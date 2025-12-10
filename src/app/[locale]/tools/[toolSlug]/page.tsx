import PageComponent from "./PageComponent";
import { setRequestLocale } from 'next-intl/server';
import { getToolPageText } from "~/i18n/languageText";
import { notFound } from "next/navigation";

export const revalidate = 120;

// Define available tools
const AVAILABLE_TOOLS = [
  'vocal-remover',
  'audio-splitter',
  'audio-cutter',
  'karaoke-maker',
  'extract-vocals',
  'acapella-maker',
  'noise-reducer'
];

export default async function ToolPage({ 
  params: { locale = '', toolSlug = '' } 
}: {
  params: { locale: string; toolSlug: string }
}) {
  // Enable static rendering
  setRequestLocale(locale);

  // Check if tool exists
  if (!AVAILABLE_TOOLS.includes(toolSlug)) {
    notFound();
  }

  const toolPageText = await getToolPageText(toolSlug);

  return (
    <PageComponent
      locale={locale}
      toolSlug={toolSlug}
      toolPageText={toolPageText}
    />
  )
}

// Generate static params for all tools
export async function generateStaticParams() {
  return AVAILABLE_TOOLS.map((toolSlug) => ({
    toolSlug: toolSlug,
  }));
}

