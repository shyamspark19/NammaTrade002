import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Mail, Phone, MessageCircle, Clock } from 'lucide-react';
import marketBg from '@/assets/consumer-bg.jpg';

const faqs = [
  {
    q: 'How do I create an account?',
    a: 'Click "Get Started" on the home page, then fill in your details on the sign-up form. After verifying your email, choose your role to access your dashboard.',
  },
  {
    q: 'What roles are available on the platform?',
    a: 'Namma Trade supports four roles: Admin (platform management), Warehouse Distributor (inventory & logistics), Vendor (product sales), and Consumer (purchasing).',
  },
  {
    q: 'How do I track my orders?',
    a: 'Once logged in, navigate to the Tracking section in your dashboard to view real-time updates on all your orders.',
  },
  {
    q: 'Can I switch roles after signing up?',
    a: 'Role changes require contacting support. Please reach out via the channels below and our team will assist you.',
  },
  {
    q: 'How do I report an issue?',
    a: 'You can email us at support@nammatrade.com or use the contact details provided on this page. We aim to respond within 24 hours.',
  },
];

export default function Support() {
  return (
    <div className="min-h-screen relative">
      {/* Full page background */}
      <div className="fixed inset-0 -z-10">
        <img src={marketBg} alt="" className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-foreground/80 backdrop-blur-sm" />
      </div>

      {/* Header */}
      <nav className="sticky top-0 z-50 border-b bg-foreground/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-1">
              <img src="/favicon.ico" alt="Namma Trade" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-primary-foreground font-[family-name:var(--font-display)]">Support</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground font-[family-name:var(--font-display)]">
            How can we help?
          </h1>
          <p className="text-primary-foreground/70 text-lg max-w-xl mx-auto">
            Find answers to common questions or get in touch with our support team.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="text-center bg-card/90 backdrop-blur-md border-border/50">
            <CardContent className="p-6 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Mail className="h-6 w-6" />
              </div>
              <CardTitle className="text-base">Email</CardTitle>
              <p className="text-sm text-muted-foreground">support@nammatrade.com</p>
            </CardContent>
          </Card>
          <Card className="text-center bg-card/90 backdrop-blur-md border-border/50">
            <CardContent className="p-6 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Phone className="h-6 w-6" />
              </div>
              <CardTitle className="text-base">Phone</CardTitle>
              <p className="text-sm text-muted-foreground">+91 98765 43210</p>
            </CardContent>
          </Card>
          <Card className="text-center bg-card/90 backdrop-blur-md border-border/50">
            <CardContent className="p-6 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
              <CardTitle className="text-base">Hours</CardTitle>
              <p className="text-sm text-muted-foreground">Mon–Sat, 9 AM – 6 PM IST</p>
            </CardContent>
          </Card>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-2xl font-bold text-primary-foreground font-[family-name:var(--font-display)] mb-6">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4 bg-card/90 backdrop-blur-md">
                <AccordionTrigger className="text-left font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
