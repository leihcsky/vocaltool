import PageComponent from './PageComponent';
import {getTranslations, unstable_setRequestLocale} from 'next-intl/server';

export async function generateMetadata({params: {locale}}) {
  const t = await getTranslations({locale});
  const aboutText = t.raw('AboutText');

  return {
    title: aboutText.title,
    description: aboutText.description,
  };
}

export default async function Page({params: {locale}}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations({locale});
  const aboutText = t.raw('AboutText');

  return (
    <PageComponent
      locale={locale}
      aboutText={aboutText}
    />
  );
}

