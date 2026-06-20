import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all data
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