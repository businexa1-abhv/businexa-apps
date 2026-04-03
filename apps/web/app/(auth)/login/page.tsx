import { redirect } from 'next/navigation';

/** Login UI lives at `/` — keep `/login` as a permanent redirect for bookmarks. */
export default function LoginPage() {
  redirect('/');
}
