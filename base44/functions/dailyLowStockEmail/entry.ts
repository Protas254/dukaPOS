import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use service role for scheduled access
    const products = await base44.asServiceRole.entities.Product.list();
    const settings = await base44.asServiceRole.entities.BusinessSettings.list();
    const businessSettings = settings[0] || {};

    const lowStock = products.filter(p =>
      p.is_active !== false &&
      (p.stock_quantity || 0) <= (p.low_stock_threshold || 10)
    );

    if (lowStock.length === 0) {
      return Response.json({ message: 'No low stock items', sent: false });
    }

    const outOfStock = lowStock.filter(p => p.stock_quantity <= 0);
    const critical = lowStock.filter(p => p.stock_quantity > 0 && p.stock_quantity <= Math.floor((p.low_stock_threshold || 10) * 0.5));
    const low = lowStock.filter(p => p.stock_quantity > Math.floor((p.low_stock_threshold || 10) * 0.5));

    const rows = (items, label) => items.length === 0 ? '' : `
      <h3 style="color:#dc2626;margin:16px 0 8px">${label} (${items.length})</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr style="background:#f3f4f6">
          <th style="padding:8px;text-align:left;border:1px solid #e5e7eb">Product</th>
          <th style="padding:8px;text-align:right;border:1px solid #e5e7eb">Stock</th>
          <th style="padding:8px;text-align:right;border:1px solid #e5e7eb">Threshold</th>
          <th style="padding:8px;text-align:left;border:1px solid #e5e7eb">SKU</th>
        </tr>
        ${items.map(p => `
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb">${p.name}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;color:${p.stock_quantity <= 0 ? '#dc2626' : '#d97706'};font-weight:bold">${p.stock_quantity} ${p.unit || ''}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">${p.low_stock_threshold || 10}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;font-family:monospace">${p.sku || '—'}</td>
          </tr>
        `).join('')}
      </table>
    `;

    const businessName = businessSettings.business_name || 'Your Store';
    const toEmail = businessSettings.business_email;

    if (!toEmail) {
      return Response.json({ message: 'No business email configured in Settings', sent: false });
    }

    const body = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#0f766e;color:white;padding:20px;border-radius:8px 8px 0 0">
          <h2 style="margin:0">📦 Daily Stock Alert — ${businessName}</h2>
          <p style="margin:4px 0 0;opacity:0.85">${new Date().toLocaleDateString('en-KE', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
        <div style="padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <p style="font-size:15px">You have <strong>${lowStock.length} product${lowStock.length > 1 ? 's' : ''}</strong> that need restocking:</p>
          ${rows(outOfStock, '🔴 Out of Stock')}
          ${rows(critical, '🟠 Critical (< 50% of threshold)')}
          ${rows(low, '🟡 Low Stock')}
          <p style="margin-top:24px;color:#6b7280;font-size:12px">
            This is an automated daily alert from your SoftPOS system. 
            Log in to manage your inventory.
          </p>
        </div>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: toEmail,
      subject: `⚠️ ${lowStock.length} Low Stock Alert${lowStock.length > 1 ? 's' : ''} — ${businessName}`,
      body,
      from_name: businessName,
    });

    return Response.json({ message: `Email sent to ${toEmail}`, sent: true, count: lowStock.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});