import { useEffect, useState } from 'react';
import { StoreBadges } from '../components/ui/StoreBadges';

/** Must match the mobile route and the API's APP_FRIEND_INVITE_URL default. */
const APP_SCHEME_URL = 'lexiroot://friend-invite';

/**
 * Bridge page for friend invitation emails.
 *
 * Invites are sent to people who may not have the app yet, and an email is as
 * likely to be opened on a laptop as a phone. A bare `lexiroot://` link is a
 * dead tap in both cases — the browser doesn't know the scheme — so the email
 * points here instead.
 *
 * On a phone with the app installed the scheme redirect fires immediately and
 * this page is never really seen. Everywhere else it degrades into an install
 * prompt that keeps the token in the URL, so the same link still works once the
 * app is installed and the person taps it again.
 *
 * Deliberately makes no API call: the app's own accept screen shows who invited
 * you, and a page whose only job is to bounce shouldn't be able to fail because
 * the API is briefly unreachable.
 */
export function FriendInvite() {
  const token = new URLSearchParams(window.location.search).get('token');
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!token) return;
    // Assigning (rather than replacing) leaves this page in history, so a
    // phone without the app comes back here instead of a blank tab.
    window.location.href = `${APP_SCHEME_URL}?token=${encodeURIComponent(token)}`;
    // The redirect either takes over immediately or silently does nothing;
    // there's no event for "scheme not handled", so fall back on a timer.
    const id = window.setTimeout(() => setAttempted(true), 1200);
    return () => window.clearTimeout(id);
  }, [token]);

  if (!token) {
    return (
      <Shell title="Invitation link incomplete">
        <p className="max-w-sm text-sm text-neutral-variant">
          This link is missing its invitation code. Open the original link from your email, or ask
          whoever invited you to send it again.
        </p>
      </Shell>
    );
  }

  return (
    <Shell title="A friend invited you to LexiRoot">
      {attempted ? (
        <>
          <p className="max-w-sm text-sm text-neutral-variant">
            Install LexiRoot, then open this link again on your phone to accept. You'll appear on each
            other's weekly leaderboard — display name, streak and Root Points, nothing else.
          </p>
          <StoreBadges className="mt-2 justify-center" />
          <button
            type="button"
            onClick={() => {
              window.location.href = `${APP_SCHEME_URL}?token=${encodeURIComponent(token)}`;
            }}
            className="mt-2 text-sm font-semibold text-primary underline underline-offset-4"
          >
            Already have the app? Open it
          </button>
        </>
      ) : (
        <p className="max-w-sm text-sm text-neutral-variant">Opening the LexiRoot app…</p>
      )}
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-primary-soft px-6 text-center">
      <span className="text-3xl font-extrabold text-primary">LexiRoot</span>
      <h1 className="text-xl font-bold text-neutral">{title}</h1>
      {children}
    </div>
  );
}
