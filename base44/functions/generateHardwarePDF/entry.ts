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
            doc.rect(0, 0, 210, 40, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text(title, 20, 20);
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(subtitle, 20, 30);
            
            doc.setTextColor(...darkGray);
        };

        const addSectionHeader = (title, icon, y) => {
            doc.setFillColor(...primaryColor);
            doc.rect(20, y - 8, 170, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(title, 25, y - 2);
            doc.setTextColor(...darkGray);
            return y + 10;
        };

        const addTable = (headers, rows, startY) => {
            const colWidths = [50, 80, 50];
            const rowHeight = 10;
            
            // Header row
            doc.setFillColor(240, 240, 240);
            doc.rect(20, startY, 170, rowHeight, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            
            headers.forEach((header, idx) => {
                doc.text(header, 25 + colWidths.slice(0, idx).reduce((a, b) => a + b, 0), startY + 6.5);
            });
            
            // Data rows
            doc.setFont('helvetica', 'normal');
            let y = startY + rowHeight;
            
            rows.forEach((row, idx) => {
                if (y > 250) {
                    doc.addPage();
                    y = 20;
                }
                
                doc.setFillColor(idx % 2 === 0 ? 255 : 248);
                doc.rect(20, y, 170, rowHeight, 'F');
                
                row.forEach((cell, cellIdx) => {
                    doc.text(String(cell), 25 + colWidths.slice(0, cellIdx).reduce((a, b) => a + b, 0), y + 6.5);
                });
                
                y += rowHeight;
            });
            
            return y;
        };

        // Page 1: Cover
        addHeader('DukaPOS Hardware Guide', 'Technical Specifications & Setup Procedures');
        
        doc.setTextColor(...darkGray);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Complete Hardware Requirements for POS Implementation', 20, 60);
        
        doc.setFontSize(10);
        doc.setTextColor(...lightGray);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 70);
        doc.text(`Prepared for: ${user.full_name}`, 20, 76);
        
        // Table of Contents
        let y = 90;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Table of Contents', 20, y);
        y += 15;
        
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
        doc.setFontSize(11);
        tocItems.forEach((item, idx) => {
            doc.text(item, 25, y + (idx * 8));
        });

        // Page 2: Essential Hardware
        doc.addPage();
        y = 20;
        y = addSectionHeader('1. Essential Hardware Components', '📦', y);
        
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
        y += 10;
        
        // Barcode Scanner Table
        doc.setFont('helvetica', 'bold');
        doc.text('1.2 Barcode Scanner', 20, y);
        y += 8;
        
        const scannerSpecs = [
            ['Type', 'Specifications', 'Price Range'],
            ['USB Wired Scanner', '1D/2D, plug & play, 10m cable, 500 scans/sec', '$50 - $100'],
            ['Bluetooth Wireless', '1D/2D, 100m range, 8hr battery, auto-sync', '$80 - $150'],
            ['2D QR Scanner', 'QR/barcode, smartphone screen scanning, omnidirectional', '$100 - $200'],
            ['Mobile Device Camera', 'Built-in, app-based, requires good lighting', '$0 (included)']
        ];
        
        y = addTable(scannerSpecs[0], scannerSpecs.slice(1), y);
        y += 10;
        
        // Receipt Printer Table
        doc.setFont('helvetica', 'bold');
        doc.text('1.3 Receipt Printer', 20, y);
        y += 8;
        
        const printerSpecs = [
            ['Type', 'Specifications', 'Price Range'],
            ['Thermal 58mm', 'USB/Ethernet, 200mm/sec, auto-cutter, 58mm paper', '$80 - $150'],
            ['Thermal 80mm', 'USB/Ethernet/WiFi, 250mm/sec, auto-cutter, 80mm paper', '$120 - $250'],
            ['Bluetooth Mobile', 'Portable, 4-8hr battery, 58mm, wireless', '$100 - $200'],
            ['Paperless Option', 'Email/SMS receipts, no hardware needed', '$0']
        ];
        
        y = addTable(printerSpecs[0], printerSpecs.slice(1), y);

        // Page 3: Payment Hardware
        y = addSectionHeader('2. Payment Processing Hardware', '💳', y);
        
        // Card Reader Table
        doc.setFont('helvetica', 'bold');
        doc.text('2.1 Card Reader / PIN Pad', 20, y);
        y += 8;
        
        const cardReaderSpecs = [
            ['Type', 'Specifications', 'Price Range'],
            ['Integrated Card Reader', 'Chip & PIN, contactless NFC, receipt printer built-in', '$200 - $400'],
            ['Standalone PIN Pad', 'PCI PTS approved, EMV chip, magnetic stripe', '$100 - $250'],
            ['Mobile Card Reader', 'Bluetooth, smartphone attachment, tap/swipe/dip', '$50 - $150'],
            ['Contactless Terminal', 'NFC only, Apple Pay/Google Pay, quick tap', '$150 - $300']
        ];
        
        y = addTable(cardReaderSpecs[0], cardReaderSpecs.slice(1), y);
        y += 10;
        
        // Cash Drawer Table
        doc.setFont('helvetica', 'bold');
        doc.text('2.2 Cash Drawer', 20, y);
        y += 8;
        
        const drawerSpecs = [
            ['Type', 'Specifications', 'Price Range'],
            ['13" Standard Drawer', '4 bill slots, 5 coin compartments, RJ11 trigger', '$100 - $180'],
            ['16" Large Drawer', '5 bill slots, 8 coin compartments, heavy-duty', '$150 - $250'],
            ['Portable Cash Box', 'Lockable, compact, manual operation', '$30 - $80'],
            ['Heavy-Duty Safe', 'Steel construction, digital lock, anchor kit', '$200 - $400']
        ];
        
        y = addTable(drawerSpecs[0], drawerSpecs.slice(1), y);

        // Page 4: Optional Hardware
        y = addSectionHeader('3. Optional Hardware (Enhanced Functionality)', '🔌', y);
        
        const optionalSpecs = [
            ['Equipment', 'Specifications', 'Price Range'],
            ['Customer Display', '15" LCD, HDMI/VGA, shows transaction to customer', '$150 - $300'],
            ['Label Printer', 'Thermal 4"x6", USB, prints barcode labels', '$120 - $350'],
            ['Barcode Scale', 'Digital, 15kg capacity, prints weight labels', '$200 - $500'],
            ['Security Tags', 'EAS system, detacher, 500 tags included', '$150 - $400'],
            ['UPS Battery Backup', '1000VA, 60min runtime, auto-shutdown', '$120 - $250']
        ];
        
        y = addTable(optionalSpecs[0], optionalSpecs.slice(1), y);
        y += 10;
        
        doc.setFontSize(10);
        doc.setTextColor(...lightGray);
        doc.text('Note: Optional hardware enhances functionality but is not required for basic operations.', 20, y);

        // Page 5: Network Requirements
        doc.addPage();
        y = 20;
        y = addSectionHeader('4. Network & Infrastructure Requirements', '📡', y);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Reliable internet connectivity is critical for cloud-based POS operations.', 20, y);
        y += 15;
        
        const networkSpecs = [
            ['Component', 'Minimum Requirement', 'Recommended'],
            ['Internet Speed', '5 Mbps download / 1 Mbps upload', '25 Mbps download / 5 Mbps upload'],
            ['Connection Type', '4G LTE / Basic broadband', 'Fiber optic / Business cable'],
            ['Router', 'WiFi 5 (802.11ac)', 'WiFi 6 (802.11ax) with QoS'],
            ['Backup', 'Mobile hotspot capability', 'Dual WAN with 4G/5G failover'],
            ['Ethernet', 'Cat5e cables (up to 100m)', 'Cat6 cables (gigabit speeds)']
        ];
        
        y = addTable(networkSpecs[0], networkSpecs.slice(1), y);
        y += 10;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Network Setup Checklist:', 20, y);
        y += 8;
        
        const networkChecklist = [
            '✓ Router with at least 4 LAN ports',
            '✓ Ethernet cables (Cat5e or Cat6) for wired connections',
            '✓ WiFi network with WPA2/WPA3 security',
            '✓ Static IP address (optional but recommended)',
            '✓ UPS battery backup for router/modem',
            '✓ Mobile hotspot as backup internet source'
        ];
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        networkChecklist.forEach((item, idx) => {
            doc.text(item, 25, y + (idx * 6));
        });

        // Page 6-7: Step-by-Step Setup Procedure
        doc.addPage();
        y = 20;
        y = addSectionHeader('5. Step-by-Step Setup Procedure', '📋', y);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Phase 1: Unboxing & Inspection (Day 1)', 20, y);
        y += 10;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const phase1Steps = [
            '1.1 Carefully unbox all hardware components',
            '1.2 Verify all items against packing list/invoice',
            '1.3 Inspect for physical damage during shipping',
            '1.4 Check power cables and adapters match your region',
            '1.5 Organize components by category (terminals, printers, scanners, etc.)',
            '1.6 Keep all packaging materials for 30 days (return window)'
        ];
        
        phase1Steps.forEach((step, idx) => {
            doc.text(step, 25, y + (idx * 6));
        });
        y += phase1Steps.length * 6 + 5;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Phase 2: Hardware Assembly (Day 1-2)', 20, y);
        y += 10;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const phase2Steps = [
            '2.1 POS Terminal Setup:',
            '   - Connect monitor (if separate) via HDMI/VGA',
            '   - Connect keyboard and mouse (USB or Bluetooth)',
            '   - Plug in power adapter and turn on',
            '   - Complete initial OS setup (Windows/Android/iOS)',
            '',
            '2.2 Receipt Printer Installation:',
            '   - Load thermal paper roll (ensure correct orientation)',
            '   - Connect to power and turn on',
            '   - Connect via USB/Ethernet/WiFi to POS terminal',
            '   - Install printer drivers (if required)',
            '   - Print test page to verify connection',
            '',
            '2.3 Barcode Scanner Setup:',
            '   - USB scanner: Plug into POS terminal USB port',
            '   - Bluetooth scanner: Charge fully, pair via Bluetooth settings',
            '   - Test by scanning a known barcode',
            '   - Configure scanner settings (prefix/suffix if needed)',
            '',
            '2.4 Cash Drawer Connection:',
            '   - Connect RJ11 cable to receipt printer (not directly to POS)',
            '   - Plug in power adapter if required',
            '   - Test by triggering from POS software',
            '   - Organize coin compartments and bill slots',
            '',
            '2.5 Card Reader/PIN Pad:',
            '   - Connect via USB/Bluetooth/Ethernet',
            '   - Follow payment provider activation instructions',
            '   - Test with small transaction',
            '   - Ensure PCI compliance signage is visible'
        ];
        
        phase2Steps.forEach((step, idx) => {
            doc.text(step, 25, y + (idx * 6));
        });
        y += phase2Steps.length * 6 + 5;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Phase 3: Network Configuration (Day 2)', 20, y);
        y += 10;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const phase3Steps = [
            '3.1 Router/Modem Setup:',
            '   - Connect modem to internet source (fiber/cable/DSL)',
            '   - Power on router and wait for stable connection',
            '   - Configure WiFi network name (SSID) and password',
            '   - Enable WPA2/WPA3 security',
            '   - Set up guest network (optional, for customer WiFi)',
            '',
            '3.2 POS Terminal Network Connection:',
            '   - Wired: Connect Ethernet cable from router to POS terminal',
            '   - Wireless: Connect to WiFi network via settings',
            '   - Test internet connectivity (open browser, visit website)',
            '   - Note IP address for troubleshooting reference',
            '',
            '3.3 Backup Internet Setup:',
            '   - Configure mobile hotspot device',
            '   - Test failover by disconnecting primary internet',
            '   - Ensure POS terminal automatically switches to backup'
        ];
        
        phase3Steps.forEach((step, idx) => {
            doc.text(step, 25, y + (idx * 6));
        });

        // Page 8: Software & Testing
        y += phase3Steps.length * 6 + 10;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Phase 4: Software Installation & Configuration (Day 3)', 20, y);
        y += 10;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const phase4Steps = [
            '4.1 DukaPOS Software Setup:',
            '   - Open web browser (Chrome/Firefox/Edge recommended)',
            '   - Navigate to DukaPOS application URL',
            '   - Log in with admin credentials',
            '   - Complete business profile setup',
            '   - Configure tax rates and currency settings',
            '',
            '4.2 Peripheral Configuration in DukaPOS:',
            '   - Go to Settings > Hardware',
            '   - Select and configure receipt printer model',
            '   - Configure barcode scanner (if settings available)',
            '   - Set up cash drawer trigger settings',
            '   - Connect payment processor integration',
            '',
            '4.3 Product Catalog Setup:',
            '   - Import products via CSV or add manually',
            '   - Ensure all products have barcodes/SKUs',
            '   - Set prices, tax rates, and stock levels',
            '   - Test barcode scanning for random products',
            '',
            '4.4 User Accounts & Permissions:',
            '   - Create user accounts for cashiers/staff',
            '   - Assign appropriate roles and permissions',
            '   - Set up PIN codes or login credentials',
            '   - Test login for each user type'
        ];
        
        phase4Steps.forEach((step, idx) => {
            doc.text(step, 25, y + (idx * 6));
        });

        // Page 9: Testing & Training
        doc.addPage();
        y = 20;
        y = addSectionHeader('5. Step-by-Step Setup Procedure (continued)', '📋', y);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Phase 5: Testing & Validation (Day 3-4)', 20, y);
        y += 10;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const phase5Steps = [
            '5.1 Hardware Testing Checklist:',
            '   ✓ Print test receipt (verify clarity and alignment)',
            '   ✓ Scan 10+ different barcodes (test speed and accuracy)',
            '   ✓ Open cash drawer 5+ times (test reliability)',
            '   ✓ Process test card payment (small amount)',
            '   ✓ Process test cash payment and give change',
            '   ✓ Test refund/void transaction',
            '   ✓ Verify all hardware works after restart',
            '',
            '5.2 Software Testing Checklist:',
            '   ✓ Create test sale with multiple items',
            '   ✓ Apply discount and verify calculation',
            '   ✓ Process split payment (cash + card)',
            '   ✓ Generate and email receipt',
            '   ✓ Check inventory deduction accuracy',
            '   ✓ Verify sales appear in reports',
            '   ✓ Test offline mode (if available)',
            '   ✓ Sync data after reconnecting to internet',
            '',
            '5.3 Integration Testing:',
            '   ✓ Verify payment processor settlement',
            '   ✓ Test email/SMS receipt delivery',
            '   ✓ Check cloud backup and sync',
            '   ✓ Test mobile app (if applicable)',
            '   ✓ Verify multi-device synchronization'
        ];
        
        phase5Steps.forEach((step, idx) => {
            doc.text(step, 25, y + (idx * 6));
        });
        y += phase5Steps.length * 6 + 5;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Phase 6: Staff Training (Day 4-5)', 20, y);
        y += 10;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const phase6Steps = [
            '6.1 Basic Operations Training:',
            '   - Logging in and out of POS system',
            '   - Processing cash sales',
            '   - Processing card payments',
            '   - Handling split payments',
            '   - Applying discounts and promotions',
            '   - Printing/emailing receipts',
            '',
            '6.2 Advanced Operations Training:',
            '   - Processing returns and refunds',
            '   - Voiding transactions',
            '   - Opening/closing shifts',
            '   - Cash drawer reconciliation',
            '   - Handling price overrides',
            '   - Manager approval workflows',
            '',
            '6.3 Troubleshooting Training:',
            '   - What to do when internet goes down',
            '   - How to restart frozen terminal',
            '   - Replacing receipt paper roll',
            '   - Reconnecting Bluetooth devices',
            '   - Who to contact for technical support',
            '   - Emergency manual receipt procedures'
        ];
        
        phase6Steps.forEach((step, idx) => {
            doc.text(step, 25, y + (idx * 6));
        });

        // Page 10: Troubleshooting
        doc.addPage();
        y = 20;
        y = addSectionHeader('6. Troubleshooting Guide', '🔧', y);
        
        const troubleshootingTable = [
            ['Issue', 'Possible Cause', 'Solution'],
            ['Receipt printer not printing', 'No paper / Wrong orientation', 'Reload paper, ensure thermal side faces up'],
            ['', 'Loose cable connection', 'Check USB/Ethernet/power cables'],
            ['', 'Wrong printer selected', 'Select correct printer in POS settings'],
            ['', 'Driver not installed', 'Install/update printer drivers'],
            ['Barcode scanner not working', 'USB port not recognized', 'Try different USB port'],
            ['', 'Bluetooth not paired', 'Re-pair scanner in Bluetooth settings'],
            ['', 'Barcode damaged/dirty', 'Clean barcode or enter SKU manually'],
            ['Cash drawer not opening', 'RJ11 cable unplugged', 'Connect to receipt printer'],
            ['', 'No power to drawer', 'Check power adapter connection'],
            ['', 'Software trigger failed', 'Test drawer from POS settings'],
            ['Card reader not responding', 'No power/connection', 'Check USB/power cables'],
            ['', 'Not activated', 'Contact payment provider for activation'],
            ['', 'Transaction declined', 'Try different card or payment method'],
            ['WiFi connection drops', 'Weak signal strength', 'Move router closer or add extender'],
            ['', 'Network congestion', 'Reduce connected devices or upgrade plan'],
            ['', 'Router malfunction', 'Restart router (unplug 30 seconds)'],
            ['POS terminal slow/freezes', 'Too many apps running', 'Close unnecessary applications'],
            ['', 'Low storage space', 'Delete unnecessary files/apps'],
            ['', 'Outdated software', 'Update OS and browser to latest version']
        ];
        
        y = addTable(troubleshootingTable[0], troubleshootingTable.slice(1), y);
        y += 10;
        
        doc.setFontSize(10);
        doc.setTextColor(...lightGray);
        doc.text('For issues not resolved by troubleshooting steps, contact DukaPOS support.', 20, y);

        // Page 11: Maintenance
        y = addSectionHeader('7. Maintenance & Support', '🛠️', y);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Daily Maintenance:', 20, y);
        y += 8;
        
        const dailyTasks = [
            '• Clean touchscreen with microfiber cloth',
            '• Wipe down barcode scanner lens',
            '• Check receipt paper level and replace if low',
            '• Verify cash drawer closes properly',
            '• Run end-of-day reports and backups',
            '• Restart POS terminal (clears memory)'
        ];
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        dailyTasks.forEach((task, idx) => {
            doc.text(task, 25, y + (idx * 6));
        });
        y += dailyTasks.length * 6 + 5;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Weekly Maintenance:', 20, y);
        y += 8;
        
        const weeklyTasks = [
            '• Deep clean all hardware surfaces',
            '• Check all cable connections (tighten if loose)',
            '• Test backup internet connection',
            '• Verify payment processor settlement',
            '• Review system logs for errors',
            '• Update software if updates available'
        ];
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        weeklyTasks.forEach((task, idx) => {
            doc.text(task, 25, y + (idx * 6));
        });
        y += weeklyTasks.length * 6 + 5;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Monthly Maintenance:', 20, y);
        y += 8;
        
        const monthlyTasks = [
            '• Replace receipt paper rolls (preventive)',
            '• Clean internal components (compressed air)',
            '• Test UPS battery backup',
            '• Review and archive old transaction data',
            '• Check warranty status on all hardware',
            '• Inventory all hardware assets'
        ];
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        monthlyTasks.forEach((task, idx) => {
            doc.text(task, 25, y + (idx * 6));
        });
        y += monthlyTasks.length * 6 + 10;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Support Contact Information:', 20, y);
        y += 8;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Email: support@dukapos.com', 25, y);
        y += 6;
        doc.text('Phone: +254 XXX XXX XXX', 25, y);
        y += 6;
        doc.text('Website: www.dukapos.com/support', 25, y);
        y += 6;
        doc.text('Hours: Monday - Saturday, 8:00 AM - 6:00 PM EAT', 25, y);

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