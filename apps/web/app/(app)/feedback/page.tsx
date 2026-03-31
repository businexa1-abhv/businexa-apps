'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function FeedbackPage() {
  const [text, setText] = useState('');
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold text-secondary">Feedback</h1>
      <Input placeholder="Tell us what you think" value={text} onChange={setText} />
      <Button type="button" onClick={() => setText('')}>
        Submit (demo)
      </Button>
    </div>
  );
}
