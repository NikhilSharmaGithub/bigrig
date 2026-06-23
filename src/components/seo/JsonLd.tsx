/**
 * Renders a JSON-LD <script> for structured data.
 * Server component — safe to drop into any page or layout.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Structured data is generated server-side from our own content.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
