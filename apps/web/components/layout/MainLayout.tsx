import { Header } from './Header';
import { Footer } from './Footer';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-10 sm:px-5 sm:py-8">{children}</main>
      <Footer />
    </div>
  );
}
