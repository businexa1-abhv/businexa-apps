import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & conditions',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-secondary">Terms & conditions</h1>
      <p className="mt-6 text-textLight">
        Placeholder terms — replace with your legal copy. Use of Businexa is subject to your acceptance of these terms.
      </p>
    </div>
  );
}
