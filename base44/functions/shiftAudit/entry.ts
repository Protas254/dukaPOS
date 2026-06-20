import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, auditId, auditData } = await req.json();

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