import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { data: product, event } = payload;

    if (!product) {
      return Response.json({ skipped: true, reason: 'No product data' });
    }

    const threshold = product.low_stock_threshold ?? 10;
    const stock = product.stock_quantity ?? 0;

    // Only alert if stock is at or below threshold
    if (stock > threshold) {
      return Response.json({ skipped: true, reason: 'Stock above threshold' });
    }

    // Fetch business settings for the email
    const settings = await base44.asServiceRole.entities.BusinessSettings.list();
    const biz = settings[0] || {};
    const bizName = biz.business_name || 'Your Store';
    const toEmail = biz.business_email;

    if (!toEmail) {
      return Response.json({ skipped: true, reason: 'No business email configured in Settings' });
    }

    const urgency = stock <= 0 ? '🚫 OUT OF STOCK' : stock <= Math.floor(threshold * 0.5) ? '🚨 CRITICAL' : '⚠️ LOW STOCK';
    const subject = `${urgency}: ${product.name} needs restocking — ${bizName}`;

    const body = `
Hello,

This is an automated inventory alert from ${bizName}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCT: ${product.name}
SKU: ${product.sku || 'N/A'}
CATEGORY: ${product.category || 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Stock:   ${stock} ${product.unit || 'units'}
Low Stock Alert: ${threshold} ${product.unit || 'units'}
Status:          ${urgency}

${stock <= 0
  ? 'This product is OUT OF STOCK. Customers cannot purchase it until restocked.'
  : `Stock has dropped to ${stock} unit(s), which is at or below the low stock threshold of ${threshold}.`
}

Please restock this product as soon as possible to avoid lost sales.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Log in to your POS to update inventory:
Settings → Inventory → ${product.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This alert was sent automatically by ${bizName} POS.
`.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: toEmail,
      subject,
      body,
      from_name: `${bizName} Inventory Alerts`,
    });

    return Response.json({ success: true, product: product.name, stock, threshold, alertedTo: toEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});