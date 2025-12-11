'use client'
import HeadInfo from "~/components/HeadInfo";
import Header from "~/components/Header";
import Footer from "~/components/Footer";
import Link from "next/link";
import { getLinkHref } from "~/configs/buildLink";
import { useEffect, useRef } from "react";
import { useCommonContext } from "~/context/common-context";
import {
  MusicalNoteIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  SparklesIcon,
  ArrowRightIcon,
  ScissorsIcon
} from '@heroicons/react/24/outline';

const PageComponent = ({
  locale,
  toolsPageText,
  toolsListText,
}: {
  locale: string;
  toolsPageText: any;
  toolsListText: any;
}) => {
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
  // Tools data with icons and colors
  const tools = [
    {
      name: toolsListText.vocalRemover,
      description: toolsListText.vocalRemoverDesc,
      href: getLinkHref(locale, 'tools/vocal-remover'),
      icon: MicrophoneIcon,
      gradient: 'from-brand-500 to-brand-600',
      emoji: '🎤'
    },
    {
      name: toolsListText.audioSplitter,
      description: toolsListText.audioSplitterDesc,
      href: getLinkHref(locale, 'tools/audio-splitter'),
      icon: SpeakerWaveIcon,
      gradient: 'from-orange-500 to-orange-600',
      emoji: '🎚️'
    },
    {
      name: toolsListText.audioCutter,
      description: toolsListText.audioCutterDesc,
      href: getLinkHref(locale, 'tools/audio-cutter'),
      icon: ScissorsIcon,
      gradient: 'from-red-500 to-red-600',
      emoji: '✂️'
    },
  ];

  return (
    <>
      <HeadInfo
        locale={locale}
        page="tools"
        title={toolsPageText.title}
        description={toolsPageText.description}
      />
      <Header locale={locale} page="tools" />
      
      <main className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6">
              {toolsPageText.h1Text}
            </h1>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              {toolsPageText.descriptionBelowH1Text}
            </p>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={index}
                  href={tool.href}
                  className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-200 hover:border-brand-300"
                >
                  {/* Icon with gradient background */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${tool.gradient} mb-6`}>
                    <span className="text-3xl">{tool.emoji}</span>
                  </div>
                  
                  {/* Tool name */}
                  <h3 className="text-2xl font-bold text-neutral-900 mb-3 group-hover:text-brand-600 transition-colors">
                    {tool.name}
                  </h3>
                  
                  {/* Tool description */}
                  <p className="text-neutral-600 mb-6 line-clamp-2">
                    {tool.description}
                  </p>
                  
                  {/* CTA */}
                  <div className="flex items-center text-brand-600 font-semibold group-hover:text-brand-700">
                    <span>Try it now</span>
                    <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <Footer locale={locale} page="tools" />
    </>
  );
};

export default PageComponent;

