import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import spicesBg from '@/assets/consumer-bg.jpg';

export default function Terms() {
  return (
    <div className="min-h-screen relative">
      {/* Full page background */}
      <div className="fixed inset-0 -z-10">
        <img src={spicesBg} alt="" className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-foreground/85 backdrop-blur-sm" />
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
            <span className="font-bold text-primary-foreground font-[family-name:var(--font-display)]">Terms & Conditions</span>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <article className="prose prose-slate max-w-none space-y-8 bg-card/90 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-border/50">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-[family-name:var(--font-display)]">
              Terms & Conditions
            </h1>
            <p className="text-muted-foreground">Last updated: February 15, 2026</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using NAMMA TRADE ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree, you may not use the Platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              You must register for an account to use the Platform. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account. You agree to provide accurate, current, and complete information during registration.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. Roles & Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed">
              Users may operate as Admin, Warehouse Distributor, Vendor, or Consumer. Each role carries specific responsibilities. Misuse of any role's privileges may result in suspension or termination of your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Transactions & Payments</h2>
            <p className="text-muted-foreground leading-relaxed">
              All transactions conducted on the Platform are subject to applicable taxes and fees. NAMMA TRADE acts as a facilitator and is not liable for disputes between buyers and sellers. Payment terms are governed by the agreements between transacting parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content, branding, and technology on the Platform are owned by NAMMA TRADE or its licensors. You may not reproduce, distribute, or create derivative works without prior written consent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your use of the Platform is also governed by our Privacy Policy. We collect and process personal data in accordance with applicable data protection laws.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">7. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              NAMMA TRADE shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform. Our total liability is limited to the fees paid by you in the twelve months preceding any claim.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">8. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account at our discretion if you violate these Terms. Upon termination, your right to access the Platform will cease immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">9. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms are governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">10. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, contact us at{' '}
              <Link to="/support" className="text-primary hover:underline">support@nammatrade.com</Link>.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
