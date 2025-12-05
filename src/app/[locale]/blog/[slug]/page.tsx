import PageComponent from "./PageComponent";
import { setRequestLocale } from 'next-intl/server';
import { getBlogPostText } from "~/i18n/languageText";
import { notFound } from "next/navigation";

export const revalidate = 120;

// Define available blog posts
const AVAILABLE_POSTS = [
  'how-to-remove-vocals-from-songs',
  'ai-audio-processing-explained',
  'best-practices-audio-editing'
];

export default async function BlogPostPage({ 
  params: { locale = '', slug = '' } 
}: {
  params: { locale: string; slug: string }
}) {
  // Enable static rendering
  setRequestLocale(locale);

  // Check if blog post exists
  if (!AVAILABLE_POSTS.includes(slug)) {
    notFound();
  }

  const blogPostText = await getBlogPostText(slug);

  return (
    <PageComponent
      locale={locale}
      slug={slug}
      blogPostText={blogPostText}
    />
  )
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  return AVAILABLE_POSTS.map((slug) => ({
    slug: slug,
  }));
}

