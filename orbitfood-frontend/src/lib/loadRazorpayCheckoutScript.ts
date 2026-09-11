/**
 * Razorpay's Standard Checkout widget is a plain <script> tag that attaches
 * window.Razorpay — it is not an npm package (the `razorpay` package is the
 * server-side Orders API SDK, unrelated to this browser widget). Memoized so
 * repeat checkouts in the same session don't re-inject the tag.
 */
let scriptPromise: Promise<boolean> | null = null;

export function loadRazorpayCheckoutScript(): Promise<boolean> {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve(true);
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return scriptPromise;
}
