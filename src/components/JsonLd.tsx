// Server component — no 'use client' needed.
// JSON.stringify is safe; the replace guards against </script> injection.
export default function JsonLd({ schema }: { schema: object | object[] }) {
  const schemas = Array.isArray(schema) ? schema : [schema];
  return (
    <>
      {schemas.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(s).replace(/<\//g, '<\\/'),
          }}
        />
      ))}
    </>
  );
}
