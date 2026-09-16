/**
 * Injects a Schema.org graph. Rendered server-side so crawlers that do not run
 * JavaScript still receive it in the initial HTML.
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // The payload is built from typed constants in lib/site.ts, never from
      // user input. JSON.stringify escaping is sufficient here; we additionally
      // neutralise "</" so a stray value can never close the script element.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
