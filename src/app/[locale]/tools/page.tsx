import PageComponent from "./PageComponent";
import { setRequestLocale } from 'next-intl/server';
import { getToolsPageText, getToolsListText } from "~/i18n/languageText";

export const revalidate = 120;

export default async function ToolsPage({ params: { locale = '' } }) {
  // Enable static rendering
  setRequestLocale(locale);

  const toolsPageText = await getToolsPageText();
  const toolsListText = await getToolsListText();

  return (
    <PageComponent
      locale={locale}
      toolsPageText={toolsPageText}
      toolsListText={toolsListText}
    />
  )
}

