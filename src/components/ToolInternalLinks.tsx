'use client'
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface ToolLink {
  slug: string;
  name: string;
  description: string;
  emoji: string;
}

interface ToolInternalLinksProps {
  locale: string;
  currentToolSlug: string;
  links: ToolLink[];
  title?: string;
}

export default function ToolInternalLinks({ 
  locale, 
  currentToolSlug, 
  links,
  title = "Related Tools"
}: ToolInternalLinksProps) {
  if (links.length === 0) return null;

  const getLinkHref = (slug: string) => {
    return `/${locale}/tools/${slug}`;
  };

  return (
    <section className="bg-gradient-to-b from-neutral-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6 text-center">
            {title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {links.map((link) => (
              <Link
                key={link.slug}
                href={getLinkHref(link.slug)}
                className="group bg-white rounded-xl p-6 border border-neutral-200 hover:border-brand-500 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0">{link.emoji}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors">
                      {link.name}
                    </h3>
                    <p className="text-sm text-neutral-600 mb-3">
                      {link.description}
                    </p>
                    <div className="flex items-center text-brand-600 text-sm font-medium group-hover:text-brand-700">
                      <span>Try {link.name}</span>
                      <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

