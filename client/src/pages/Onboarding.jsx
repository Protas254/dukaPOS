import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle, ArrowRight, ArrowLeft, Store, Package, Users, Receipt, BarChart3, Settings, Download, Server, FileText, Palette } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { toast } from 'sonner';

const onboardingSteps = [
  {
    icon: Store,
    title: 'Set Up Your Business',
    description: 'Configure your business details, tax rates, and receipt settings',
    link: '/settings',
    color: 'bg-emerald-500'
  },
  {
    icon: Package,
    title: 'Add Products',
    description: 'Create your product catalog with prices, categories, and stock levels',
    link: '/inventory',
    color: 'bg-blue-500'
  },
  {
    icon: Users,
    title: 'Manage Customers',
    description: 'Add customer profiles and set up loyalty programs',
    link: '/customers',
    color: 'bg-purple-500'
  },
  {
    icon: Receipt,
    title: 'Start Selling',
    description: 'Use the POS terminal to process sales and accept payments',
    link: '/pos',
    color: 'bg-orange-500'
  },
  {
    icon: BarChart3,
    title: 'Track Performance',
    description: 'View reports and analytics to grow your business',
    link: '/reports',
    color: 'bg-pink-500'
  },
  {
    icon: Settings,
    title: 'Customize Settings',
    description: 'Fine-tune your system preferences and compliance settings',
    link: '/settings',
    color: 'bg-gray-500'
  }
];

export default function Onboarding() {
  const handleDownloadHardwareGuide = async () => {
    try {
      const response = await api.functions.invoke('generateHardwarePDF', {});
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'DukaPOS_Hardware_Guide.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Hardware guide downloaded!');
    } catch (error) {
      toast.error('Failed to download hardware guide. Please try again.');
    }
  };

  const handleDownloadBrandGuide = async () => {
    try {
      const response = await api.functions.invoke('generateBrandingPDF', {});
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'DukaPOS_Brand_Guide.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Brand guide downloaded!');
    } catch (error) {
      toast.error('Failed to download brand guide. Please try again.');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Welcome to DukaPOS</h1>
        <p className="text-muted-foreground">
          Follow these steps to get your business up and running
        </p>
      </div>

      {/* Resource Guides */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Hardware Guide Download Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Server className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Hardware Guide</CardTitle>
                <CardDescription>
                  Technical specs and setup procedures
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleDownloadHardwareGuide} className="w-full gap-2">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-primary mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold">Technical Specifications</p>
                  <p className="text-muted-foreground">Hardware specs for all components</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold">Step-by-Step Setup</p>
                  <p className="text-muted-foreground">Installation procedures</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-primary mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold">Maintenance Guide</p>
                  <p className="text-muted-foreground">Troubleshooting and support</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand Guide Download Card */}
        <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Brand Guide</CardTitle>
                <CardDescription>
                  Logo, colors, and marketing materials
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleDownloadBrandGuide} className="w-full gap-2" variant="secondary">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <div className="flex items-start gap-2">
                <Palette className="w-4 h-4 text-accent mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold">Logo Concepts</p>
                  <p className="text-muted-foreground">3 professional logo designs</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold">Color Palette</p>
                  <p className="text-muted-foreground">Brand colors and usage</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-accent mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold">Marketing Copy</p>
                  <p className="text-muted-foreground">Taglines and messaging</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {onboardingSteps.map((step, index) => (
          <Card key={step.title} className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center mb-4`}>
                <step.icon className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">{step.title}</CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={step.link}>
                <Button className="w-full gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
            <div className="absolute top-3 right-3 text-xs font-semibold text-muted-foreground">
              Step {index + 1}
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Need Help?
          </CardTitle>
          <CardDescription className="text-emerald-100">
            Our support team is here to assist you every step of the way
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" className="gap-2">
            Contact Support
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" disabled className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>
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