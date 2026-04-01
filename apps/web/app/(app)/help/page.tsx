'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const faqs = [
  { q: 'How do I log in?', a: 'Use your Indian mobile number. We send a one-time password (OTP) via SMS.' },
  { q: 'How do I share my shop?', a: 'Copy your public shop URL from the dashboard or account page.' },
  {
    q: 'Why do I need a subscription?',
    a: 'If you run a shop as a seller, QR generation and premium features require an active plan. Buyers and admins do not use shop billing here.',
  },
];

export default function HelpPage() {
  const [open, setOpen] = useState(0);
  const [message, setMessage] = useState('');

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-secondary">Help & support</h1>
      <section>
        <h2 className="text-lg font-semibold text-secondary">FAQ</h2>
        <div className="mt-4 space-y-2">
          {faqs.map((f, i) => (
            <Card key={f.q} padding="sm" clickable onClick={() => setOpen(i)}>
              <p className="font-medium text-secondary">{f.q}</p>
              {open === i ? <p className="mt-2 text-sm text-textLight">{f.a}</p> : null}
            </Card>
          ))}
        </div>
      </section>
      <Card>
        <h2 className="text-lg font-semibold text-secondary">Contact</h2>
        <p className="mt-2 text-sm text-textLight">Send us a message (demo — not wired to backend).</p>
        <div className="mt-4 space-y-3">
          <Input placeholder="Your message" value={message} onChange={setMessage} />
          <Button type="button" onClick={() => setMessage('')}>
            Send
          </Button>
        </div>
      </Card>
    </div>
  );
}
