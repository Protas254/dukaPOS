import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle, ArrowRight, ArrowLeft, Store, Package, Users, Receipt, BarChart3, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Welcome to SoftPOS Kenya</h1>
        <p className="text-muted-foreground">
          Follow these steps to get your business up and running
        </p>
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