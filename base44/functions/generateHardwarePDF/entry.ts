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
        
        // Colors
        const primaryColor = [13, 110, 139]; // Teal
        const accentColor = [245, 158, 11]; // Amber
        const darkGray = [51, 51, 51];
        const lightGray = [128, 128, 128];

        // Helper functions
        const addHeader = (title, subtitle) => {
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, 210, 35, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text(title, 20, 18);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(subtitle, 20, 26);
            
            doc.setTextColor(...darkGray);
        };

        const addSectionHeader = (title, y) => {
            doc.setFillColor(...primaryColor);
            doc.rect(20, y - 6, 170, 6, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(title, 25, y - 1.5);
            doc.setTextColor(...darkGray);
            return y + 7;
        };

        const addCostSummary = (smallShop, mediumShop, largeShop, y) => {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Estimated Total Cost by Shop Size:', 20, y);
            y += 6;
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text('Small Shop (1-2 staff, <500 sq ft):', 25, y);
            doc.text(smallShop, 100, y);
            y += 5;
            
            doc.text('Medium Shop (3-5 staff, 500-1500 sq ft):', 25, y);
            doc.text(mediumShop, 100, y);
            y += 5;
            
            doc.text('Large Shop (6+ staff, 1500+ sq ft):', 25, y);
            doc.text(largeShop, 100, y);
            y += 5;
            
            return y;
        };

        const addShopAdvice = (y) => {
            doc.addPage();
            y = 20;
            doc.setFillColor(...primaryColor);
            doc.rect(20, y - 6, 170, 6, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Shop Size Recommendations', 25, y - 1.5);
            doc.setTextColor(...darkGray);
            y += 10;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Small Shop (<500 sq ft, 1-2 staff):', 20, y);
            y += 5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text('Capacity: 50-100 customers/day | 1,500-3,000/month | 18,000-36,000/year', 25, y);
            y += 5;
            doc.text('Best for: Kiosks, small retail, cafes, salons, convenience stores', 25, y);
            y += 5;
            doc.text('Hardware: Basic POS (tablet/smartphone), USB scanner, 58mm printer', 25, y);
            y += 5;
            doc.text('Payment: Mobile card reader or cash-only initially', 25, y);
            y += 5;
            doc.text('Network: Basic WiFi router, no backup needed', 25, y);
            y += 5;
            doc.text('Tip: Start minimal, add hardware as revenue grows', 25, y);
            y += 8;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Medium Shop (500-1500 sq ft, 3-5 staff):', 20, y);
            y += 5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text('Capacity: 150-300 customers/day | 4,500-9,000/month | 54,000-108,000/year', 25, y);
            y += 5;
            doc.text('Best for: Grocery stores, boutiques, pharmacies, electronics shops', 25, y);
            y += 5;
            doc.text('Hardware: All-in-one terminal, Bluetooth scanner, 80mm printer', 25, y);
            y += 5;
            doc.text('Payment: Integrated card reader + cash drawer required', 25, y);
            y += 5;
            doc.text('Network: Business router + UPS backup recommended', 25, y);
            y += 5;
            doc.text('Tip: Add customer display for better service experience', 25, y);
            y += 8;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Large Shop (1500+ sq ft, 6+ staff):', 20, y);
            y += 5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text('Capacity: 400-800+ customers/day | 12,000-24,000/month | 144,000-288,000+/year', 25, y);
            y += 5;
            doc.text('Best for: Supermarkets, department stores, hardware stores, wholesale', 25, y);
            y += 5;
            doc.text('Hardware: Multiple terminals, 2D scanners, industrial printers', 25, y);
            y += 5;
            doc.text('Payment: Multiple terminals, contactless, integrated systems', 25, y);
            y += 5;
            doc.text('Network: Dual WAN + 4G/5G failover, enterprise router', 25, y);
            y += 5;
            doc.text('Tip: Invest in redundancy - backup everything (power, internet, hardware)', 25, y);
            y += 8;
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('General Recommendations:', 20, y);
            y += 5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text('- Budget 15-20% extra for cables, mounts, and accessories', 25, y);
            y += 4;
            doc.text('- Plan for 20% annual customer growth when sizing hardware', 25, y);
            y += 4;
            doc.text('- Replace receipt printers every 2-3 years with heavy use', 25, y);
            y += 4;
            doc.text('- Train all staff on basic troubleshooting', 25, y);
            y += 4;
            doc.text('- Keep spare scanner and printer for peak periods', 25, y);
            y += 4;
            doc.text('- Consider lease options for expensive equipment to preserve cash flow', 25, y);
            
            return y + 10;
        };

        const addTable = (headers, rows, startY) => {
            const colWidths = [48, 82, 50];
            const rowHeight = 7;
            
            // Header row
            doc.setFillColor(240, 240, 240);
            doc.rect(20, startY, 170, rowHeight, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            
            headers.forEach((header, idx) => {
                doc.text(header, 23 + colWidths.slice(0, idx).reduce((a, b) => a + b, 0), startY + 5);
            });
            
            // Data rows
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            let y = startY + rowHeight;
            
            rows.forEach((row, idx) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                
                doc.setFillColor(idx % 2 === 0 ? 255 : 248);
                doc.rect(20, y, 170, rowHeight, 'F');
                
                row.forEach((cell, cellIdx) => {
                    const text = String(cell).length > 35 ? String(cell).substring(0, 33) + '..' : String(cell);
                    doc.text(text, 23 + colWidths.slice(0, cellIdx).reduce((a, b) => a + b, 0), y + 5);
                });
                
                y += rowHeight;
            });
            
            return y;
        };

        // Page 1: Cover
        addHeader('DukaPOS Hardware Guide', 'Technical Specifications & Setup Procedures');
        
        doc.setTextColor(...darkGray);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Complete Hardware Requirements for POS Implementation', 20, 52);
        
        doc.setFontSize(9);
        doc.setTextColor(...lightGray);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 60);
        doc.text(`Prepared for: ${user.full_name}`, 20, 65);
        
        // Table of Contents
        let y = 75;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Table of Contents', 20, y);
        y += 10;
        
        const tocItems = [
            '1. Essential Hardware Components',
            '2. Technical Specifications',
            '3. Optional Equipment',
            '4. Network & Infrastructure',
            '5. Step-by-Step Setup Procedure',
            '6. Troubleshooting Guide',
            '7. Maintenance & Support'
        ];
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        tocItems.forEach((item, idx) => {
            doc.text(item, 25, y + (idx * 5));
        });

        // Page 2: Essential Hardware
        doc.addPage();
        y = 20;
        y = addSectionHeader('1. Essential Hardware Components', y);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('These components are required for basic POS operations. Choose one option from each category.', 20, y);
        y += 15;
        
        // POS Terminal Table
        doc.setFont('helvetica', 'bold');
        doc.text('1.1 POS Terminal/Computing Device', 20, y);
        y += 8;
        
        const terminalSpecs = [
            ['Option', 'Specifications', 'Price Range'],
            ['All-in-One POS Terminal', '15" touchscreen, Intel i3, 8GB RAM, 128GB SSD, Windows/Android', '$400 - $800'],
            ['Tablet (iPad/Android)', '10"+ screen, 64GB storage, WiFi + Cellular optional', '$300 - $600'],
            ['Laptop/Desktop', 'Intel i3/Ryzen 3, 8GB RAM, 256GB SSD, Windows 10/11', '$350 - $700'],
            ['Smartphone (Mobile POS)', '5"+ screen, Android 10+/iOS 14+, 32GB storage', '$200 - $400']
        ];
        
        y = addTable(terminalSpecs[0], terminalSpecs.slice(1), y);
        y += 5;
        
        // Barcode Scanner Table
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('1.2 Barcode Scanner', 20, y);
        y += 6;
        
        const scannerSpecs = [
            ['Type', 'Specifications', 'Price Range'],
            ['USB Wired Scanner', '1D/2D, plug & play, 10m cable, 500 scans/sec', '$50 - $100'],
            ['Bluetooth Wireless', '1D/2D, 100m range, 8hr battery, auto-sync', '$80 - $150'],
            ['2D QR Scanner', 'QR/barcode, smartphone screen scanning, omnidirectional', '$100 - $200'],
            ['Mobile Device Camera', 'Built-in, app-based, requires good lighting', '$0 (included)']
        ];
        
        y = addTable(scannerSpecs[0], scannerSpecs.slice(1), y);
        y += 5;
        
        // Receipt Printer Table
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('1.3 Receipt Printer', 20, y);
        y += 6;
        
        const printerSpecs = [
            ['Type', 'Specifications', 'Price Range'],
            ['Thermal 58mm', 'USB/Ethernet, 200mm/sec, auto-cutter, 58mm paper', '$80 - $150'],
            ['Thermal 80mm', 'USB/Ethernet/WiFi, 250mm/sec, auto-cutter, 80mm paper', '$120 - $250'],
            ['Bluetooth Mobile', 'Portable, 4-8hr battery, 58mm, wireless', '$100 - $200'],
            ['Paperless Option', 'Email/SMS receipts, no hardware needed', '$0']
        ];
        
        y = addTable(printerSpecs[0], printerSpecs.slice(1), y);
        y += 8;
        
        // Cost summary for essential hardware
        y = addCostSummary('$530 - $950 (Basic setup)', '$780 - $1,400 (Recommended)', '$1,200 - $2,100 (Complete)', y);

        // Page 3: Payment Hardware
        doc.addPage();
        y = addSectionHeader('2. Payment Processing Hardware', y);
        
        // Card Reader Table
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('2.1 Card Reader / PIN Pad', 20, y);
        y += 6;
        
        const cardReaderSpecs = [
            ['Type', 'Specifications', 'Price Range'],
            ['Integrated Card Reader', 'Chip & PIN, contactless NFC, receipt printer built-in', '$200 - $400'],
            ['Standalone PIN Pad', 'PCI PTS approved, EMV chip, magnetic stripe', '$100 - $250'],
            ['Mobile Card Reader', 'Bluetooth, smartphone attachment, tap/swipe/dip', '$50 - $150'],
            ['Contactless Terminal', 'NFC only, Apple Pay/Google Pay, quick tap', '$150 - $300']
        ];
        
        y = addTable(cardReaderSpecs[0], cardReaderSpecs.slice(1), y);
        y += 5;
        
        // Cash Drawer Table
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('2.2 Cash Drawer', 20, y);
        y += 6;
        
        const drawerSpecs = [
            ['Type', 'Specifications', 'Price Range'],
            ['13" Standard Drawer', '4 bill slots, 5 coin compartments, RJ11 trigger', '$100 - $180'],
            ['16" Large Drawer', '5 bill slots, 8 coin compartments, heavy-duty', '$150 - $250'],
            ['Portable Cash Box', 'Lockable, compact, manual operation', '$30 - $80'],
            ['Heavy-Duty Safe', 'Steel construction, digital lock, anchor kit', '$200 - $400']
        ];
        
        y = addTable(drawerSpecs[0], drawerSpecs.slice(1), y);
        y += 8;
        
        // Cost summary for payment hardware
        y = addCostSummary('$130 - $230 (Basic)', '$300 - $550 (Recommended)', '$450 - $850 (Complete)', y);

        // Page 4: Optional Hardware
        doc.addPage();
        y = addSectionHeader('3. Optional Hardware', y);
        
        const optionalSpecs = [
            ['Equipment', 'Specifications', 'Price Range'],
            ['Customer Display', '15" LCD, HDMI/VGA, shows transaction', '$150 - $300'],
            ['Label Printer', 'Thermal 4x6, USB, barcode labels', '$120 - $350'],
            ['Barcode Scale', 'Digital, 15kg, prints weight labels', '$200 - $500'],
            ['Security Tags', 'EAS system, detacher, 500 tags', '$150 - $400'],
            ['UPS Battery Backup', '1000VA, 60min runtime', '$120 - $250']
        ];
        
        y = addTable(optionalSpecs[0], optionalSpecs.slice(1), y);
        y += 8;
        
        doc.setFontSize(9);
        doc.setTextColor(...darkGray);
        doc.text('Recommendation by Shop Size:', 20, y);
        y += 5;
        
        doc.setFontSize(8);
        doc.text('Small Shop: Skip optional items, focus on essentials only', 25, y);
        y += 4;
        doc.text('Medium Shop: Add customer display + label printer ($270-650)', 25, y);
        y += 4;
        doc.text('Large Shop: All optional items recommended ($740-1,800)', 25, y);
        y += 4;
        
        doc.setTextColor(...lightGray);
        doc.text('Note: Optional hardware enhances functionality but not required.', 20, y);

        // Page 5: Network Requirements
        doc.addPage();
        y = 20;
        y = addSectionHeader('4. Network & Infrastructure Requirements', y);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Reliable internet connectivity is critical for cloud-based POS operations.', 20, y);
        y += 8;
        
        const networkSpecs = [
            ['Component', 'Minimum', 'Recommended'],
            ['Internet Speed', '5 Mbps down / 1 Mbps up', '25 Mbps down / 5 Mbps up'],
            ['Connection Type', '4G LTE / Basic broadband', 'Fiber / Business cable'],
            ['Router', 'WiFi 5 (802.11ac)', 'WiFi 6 (802.11ax)'],
            ['Backup', 'Mobile hotspot', 'Dual WAN 4G/5G'],
            ['Ethernet', 'Cat5e (100m)', 'Cat6 (gigabit)']
        ];
        
        y = addTable(networkSpecs[0], networkSpecs.slice(1), y);
        y += 5;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Network Setup Checklist:', 20, y);
        y += 6;
        
        const networkChecklist = [
            '- Router with 4+ LAN ports',
            '- Ethernet cables (Cat5e/Cat6)',
            '- WiFi with WPA2/WPA3 security',
            '- Static IP (optional)',
            '- UPS for router/modem',
            '- Mobile hotspot backup'
        ];
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        networkChecklist.forEach((item, idx) => {
            doc.text(item, 25, y + (idx * 4));
        });
        y += networkChecklist.length * 4 + 8;
        
        // Network cost summary
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Network Equipment Costs:', 20, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.text('Small Shop: Basic router + cables ($80-150)', 25, y);
        y += 4;
        doc.text('Medium Shop: Business router + UPS ($200-350)', 25, y);
        y += 4;
        doc.text('Large Shop: Dual WAN + backup 4G/5G ($400-700)', 25, y);

        // Page 6-7: Step-by-Step Setup Procedure
        doc.addPage();
        y = 20;
        y = addSectionHeader('5. Step-by-Step Setup Procedure', y);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Phase 1: Unboxing & Inspection (Day 1)', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const phase1Steps = [
            '1.1 Unbox all hardware components',
            '1.2 Verify items against packing list',
            '1.3 Inspect for shipping damage',
            '1.4 Check power cables match region',
            '1.5 Organize by category',
            '1.6 Keep packaging 30 days'
        ];
        
        phase1Steps.forEach((step, idx) => {
            doc.text(step, 25, y + (idx * 4));
        });
        y += phase1Steps.length * 4 + 4;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Phase 2: Hardware Assembly (Day 1-2)', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const phase2Steps = [
            '2.1 POS Terminal: Connect monitor, keyboard, mouse, power on',
            '   Complete OS setup (Windows/Android/iOS)',
            '2.2 Receipt Printer: Load paper, connect power/USB',
            '   Install drivers, print test page',
            '2.3 Barcode Scanner: USB plug-in or Bluetooth pair',
            '   Test scanning, configure if needed',
            '2.4 Cash Drawer: Connect RJ11 to printer',
            '   Test trigger from POS',
            '2.5 Card Reader: Connect USB/Bluetooth',
            '   Activate with payment provider, test transaction'
        ];
        
        phase2Steps.forEach((step, idx) => {
            doc.text(step, 25, y + (idx * 4));
        });
        y += phase2Steps.length * 4 + 4;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Phase 3: Network Configuration (Day 2)', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const phase3Steps = [
            '3.1 Router: Connect modem, power on, configure WiFi',
            '   Enable WPA2/WPA3 security',
            '3.2 POS Network: Ethernet or WiFi connection',
            '   Test internet, note IP address',
            '3.3 Backup: Configure mobile hotspot',
            '   Test failover'
        ];
        
        phase3Steps.forEach((step, idx) => {
            doc.text(step, 25, y + (idx * 4));
        });
        y += phase3Steps.length * 4 + 4;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Phase 4: Software Setup (Day 3)', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const phase4Steps = [
            '4.1 DukaPOS: Open browser, login admin',
            '   Configure business, tax, currency',
            '4.2 Hardware: Settings > Hardware',
            '   Configure printer, scanner, drawer',
            '4.3 Products: Import CSV or add manual',
            '   Set prices, test barcodes',
            '4.4 Users: Create cashier accounts',
            '   Assign roles, test login'
        ];
        
        phase4Steps.forEach((step, idx) => {
            doc.text(step, 25, y + (idx * 4));
        });

        // Page 9: Testing & Training
        doc.addPage();
        y = 20;
        y = addSectionHeader('5. Step-by-Step Setup Procedure (continued)', y);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Phase 5: Testing (Day 3-4)', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const phase5Steps = [
            'Hardware: Print receipt, scan 10+ barcodes',
            '   Test drawer, card payment, cash/change',
            '   Test refund/void, restart verify',
            'Software: Create sale, apply discount',
            '   Split payment, email receipt',
            '   Check inventory, reports, offline mode',
            'Integration: Payment settlement',
            '   Email/SMS receipts, cloud sync'
        ];
        
        phase5Steps.forEach((step, idx) => {
            doc.text(step, 25, y + (idx * 4));
        });
        y += phase5Steps.length * 4 + 4;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Phase 6: Staff Training (Day 4-5)', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const phase6Steps = [
            '6.1 Basic: Login, cash/card sales',
            '   Discounts, receipts, split payments',
            '6.2 Advanced: Returns, voids, shifts',
            '   Reconciliation, price overrides',
            '6.3 Troubleshooting: Internet down',
            '   Restart, paper, Bluetooth, support'
        ];
        
        phase6Steps.forEach((step, idx) => {
            doc.text(step, 25, y + (idx * 4));
        });

        // Page 10: Troubleshooting
        doc.addPage();
        y = 20;
        y = addSectionHeader('6. Troubleshooting Guide', y);
        
        const troubleshootingTable = [
            ['Issue', 'Cause', 'Solution'],
            ['Printer not printing', 'No paper/wrong orientation', 'Reload paper correctly'],
            ['', 'Loose cables', 'Check USB/power connections'],
            ['', 'Wrong printer', 'Select in POS settings'],
            ['', 'No driver', 'Install drivers'],
            ['Scanner not working', 'USB not recognized', 'Try different port'],
            ['', 'Bluetooth unpaired', 'Re-pair in settings'],
            ['', 'Barcode dirty', 'Clean or enter SKU'],
            ['Drawer not opening', 'Cable unplugged', 'Connect to printer'],
            ['', 'No power', 'Check adapter'],
            ['', 'Trigger failed', 'Test in settings'],
            ['Card reader dead', 'No power', 'Check cables'],
            ['', 'Not activated', 'Contact provider'],
            ['', 'Declined', 'Try different card'],
            ['WiFi drops', 'Weak signal', 'Move router/add extender'],
            ['', 'Congestion', 'Reduce devices'],
            ['', 'Router issue', 'Restart router'],
            ['Terminal slow', 'Too many apps', 'Close apps'],
            ['', 'Low storage', 'Delete files'],
            ['', 'Outdated', 'Update software']
        ];
        
        y = addTable(troubleshootingTable[0], troubleshootingTable.slice(1), y);
        y += 6;
        
        doc.setFontSize(8);
        doc.setTextColor(...lightGray);
        doc.text('Contact support for unresolved issues.', 20, y);

        // Page 11: Shop Size Advice
        y = addShopAdvice(20);
        
        // Page 12: Maintenance
        doc.addPage();
        y = 20;
        y = addSectionHeader('7. Maintenance & Support', y);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Daily: Clean screen, scanner, check paper', 20, y);
        y += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const dailyTasks = [
            '- Clean touchscreen',
            '- Wipe scanner lens',
            '- Check paper level',
            '- Test cash drawer',
            '- Run reports',
            '- Restart terminal'
        ];
        
        dailyTasks.forEach((task, idx) => {
            doc.text(task, 25, y + (idx * 4));
        });
        y += dailyTasks.length * 4 + 4;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Weekly: Deep clean, check cables', 20, y);
        y += 5;
        
        const weeklyTasks = [
            '- Deep clean hardware',
            '- Check cables',
            '- Test backup internet',
            '- Verify settlement',
            '- Review logs',
            '- Update software'
        ];
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        weeklyTasks.forEach((task, idx) => {
            doc.text(task, 25, y + (idx * 4));
        });
        y += weeklyTasks.length * 4 + 4;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Monthly: Replace paper, clean', 20, y);
        y += 5;
        
        const monthlyTasks = [
            '- Replace paper rolls',
            '- Clean internals',
            '- Test UPS',
            '- Archive data',
            '- Check warranty',
            '- Inventory assets'
        ];
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        monthlyTasks.forEach((task, idx) => {
            doc.text(task, 25, y + (idx * 4));
        });
        y += monthlyTasks.length * 4 + 4;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Support:', 20, y);
        y += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Email: support@dukapos.com', 25, y);
        y += 4;
        doc.text('Phone: +254 XXX XXX XXX', 25, y);
        y += 4;
        doc.text('Web: www.dukapos.com/support', 25, y);
        y += 4;
        doc.text('Hours: Mon-Sat 8AM-6PM EAT', 25, y);
        y += 8;
        
        // Total Investment Summary
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('TOTAL INVESTMENT SUMMARY:', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Small Shop (Essentials + Network):', 25, y);
        doc.text('$740 - $1,330', 140, y);
        y += 5;
        
        doc.text('Medium Shop (Recommended + Network):', 25, y);
        doc.text('$1,280 - $2,300', 140, y);
        y += 5;
        
        doc.text('Large Shop (Complete + Premium):', 25, y);
        doc.text('$2,090 - $3,650', 140, y);
        y += 5;
        
        doc.setFontSize(8);
        doc.setTextColor(...lightGray);
        doc.text('Note: Costs approximate, vary by brand/region.', 20, y);

        // Footer on all pages
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(...lightGray);
            doc.text(`Page ${i} of ${pageCount}`, 180, 290);
            doc.text('DukaPOS Hardware Guide - Confidential', 20, 290);
        }

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename=DukaPOS_Hardware_Guide.pdf'
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});