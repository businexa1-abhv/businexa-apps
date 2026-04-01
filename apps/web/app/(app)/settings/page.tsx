'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/context/ThemeContext';
import * as api from '@/lib/api';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { theme, setTheme, toggle } = useTheme();
  const { showToast } = useNotifications();
  const { logout, isLoading: authBusy } = useAuth();
  const [lang, setLang] = useState('en');
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    api
      .getProfile()
      .then(({ data }) => {
        const prefs = (data.user as { preferences?: { language?: string; theme?: string; notifications?: boolean } })
          ?.preferences;
        if (prefs?.language) setLang(prefs.language);
        if (prefs?.notifications !== undefined) setNotifications(prefs.notifications);
        if (prefs?.theme === 'dark' || prefs?.theme === 'light') setTheme(prefs.theme);
      })
      .catch(() => {});
  }, [setTheme]);

  const save = async () => {
    try {
      await api.updatePreferences({ language: lang, theme, notifications });
      showToast('Preferences saved', 'success');
    } catch {
      showToast('Could not save', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-secondary">Settings</h1>
      <Card>
        <h2 className="font-semibold text-secondary">Appearance</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant={theme === 'light' ? 'primary' : 'outline'} onClick={() => setTheme('light')}>
            Light
          </Button>
          <Button variant={theme === 'dark' ? 'primary' : 'outline'} onClick={() => setTheme('dark')}>
            Dark
          </Button>
          <Button variant="ghost" onClick={toggle}>
            Toggle
          </Button>
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold text-secondary">Language</h2>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
        </select>
      </Card>
      <Card>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />
          Notifications
        </label>
      </Card>
      <Button onClick={save}>Save preferences</Button>

      <Card>
        <h2 className="font-semibold text-secondary">Session</h2>
        <p className="mt-1 text-sm text-textLight">Sign out on this device. You can also use Log out in the header.</p>
        <Button variant="outline" className="mt-4" onClick={() => logout()} disabled={authBusy} loading={authBusy}>
          Log out
        </Button>
      </Card>
    </div>
  );
}
