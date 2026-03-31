import Link from 'next/link';

export default function LanguagePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary">Language</h1>
      <p className="mt-2 text-textLight">
        Prefer managing language in{' '}
        <Link href="/settings" className="text-primary hover:underline">
          Settings
        </Link>
        .
      </p>
    </div>
  );
}
