import PageComponent from "./PageComponent";
import { setRequestLocale } from 'next-intl/server';
import { getBlogText } from "~/i18n/languageText";

export const revalidate = 120;

export default async function BlogPage({ params: { locale = '' } }) {
  // Enable static rendering
  setRequestLocale(locale);

  const blogText = await getBlogText();

  return (
    <PageComponent
      locale={locale}
      blogText={blogText}
    />
  )
}

