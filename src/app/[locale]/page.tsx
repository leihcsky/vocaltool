import PageComponent from "./PageComponent";
import { setRequestLocale } from 'next-intl/server';

import {
  getIndexPageText,
  getQuestionText,
  getFeaturesText,
  getToolsListText,
  getPricingText,
  getTargetAudienceText
} from "~/i18n/languageText";

export const revalidate = 120;
export default async function IndexPage({ params: { locale = '' }, searchParams: searchParams }) {
  // Enable static rendering
  setRequestLocale(locale);

  const indexText = await getIndexPageText();
  const questionText = await getQuestionText();
  const featuresText = await getFeaturesText();
  const toolsListText = await getToolsListText();
  const pricingText = await getPricingText();
  const targetAudienceText = await getTargetAudienceText();

  return (
    <PageComponent
      locale={locale}
      indexText={indexText}
      questionText={questionText}
      featuresText={featuresText}
      toolsListText={toolsListText}
      pricingText={pricingText}
      targetAudienceText={targetAudienceText}
      searchParams={searchParams}
    />
  )


}
