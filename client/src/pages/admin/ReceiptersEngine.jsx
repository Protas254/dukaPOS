import React, { useState } from 'react';
import ReceiptersAuthGate from '@/components/ReceiptersAuthGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Download, FileDown, Search, Filter, AlertTriangle, 
  TrendingUp, Activity, Bell, ListPlus, Banknote, ShieldAlert, Eye, Calendar,
  Zap, Tag, Maximize, FileText, Printer
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/apiClient';
import ReceiptModal from '@/components/receipters/ReceiptModal';

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
      const data = Array.isArray(res) ? res : (res.data || []); return data.filter(doc => doc.document_type === 'receipt');
    }
  });

  // Fetch Engine Stats (Mocked AI & Stats)
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['receipters_engine_stats'],
    queryFn: async () => {
      const res = await api.get('/receipters/engine-stats');
      return Array.isArray(res) ? res : (res.data || []);
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
            <h1 className="text-2xl font-bold tracking-tight text-blue-900 uppercase flex items-center gap-2">
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
            <Button variant="outline" onClick={() => toast.success("Exporting data...")} className="border-blue-200 text-blue-700 hover:bg-blue-50">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={() => toast.info("Opening guide...")} className="border-blue-200 text-blue-700 hover:bg-blue-50">
              View Guide
            </Button>
            <Button onClick={() => toast.success("Downloading PDF report...")} className="bg-blue-600 hover:bg-blue-700 text-white">
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
            className={`rounded-full ${activeTab === 'All Receipts' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white border border-slate-200 hover:bg-slate-100'}`}
          >
            All Receipts
          </Button>
          <Button 
            variant={activeTab === 'My Receipts' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('My Receipts')}
            className={`rounded-full ${activeTab === 'My Receipts' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white border border-slate-200 hover:bg-slate-100'}`}
          >
            My Receipts
          </Button>
          <div className="w-px h-6 bg-slate-200 mx-2"></div>
          
          <Button 
            variant={activeFilter === 'AI Analysis' ? 'default' : 'outline'} 
            onClick={() => { setActiveFilter('AI Analysis'); toast.info("AI Analysis selected"); }}
            size="sm" className={`rounded-full ${activeFilter === 'AI Analysis' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50'}`}>
            <Activity className={`w-3.5 h-3.5 mr-1.5 ${activeFilter === 'AI Analysis' ? '' : 'text-blue-500'}`} /> AI Analysis
          </Button>
          <Button 
            variant={activeFilter === 'Anomaly Detection' ? 'default' : 'outline'} 
            onClick={() => { setActiveFilter('Anomaly Detection'); toast.info("Anomaly Detection selected"); }}
            size="sm" className={`rounded-full ${activeFilter === 'Anomaly Detection' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
            <ShieldAlert className={`w-3.5 h-3.5 mr-1.5 ${activeFilter === 'Anomaly Detection' ? '' : 'text-amber-500'}`} /> Anomaly Detection
          </Button>
          <Button 
            variant={activeFilter === 'Trends' ? 'default' : 'outline'} 
            onClick={() => { setActiveFilter('Trends'); toast.info("Trends selected"); }}
            size="sm" className={`rounded-full ${activeFilter === 'Trends' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
            <TrendingUp className={`w-3.5 h-3.5 mr-1.5 ${activeFilter === 'Trends' ? '' : 'text-green-600'}`} /> Trends
          </Button>
          <Button 
            variant={activeFilter === 'Real-time' ? 'default' : 'outline'} 
            onClick={() => { setActiveFilter('Real-time'); toast.info("Real-time selected"); }}
            size="sm" className={`rounded-full ${activeFilter === 'Real-time' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
            <Zap className={`w-3.5 h-3.5 mr-1.5 ${activeFilter === 'Real-time' ? '' : 'text-blue-500'}`} /> Real-time
          </Button>
          <Button 
            variant={activeFilter === 'Search' ? 'default' : 'outline'} 
            onClick={() => { setActiveFilter('Search'); }}
            size="sm" className={`rounded-full ${activeFilter === 'Search' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
            <Search className={`w-3.5 h-3.5 mr-1.5 ${activeFilter === 'Search' ? '' : 'text-slate-500'}`} /> Search
          </Button>
          <Button 
            variant={activeFilter === 'Categorize' ? 'default' : 'outline'} 
            onClick={() => { setActiveFilter('Categorize'); toast.info("Categorize selected"); }}
            size="sm" className={`rounded-full ${activeFilter === 'Categorize' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
            <Tag className={`w-3.5 h-3.5 mr-1.5 ${activeFilter === 'Categorize' ? '' : 'text-purple-500'}`} /> Categorize
          </Button>
          <Button 
            variant={activeFilter === 'Alerts & Monitoring' ? 'default' : 'outline'} 
            onClick={() => { setActiveFilter('Alerts & Monitoring'); toast.info("Alerts & Monitoring selected"); }}
            size="sm" className={`rounded-full ${activeFilter === 'Alerts & Monitoring' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
            <Bell className={`w-3.5 h-3.5 mr-1.5 ${activeFilter === 'Alerts & Monitoring' ? '' : 'text-amber-500'}`} /> Alerts & Monitoring
          </Button>
          <Button 
            variant={activeFilter === 'Manual Capture' ? 'default' : 'outline'} 
            onClick={() => { setActiveFilter('Manual Capture'); toast.info("Manual Capture selected"); }}
            size="sm" className={`rounded-full ${activeFilter === 'Manual Capture' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
            <Maximize className={`w-3.5 h-3.5 mr-1.5 ${activeFilter === 'Manual Capture' ? '' : 'text-indigo-500'}`} /> Manual Capture
          </Button>
          <Button 
            variant={activeFilter === 'Budget' ? 'default' : 'outline'} 
            onClick={() => { setActiveFilter('Budget'); toast.info("Budget selected"); }}
            size="sm" className={`rounded-full ${activeFilter === 'Budget' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
            <Banknote className="w-3.5 h-3.5 mr-1.5" /> Budget
          </Button>
        </div>

        {/* Dynamic Main Content Based on Filter */}
        {activeFilter === 'AI Analysis' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map(insight => (
              <div key={insight.id} className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  {insight.impact === 'positive' ? <TrendingUp className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-blue-500" />}
                  <h3 className="font-semibold text-slate-900">{insight.title}</h3>
                </div>
                <p className="text-sm text-slate-600">{insight.description}</p>
                <div className="mt-4">
                  <Badge variant="outline" className={insight.impact === 'positive' ? 'text-green-700 border-green-200 bg-green-50' : 'text-blue-700 border-blue-200 bg-blue-50'}>
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
                    className={`h-2 rounded-full ${budget.status === 'exceeded' ? 'bg-blue-500' : budget.status === 'at-risk' ? 'bg-amber-500' : 'bg-green-500'}`} 
                    style={{ width: `${Math.min((budget.spent / budget.limit) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Advanced Search Panel */}
        {activeFilter === 'Search' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between text-slate-700 font-semibold border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              Advanced Search
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Product</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                  className="pl-8 h-9 text-sm" 
                  placeholder="Name or ID" 
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Min Price</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input type="number" className="pl-8 h-9 text-sm" placeholder="0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Max Price</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input type="number" className="pl-8 h-9 text-sm" placeholder="∞" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">City</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className="pl-8 h-9 text-sm" placeholder="City" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Zipcode</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className="pl-8 h-9 text-sm" placeholder="10001" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Store ID</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className="pl-8 h-9 text-sm" placeholder="Branch ID" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">From Date</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input type="date" className="pl-8 h-9 text-slate-500 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">To Date</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input type="date" className="pl-8 h-9 text-slate-500 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Payment</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className="pl-8 h-9 text-sm" placeholder="All Methods" />
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button onClick={() => toast.success("Executing advanced search...")} className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-6 rounded-full">
              <Search className="w-3.5 h-3.5 mr-2" /> Search
            </Button>
          </div>
        </div>
        )}

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
                    <div className="space-y-1.5 flex-1 max-w-[80%]">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900 text-[15px]">{receipt.reference_number || receipt.title}</span>
                        <Badge variant="secondary" className={`${payMethod.toLowerCase() === 'cash' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-blue-100 text-blue-700 hover:bg-blue-100'} border-0 px-2 py-0 h-5 text-[11px]`}>{payMethod}</Badge>
                      </div>
                      <div className="text-[13px] text-slate-400">
                        {new Date(receipt.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(receipt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {itemsCount} items • {receipt.stored_by_name || 'System'}
                      </div>
                      <div className="text-[13px] text-slate-400 truncate w-full">
                        {(data.items || []).map(i => `${i.product_name} ${i.quantity > 1 ? `(${i.quantity})` : ''}`).join(', ') || 'No items listed'}
                      </div>
                      <div className="flex items-center gap-2 pt-3">
                        <Button variant="outline" size="sm" onClick={() => setSelectedReceipt(receipt)} className="text-blue-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 rounded-md h-8 text-xs font-semibold px-3">
                          <Eye className="w-3.5 h-3.5 mr-1.5"/> View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setSelectedReceipt(receipt)} className="text-blue-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 rounded-md h-8 text-xs font-semibold px-3">
                          <Download className="w-3.5 h-3.5 mr-1.5"/> Download
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setSelectedReceipt(receipt)} className="text-blue-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 rounded-md h-8 text-xs font-semibold px-3">
                          <Printer className="w-3.5 h-3.5 mr-1.5"/> Print
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-slate-900">KES {parseFloat(receipt.amount).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Receipt Detail Dialog */}
        <ReceiptModal 
          receipt={selectedReceipt} 
          open={!!selectedReceipt} 
          onClose={() => setSelectedReceipt(null)} 
        />
      </div>
    </ReceiptersAuthGate>
  );
}
