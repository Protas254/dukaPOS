import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import PDFDocument from 'npm:pdfkit@0.15.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));

        // Title
        doc.fontSize(24).font('Helvetica-Bold').text('eTIMS Integration Roadmap', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').text('DukaPOS - Kenya Revenue Authority Compliance Guide', { align: 'center' });
        doc.moveDown(1);

        // Introduction
        doc.fontSize(16).font('Helvetica-Bold').text('Overview');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text(
            'This roadmap outlines the step-by-step process for integrating KRA eTIMS (Electronic Tax Invoice Management System) ' +
            'into your DukaPOS system. The integration ensures compliance with Kenyan tax regulations and enables automatic ' +
            'submission of invoices to KRA.'
        );
        doc.moveDown(1);

        // Timeline
        doc.fontSize(14).font('Helvetica-Bold').text('Implementation Timeline: 6-8 Weeks');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text('Estimated completion: 6-8 weeks from project initiation to production go-live');
        doc.moveDown(2);

        // Phase 1
        doc.fontSize(16).font('Helvetica-Bold').text('Phase 1: Preparation & Requirements (Week 1-2)');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text('1.1 KRA Registration & Documentation', { bold: true });
        doc.text('   - Register for eTIMS portal access at https://etims.kra.go.ke');
        doc.text('   - Download integration documentation and API specifications');
        doc.text('   - Request OSCU (Online Sales Control Unit) credentials');
        doc.text('   - Note: Allow 5-7 business days for KRA approval');
        doc.moveDown(0.5);

        doc.fontSize(11).font('Helvetica').text('1.2 Business Information Setup', { bold: true });
        doc.text('   - Verify KRA PIN is active and up-to-date');
        doc.text('   - Ensure business details match KRA records');
        doc.text('   - Update BusinessSettings entity in DukaPOS with:');
        doc.text('     • Legal business name');
        doc.text('     • KRA PIN (11 characters)');
        doc.text('     • Business address and contact details');
        doc.moveDown(0.5);

        doc.fontSize(11).font('Helvetica').text('1.3 Technical Prerequisites', { bold: true });
        doc.text('   - Active internet connection for API calls');
        doc.text('   - SSL certificate for secure communication');
        doc.text('   - Backup power solution for uninterrupted operations');
        doc.moveDown(1);

        // Phase 2
        doc.fontSize(16).font('Helvetica-Bold').text('Phase 2: Technical Setup (Week 2-3)');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text('2.1 Environment Configuration', { bold: true });
        doc.text('   - Set up KRA sandbox/testing environment access');
        doc.text('   - Configure API endpoints (test vs production)');
        doc.text('   - Store credentials securely (ETIMS_KRA_PIN, ETIMS_DEVICE_SERIAL)');
        doc.moveDown(0.5);

        doc.fontSize(11).font('Helvetica').text('2.2 DukaPOS Configuration', { bold: true });
        doc.text('   - Update BusinessSettings with KRA PIN');
        doc.text('   - Configure tax rates (standard 16% VAT)');
        doc.text('   - Enable eTIMS fields in product and sale entities');
        doc.moveDown(0.5);

        doc.fontSize(11).font('Helvetica').text('2.3 Backend Function Deployment', { bold: true });
        doc.text('   - Deploy submitEtimsInvoice function for real-time submission');
        doc.text('   - Deploy etimsAutoSubmit for automatic processing');
        doc.text('   - Deploy etimsRetryFailed for failed invoice recovery');
        doc.moveDown(1);

        // Phase 3
        doc.fontSize(16).font('Helvetica-Bold').text('Phase 3: Integration & Testing (Week 3-4)');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text('3.1 Invoice Submission Flow', { bold: true });
        doc.text('   - Implement invoice data mapping to KRA JSON schema');
        doc.text('   - Test single invoice submission via API');
        doc.text('   - Validate CUIN (Control Unit Invoice Number) generation');
        doc.text('   - Handle response codes and error messages');
        doc.moveDown(0.5);

        doc.fontSize(11).font('Helvetica').text('3.2 Batch Processing', { bold: true });
        doc.text('   - Implement daily summary generation');
        doc.text('   - Test bulk invoice submission');
        doc.text('   - Verify payment method mapping (Cash=01, Card=02, M-Pesa=05)');
        doc.moveDown(0.5);

        doc.fontSize(11).font('Helvetica').text('3.3 Error Handling', { bold: true });
        doc.text('   - Implement retry logic for failed submissions');
        doc.text('   - Set up alerts for submission failures');
        doc.text('   - Create manual override procedures');
        doc.moveDown(1);

        // Phase 4
        doc.fontSize(16).font('Helvetica-Bold').text('Phase 4: Compliance Verification (Week 4-5)');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text('4.1 KRA Certification', { bold: true });
        doc.text('   - Submit test invoices to KRA sandbox environment');
        doc.text('   - Pass KRA validation and compliance checks');
        doc.text('   - Receive OSCU certification number');
        doc.moveDown(0.5);

        doc.fontSize(11).font('Helvetica').text('4.2 Production Cutover', { bold: true });
        doc.text('   - Switch API endpoints to production environment');
        doc.text('   - Update OSCU serial to production value');
        doc.text('   - Conduct parallel run for 7 days');
        doc.moveDown(0.5);

        doc.fontSize(11).font('Helvetica').text('4.3 Staff Training', { bold: true });
        doc.text('   - Train cashiers on eTIMS-compliant receipts');
        doc.text('   - Educate managers on compliance dashboard');
        doc.text('   - Document troubleshooting procedures');
        doc.moveDown(1);

        // Phase 5
        doc.fontSize(16).font('Helvetica-Bold').text('Phase 5: Go-Live & Monitoring (Week 5-6)');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text('5.1 Production Launch', { bold: true });
        doc.text('   - Enable automatic eTIMS submission for all sales');
        doc.text('   - Monitor first week of transactions closely');
        doc.text('   - Verify all CUINs are generated successfully');
        doc.moveDown(0.5);

        doc.fontSize(11).font('Helvetica').text('5.2 Ongoing Compliance', { bold: true });
        doc.text('   - Daily: Review eTIMS dashboard for failed submissions');
        doc.text('   - Weekly: Export and backup KRA JSON files');
        doc.text('   - Monthly: Reconcile submitted invoices with iTax returns');
        doc.moveDown(0.5);

        doc.fontSize(11).font('Helvetica').text('5.3 Maintenance', { bold: true });
        doc.text('   - Keep OSCU credentials updated before expiry');
        doc.text('   - Monitor KRA API changes and updates');
        doc.text('   - Maintain audit trail for 5 years minimum');
        doc.moveDown(2);

        // Technical Requirements
        doc.fontSize(16).font('Helvetica-Bold').text('Technical Requirements');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text('API Endpoints:');
        doc.text('   - Sandbox: https://etims-sandbox.kra.go.ke/api/v1');
        doc.text('   - Production: https://etims.kra.go.ke/api/v1');
        doc.moveDown(0.5);

        doc.fontSize(11).font('Helvetica').text('Required Credentials:');
        doc.text('   - ETIMS_KRA_PIN: Your 11-character KRA PIN');
        doc.text('   - ETIMS_DEVICE_SERIAL: OSCU device serial number');
        doc.text('   - ETIMS_API_KEY: Authentication token from KRA');
        doc.moveDown(0.5);

        doc.fontSize(11).font('Helvetica').text('Invoice Data Requirements:');
        doc.text('   - Valid receipt number (unique per transaction)');
        doc.text('   - Accurate tax breakdown (16% VAT standard rate)');
        doc.text('   - Payment method codes (01=Cash, 02=Card, 04=Split, 05=M-Pesa)');
        doc.text('   - Customer details (optional for B2C, required for B2B)');
        doc.moveDown(2);

        // Support Resources
        doc.fontSize(16).font('Helvetica-Bold').text('Support Resources');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text('Official KRA Channels:');
        doc.text('   - eTIMS Portal: https://etims.kra.go.ke');
        doc.text('   - iTax Portal: https://itax.kra.go.ke');
        doc.text('   - KRA Contact Centre: +254 711 099 999');
        doc.text('   - Email: callcentre@kra.go.ke');
        doc.moveDown(0.5);

        doc.fontSize(11).font('Helvetica').text('Documentation:');
        doc.text('   - eTIMS Integration Guide (download from portal)');
        doc.text('   - API Reference Documentation');
        doc.text('   - Invoice Schema Specification');
        doc.moveDown(2);

        // Footer
        doc.fontSize(9).font('Helvetica').text(
            `Generated for ${user.full_name} | ${new Date().toLocaleDateString()}`,
            { align: 'center' }
        );
        doc.text('DukaPOS eTIMS Integration Roadmap v1.0', { align: 'center' });

        doc.end();

        // Wait for PDF to complete
        const pdfBuffer = await new Promise((resolve) => {
            doc.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
        });

        return new Response(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="etims-integration-roadmap.pdf"',
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});