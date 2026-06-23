import type { ReactNode } from "react";

/** Shared layout for static content/policy pages: dark hero + prose body. */
export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="hazard-stripes h-1.5 w-full" />
      <div className="bg-steel-900 text-white">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h1 className="font-display text-4xl font-bold uppercase tracking-wide">
            {title}
          </h1>
          {subtitle && <p className="mt-2 max-w-2xl text-steel-300">{subtitle}</p>}
        </div>
      </div>
      <article className="mx-auto max-w-4xl space-y-5 px-4 py-10 [&_a]:font-medium [&_a]:text-brand hover:[&_a]:underline [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:text-steel-900 [&_h3]:mt-4 [&_h3]:font-bold [&_h3]:text-steel-900 [&_li]:leading-relaxed [&_p]:leading-relaxed [&_p]:text-steel-700 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-steel-700">
        {children}
      </article>
    </div>
  );
}
