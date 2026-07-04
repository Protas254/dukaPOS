import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { api } from '@/api/apiClient';
import { 
  Zap, Package, Users, TrendingUp, Shield, CreditCard, BarChart3, 
  Clock, AlertTriangle, FileText, Smartphone, Keyboard, Gift,
  CheckCircle, ArrowRight, Star, Globe, Lock, Download, Calculator
} from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    category: 'Speed & Efficiency',
    icon: Zap,
    color: 'text-amber-500',
    items: [
      { name: 'Quick Keys Panel', desc: 'One-tap access to top-selling products', icon: Star },
      { name: 'Barcode Scanner', desc: 'Instant product lookup via SKU/barcode', icon: Zap },
      { name: 'Keyboard Shortcuts', desc: 'F1-F9 hotkeys for common actions', icon: Keyboard },
      { name: 'Hold/Recall', desc: 'Park transactions and resume later', icon: Clock },
      { name: 'Favorites Bar', desc: 'Pin frequently sold items', icon: Star },
    ]
  },
  {
    category: 'Manager Controls',
    icon: Shield,
    color: 'text-blue-500',
    items: [
      { name: 'Approval Workflow', desc: 'Manager auth for large discounts/voids', icon: Lock },
      { name: 'Shift Audits', desc: 'Track discrepancies and adjustments', icon: FileText },
      { name: 'Employee Ratings', desc: 'Performance tracking per cashier', icon: Star },
      { name: 'Access Control', desc: 'Role-based permissions', icon: Lock },
    ]
  },
  {
    category: 'Customer Experience',
    icon: Users,
    color: 'text-green-500',
    items: [
      { name: 'Loyalty Program', desc: 'Points, tiers (Bronze/Silver/Gold/Platinum)', icon: Gift },
      { name: 'Purchase History', desc: 'Complete customer transaction view', icon: FileText },
      { name: 'Digital Receipts', desc: 'SMS/Email receipt delivery', icon: Smartphone },
      { name: 'Customer Profiles', desc: 'Track spending and preferences', icon: Users },
    ]
  },
  {
    category: 'Inventory Intelligence',
    icon: Package,
    color: 'text-purple-500',
    items: [
      { name: 'Real-time Stock Alerts', desc: 'Low stock warnings during checkout', icon: AlertTriangle },
      { name: 'Auto Stock Deduction', desc: 'Inventory updates on sale', icon: CheckCircle },
      { name: 'Bulk Import', desc: 'CSV upload for products', icon: Download },
      { name: 'Barcode Printing', desc: 'Generate product barcodes', icon: Zap },
      { name: 'Category Management', desc: 'Organize by product type', icon: Package },
    ]
  },
  {
    category: 'Analytics & Reporting',
    icon: BarChart3,
    color: 'text-orange-500',
    items: [
      { name: 'Sales Dashboard', desc: 'Real-time revenue and trends', icon: TrendingUp },
      { name: 'Hourly Analytics', desc: 'Peak hours identification', icon: Clock },
      { name: 'Top Products', desc: 'Best sellers by revenue/units', icon: Star },
      { name: 'Payment Breakdown', desc: 'Method distribution charts', icon: CreditCard },
      { name: 'Cashier Comparison', desc: 'Performance metrics per staff', icon: Users },
    ]
  },
  {
    category: 'Payments',
    icon: CreditCard,
    color: 'text-cyan-500',
    items: [
      { name: 'Multi-payment Support', desc: 'Cash, M-Pesa, Card, Bank Transfer', icon: CreditCard },
      { name: 'Split Payments', desc: 'Combine multiple payment methods', icon: CreditCard },
      { name: 'M-Pesa Integration', desc: 'Transaction reference tracking', icon: Smartphone },
      { name: 'Change Calculation', desc: 'Auto-calculate cash change', icon: Calculator },
    ]
  },
  {
    category: 'Compliance',
    icon: Globe,
    color: 'text-red-500',
    items: [
      { name: 'KRA eTIMS', desc: 'Automatic invoice submission', icon: FileText },
      { name: 'CUIN Generation', desc: 'Control Unit Invoice Numbers', icon: FileText },
      { name: 'Tax Calculations', desc: '16% VAT auto-applied', icon: CheckCircle },
      { name: 'Audit Trail', desc: 'Complete transaction history', icon: Shield },
    ]
  },
];

export default function FeaturesShowcase() {
  const handleDownloadPDF = async () => {
    try {
      const response = await api.functions.invoke('generateUserManualPDF', {});
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DukaPOS_User_Manual_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('User manual downloaded successfully');
    } catch (err) {
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="bg-primary/5 border-b">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-display font-bold text-primary">
              World-Class POS System
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built for Kenyan retail businesses. Fast, compliant, and packed with features 
              to help you sell more and manage better.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link to="/pos">
                <Button size="lg" className="gap-2">
                  Launch POS <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-6 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Features', value: '50+', icon: Zap },
            { label: 'Payment Methods', value: '5', icon: CreditCard },
            { label: 'Loyalty Tiers', value: '4', icon: Gift },
            { label: 'Compliance', value: '100%', icon: Shield },
          ].map((stat, idx) => (
            <Card key={idx} className="border-2 shadow-lg">
              <CardContent className="pt-6">
                <stat.icon className="w-8 h-8 text-primary mb-2" />
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {features.map((category, idx) => (
            <Card key={idx} className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted`}>
                    <category.icon className={`w-6 h-6 ${category.color}`} />
                  </div>
                  <CardTitle className="text-lg">{category.category}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-start gap-3">
                      <item.icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Documentation Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold mb-2">Downloadable Documentation</h2>
          <p className="text-muted-foreground">Get comprehensive PDF reports of your DukaPOS system</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">User Manual & Documentation</CardTitle>
                  <p className="text-sm text-muted-foreground">How every feature works</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Complete user manual (12 sections)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  How to use POS system
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Manager controls & approvals
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Inventory management guide
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Shift management & audits
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Keyboard shortcuts & tips
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Troubleshooting guide
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  KRA eTIMS compliance
                </li>
              </ul>
              <Button onClick={handleDownloadPDF} className="w-full gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow bg-muted/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-muted">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">More Reports Coming Soon</CardTitle>
                  <p className="text-sm text-muted-foreground">Additional documents in development</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 mb-4 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Sales report (by date range)
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Inventory valuation report
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Tax compliance report
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Employee performance report
                </li>
              </ul>
              <Button disabled className="w-full gap-2" variant="outline">
                <Clock className="w-4 h-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-4">
          <h2 className="text-3xl font-display font-bold">
            Ready to Transform Your Business?
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Join hundreds of Kenyan businesses using DukaPOS to manage sales, 
            inventory, and grow their revenue.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link to="/pos">
              <Button size="lg" variant="secondary" className="gap-2">
                Start Selling Now <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>DukaPOS — Built for Kenya</p>
          <p className="mt-2">KRA eTIMS Compliant • M-Pesa Integrated • Offline Capable</p>
        </div>
      </div>
    </div>
  );
}