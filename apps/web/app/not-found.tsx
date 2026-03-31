import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-xl font-semibold text-secondary">Page not found</h1>
      <Link href="/" className="text-primary hover:underline">
        Home
      </Link>
    </div>
  );
}
