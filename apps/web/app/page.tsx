import type { Metadata } from 'next';
import { RootAuthPage } from '@/components/auth/RootAuthPage';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in or create a Businexa account',
};

export default function HomePage() {
  return <RootAuthPage />;
}
