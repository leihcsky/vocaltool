'use client'
import HeadInfo from "~/components/HeadInfo";
import Header from "~/components/Header";
import Footer from "~/components/Footer";
import { useEffect, useRef, useState } from "react";
import { useCommonContext } from "~/context/common-context";
import Link from "next/link";
import { getLinkHref } from "~/configs/buildLink";

const PageComponent = ({ locale, blogText }) => {
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
    return () => { }
  }, []);

  // Sample blog posts - in a real app, this would come from a CMS or database
  const blogPosts = [
    {
      slug: 'how-to-remove-vocals-from-songs',
      title: 'How to Remove Vocals from Songs: A Complete Guide',
      excerpt: 'Learn the best techniques and tools to extract vocals from any song, perfect for creating karaoke tracks or remixes.',
      date: '2024-12-01',
      category: 'Tutorial',
      readTime: '5 min read',
      image: '/blog/vocal-removal.jpg'
    },
    {
      slug: 'ai-audio-processing-explained',
      title: 'AI Audio Processing Explained: How It Works',
      excerpt: 'Discover how artificial intelligence is revolutionizing audio editing and what makes AI-powered tools so effective.',
      date: '2024-11-28',
      category: 'Technology',
      readTime: '7 min read',
      image: '/blog/ai-audio.jpg'
    },
    {
      slug: 'best-practices-audio-editing',
      title: 'Best Practices for Professional Audio Editing',
      excerpt: 'Essential tips and techniques used by professional audio engineers to achieve studio-quality results.',
      date: '2024-11-25',
      category: 'Tips',
      readTime: '6 min read',
      image: '/blog/audio-editing.jpg'
    }
  ];

  return (
    <>
      <HeadInfo
        locale={locale}
        page={pagePath}
        title={blogText.title}
        description={blogText.description}
        keywords="audio editing blog, AI audio tutorials, vocal removal guide, music production tips, audio processing techniques, karaoke creation, sound engineering"
      />
      <Header
        locale={locale}
        page={pagePath}
      />

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="bg-gradient-hero">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
                {blogText.h1Text}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
                {blogText.descriptionBelowH1Text}
              </p>
            </div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <section className="py-12 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {blogPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={getLinkHref(locale, `blog/${post.slug}`)}
                  className="group flex flex-col rounded-2xl border border-neutral-200 bg-white overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Image Placeholder */}
                  <div className="aspect-video bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                    <span className="text-6xl">🎵</span>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-grow p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                      <span className="text-xs text-neutral-500">{post.readTime}</span>
                    </div>

                    <h2 className="text-xl font-bold text-neutral-900 mb-3 group-hover:text-brand-600 transition-colors">
                      {post.title}
                    </h2>

                    <p className="text-neutral-600 text-sm mb-4 flex-grow">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                      <time className="text-xs text-neutral-500">{post.date}</time>
                      <span className="text-brand-600 text-sm font-semibold group-hover:translate-x-1 transition-transform inline-block">
                        Read more →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Coming Soon Message */}
            <div className="mt-16 text-center">
              <p className="text-neutral-600">
                More articles coming soon! Stay tuned for audio editing tips, tutorials, and industry insights.
              </p>
            </div>
          </div>
        </section>
      </div>

      <Footer
        locale={locale}
        page={pagePath}
      />
    </>
  )
}

export default PageComponent

