'use client'
import HeadInfo from "~/components/HeadInfo";
import Header from "~/components/Header";
import Footer from "~/components/Footer";
import { useEffect, useRef, useState } from "react";
import { useCommonContext } from "~/context/common-context";
import Link from "next/link";
import { getLinkHref } from "~/configs/buildLink";
import Markdown from "react-markdown";
import { ArticleStructuredData, BreadcrumbStructuredData } from "~/components/StructuredData";

const PageComponent = ({ locale, slug, blogPostText }) => {
  const [pagePath] = useState('blog');
  const { setShowLoadingModal } = useCommonContext();

  const useCustomEffect = (effect, deps) => {
    const isInitialMount = useRef(true);

    useEffect(() => {
      if (process.env.NODE_ENV === 'production' || isInitialMount.current) {
        isInitialMount.current = false;
        return effect();
      }
    }, deps);
  };

  useCustomEffect(() => {
    setShowLoadingModal(false);
    window.scrollTo(0, 0);
    return () => { }
  }, []);

  // Convert date format for structured data (e.g., "December 1, 2024" -> "2024-12-01")
  const convertDateToISO = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const currentUrl = locale === 'en'
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${slug}`
    : `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/blog/${slug}`;

  return (
    <>
      <HeadInfo
        locale={locale}
        page={`blog/${slug}`}
        title={blogPostText.title}
        description={blogPostText.description}
        keywords={`${blogPostText.category}, audio editing, ${blogPostText.title}`}
        ogType="article"
        article={{
          publishedTime: convertDateToISO(blogPostText.date),
          author: blogPostText.author,
          section: blogPostText.category,
          tags: [blogPostText.category, 'Audio Editing', 'AI Tools'],
        }}
      />
      <ArticleStructuredData
        title={blogPostText.title}
        description={blogPostText.description}
        url={currentUrl}
        datePublished={convertDateToISO(blogPostText.date)}
        author={blogPostText.author}
        category={blogPostText.category}
      />
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', url: process.env.NEXT_PUBLIC_SITE_URL || 'https://wavekit.org' },
          { name: 'Blog', url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale === 'en' ? '' : locale + '/'}blog` },
          { name: blogPostText.h1Text, url: currentUrl },
        ]}
      />
      <Header
        locale={locale}
        page={pagePath}
      />

      <div className="min-h-screen bg-white">
        {/* Article Header */}
        <div className="bg-gradient-hero">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-20 pb-12">
            <div className="mb-6">
              <Link
                href={getLinkHref(locale, 'blog')}
                className="text-brand-600 hover:text-brand-700 font-semibold text-sm inline-flex items-center gap-2"
              >
                ← Back to Blog
              </Link>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm font-semibold text-brand-600 bg-brand-50 px-4 py-1.5 rounded-full">
                {blogPostText.category}
              </span>
              <span className="text-sm text-neutral-600">{blogPostText.readTime}</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl mb-6">
              {blogPostText.h1Text}
            </h1>

            <div className="flex items-center gap-4 text-sm text-neutral-600">
              <time>{blogPostText.date}</time>
              <span>•</span>
              <span>{blogPostText.author}</span>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <article className="py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            {/* Featured Image Placeholder */}
            <div className="aspect-video bg-gradient-to-br from-brand-100 to-brand-200 rounded-2xl mb-12 flex items-center justify-center">
              <span className="text-8xl">🎵</span>
            </div>

            {/* Article Body */}
            <div className="prose prose-lg prose-neutral max-w-none">
              <Markdown>
                {blogPostText.content}
              </Markdown>
            </div>

            {/* CTA Section */}
            <div className="mt-16 p-8 bg-gradient-to-br from-brand-50 to-accent-50 rounded-2xl text-center">
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                Ready to try our audio tools?
              </h3>
              <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
                Experience professional-grade audio editing powered by AI. Start for free today!
              </p>
              <Link
                href={getLinkHref(locale, 'tools')}
                className="btn-primary inline-block"
              >
                Explore Tools
              </Link>
            </div>

            {/* Related Posts */}
            <div className="mt-16 pt-12 border-t border-neutral-200">
              <h3 className="text-2xl font-bold text-neutral-900 mb-8">Related Articles</h3>
              <div className="grid gap-6 md:grid-cols-2">
                {blogPostText.relatedPosts?.map((post, index) => (
                  <Link
                    key={index}
                    href={getLinkHref(locale, `blog/${post.slug}`)}
                    className="group p-6 rounded-xl border border-neutral-200 hover:shadow-md transition-shadow"
                  >
                    <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                    <h4 className="text-lg font-bold text-neutral-900 mt-4 mb-2 group-hover:text-brand-600 transition-colors">
                      {post.title}
                    </h4>
                    <p className="text-sm text-neutral-600">{post.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </article>
      </div>

      <Footer
        locale={locale}
        page={pagePath}
      />
    </>
  )
}

export default PageComponent

