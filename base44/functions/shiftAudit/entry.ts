import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json().catch(() => null);

        // Check if this is an automation trigger (entity event)
        if (body?.event?.type && body?.data) {
            const { event, data, old_data } = body;
            
            // Only process Sale events
            if (event.entity_name !== 'Sale') {
                return Response.json({ success: false, reason: 'Not a Sale event' });
            }

            // Fetch the current user (cashier)
            let user;
            try {
                user = await base44.auth.me();
            } catch (e) {
                // For automations, we might not have a user context
                // Use the cashier info from the sale data
                user = null;
            }

            // Determine audit type based on sale status or discount
            let auditType = null;
            let reason = '';
            let amount = 0;

            if (data.status === 'refunded') {
                auditType = 'refund_override';
                reason = `Refund processed for receipt ${data.receipt_number || 'N/A'}`;
                amount = data.total_amount || 0;
            } else if (data.status === 'voided') {
                auditType = 'void_transaction';
                reason = `Transaction voided for receipt ${data.receipt_number || 'N/A'}`;
                amount = data.total_amount || 0;
            } else if ((data.discount_amount || 0) > 0) {
                const oldDiscount = old_data?.discount_amount || 0;
                // Only create audit if discount is new or increased
                if (data.discount_amount > oldDiscount) {
                    auditType = 'discount_override';
                    reason = `Discount of KES ${data.discount_amount} applied to receipt ${data.receipt_number || 'N/A'}`;
                    amount = data.discount_amount;
                }
            }

            // Skip if no audit type determined
            if (!auditType) {
                return Response.json({ success: false, reason: 'No audit required' });
            }

            // Create audit record
            const auditData = {
                shift_id: data.shift_id || null,
                cashier_id: data.cashier_id || null,
                cashier_name: data.cashier_name || 'Unknown',
                audit_type: auditType,
                amount: amount,
                original_amount: data.total_amount || 0,
                sale_amount: data.total_amount || 0,
                discount_amount: data.discount_amount || 0,
                sale_receipt_number: data.receipt_number || null,
                sale_id: event.entity_id,
                reason: reason,
                category: 'other',
                requires_approval: true,
                approval_status: 'pending',
                created_at: new Date().toISOString(),
            };

            const newAudit = await base44.entities.ShiftAudit.create(auditData);
            return Response.json({ success: true, audit: newAudit });
        }

        // Manual audit creation (from End of Day Reconciliation)
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, auditId, auditData } = body;

        // Create new audit record
        if (action === 'create') {
            const newAudit = await base44.entities.ShiftAudit.create({
                ...auditData,
                created_by_id: user.id,
            });
            return Response.json({ success: true, audit: newAudit });
        }

        // Approve audit record (admin only)
        if (action === 'approve') {
            if (user.role !== 'admin') {
                return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
            }

            await base44.entities.ShiftAudit.update(auditId, {
                approval_status: 'approved',
                approved_by: user.id,
                approved_by_name: user.full_name,
                approved_at: new Date().toISOString(),
            });

            return Response.json({ success: true });
        }

        // Reject audit record (admin only)
        if (action === 'reject') {
            if (user.role !== 'admin') {
                return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
            }

            await base44.entities.ShiftAudit.update(auditId, {
                approval_status: 'rejected',
                approved_by: user.id,
                approved_by_name: user.full_name,
                approved_at: new Date().toISOString(),
            });

            return Response.json({ success: true });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});