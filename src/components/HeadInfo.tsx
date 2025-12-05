import { languages } from "~/i18n/config";

interface HeadInfoProps {
  locale: string;
  page: string;
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
}

const HeadInfo = ({
  locale,
  page,
  title,
  description,
  keywords,
  ogImage,
  ogType = 'website',
  article,
}: HeadInfoProps) => {
  // Build current page URL
  const getCurrentUrl = () => {
    if (page) {
      return locale === 'en'
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/${page}`
        : `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/${page}`;
    }
    return locale === 'en'
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/`
      : `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}`;
  };

  const currentUrl = getCurrentUrl();
  const defaultOgImage = `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.jpg`;
  const finalOgImage = ogImage || defaultOgImage;

  return (
    <>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={process.env.NEXT_PUBLIC_BRAND_NAME} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:site_name" content={process.env.NEXT_PUBLIC_BRAND_NAME} />
      <meta property="og:locale" content={locale === 'zh' ? 'zh_CN' : 'en_US'} />

      {/* Article-specific Open Graph tags */}
      {article && ogType === 'article' && (
        <>
          {article.publishedTime && <meta property="article:published_time" content={article.publishedTime} />}
          {article.modifiedTime && <meta property="article:modified_time" content={article.modifiedTime} />}
          {article.author && <meta property="article:author" content={article.author} />}
          {article.section && <meta property="article:section" content={article.section} />}
          {article.tags && article.tags.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={finalOgImage} />

      {/* Alternate Language Links */}
      {languages.map((item) => {
        const hrefLang = item.lang === 'en' ? 'x-default' : item.code;
        let href: string;
        if (page) {
          href = item.lang === 'en'
            ? `${process.env.NEXT_PUBLIC_SITE_URL}/${page}`
            : `${process.env.NEXT_PUBLIC_SITE_URL}/${item.lang}/${page}`;
        } else {
          href = item.lang === 'en'
            ? `${process.env.NEXT_PUBLIC_SITE_URL}/`
            : `${process.env.NEXT_PUBLIC_SITE_URL}/${item.lang}`;
        }
        return <link key={href} rel="alternate" hrefLang={hrefLang} href={href} />
      })}

      {/* Canonical Link */}
      <link rel="canonical" href={currentUrl} />

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
    </>
  )
}

export default HeadInfo
