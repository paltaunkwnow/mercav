import Link from "next/link";
import type { PlaceFaqItem } from "@/components/kosher/place/seo";

/** Las mismas preguntas que van en el FAQPage, visibles en la página. */
export function PlaceFaq({ items }: { items: PlaceFaqItem[] }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="k-place-faq" className="mv-panel mt-4 p-6 md:p-8">
      <h2 id="k-place-faq" className="mv-h3">
        Preguntas frecuentes
      </h2>
      <div className="mt-4 divide-y divide-[var(--mv-hairline)]">
        {items.map((item) => (
          <div key={item.question} className="py-4 first:pt-0 last:pb-0">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.question}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">{item.answer}</p>
            {item.link && (
              <Link href={item.link.href} className="mv-link mt-2 inline-block text-sm">
                {item.link.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
// creado por pato dev y askforvini
