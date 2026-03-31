import { AuthGate } from '@/components/auth/AuthGate';
import { MainLayout } from '@/components/layout/MainLayout';

export default function AppSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <MainLayout>{children}</MainLayout>
    </AuthGate>
  );
}
