import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { 
  BookOpen, ExternalLink, Download, Phone, Mail, Clock,
  CheckCircle, FileText, Server, Key, AlertCircle, Plug
} from 'lucide-react';

export default function EtimsRoadmap() {
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    try {
      const response = await base44.functions.invoke('generateDukaPOSPDF', {
        type: 'etims_roadmap'
      });
      
      // Create blob from response data and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'eTIMS_Integration_Roadmap.pdf';
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'PDF Downloaded',
        description: 'eTIMS integration roadmap has been downloaded.'
      });
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Could not generate PDF. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleStartIntegration = () => {
    toast({
      title: 'Integration Started',
      description: 'Contact support to begin your eTIMS integration journey.'
    });
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          eTIMS Integration Roadmap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeline Overview */}
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <h4 className="font-semibold text-sm mb-3 text-primary">Implementation Timeline: 6-8 Weeks</h4>
          <div className="grid md:grid-cols-5 gap-2">
            {[
              { phase: 'Phase 1', title: 'Preparation', weeks: 'Week 1-2', color: 'bg-blue-100 text-blue-700' },
              { phase: 'Phase 2', title: 'Technical Setup', weeks: 'Week 2-3', color: 'bg-indigo-100 text-indigo-700' },
              { phase: 'Phase 3', title: 'Integration', weeks: 'Week 3-4', color: 'bg-purple-100 text-purple-700' },
              { phase: 'Phase 4', title: 'Verification', weeks: 'Week 4-5', color: 'bg-orange-100 text-orange-700' },
              { phase: 'Phase 5', title: 'Go-Live', weeks: 'Week 5-6', color: 'bg-green-100 text-green-700' },
            ].map((item) => (
              <div key={item.phase} className={`${item.color} rounded-md p-2 text-center`}>
                <p className="text-xs font-semibold">{item.phase}</p>
                <p className="text-xs font-medium">{item.title}</p>
                <p className="text-[10px] opacity-75">{item.weeks}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-4">
          <PhaseCard 
            number={1}
            title="Preparation & Requirements"
            timeline="Week 1-2"
            items={[
              'Register for eTIMS portal access at etims.kra.go.ke',
              'Download integration documentation and API specifications',
              'Request OSCU credentials (allow 5-7 business days)',
              'Verify KRA PIN is active and up-to-date',
              'Update BusinessSettings with legal business details'
            ]}
          />
          
          <PhaseCard 
            number={2}
            title="Technical Setup"
            timeline="Week 2-3"
            items={[
              'Configure KRA sandbox/testing environment',
              'Store credentials securely (ETIMS_KRA_PIN, ETIMS_DEVICE_SERIAL)',
              'Configure tax rates (standard 16% VAT)',
              'Deploy submitEtimsInvoice backend function',
              'Deploy etimsAutoSubmit and etimsRetryFailed functions'
            ]}
          />

          <PhaseCard 
            number={3}
            title="Integration & Testing"
            timeline="Week 3-4"
            items={[
              'Implement invoice data mapping to KRA JSON schema',
              'Test single invoice submission via API',
              'Validate CUIN (Control Unit Invoice Number) generation',
              'Test batch processing and daily summary generation',
              'Implement retry logic for failed submissions'
            ]}
          />

          <PhaseCard 
            number={4}
            title="Compliance Verification"
            timeline="Week 4-5"
            items={[
              'Submit test invoices to KRA sandbox environment',
              'Pass KRA validation and compliance checks',
              'Receive OSCU certification number',
              'Switch to production environment',
              'Train staff on eTIMS-compliant procedures'
            ]}
          />

          <PhaseCard 
            number={5}
            title="Go-Live & Monitoring"
            timeline="Week 5-6"
            items={[
              'Enable automatic eTIMS submission for all sales',
              'Monitor first week of transactions closely',
              'Daily review of eTIMS dashboard for failures',
              'Weekly export and backup of KRA JSON files',
              'Monthly reconciliation with iTax returns'
            ]}
          />
        </div>

        {/* Technical Requirements */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              API Endpoints
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="font-mono">etims-sandbox.kra.go.ke/api/v1</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="font-mono">etims.kra.go.ke/api/v1</span>
              </li>
            </ul>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              Required Credentials
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>• <strong>ETIMS_KRA_PIN:</strong> 11-character KRA PIN</li>
              <li>• <strong>ETIMS_DEVICE_SERIAL:</strong> OSCU serial number</li>
              <li>• <strong>ETIMS_API_KEY:</strong> Authentication token</li>
            </ul>
          </div>
        </div>

        {/* Resources & Actions */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href="https://etims.kra.go.ke" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              eTIMS Portal
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href="https://itax.kra.go.ke" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              iTax Portal
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4" />
            Download PDF Guide
          </Button>
          <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90" onClick={handleStartIntegration}>
            <Plug className="w-4 h-4" />
            Start Integration
          </Button>
        </div>

        {/* Support */}
        <div className="bg-accent/20 rounded-lg p-4 border border-accent/30">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent" />
            KRA Support Resources
          </h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span><strong className="text-foreground">Contact:</strong> +254 711 099 999</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span><strong className="text-foreground">Email:</strong> callcentre@kra.go.ke</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span><strong className="text-foreground">Hours:</strong> Mon-Fri 8:00 AM - 5:00 PM</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span><strong className="text-foreground">Support:</strong> support@kra.go.ke</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PhaseCard({ number, title, timeline, items }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
          {number}
        </div>
        <div>
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground">{timeline}</p>
        </div>
      </div>
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}