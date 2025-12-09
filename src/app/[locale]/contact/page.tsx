import PageComponent from './PageComponent';
import {getTranslations, unstable_setRequestLocale} from 'next-intl/server';

export async function generateMetadata({params: {locale}}) {
  const t = await getTranslations({locale});
  const contactText = t.raw('ContactText');

  return {
    title: contactText.title,
    description: contactText.description,
  };
}

export default async function Page({params: {locale}}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations({locale});
  const contactText = t.raw('ContactText');

  return (
    <PageComponent
      locale={locale}
      contactText={contactText}
    />
  );
}

