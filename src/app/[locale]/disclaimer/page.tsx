import PageComponent from './PageComponent';
import {getTranslations, unstable_setRequestLocale} from 'next-intl/server';

export async function generateMetadata({params: {locale}}) {
  const t = await getTranslations({locale});
  const disclaimerText = t.raw('DisclaimerText');

  return {
    title: disclaimerText.title,
    description: disclaimerText.description,
  };
}

export default async function Page({params: {locale}}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations({locale});
  const disclaimerText = t.raw('DisclaimerText');

  return (
    <PageComponent
      locale={locale}
      disclaimerText={disclaimerText}
    />
  );
}

