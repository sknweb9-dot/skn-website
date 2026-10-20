'use client';

import './globals.css';

/**
 * The last resort: the root layout itself failed, so there is no layout to sit
 * inside. It replaces the whole document, so it carries its own <html> and
 * <body>, and plain system fonts rather than the ones the layout loads.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="bg-cream text-ink antialiased">
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-24 sm:px-8">
          <h1 className="text-[2.4rem] leading-tight font-semibold text-teal-deep">Shanti Kala Nikketan</h1>
          <p className="mt-6 text-[1.05rem] leading-relaxed text-ink-soft">
            The site did not load. Please try again, or reach the academy on +91 98840 22306 or at
            shantikalanikketan@gmail.com.
          </p>
          <div className="mt-8">
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center rounded-full bg-kumkum px-6 py-3 text-sm font-semibold text-cream"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
