import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-8 text-center text-sm text-textLight">
      <div className="mx-auto max-w-6xl px-4">
        <p>© {new Date().getFullYear()} Businexa. All rights reserved.</p>
        <div className="mt-2 flex justify-center gap-4">
          <Link href="/terms" className="hover:text-primary">
            Terms
          </Link>
          <Link href="/help" className="hover:text-primary">
            Help
          </Link>
        </div>
      </div>
    </footer>
  );
}
