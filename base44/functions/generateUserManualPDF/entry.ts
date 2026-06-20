import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

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

        const addStep = (step, text) => {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(step, margin, y);
            doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(text, pageWidth - margin * 2 - 15);
            lines.forEach(line => {
                doc.text(line, margin + 15, y);
                y += size + 2;
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
        doc.rect(0, 0, pageWidth, 60, 'F');
        
        doc.setFontSize(26);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('DukaPOS', pageWidth / 2, 28, { align: 'center' });
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'normal');
        doc.text('Complete User Manual & Feature Guide', pageWidth / 2, 40, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text('How to Use Every Feature', pageWidth / 2, 50, { align: 'center' });
        
        doc.setTextColor(0, 0, 0);
        y = 75;

        // TABLE OF CONTENTS
        addSection('Table of Contents');
        addText('1. Getting Started with POS');
        addText('2. Processing Sales');
        addText('3. Payment Methods');
        addText('4. Inventory Management');
        addText('5. Customer Management & Loyalty');
        addText('6. Manager Controls & Approvals');
        addText('7. Shift Management');
        addText('8. Expense Tracking');
        addText('9. Reports & Analytics');
        addText('10. KRA eTIMS Compliance');
        addText('11. Keyboard Shortcuts');
        addText('12. Troubleshooting');

        doc.addPage();
        y = margin;

        // 1. GETTING STARTED
        addSection('1. Getting Started with POS');
        addText('The Point of Sale (POS) is the main interface for processing sales. Access it from the sidebar or dashboard.');
        y += 5;
        addText('Key Components:', 11, 'bold');
        addText('• Product Grid: Displays all products with images and prices');
        addText('• Search Bar: Find products by name or barcode');
        addText('• Category Filters: Filter products by category');
        addText('• Cart Panel: Shows selected items and totals');
        addText('• Quick Keys: One-tap access to best-selling items');
        y += 5;
        addText('First-Time Setup:', 11, 'bold');
        addText('1. Add products via Inventory > Add Product');
        addText('2. Set up categories (Groceries, Beverages, etc.)');
        y += 5;
        addText('3. Configure business settings (name, tax rate)');
        addText('4. Start a shift before processing sales');

        // 2. PROCESSING SALES
        checkNewPage();
        addSection('2. Processing Sales');
        addText('Step-by-Step Guide:', 11, 'bold');
        y += 3;
        addStep('Step 1:', 'Search or scan products using the search bar or barcode scanner');
        addStep('Step 2:', 'Click products to add them to cart, or use Quick Keys for fast access');
        addStep('Step 3:', 'Adjust quantities using the +/- buttons in the cart');
        addStep('Step 4:', 'Select a customer (optional) for loyalty points tracking');
        addStep('Step 5:', 'Apply discounts if needed (requires manager approval above threshold)');
        addStep('Step 6:', 'Click "Checkout" and select payment method');
        addStep('Step 7:', 'Complete payment and receive receipt');
        y += 5;
        addText('Pro Tips:', 11, 'bold');
        addText('• Use F2 key to focus search bar');
        addText('• Hold transactions with F7 to serve other customers');
        addText('• Stock alerts appear automatically when items are low');

        // 3. PAYMENT METHODS
        checkNewPage();
        addSection('3. Payment Methods');
        addText('DukaPOS supports multiple payment options:');
        y += 5;
        addText('Cash:', 11, 'bold');
        addText('• Enter amount received from customer');
        addText('• System automatically calculates change due');
        y += 3;
        addText('M-Pesa:', 11, 'bold');
        addText('• Select M-Pesa payment option');
        addText('• Enter transaction reference number from customer phone');
        addText('• Complete transaction after confirmation');
        y += 3;
        addText('Card/Bank Transfer:', 11, 'bold');
        addText('• Select Card or Bank Transfer');
        addText('• Enter reference number if applicable');
        y += 3;
        addText('Split Payments:', 11, 'bold');
        addText('• Select "Split" payment method');
        addText('• Add multiple payment entries (e.g., part cash, part M-Pesa)');
        addText('• Total must equal the transaction amount');

        // 4. INVENTORY MANAGEMENT
        checkNewPage();
        addSection('4. Inventory Management');
        addText('Adding Products:', 11, 'bold');
        addStep('Step 1:', 'Go to Inventory page');
        addStep('Step 2:', 'Click "Add Product" button');
        addStep('Step 3:', 'Fill in details: name, SKU, category, price, cost price');
        addStep('Step 4:', 'Set stock quantity and low-stock threshold');
        addStep('Step 5:', 'Upload product image (optional)');
        addStep('Step 6:', 'Save product');
        y += 5;
        addText('Bulk Import:', 11, 'bold');
        addText('• Download CSV template from Inventory page');
        addText('• Fill in product data in spreadsheet');
        addText('• Upload CSV file to import multiple products at once');
        y += 5;
        addText('Stock Management:', 11, 'bold');
        addText('• Stock automatically deducts when sales are processed');
        addText('• Low stock alerts appear during checkout');
        addText('• Use "Quick Stock Update" to add inventory');
        addText('• Print barcodes for products without manufacturer barcodes');

        // 5. CUSTOMER MANAGEMENT
        checkNewPage();
        addSection('5. Customer Management & Loyalty Program');
        addText('Adding Customers:', 11, 'bold');
        addStep('Step 1:', 'Go to Customers page');
        addStep('Step 2:', 'Click "Add Customer"');
        addStep('Step 3:', 'Enter name, phone, email (phone is required)');
        addStep('Step 4:', 'Save customer profile');
        y += 5;
        addText('Loyalty Program:', 11, 'bold');
        addText('Customers earn points automatically with each purchase.');
        y += 3;
        addText('Tier Structure:', 11, 'bold');
        addText('• Bronze: 0-999 points (1 point per KES 10 spent)');
        addText('• Silver: 1,000-4,999 points (1.25 points per KES 10)');
        addText('• Gold: 5,000-19,999 points (1.5 points per KES 10)');
        addText('• Platinum: 20,000+ points (2 points per KES 10)');
        y += 5;
        addText('Redeeming Points:', 11, 'bold');
        addText('• Select customer during checkout');
        addText('• Points redemption panel shows available points');
        addText('• Enter amount to redeem (100 points = KES 10)');
        addText('• Discount applies automatically to total');

        // 6. MANAGER CONTROLS
        checkNewPage();
        addSection('6. Manager Controls & Approval Workflow');
        addText('Manager approvals are required for:');
        y += 5;
        addText('• Discounts above threshold (default: KES 500)');
        addText('• Voiding completed transactions');
        addText('• Processing refunds');
        y += 5;
        addText('Approval Process:', 11, 'bold');
        addStep('Step 1:', 'Cashier initiates action (discount/void/refund)');
        addStep('Step 2:', 'System prompts for manager credentials');
        addStep('Step 3:', 'Manager enters email and password');
        addStep('Step 4:', 'Manager provides reason for approval');
        addStep('Step 5:', 'System verifies manager role and approves');
        addStep('Step 6:', 'Action is logged in Shift Audit trail');
        y += 5;
        addText('Security Notes:', 11, 'bold');
        addText('• Only users with "admin" role can approve');
        addText('• All approvals are logged with timestamp and reason');
        addText('• Manager is automatically logged out after approval');

        // 7. SHIFT MANAGEMENT
        checkNewPage();
        addSection('7. Shift Management');
        addText('Starting a Shift:', 11, 'bold');
        addStep('Step 1:', 'Go to "My Shifts" page');
        addStep('Step 2:', 'Click "Start New Shift"');
        addStep('Step 3:', 'Add optional opening note (e.g., cash float amount)');
        addStep('Step 4:', 'Shift begins - you can now process sales');
        y += 5;
        addText('Ending a Shift:', 11, 'bold');
        addStep('Step 1:', 'Click "End Shift" button');
        addStep('Step 2:', 'Enter actual cash count from drawer');
        addStep('Step 3:', 'System compares vs expected amount');
        addStep('Step 4:', 'Add closing note if needed');
        addStep('Step 5:', 'Submit reconciliation');
        y += 5;
        addText('Handling Discrepancies:', 11, 'bold');
        addText('• If cash doesn\'t match, Shift Audit record is created');
        addText('• Manager can review and approve discrepancies');
        addText('• All variances are tracked for accountability');

        // 8. EXPENSE TRACKING
        checkNewPage();
        addSection('8. Expense Tracking');
        addText('Recording Expenses:', 11, 'bold');
        addStep('Step 1:', 'Go to Expenses page');
        addStep('Step 2:', 'Click "Add Expense"');
        addStep('Step 3:', 'Enter amount and select category');
        addStep('Step 4:', 'Choose payment method (Cash, M-Pesa, etc.)');
        addStep('Step 5:', 'Add description and reference number');
        addStep('Step 6:', 'Upload receipt image (optional)');
        addStep('Step 7:', 'Save expense record');
        y += 5;
        addText('Expense Categories:', 11, 'bold');
        addText('• Rent, Utilities, Salaries, Supplies');
        addText('• Maintenance, Transport, Marketing');
        addText('• Insurance, Taxes, Other');
        y += 5;
        addText('Linking to Shifts:', 11, 'bold');
        addText('• Expenses can be linked to specific shifts');
        addText('• Useful for tracking shift-specific costs');

        // 9. REPORTS & ANALYTICS
        checkNewPage();
        addSection('9. Reports & Analytics');
        addText('Dashboard Analytics:', 11, 'bold');
        addText('• Today\'s revenue, expenses, and net profit');
        addText('• Transaction count and average sale value');
        addText('• Hourly sales trends (bar chart)');
        addText('• Payment method distribution (pie chart)');
        addText('• Top products by revenue');
        addText('• Low stock alerts with visual indicators');
        y += 5;
        addText('Reports Page:', 11, 'bold');
        addText('• Sales reports with date range filters');
        addText('• Cashier performance comparison');
        addText('• Product performance analysis');
        addText('• Payment method breakdowns');
        y += 5;
        addText('Export Options:', 11, 'bold');
        addText('• Download PDF documentation from Features page');
        addText('• Print receipts for individual transactions');
        addText('• Export product barcodes for printing');

        // 10. KRA eTIMS
        checkNewPage();
        addSection('10. KRA eTIMS Compliance');
        addText('DukaPOS automatically handles KRA eTIMS requirements:');
        y += 5;
        addText('CUIN Generation:', 11, 'bold');
        addText('• Control Unit Invoice Number generated for each sale');
        addText('• CUIN is printed on receipts');
        addText('• Stored in transaction records');
        y += 5;
        addText('Automatic Submission:', 11, 'bold');
        addText('• Invoices submitted to KRA eTIMS automatically');
        addText('• Submission status tracked (Submitted/Failed)');
        addText('• Failed submissions retry automatically');
        y += 5;
        addText('Tax Calculations:', 11, 'bold');
        addText('• 16% VAT automatically calculated on sales');
        addText('• Tax amounts shown on receipts');
        addText('• Tax totals available in reports');

        // 11. KEYBOARD SHORTCUTS
        checkNewPage();
        addSection('11. Keyboard Shortcuts');
        addText('Speed up your workflow with these shortcuts:');
        y += 5;
        addText('F1 - Open/close cart panel');
        addText('F2 - Focus search bar');
        addText('F3 - Open checkout dialog');
        addText('F4 - Toggle barcode scanner mode');
        addText('F5 - Refresh product list');
        addText('F6 - Open held transactions');
        addText('F7 - Hold current transaction');
        addText('F8 - Open customer search');
        addText('F9 - Open keyboard shortcuts help');
        addText('ESC - Close dialogs');
        y += 5;
        addText('Tips:', 11, 'bold');
        addText('• Shortcuts work only in POS page');
        addText('• Press F9 anytime to view shortcut reference');

        // 12. TROUBLESHOOTING
        checkNewPage();
        addSection('12. Troubleshooting');
        addText('Common Issues & Solutions:', 11, 'bold');
        y += 5;
        addText('Product not found in search:', 11, 'bold');
        addText('• Check if product is marked as "Active"');
        addText('• Verify barcode/SKU is entered correctly');
        addText('• Try searching by product name instead');
        y += 5;
        addText('Payment submission failed:', 11, 'bold');
        addText('• Check internet connection');
        addText('• Verify M-Pesa reference number format');
        addText('• Retry transaction or use alternative payment method');
        y += 5;
        addText('Low stock alert appearing:', 11, 'bold');
        addText('• Go to Inventory and update stock quantity');
        addText('• Adjust low-stock threshold if needed');
        addText('• Consider reordering products');
        y += 5;
        addText('Cannot end shift:', 11, 'bold');
        addText('• Ensure all transactions are completed');
        addText('• Verify cash count is entered correctly');
        addText('• Contact manager if discrepancy is large');
        y += 5;
        addText('eTIMS submission failed:', 11, 'bold');
        addText('• Check KRA eTIMS service status');
        addText('• System will retry automatically');
        addText('• Manual retry available in eTIMS page');

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(8, 145, 178);
        doc.setFont('helvetica', 'bold');
        doc.text('DukaPOS User Manual v1.0', pageWidth / 2, 275, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 280, { align: 'center' });

        // Return PDF
        const pdfBytes = doc.output('arraybuffer');
        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="DukaPOS_User_Manual.pdf"',
            },
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});