/**
 * KRA eTIMS Invoice Submission (OSCU — Online Sales Control Unit)
 *
 * SETUP REQUIRED (set these in Dashboard → Code → Secrets):
 *   ETIMS_KRA_PIN        — Your business KRA PIN (e.g. P051234567A)
 *   ETIMS_DEVICE_SERIAL  — Device serial number issued by KRA after OSCU registration
 *   ETIMS_BRANCH_ID      — Branch code, default "00" for single branch
 *   ETIMS_ENV            — "test" or "prod" (defaults to "test")
 *
 * Register your OSCU device at: https://etims.kra.go.ke
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BASE_URLS = {
  test: 'https://etims-api.kra.go.ke/etims-backend-test',
  prod: 'https://etims-api.kra.go.ke/etims-backend-prod',
};

const PMT_CODE = { cash: '01', card: '02', split: '04', mpesa: '05' };

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const kraPin = Deno.env.get('ETIMS_KRA_PIN');
    const deviceSerial = Deno.env.get('ETIMS_DEVICE_SERIAL');
    const branchId = Deno.env.get('ETIMS_BRANCH_ID') || '00';
    const env = Deno.env.get('ETIMS_ENV') || 'test';

    if (!kraPin || !deviceSerial) {
      // eTIMS not yet configured — mark sale as not_submitted and return gracefully
      return Response.json({
        success: false,
        etims_status: 'not_submitted',
        message: 'eTIMS not configured. Set ETIMS_KRA_PIN and ETIMS_DEVICE_SERIAL in Secrets.',
      });
    }

    const { sale } = await req.json();
    if (!sale) return Response.json({ error: 'sale is required' }, { status: 400 });

    const saleDate = new Date(sale.created_date || new Date());
    const saleDateStr = saleDate.toISOString().slice(0, 10).replace(/-/g, '');
    const cfmDt = saleDate.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

    // Taxable amount = total excl. VAT (after discount)
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
        dcRt: 0,
        dcAmt: 0,
        isrccCd: null,
        isrccNm: null,
        isrcRt: null,
        isrcAmt: null,
        vatCatCd: 'B', // Standard 16% VAT
        exciseTxCatCd: null,
        vatTaxblAmt: exclVat,
        exciseTxblAmt: null,
        exciseTxAmt: null,
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
      rcptTyCd: 'S',      // S = Sale
      pmtTyCd: PMT_CODE[sale.payment_method] || '01',
      salesSttsCd: '02',  // 02 = Approved
      cfmDt,
      salesDt: saleDateStr,
      stockRlsDt: null,
      custBhfId: '00',
      occrRrn: null,
      totItemCnt: itemList.length,
      taxblAmtA: 0,
      taxblAmtB: taxableAmt,
      taxblAmtC: 0,
      taxblAmtD: 0,
      taxblAmtE: 0,
      taxRtA: 0,
      taxRtB: 16,
      taxRtC: 0,
      taxRtD: 0,
      taxRtE: 0,
      taxAmtA: 0,
      taxAmtB: Math.round(sale.tax_total || 0),
      taxAmtC: 0,
      taxAmtD: 0,
      taxAmtE: 0,
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

    const result = await response.json();

    if (result.resultCd === '000') {
      const cuin = result.data?.cisInvcNo || result.data?.cuin || sale.receipt_number;
      await base44.asServiceRole.entities.Sale.update(sale.id, {
        cuin,
        etims_status: 'submitted',
      });
      return Response.json({ success: true, cuin, etims_status: 'submitted' });
    } else {
      await base44.asServiceRole.entities.Sale.update(sale.id, {
        etims_status: 'failed',
      });
      return Response.json({
        success: false,
        etims_status: 'failed',
        error: result.resultMsg || 'KRA rejected the invoice',
        kra_code: result.resultCd,
      }, { status: 422 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});