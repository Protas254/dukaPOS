import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Monitor, Printer, Barcode, CreditCard, Wifi, Server, 
  Smartphone, Tablet, Laptop, ShoppingCart, ScanLine,
  CheckCircle2, DollarSign, Plug, Headphones
} from 'lucide-react';
import { Link } from 'react-router-dom';

const hardwareCategories = [
  {
    title: 'Essential Hardware',
    description: 'Must-have components for basic POS operations',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    items: [
      {
        name: 'POS Terminal/Device',
        description: 'Computer, tablet, or smartphone to run DukaPOS software',
        options: [
          'All-in-one POS terminal (15" touchscreen)',
          'Tablet (iPad/Android, 10"+ screen)',
          'Laptop/Desktop computer',
          'Smartphone (for mobile POS)'
        ],
        priceRange: '$200 - $800',
        priority: 'Critical'
      },
      {
        name: 'Barcode Scanner',
        description: 'Scan product barcodes for quick checkout',
        options: [
          'USB wired barcode scanner',
          'Bluetooth wireless scanner',
          '2D QR code scanner',
          'Mobile device camera (built-in)'
        ],
        priceRange: '$50 - $200',
        priority: 'High'
      },
      {
        name: 'Receipt Printer',
        description: 'Print customer receipts and transaction records',
        options: [
          'Thermal receipt printer (58mm)',
          'Thermal receipt printer (80mm)',
          'Bluetooth mobile printer',
          'Email/SMS receipts (paperless)'
        ],
        priceRange: '$80 - $300',
        priority: 'High'
      }
    ]
  },
  {
    title: 'Payment Processing',
    description: 'Hardware for accepting customer payments',
    icon: CreditCard,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    items: [
      {
        name: 'Card Reader/PIN Pad',
        description: 'Accept credit/debit card payments',
        options: [
          'Integrated card reader',
          'Standalone PIN pad',
          'Mobile card reader (Square/Stripe)',
          'Contactless NFC terminal'
        ],
        priceRange: '$100 - $400',
        priority: 'High'
      },
      {
        name: 'Cash Drawer',
        description: 'Secure storage for cash and coins',
        options: [
          '13" cash drawer (4 bill slots)',
          '16" cash drawer (5 bill slots)',
          'Compact portable cash box',
          'Heavy-duty safe drawer'
        ],
        priceRange: '$100 - $250',
        priority: 'Medium'
      }
    ]
  },
  {
    title: 'Optional Hardware',
    description: 'Additional equipment for enhanced functionality',
    icon: Plug,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    items: [
      {
        name: 'Customer Display',
        description: 'Secondary screen showing transaction details to customers',
        options: [
          'LCD customer display (2-line)',
          'Touchscreen customer display',
          'Pole display (VFD)',
          'Tablet as customer screen'
        ],
        priceRange: '$80 - $300',
        priority: 'Low'
      },
      {
        name: 'Label Printer',
        description: 'Print barcode labels for products without barcodes',
        options: [
          'Thermal label printer (4"x6")',
          'Desktop label printer',
          'Portable label maker',
          'Integrated with receipt printer'
        ],
        priceRange: '$100 - $400',
        priority: 'Low'
      },
      {
        name: 'Scale',
        description: 'Weigh products sold by weight (produce, bulk items)',
        options: [
          'Digital retail scale',
          'Barcode printing scale',
          'Platform scale',
          'USB connected scale'
        ],
        priceRange: '$150 - $500',
        priority: 'Low'
      }
    ]
  },
  {
    title: 'Network & Infrastructure',
    description: 'Connectivity and backup requirements',
    icon: Wifi,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    items: [
      {
        name: 'Internet Connection',
        description: 'Reliable internet for cloud-based operations',
        options: [
          'Broadband fiber connection',
          'Business cable internet',
          '4G/5G backup connection',
          'Mobile hotspot backup'
        ],
        priceRange: '$50 - $150/month',
        priority: 'Critical'
      },
      {
        name: 'Router/Network Equipment',
        description: 'Network infrastructure for POS connectivity',
        options: [
          'Business-grade router',
          'WiFi access point',
          'Network switch',
          'Ethernet cables'
        ],
        priceRange: '$100 - $300',
        priority: 'High'
      },
      {
        name: 'UPS Battery Backup',
        description: 'Uninterruptible power supply for power outages',
        options: [
          '600VA UPS (30 min backup)',
          '1000VA UPS (60 min backup)',
          '1500VA UPS (2+ hours)',
          'Portable power station'
        ],
        priceRange: '$100 - $400',
        priority: 'Medium'
      }
    ]
  }
];

const starterPackages = [
  {
    name: 'Basic Setup',
    description: 'Perfect for small shops and startups',
    totalCost: '$400 - $800',
    items: ['Tablet/Smartphone', 'Bluetooth barcode scanner', 'Mobile card reader', 'Paperless receipts'],
    icon: Smartphone
  },
  {
    name: 'Standard Setup',
    description: 'Ideal for retail stores',
    totalCost: '$800 - $1,500',
    items: ['All-in-one POS terminal', 'USB barcode scanner', 'Thermal receipt printer', 'Cash drawer', 'Card reader'],
    icon: Monitor
  },
  {
    name: 'Complete Setup',
    description: 'Full-featured retail solution',
    totalCost: '$1,500 - $3,000',
    items: ['POS terminal + customer display', '2D barcode scanner', 'Receipt + label printer', 'Cash drawer', 'PIN pad', 'Scale', 'UPS backup'],
    icon: ShoppingCart
  }
];

export default function HardwareRequirements() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 ">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Hardware Requirements</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Complete guide to POS hardware for your business
          </p>
        </div>
        <Link to="/settings">
          <Button variant="outline" className="gap-2">
            Back to Settings
          </Button>
        </Link>
      </div>

      {/* Introduction Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Server className="w-5 h-5 text-primary" />
            DukaPOS Hardware Overview
          </CardTitle>
          <CardDescription>
            DukaPOS is software-only and works with standard POS hardware. Choose components based on your business size, budget, and requirements.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Hardware Categories */}
      <div className="grid gap-6">
        {hardwareCategories.map((category, idx) => (
          <Card key={idx} className={`border-l-4 ${category.borderColor.replace('border', 'border-l')}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${category.bgColor}`}>
                  <category.icon className={`w-5 h-5 ${category.color}`} />
                </div>
                <div>
                  <CardTitle className="font-display">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {category.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="p-4 rounded-lg border bg-card space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-sm">{item.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      </div>
                      <Badge variant={item.priority === 'Critical' ? 'default' : 'secondary'} className="text-xs">
                        {item.priority}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <DollarSign className="w-3 h-3" />
                        <span className="font-medium">{item.priceRange}</span>
                      </div>
                      <ul className="space-y-1">
                        {item.options.map((option, optIdx) => (
                          <li key={optIdx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                            {option}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Starter Packages */}
      <div className="grid gap-6 md:grid-cols-3">
        {starterPackages.map((pkg, idx) => (
          <Card key={idx} className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <pkg.icon className="w-5 h-5 text-primary" />
                <CardTitle className="font-display">{pkg.name}</CardTitle>
              </div>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold text-primary">{pkg.totalCost}</div>
              <ul className="space-y-2">
                {pkg.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Tips */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Headphones className="w-5 h-5" />
            Additional Considerations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">💡 Pro Tips</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Start with minimum hardware and expand as your business grows
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Choose Bluetooth/wireless options for flexibility and mobility
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Invest in quality scanners and printers for reliability
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Always have a backup internet connection (mobile hotspot)
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">📋 Before You Buy</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Verify hardware compatibility with your device (USB/Bluetooth)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Check power requirements and outlet availability
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Consider warranty and local support availability
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Factor in ongoing costs (receipt paper, ink, maintenance)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Link to="/pos">
          <Button variant="outline" className="gap-2">
            Go to POS
          </Button>
        </Link>
        <Link to="/inventory">
          <Button variant="outline" className="gap-2">
            Go to Inventory
          </Button>
        </Link>
      </div>
    </div>
  );
}