/**
 * eTIMS Auto-Submit — triggered automatically when a new Sale is created.
 * Uses service role; no user session required.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BASE_URLS = {
  test: 'https://etims-api.kra.go.ke/etims-backend-test',
  prod: 'https://etims-api.kra.go.ke/etims-backend-prod',
};

const PMT_CODE = { cash: '01', card: '02', split: '04', mpesa: '05' };

async function submitToKra(sale, kraPin, deviceSerial, branchId, env) {
  const saleDate = new Date(sale.created_date || new Date());
  const saleDateStr = saleDate.toISOString().slice(0, 10).replace(/-/g, '');
  const cfmDt = saleDate.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const taxableAmt = Math.round((sale.total_amount || 0) - (sale.tax_total || 0));

  const itemList = (sale.items || []).map((item, idx) => {
    const exclVat = Math.round(((item.total || 0) - (item.tax_amount || 0)) * 100) / 100;
    return {
      itemSeq: idx + 1,
      itemCd: item.product_id || `ITEM${idx + 1}`,
      itemNm: item.product_name,
      pkgUnitCd: 'NT',
      pkg: item.quantity,
      qtyUnitCd: 'U',
      qty: item.quantity,
      prc: item.unit_price,
      splyAmt: exclVat,
      dcRt: 0, dcAmt: 0,
      isrccCd: null, isrccNm: null, isrcRt: null, isrcAmt: null,
      vatCatCd: 'B',
      exciseTxCatCd: null,
      vatTaxblAmt: exclVat,
      exciseTxblAmt: null, exciseTxAmt: null,
      vatAmt: Math.round((item.tax_amount || 0) * 100) / 100,
      totAmt: item.total,
    };
  });

  const payload = {
    tin: kraPin,
    bhfId: branchId,
    orgInvcNo: 0,
    cisInvcNo: sale.receipt_number,
    custTin: null,
    custNm: sale.customer_name || null,
    rcptTyCd: 'S',
    pmtTyCd: PMT_CODE[sale.payment_method] || '01',
    salesSttsCd: '02',
    cfmDt,
    salesDt: saleDateStr,
    stockRlsDt: null,
    custBhfId: '00',
    occrRrn: null,
    totItemCnt: itemList.length,
    taxblAmtA: 0, taxblAmtB: taxableAmt, taxblAmtC: 0, taxblAmtD: 0, taxblAmtE: 0,
    taxRtA: 0, taxRtB: 16, taxRtC: 0, taxRtD: 0, taxRtE: 0,
    taxAmtA: 0, taxAmtB: Math.round(sale.tax_total || 0), taxAmtC: 0, taxAmtD: 0, taxAmtE: 0,
    totTaxblAmt: taxableAmt,
    totTaxAmt: Math.round(sale.tax_total || 0),
    totAmt: sale.total_amount,
    remark: sale.notes || null,
    itemList,
  };

  const baseUrl = BASE_URLS[env] || BASE_URLS.test;
  const response = await fetch(`${baseUrl}/oscu/saveTrnsSalesSummary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'tin': kraPin,
      'bhfId': branchId,
      'cmcKey': deviceSerial,
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const kraPin = Deno.env.get('ETIMS_KRA_PIN');
    const deviceSerial = Deno.env.get('ETIMS_DEVICE_SERIAL');
    const branchId = Deno.env.get('ETIMS_BRANCH_ID') || '00';
    const env = Deno.env.get('ETIMS_ENV') || 'test';

    if (!kraPin || !deviceSerial) {
      // Credentials not set yet — mark as not_submitted and exit gracefully
      return Response.json({ success: false, etims_status: 'not_submitted', message: 'eTIMS credentials not configured' });
    }

    const body = await req.json();

    // Support both entity automation payload { event, data } and direct { sale }
    let sale = body.sale || body.data;
    const entityId = body.event?.entity_id;

    // If payload was too large or missing, fetch the sale directly
    if (!sale || body.payload_too_large) {
      if (!entityId) return Response.json({ error: 'No sale data or entity_id provided' }, { status: 400 });
      sale = await base44.asServiceRole.entities.Sale.get(entityId);
    }

    if (!sale || !sale.id) {
      return Response.json({ error: 'Could not resolve sale record' }, { status: 400 });
    }

    // Skip if already submitted
    if (sale.etims_status === 'submitted') {
      return Response.json({ success: true, message: 'Already submitted', cuin: sale.cuin });
    }

    // Skip refunded/voided sales
    if (sale.status !== 'completed') {
      return Response.json({ success: true, message: `Skipped — sale status is ${sale.status}` });
    }

    const result = await submitToKra(sale, kraPin, deviceSerial, branchId, env);

    if (result.resultCd === '000') {
      const cuin = result.data?.cisInvcNo || result.data?.cuin || sale.receipt_number;
      await base44.asServiceRole.entities.Sale.update(sale.id, { cuin, etims_status: 'submitted' });
      return Response.json({ success: true, cuin, etims_status: 'submitted', sale_id: sale.id });
    } else {
      await base44.asServiceRole.entities.Sale.update(sale.id, { etims_status: 'failed' });
      return Response.json({
        success: false,
        etims_status: 'failed',
        error: result.resultMsg || 'KRA rejected the invoice',
        kra_code: result.resultCd,
        sale_id: sale.id,
      }, { status: 422 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});