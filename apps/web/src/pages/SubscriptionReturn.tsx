import { useEffect } from 'react';

interface SubscriptionReturnProps {
  variant: 'success' | 'cancel';
}

/**
 * Public landing page for hosted-checkout returns. Payment providers can only
 * redirect to an https URL, so the mobile app passes its deep link as
 * `?redirect=`; this page immediately bounces the in-app browser to it, which
 * closes the checkout session and hands control back to the app. When there's
 * no deep link (a web visitor), it just shows a confirmation message.
 */
export function SubscriptionReturn({ variant }: SubscriptionReturnProps) {
  const redirect = new URLSearchParams(window.location.search).get('redirect');

  useEffect(() => {
    if (redirect) window.location.replace(redirect);
  }, [redirect]);

  const success = variant === 'success';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-primary-soft px-6 text-center">
      <span className="text-3xl font-extrabold text-primary">LexiRoot</span>
      <h1 className="text-xl font-bold text-neutral">
        {success ? 'Payment successful' : 'Checkout cancelled'}
      </h1>
      <p className="max-w-sm text-sm text-neutral-variant">
        {redirect
          ? 'Returning you to the app…'
          : success
            ? 'Your subscription is being confirmed. You can return to the LexiRoot app.'
            : 'No changes were made. You can return to the LexiRoot app.'}
      </p>
    </div>
  );
}
