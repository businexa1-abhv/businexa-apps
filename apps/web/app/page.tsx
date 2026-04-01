import Link from 'next/link';
import { cn } from '@/lib/utils';

const btnPrimary = 'inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90';
const btnOutline =
  'inline-flex items-center justify-center rounded-md border-2 border-primary px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/10';

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Businexa',
    description: 'Digital shop and QR catalog for businesses.',
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <span className="text-xl font-bold text-primary">Businexa</span>
            <div className="flex gap-2">
              <Link href="/login" className={btnOutline}>
                Log in
              </Link>
              <Link href="/login" className={btnPrimary}>
                Get started
              </Link>
            </div>
          </div>
        </header>
        <main>
          <section className="mx-auto max-w-6xl px-4 py-20 text-center md:py-28">
            <h1 className="text-4xl font-bold tracking-tight text-secondary md:text-5xl">
              Your shop online in minutes
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-textLight">
              List products, share a beautiful public page, and use QR codes so customers find you instantly.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/login" className={cn(btnPrimary, 'px-8 py-3 text-base')}>
                Get started
              </Link>
              <Link href="#features" className={cn(btnOutline, 'px-8 py-3 text-base')}>
                Learn more
              </Link>
            </div>
          </section>
          <section id="features" className="border-t border-border bg-surface py-16">
            <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-3">
              {[
                { title: 'OTP login', desc: 'Secure sign-in with your mobile number.' },
                { title: 'Product catalog', desc: 'Photos, prices, and categories in one place.' },
                { title: 'QR & plans (sellers)', desc: 'Shop owners pick a plan for QR assets and premium shop features.' },
              ].map((f) => (
                <div key={f.title} className="rounded-xl border border-border p-6">
                  <h2 className="text-lg font-semibold text-secondary">{f.title}</h2>
                  <p className="mt-2 text-sm text-textLight">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
        <footer className="border-t border-border py-8 text-center text-sm text-textLight">
          © {new Date().getFullYear()} Businexa
        </footer>
      </div>
    </>
  );
}
