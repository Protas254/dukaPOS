import React, { useState } from 'react';
import ReceiptersAuthGate from '@/components/ReceiptersAuthGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Download, FileDown, Search, Filter, AlertTriangle, 
  TrendingUp, Activity, Bell, ListPlus, Banknote, ShieldAlert, Eye, Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/apiClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ReceiptersEngine() {
  const [activeTab, setActiveTab] = useState('All Receipts');
  const [activeFilter, setActiveFilter] = useState('Search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Fetch VaultDocuments (Receipts)
  const { data: receiptsData, isLoading: receiptsLoading } = useQuery({
    queryKey: ['receipters_receipts'],
    queryFn: async () => {
      const res = await api.get('/entities/VaultDocument');
      return res.data.filter(doc => doc.document_type === 'receipt');
    }
  });

  // Fetch Engine Stats (Mocked AI & Stats)
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['receipters_engine_stats'],
    queryFn: async () => {
      const res = await api.get('/receipters/engine-stats');
      return res.data;
    }
  });

  const receipts = receiptsData || [];
  const overview = statsData?.overview || {};
  const insights = statsData?.insights || [];
  const budgets = statsData?.budgets || [];

  const filteredReceipts = receipts.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.reference_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ReceiptersAuthGate featureName="Receipters Engine">
      <div className="flex flex-col h-full bg-slate-50/50 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-red-900 uppercase flex items-center gap-2">
              Receipters Engine
            </h1>
            <p className="text-muted-foreground mt-1">AI-powered receipt intelligence & analytics</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm mr-4">
              <span className="flex items-center gap-1.5 text-slate-600">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div> {overview.total_receipts || 0} analyzed
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div> {insights.length} insights
              </span>
            </div>
            <Button variant="outline" onClick={() => toast.success("Exporting data...")} className="border-red-200 text-red-700 hover:bg-red-50">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={() => toast.info("Opening guide...")} className="border-red-200 text-red-700 hover:bg-red-50">
              View Guide
            </Button>
            <Button onClick={() => toast.success("Downloading PDF report...")} className="bg-red-600 hover:bg-red-700 text-white">
              <FileDown className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Top Navigation Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant={activeTab === 'All Receipts' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('All Receipts')}
            className={`rounded-full ${activeTab === 'All Receipts' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white border border-slate-200 hover:bg-slate-100'}`}
          >
            All Receipts
          </Button>
          <Button 
            variant={activeTab === 'My Receipts' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('My Receipts')}
            className={`rounded-full ${activeTab === 'My Receipts' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white border border-slate-200 hover:bg-slate-100'}`}
          >
            My Receipts
          </Button>
          <div className="w-px h-6 bg-slate-200 mx-2"></div>
          
          <Button 
            variant={activeFilter === 'AI Analysis' ? 'default' : 'outline'} 
            onClick={() => { setActiveFilter('AI Analysis'); toast.info("AI Analysis selected"); }}
            size="sm" className={`rounded-full ${activeFilter === 'AI Analysis' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white text-red-600 border-red-100 hover:bg-red-50'}`}>
            <Activity className={`w-3.5 h-3.5 mr-1.5 ${activeFilter === 'AI Analysis' ? '' : 'text-red-500'}`} /> AI Analysis
          </Button>
          <Button 
            variant={activeFilter === 'Anomaly Detection' ? 'default' : 'outline'} 
            onClick={() => { setActiveFilter('Anomaly Detection'); toast.info("Anomaly Detection selected"); }}
            size="sm" className={`rounded-full ${activeFilter === 'Anomaly Detection' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
            <ShieldAlert className={`w-3.5 h-3.5 mr-1.5 ${activeFilter === 'Anomaly Detection' ? '' : 'text-amber-500'}`} /> Anomaly Detection
          </Button>
          <Button 
            variant={activeFilter === 'Trends' ? 'default' : 'outline'} 
            onClick={() => { setActiveFilter('Trends'); toast.info("Trends selected"); }}
            size="sm" className={`rounded-full ${activeFilter === 'Trends' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
            <TrendingUp className={`w-3.5 h-3.5 mr-1.5 ${activeFilter === 'Trends' ? '' : 'text-green-600'}`} /> Trends
          </Button>
          <Button 
            variant={activeFilter === 'Budget' ? 'default' : 'outline'} 
            onClick={() => { setActiveFilter('Budget'); toast.info("Budget selected"); }}
            size="sm" className={`rounded-full ${activeFilter === 'Budget' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
            <Banknote className="w-3.5 h-3.5 mr-1.5" /> Budget
          </Button>
        </div>

        {/* Dynamic Main Content Based on Filter */}
        {activeFilter === 'AI Analysis' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map(insight => (
              <div key={insight.id} className="bg-white p-5 rounded-xl border border-red-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  {insight.impact === 'positive' ? <TrendingUp className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
                  <h3 className="font-semibold text-slate-900">{insight.title}</h3>
                </div>
                <p className="text-sm text-slate-600">{insight.description}</p>
                <div className="mt-4">
                  <Badge variant="outline" className={insight.impact === 'positive' ? 'text-green-700 border-green-200 bg-green-50' : 'text-red-700 border-red-200 bg-red-50'}>
                    {insight.type.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeFilter === 'Budget' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 mb-4">Budget Tracking</h3>
            {budgets.map(budget => (
              <div key={budget.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{budget.category}</span>
                  <span className="text-slate-500">KES {budget.spent.toLocaleString()} / {budget.limit.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${budget.status === 'exceeded' ? 'bg-red-500' : budget.status === 'at-risk' ? 'bg-amber-500' : 'bg-green-500'}`} 
                    style={{ width: `${Math.min((budget.spent / budget.limit) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Advanced Search Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between text-red-900 font-medium">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Advanced Search
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                  className="pl-9 h-9" 
                  placeholder="Receipt ID or Name" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">From Date</label>
              <Input type="date" className="h-9 text-slate-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">To Date</label>
              <Input type="date" className="h-9 text-slate-500" />
            </div>
            <div className="flex items-end justify-end pt-2">
              <Button onClick={() => toast.success("Executing advanced search...")} className="bg-red-600 hover:bg-red-700 text-white w-full h-9">
                <Search className="w-4 h-4 mr-2" /> Search
              </Button>
            </div>
          </div>
        </div>

        {/* Receipts List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Receipts ({filteredReceipts.length})</h3>
            <span className="text-sm text-slate-400">Captured receipts from POS</span>
          </div>
          
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
            {receiptsLoading ? (
              <div className="p-8 text-center text-slate-500">Loading receipts...</div>
            ) : filteredReceipts.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No receipts found. Complete a sale in POS to generate one.</div>
            ) : (
              filteredReceipts.map(receipt => {
                const data = receipt.receipt_data || {};
                const itemsCount = (data.items || []).length;
                const payMethod = data.payment_method || 'Unknown';
                
                return (
                  <div key={receipt.id} className="p-5 hover:bg-slate-50 transition-colors flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">{receipt.reference_number || receipt.title}</span>
                        <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100 border-0">{payMethod}</Badge>
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" /> 
                        {new Date(receipt.created_at).toLocaleString()} • {itemsCount} items • By {receipt.stored_by_name || 'System'}
                      </div>
                      <div className="flex items-center gap-4 pt-2">
                        <button onClick={() => setSelectedReceipt(receipt)} className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center gap-1.5"><Eye className="w-4 h-4"/> View Full Details</button>
                        <button onClick={() => toast.success(`Receipt ${receipt.reference_number} downloaded`)} className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center gap-1.5"><Download className="w-4 h-4"/> Download JSON</button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-slate-900">KES {parseFloat(receipt.amount).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Receipt Detail Dialog */}
        <Dialog open={!!selectedReceipt} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
          <DialogContent className="max-w-2xl bg-white max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-red-900 text-xl flex items-center gap-2">
                <Banknote className="w-5 h-5 text-red-600" />
                Receipt Details
              </DialogTitle>
            </DialogHeader>
            {selectedReceipt && (
              <div className="space-y-6 mt-4">
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Reference Number</div>
                    <div className="font-bold text-slate-900 text-lg">{selectedReceipt.reference_number || selectedReceipt.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Total Amount</div>
                    <div className="font-bold text-slate-900 text-xl text-red-700">KES {parseFloat(selectedReceipt.amount).toLocaleString()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-xs text-slate-500 uppercase font-semibold">Date & Time</div>
                    <div className="font-medium text-slate-900">{new Date(selectedReceipt.created_at).toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-xs text-slate-500 uppercase font-semibold">Payment Method</div>
                    <div className="font-medium text-slate-900">{selectedReceipt.receipt_data?.payment_method || 'Unknown'}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-xs text-slate-500 uppercase font-semibold">Cashier</div>
                    <div className="font-medium text-slate-900">{selectedReceipt.stored_by_name || 'System'}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-xs text-slate-500 uppercase font-semibold">Status</div>
                    <div className="font-medium text-slate-900">
                      <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">Captured & Verified</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Line Items</h3>
                  <div className="space-y-2">
                    {selectedReceipt.receipt_data?.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded-md">
                        <div>
                          <span className="font-medium text-slate-900">{item.product_name}</span>
                          <span className="text-slate-500 ml-2">x{item.quantity}</span>
                        </div>
                        <div className="font-medium">
                          KES {(parseFloat(item.price) * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    )) || <div className="text-sm text-slate-500 italic">No line items recorded.</div>}
                  </div>
                </div>
                
                <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                  <Button variant="outline" onClick={() => setSelectedReceipt(null)}>Close</Button>
                  <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => {
                    toast.success("Receipt details downloaded");
                  }}>
                    <Download className="w-4 h-4 mr-2" /> Download JSON
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </ReceiptersAuthGate>
  );
}
