import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  FileDown, RefreshCw, CheckCircle, XCircle, Clock,
  AlertTriangle, ChevronLeft, ChevronRight, FileJson, FileText, ArrowLeft, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import EtimsRoadmap from '@/components/etims/EtimsRoadmap';

const STATUS_CONFIG = {
  submitted:    { label: 'Submitted',     icon: CheckCircle,    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  failed:       { label: 'Failed',        icon: XCircle,        cls: 'bg-red-100 text-red-700 border-red-200' },
  not_submitted:{ label: 'Not Submitted', icon: Clock,          cls: 'bg-amber-100 text-amber-700 border-amber-200' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_submitted;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

export default function EtimsCompliance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [resubmitting, setResubmitting] = useState(new Set());

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayStart = startOfDay(selectedDate).toISOString();
  const dayEnd = endOfDay(selectedDate).toISOString();

  const { data: settings = [] } = useQuery({
    queryKey: ['business-settings'],
    queryFn: () => base44.entities.BusinessSettings.list(),
  });
  const biz = settings[0] || {};

  const { data: allSales = [], isLoading } = useQuery({
    queryKey: ['sales-etims', dateStr],
    queryFn: () => base44.entities.Sale.filter({ status: 'completed' }),
  });

  // Filter to selected day client-side
  const sales = useMemo(() => allSales.filter(s => {
    const d = new Date(s.created_date);
    return d >= new Date(dayStart) && d <= new Date(dayEnd);
  }), [allSales, dayStart, dayEnd]);

  const submitted    = sales.filter(s => s.etims_status === 'submitted');
  const failed       = sales.filter(s => s.etims_status === 'failed');
  const notSubmitted = sales.filter(s => !s.etims_status || s.etims_status === 'not_submitted');

  const totalRevenue = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const totalVat     = sales.reduce((sum, s) => sum + (s.tax_total || 0), 0);
  const taxableAmt   = totalRevenue - totalVat;

  const shiftDate = (days) => setSelectedDate(d => {
    const next = new Date(d);
    next.setDate(next.getDate() + days);
    return next;
  });

  // Re-submit a single failed/pending sale
  const resubmit = async (sale) => {
    setResubmitting(prev => new Set(prev).add(sale.id));
    try {
      const res = await base44.functions.invoke('submitEtimsInvoice', {
        sale: { ...sale }
      });
      if (res.data?.etims_status === 'submitted') {
        toast({ title: 'Invoice submitted to KRA', description: `CUIN: ${res.data.cuin}` });
      } else {
        toast({ title: 'Submission failed', description: res.data?.error || 'KRA rejected the invoice', variant: 'destructive' });
      }
      queryClient.invalidateQueries({ queryKey: ['sales-etims', dateStr] });
    } catch {
      toast({ title: 'Error', description: 'Could not reach eTIMS function', variant: 'destructive' });
    } finally {
      setResubmitting(prev => { const s = new Set(prev); s.delete(sale.id); return s; });
    }
  };

  // Re-submit ALL failed + not_submitted
  const resubmitAll = async () => {
    const pending = [...failed, ...notSubmitted];
    for (const sale of pending) await resubmit(sale);
  };

  // Build KRA-format daily summary JSON
  const buildKraJson = () => {
    const PMT_CODE = { cash: '01', card: '02', split: '04', mpesa: '05' };
    return {
      exportDate: dateStr,
      exportedAt: new Date().toISOString(),
      business: {
        tin: biz.kra_pin || '',
        name: biz.business_name || '',
        address: biz.business_address || '',
      },
      dailySummary: {
        totalSales: sales.length,
        totalRevenue,
        totalVat,
        taxableAmount: taxableAmt,
        submitted: submitted.length,
        failed: failed.length,
        notSubmitted: notSubmitted.length,
      },
      invoices: sales.map(s => ({
        cisInvcNo: s.receipt_number,
        cuin: s.cuin || null,
        etimsStatus: s.etims_status || 'not_submitted',
        salesDt: format(new Date(s.created_date), 'yyyyMMdd'),
        cfmDt: format(new Date(s.created_date), "yyyyMMddHHmmss"),
        rcptTyCd: 'S',
        pmtTyCd: PMT_CODE[s.payment_method] || '01',
        custNm: s.customer_name || null,
        taxblAmtB: Math.round((s.total_amount || 0) - (s.tax_total || 0)),
        taxAmtB: Math.round(s.tax_total || 0),
        totAmt: s.total_amount,
        itemList: (s.items || []).map((item, idx) => ({
          itemSeq: idx + 1,
          itemNm: item.product_name,
          qty: item.quantity,
          prc: item.unit_price,
          splyAmt: Math.round((item.total || 0) - (item.tax_amount || 0)),
          vatCatCd: 'B',
          vatTaxblAmt: Math.round((item.total || 0) - (item.tax_amount || 0)),
          vatAmt: Math.round(item.tax_amount || 0),
          totAmt: item.total,
        })),
      })),
    };
  };

  const downloadJson = () => {
    const data = buildKraJson();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `etims-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCsv = () => {
    const rows = [
      ['Receipt No', 'CUIN', 'eTIMS Status', 'Date', 'Payment', 'Customer', 'Taxable (B)', 'VAT 16%', 'Total (KES)'],
      ...sales.map(s => [
        s.receipt_number,
        s.cuin || '',
        s.etims_status || 'not_submitted',
        format(new Date(s.created_date), 'dd/MM/yyyy HH:mm'),
        s.payment_method?.toUpperCase(),
        s.customer_name || '',
        Math.round((s.total_amount || 0) - (s.tax_total || 0)),
        Math.round(s.tax_total || 0),
        s.total_amount,
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `etims-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">eTIMS Compliance</h1>
          <p className="text-muted-foreground text-sm mt-0.5">KRA daily invoice tracking &amp; export</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(failed.length > 0 || notSubmitted.length > 0) && (
            <Button variant="outline" size="sm" onClick={resubmitAll} className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50">
              <RefreshCw className="w-3.5 h-3.5" />
              Re-submit All ({failed.length + notSubmitted.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={downloadCsv} className="gap-2">
            <FileText className="w-3.5 h-3.5" />
            CSV
          </Button>
          <Button size="sm" onClick={downloadJson} className="gap-2">
            <FileJson className="w-3.5 h-3.5" />
            Export KRA JSON
          </Button>
        </div>
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => shiftDate(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <input
          type="date"
          value={dateStr}
          max={format(new Date(), 'yyyy-MM-dd')}
          onChange={e => setSelectedDate(new Date(e.target.value))}
          className="border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button variant="outline" size="icon" onClick={() => shiftDate(1)} disabled={dateStr >= format(new Date(), 'yyyy-MM-dd')}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date())} className="text-muted-foreground">Today</Button>
      </div>

      {/* KRA env warning */}
      {biz.kra_pin ? (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          KRA PIN: <strong>{biz.kra_pin}</strong> — {biz.business_name}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          KRA PIN not configured. Go to <strong>Settings</strong> to add your business details.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Invoices</p>
            <p className="text-2xl font-bold font-display">{sales.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Revenue (KES)</p>
            <p className="text-2xl font-bold font-display">{Math.round(totalRevenue).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Taxable Amt (B)</p>
            <p className="text-2xl font-bold font-display">{Math.round(taxableAmt).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">VAT 16% Collected</p>
            <p className="text-2xl font-bold font-display text-primary">{Math.round(totalVat).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Submission status bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-emerald-700">{submitted.length}</p>
          <p className="text-xs text-emerald-600 font-medium">Submitted</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <XCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-red-600">{failed.length}</p>
          <p className="text-xs text-red-500 font-medium">Failed</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <Clock className="w-6 h-6 text-amber-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-700">{notSubmitted.length}</p>
          <p className="text-xs text-amber-600 font-medium">Not Submitted</p>
        </div>
      </div>

      {/* Invoice table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Invoices — {format(selectedDate, 'dd MMMM yyyy')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : sales.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No sales recorded on this date.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Invoice No.</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Time</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Payment</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs">Taxable (B)</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs">VAT 16%</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs">Total (KES)</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">CUIN</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">eTIMS</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(sale => (
                    <tr key={sale.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold">{sale.receipt_number}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {format(new Date(sale.created_date), 'HH:mm')}
                      </td>
                      <td className="px-4 py-3 uppercase text-xs">
                        {sale.payment_method === 'mpesa' ? 'M-PESA' : sale.payment_method}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {Math.round((sale.total_amount || 0) - (sale.tax_total || 0)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-primary">
                        {Math.round(sale.tax_total || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold">
                        {(sale.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {sale.cuin || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={sale.etims_status || 'not_submitted'} />
                      </td>
                      <td className="px-4 py-3">
                        {(sale.etims_status === 'failed' || !sale.etims_status || sale.etims_status === 'not_submitted') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            disabled={resubmitting.has(sale.id)}
                            onClick={() => resubmit(sale)}
                          >
                            <RefreshCw className={`w-3 h-3 mr-1 ${resubmitting.has(sale.id) ? 'animate-spin' : ''}`} />
                            {resubmitting.has(sale.id) ? 'Sending...' : 'Submit'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr className="bg-muted/40 border-t-2 font-semibold">
                    <td colSpan={3} className="px-4 py-2.5 text-xs text-muted-foreground">Daily Totals ({sales.length} invoices)</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">{Math.round(taxableAmt).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-primary">{Math.round(totalVat).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">{Math.round(totalRevenue).toLocaleString()}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export instructions */}
      <Card className="border-dashed">
        <CardContent className="pt-4 pb-4">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <FileDown className="w-4 h-4" /> Manual Upload Instructions
          </h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Click <strong>Export KRA JSON</strong> to download the daily file.</li>
            <li>Log in to the eTIMS portal at <span className="font-mono text-xs">etims.kra.go.ke</span>.</li>
            <li>Go to <em>Sales → Upload Invoice</em> and select the JSON file.</li>
            <li>Verify the CUIN numbers returned and cross-check with this page.</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-3">
            If you have configured your KRA OSCU credentials (ETIMS_KRA_PIN + ETIMS_DEVICE_SERIAL secrets),
            invoices are submitted automatically at point of sale — manual upload is only a fallback.
          </p>
        </CardContent>
      </Card>

      {/* Integration Roadmap */}
      <EtimsRoadmap />

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Link to="/my-shifts">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Previous: My Shifts
          </Button>
        </Link>
        <Link to="/settings">
          <Button className="gap-2">
            Next: Settings
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}