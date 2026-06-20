import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body for type parameter
        const body = await req.json().catch(() => ({}));
        const pdfType = body?.type || 'dukapos_report';

        // If eTIMS roadmap, generate that instead
        if (pdfType === 'etims_roadmap') {
            return generateEtimsRoadmapPDF(user);
        }

        // Fetch all data for regular report
        const [products, sales, customers, shifts, expenses, settings] = await Promise.all([
            base44.entities.Product.list(),
            base44.entities.Sale.list('-created_date', 1000),
            base44.entities.Customer.list(),
            base44.entities.Shift.list(),
            base44.entities.Expense.list(),
            base44.entities.BusinessSettings.list(),
        ]);

        // Calculate metrics
        const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
        const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const netProfit = totalRevenue - totalExpenses;

        // Top products
        const productSales = {};
        sales.forEach(sale => {
            sale.items?.forEach(item => {
                if (!productSales[item.product_name]) {
                    productSales[item.product_name] = { quantity: 0, revenue: 0 };
                }
                productSales[item.product_name].quantity += item.quantity;
                productSales[item.product_name].revenue += item.total;
            });
        });

        const topProducts = Object.entries(productSales)
            .sort((a, b) => b[1].revenue - a[1].revenue)
            .slice(0, 10);

        // Create PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let y = margin;

        const addTitle = (text, size = 18) => {
            doc.setFontSize(size);
            doc.setFont('helvetica', 'bold');
            doc.text(text, margin, y);
            y += size + 5;
        };

        const addSection = (text) => {
            y += 5;
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(8, 145, 178);
            doc.text(text, margin, y);
            y += 6;
            doc.setLineWidth(0.5);
            doc.line(margin, y - 1, pageWidth - margin, y - 1);
            y += 5;
            doc.setTextColor(0, 0, 0);
        };

        const addText = (text, size = 10, style = 'normal') => {
            doc.setFontSize(size);
            doc.setFont('helvetica', style);
            const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
            lines.forEach(line => {
                doc.text(line, margin, y);
                y += size + 2;
            });
        };

        const addKeyValue = (key, value) => {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`${key}:`, margin, y);
            doc.setFont('helvetica', 'normal');
            doc.text(String(value), margin + 50, y);
            y += 6;
        };

        const checkNewPage = () => {
            if (y > 270) {
                doc.addPage();
                y = margin;
            }
        };

        // COVER PAGE
        doc.setFillColor(8, 145, 178);
        doc.rect(0, 0, pageWidth, 50, 'F');
        
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('DukaPOS', pageWidth / 2, 25, { align: 'center' });
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('System Documentation & Report', pageWidth / 2, 35, { align: 'center' });
        
        const businessName = settings[0]?.business_name || 'Your Business';
        doc.setFontSize(10);
        doc.text(`Generated for: ${businessName}`, pageWidth / 2, 45, { align: 'center' });
        
        doc.setTextColor(0, 0, 0);
        y = 60;

        // TABLE OF CONTENTS
        addSection('Table of Contents');
        addText('1. Executive Summary');
        addText('2. System Overview');
        addText('3. Key Metrics');
        addText('4. Product Catalog Summary');
        addText('5. Sales Performance');
        addText('6. Customer Management');
        addText('7. Staff & Shifts');
        addText('8. Expense Tracking');
        addText('9. Features & Capabilities');

        doc.addPage();
        y = margin;

        // 1. EXECUTIVE SUMMARY
        addSection('1. Executive Summary');
        addText('DukaPOS is a comprehensive Point of Sale and inventory management system designed for Kenyan retail businesses. This report provides an overview of system usage and performance.');
        y += 5;
        addText('Key Highlights:', 11, 'bold');
        addText(`• ${products.length} products in catalog`);
        addText(`• ${sales.length} total transactions processed`);
        addText(`• ${customers.length} registered customers`);
        addText(`• KES ${Math.round(totalRevenue).toLocaleString()} total revenue`);
        addText(`• KES ${Math.round(netProfit).toLocaleString()} net profit`);

        // 2. SYSTEM OVERVIEW
        checkNewPage();
        addSection('2. System Overview');
        addKeyValue('Business Name', businessName);
        addKeyValue('System Version', '1.0.0');
        addKeyValue('Currency', 'KES (Kenyan Shilling)');
        addKeyValue('Tax Rate', `${settings[0]?.default_tax_rate || 16}%`);
        addKeyValue('Report Generated', new Date().toLocaleString());

        // 3. KEY METRICS
        checkNewPage();
        addSection('3. Key Metrics Dashboard');
        const metrics = [
            ['Metric', 'Value'],
            ['Total Revenue', `KES ${Math.round(totalRevenue).toLocaleString()}`],
            ['Total Expenses', `KES ${Math.round(totalExpenses).toLocaleString()}`],
            ['Net Profit', `KES ${Math.round(netProfit).toLocaleString()}`],
            ['Total Products', products.length.toString()],
            ['Total Customers', customers.length.toString()],
            ['Total Transactions', sales.length.toString()],
            ['Active Shifts', shifts.filter(s => s.status === 'active').length.toString()],
        ];

        // Simple table
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(8, 145, 178);
        doc.setTextColor(255, 255, 255);
        const colWidth = (pageWidth - margin * 2) / 2;
        doc.text(metrics[0][0], margin + 5, y + 5);
        doc.text(metrics[0][1], margin + colWidth + 5, y + 5);
        doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
        y += 8;
        
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        metrics.slice(1).forEach(row => {
            checkNewPage();
            doc.text(row[0], margin + 5, y + 5);
            doc.text(row[1], margin + colWidth + 5, y + 5);
            doc.line(margin, y, pageWidth - margin, y);
            y += 7;
        });
        y += 5;

        // 4. PRODUCT CATALOG
        checkNewPage();
        addSection('4. Product Catalog Summary');
        const categories = {};
        products.forEach(p => {
            categories[p.category] = (categories[p.category] || 0) + 1;
        });
        addText('Products by Category:', 11, 'bold');
        Object.entries(categories).forEach(([cat, count]) => {
            addKeyValue(cat, `${count} products`);
        });

        // 5. SALES PERFORMANCE
        checkNewPage();
        addSection('5. Sales Performance');
        addText('Top 10 Products by Revenue:', 11, 'bold');
        y += 3;
        topProducts.forEach(([name, data], idx) => {
            checkNewPage();
            doc.setFontSize(9);
            doc.text(`${idx + 1}. ${name}`, margin, y);
            doc.text(`KES ${data.revenue.toLocaleString()} (${data.quantity} units)`, margin + 80, y);
            y += 6;
        });

        // 6. CUSTOMER MANAGEMENT
        checkNewPage();
        addSection('6. Customer Management');
        const tiers = {};
        customers.forEach(c => {
            tiers[c.tier] = (tiers[c.tier] || 0) + 1;
        });
        addText('Customer Loyalty Tiers:', 11, 'bold');
        Object.entries(tiers).forEach(([tier, count]) => {
            addKeyValue(tier.toUpperCase(), `${count} customers`);
        });

        // 7. STAFF & SHIFTS
        checkNewPage();
        addSection('7. Staff & Shift Management');
        const shiftStats = {
            total: shifts.length,
            active: shifts.filter(s => s.status === 'active').length,
            closed: shifts.filter(s => s.status === 'closed').length,
        };
        addKeyValue('Total Shifts', shiftStats.total);
        addKeyValue('Active Shifts', shiftStats.active);
        addKeyValue('Closed Shifts', shiftStats.closed);

        // 8. EXPENSE TRACKING
        checkNewPage();
        addSection('8. Expense Tracking');
        const expenseCategories = {};
        expenses.forEach(e => {
            expenseCategories[e.category] = (expenseCategories[e.category] || 0) + 1;
        });
        addText('Expenses by Category:', 11, 'bold');
        Object.entries(expenseCategories).forEach(([cat, count]) => {
            addKeyValue(cat, `${count} expenses`);
        });

        // 9. FEATURES
        checkNewPage();
        addSection('9. Features & Capabilities');
        const features = [
            'Point of Sale with barcode scanning',
            'Inventory management with low-stock alerts',
            'Customer loyalty program (Bronze/Silver/Gold/Platinum)',
            'M-Pesa, card, cash, and split payments',
            'Manager approval workflow for discounts',
            'Shift tracking and reconciliation',
            'Expense tracking and categorization',
            'KRA eTIMS compliance',
            'Real-time sales analytics',
            'Customer purchase history',
            'Quick keys for best-sellers',
            'Hold/recall transactions',
            'Digital receipts (SMS/Email)',
            'Keyboard shortcuts (F1-F9)',
            'Responsive design (desktop/mobile)',
        ];
        features.forEach((feature, idx) => {
            addText(`✓ ${feature}`, 9);
        });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Generated by DukaPOS on ${new Date().toLocaleString()}`, pageWidth / 2, 280, { align: 'center' });

        // Return PDF
        const pdfBytes = doc.output('arraybuffer');
        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="DukaPOS_Documentation.pdf"',
            },
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});

// Helper function to generate eTIMS roadmap PDF
async function generateEtimsRoadmapPDF(user) {
    const doc = new jsPDF({ encoding: 'UTF-8' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    const addTitle = (text, size = 18) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(8, 145, 178);
        doc.text(text, margin, y);
        y += size + 5;
    };

    const addSection = (text) => {
        y += 3;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(8, 145, 178);
        doc.text(text, margin, y);
        y += 5;
        doc.setLineWidth(0.5);
        doc.line(margin, y - 1, pageWidth - margin, y - 1);
        y += 3;
        doc.setTextColor(0, 0, 0);
    };

    const addText = (text, size = 9, style = 'normal') => {
        doc.setFontSize(size);
        doc.setFont('helvetica', style);
        const cleanText = text.normalize('NFKD').replace(/[^\x00-\x7F]/g, '');
        const lines = doc.splitTextToSize(cleanText, pageWidth - margin * 2);
        lines.forEach(line => {
            doc.text(line, margin, y);
            y += size + 1;
        });
    };

    const checkNewPage = () => {
        if (y > 270) {
            doc.addPage();
            y = margin;
        }
    };

    // COVER PAGE
    doc.setFillColor(8, 145, 178);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('eTIMS Integration Roadmap', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('KRA Compliance Guide for DukaPOS', pageWidth / 2, 35, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated for: ${user.full_name}`, pageWidth / 2, 45, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    y = 60;

    // INTRODUCTION
    addSection('Overview');
    addText('This roadmap outlines the step-by-step process for integrating KRA eTIMS (Electronic Tax Invoice Management System) into your DukaPOS system. The integration ensures compliance with Kenyan tax regulations and enables automatic submission of invoices to KRA.');
    y += 3;
    addText('Implementation Timeline: 6-8 weeks from project initiation to production go-live.', 9, 'bold');

    // PHASE 1
    checkNewPage();
    addSection('Phase 1: Preparation & Requirements (Week 1-2)');
    addText('1.1 KRA Registration & Documentation:', 9, 'bold');
    addText('  • Register for eTIMS portal access at https://etims.kra.go.ke');
    addText('  • Download integration documentation and API specifications');
    addText('  • Request OSCU (Online Sales Control Unit) credentials');
    addText('  • Note: Allow 5-7 business days for KRA approval');
    y += 2;
    addText('1.2 Business Information Setup:', 9, 'bold');
    addText('  • Verify KRA PIN is active and up-to-date');
    addText('  • Ensure business details match KRA records');
    addText('  • Update BusinessSettings entity in DukaPOS with legal business name, KRA PIN, and address');
    y += 2;
    addText('1.3 Technical Prerequisites:', 9, 'bold');
    addText('  • Active internet connection for API calls');
    addText('  • SSL certificate for secure communication');
    addText('  • Backup power solution for uninterrupted operations');

    // PHASE 2
    checkNewPage();
    addSection('Phase 2: Technical Setup (Week 2-3)');
    addText('2.1 Environment Configuration:', 9, 'bold');
    addText('  • Set up KRA sandbox/testing environment access');
    addText('  • Configure API endpoints (test vs production)');
    addText('  • Store credentials securely (ETIMS_KRA_PIN, ETIMS_DEVICE_SERIAL)');
    y += 2;
    addText('2.2 DukaPOS Configuration:', 9, 'bold');
    addText('  • Update BusinessSettings with KRA PIN');
    addText('  • Configure tax rates (standard 16% VAT)');
    addText('  • Enable eTIMS fields in product and sale entities');
    y += 2;
    addText('2.3 Backend Function Deployment:', 9, 'bold');
    addText('  • Deploy submitEtimsInvoice function for real-time submission');
    addText('  • Deploy etimsAutoSubmit for automatic processing');
    addText('  • Deploy etimsRetryFailed for failed invoice recovery');

    // PHASE 3
    checkNewPage();
    addSection('Phase 3: Integration & Testing (Week 3-4)');
    addText('3.1 Invoice Submission Flow:', 9, 'bold');
    addText('  • Implement invoice data mapping to KRA JSON schema');
    addText('  • Test single invoice submission via API');
    addText('  • Validate CUIN (Control Unit Invoice Number) generation');
    addText('  • Handle response codes and error messages');
    y += 2;
    addText('3.2 Batch Processing:', 9, 'bold');
    addText('  • Implement daily summary generation');
    addText('  • Test bulk invoice submission');
    addText('  • Verify payment method mapping (Cash=01, Card=02, M-Pesa=05)');
    y += 2;
    addText('3.3 Error Handling:', 9, 'bold');
    addText('  • Implement retry logic for failed submissions');
    addText('  • Set up alerts for submission failures');
    addText('  • Create manual override procedures');

    // PHASE 4
    checkNewPage();
    addSection('Phase 4: Compliance Verification (Week 4-5)');
    addText('4.1 KRA Certification:', 9, 'bold');
    addText('  • Submit test invoices to KRA sandbox environment');
    addText('  • Pass KRA validation and compliance checks');
    addText('  • Receive OSCU certification number');
    y += 2;
    addText('4.2 Production Cutover:', 9, 'bold');
    addText('  • Switch API endpoints to production environment');
    addText('  • Update OSCU serial to production value');
    addText('  • Conduct parallel run for 7 days');
    y += 2;
    addText('4.3 Staff Training:', 9, 'bold');
    addText('  • Train cashiers on eTIMS-compliant receipts');
    addText('  • Educate managers on compliance dashboard');
    addText('  • Document troubleshooting procedures');

    // PHASE 5
    checkNewPage();
    addSection('Phase 5: Go-Live & Monitoring (Week 5-6)');
    addText('5.1 Production Launch:', 9, 'bold');
    addText('  • Enable automatic eTIMS submission for all sales');
    addText('  • Monitor first week of transactions closely');
    addText('  • Verify all CUINs are generated successfully');
    y += 2;
    addText('5.2 Ongoing Compliance:', 9, 'bold');
    addText('  • Daily: Review eTIMS dashboard for failed submissions');
    addText('  • Weekly: Export and backup KRA JSON files');
    addText('  • Monthly: Reconcile submitted invoices with iTax returns');
    y += 2;
    addText('5.3 Maintenance:', 9, 'bold');
    addText('  • Keep OSCU credentials updated before expiry');
    addText('  • Monitor KRA API changes and updates');
    addText('  • Maintain audit trail for 5 years minimum');

    // TECHNICAL REQUIREMENTS
    checkNewPage();
    addSection('Technical Requirements');
    addText('API Endpoints:', 9, 'bold');
    addText('  • Sandbox: https://etims-sandbox.kra.go.ke/api/v1');
    addText('  • Production: https://etims.kra.go.ke/api/v1');
    y += 2;
    addText('Required Credentials:', 9, 'bold');
    addText('  • ETIMS_KRA_PIN: Your 11-character KRA PIN');
    addText('  • ETIMS_DEVICE_SERIAL: OSCU device serial number');
    addText('  • ETIMS_API_KEY: Authentication token from KRA');
    y += 2;
    addText('Invoice Data Requirements:', 9, 'bold');
    addText('  • Valid receipt number (unique per transaction)');
    addText('  • Accurate tax breakdown (16% VAT standard rate)');
    addText('  • Payment method codes (01=Cash, 02=Card, 04=Split, 05=M-Pesa)');
    addText('  • Customer details (optional for B2C, required for B2B)');

    // SUPPORT RESOURCES
    checkNewPage();
    addSection('Support Resources');
    addText('Official KRA Channels:', 9, 'bold');
    addText('  • eTIMS Portal: https://etims.kra.go.ke');
    addText('  • iTax Portal: https://itax.kra.go.ke');
    addText('  • KRA Contact Centre: +254 711 099 999');
    addText('  • Email: callcentre@kra.go.ke');
    y += 2;
    addText('Documentation:', 9, 'bold');
    addText('  • eTIMS Integration Guide (download from portal)');
    addText('  • API Reference Documentation');
    addText('  • Invoice Schema Specification');

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated by DukaPOS on ${new Date().toLocaleString()}`, pageWidth / 2, 280, { align: 'center' });

    // Return PDF
    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="eTIMS_Integration_Roadmap.pdf"',
        },
    });
}