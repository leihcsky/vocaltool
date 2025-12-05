'use client'
import HeadInfo from "~/components/HeadInfo";
import Header from "~/components/Header";
import Footer from "~/components/Footer";
import ToolsSidebar from "~/components/ToolsSidebar";
import { useState, useEffect, useRef } from "react";
import { useCommonContext } from "~/context/common-context";
import {
  CloudArrowUpIcon,
  MusicalNoteIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import Markdown from "react-markdown";

const PageComponent = ({
  locale,
  toolSlug,
  toolPageText,
}: {
  locale: string;
  toolSlug: string;
  toolPageText: any;
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleProcess = () => {
    setIsProcessing(true);
    // TODO: Implement actual processing logic
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  };

  // Generate tool-specific keywords
  const getToolKeywords = (slug: string) => {
    const baseKeywords = "AI audio editing, audio processing, music editing, online audio tool";
    const toolKeywords = {
      'vocal-remover': 'vocal remover, remove vocals, instrumental maker, karaoke track, stem separation',
      'karaoke-maker': 'karaoke maker, karaoke creator, backing track, remove vocals, sing along',
      'extract-vocals': 'extract vocals, vocal isolation, acapella extraction, voice extractor',
      'acapella-maker': 'acapella maker, vocal only, isolated vocals, voice track',
      'noise-reducer': 'noise reducer, audio cleanup, remove background noise, denoise audio',
    };
    return `${baseKeywords}, ${toolKeywords[slug] || ''}`;
  };

  return (
    <>
      <HeadInfo
        locale={locale}
        page={`tools/${toolSlug}`}
        title={toolPageText.title}
        description={toolPageText.description}
        keywords={getToolKeywords(toolSlug)}
      />
      <Header locale={locale} page={`tools/${toolSlug}`} />

      {/* Layout with Sidebar */}
      <div className="flex">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:block">
          <ToolsSidebar locale={locale} currentToolSlug={toolSlug} />
        </div>

        {/* Main Content */}
        <main className="flex-1 min-h-screen bg-gradient-to-b from-white to-neutral-50">
          {/* Hero Section */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4">
                {toolPageText.h1Text}
              </h1>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
                {toolPageText.descriptionBelowH1Text}
              </p>
            </div>

            {/* Upload Section */}
            <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8 sm:p-12">
              {!uploadedFile ? (
                <div className="text-center">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer block"
                  >
                    <div className="border-2 border-dashed border-neutral-300 rounded-xl p-12 hover:border-brand-500 transition-colors">
                      <CloudArrowUpIcon className="w-16 h-16 mx-auto text-neutral-400 mb-4" />
                      <p className="text-lg font-semibold text-neutral-900 mb-2">
                        {toolPageText.uploadTitle || 'Upload your audio file'}
                      </p>
                      <p className="text-neutral-600 mb-4">
                        {toolPageText.uploadDesc || 'Drag and drop or click to browse'}
                      </p>
                      <p className="text-sm text-neutral-500">
                        Supports MP3, WAV, FLAC (Max 100MB)
                      </p>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept="audio/*"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* File info */}
                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MusicalNoteIcon className="w-8 h-8 text-brand-600" />
                      <div>
                        <p className="font-semibold text-neutral-900">{uploadedFile.name}</p>
                        <p className="text-sm text-neutral-600">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="text-sm text-neutral-600 hover:text-neutral-900"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Process button */}
                  <button
                    onClick={handleProcess}
                    disabled={isProcessing}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      toolPageText.processButton || 'Process Audio'
                    )}
                  </button>
                </div>
              )}
              </div>
            </div>
          </section>

          {/* How to Use Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">
              {toolPageText.howToUseTitle || 'How to Use'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 text-brand-600 font-bold text-xl mb-4">
                  1
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">
                  {toolPageText.step1Title || 'Upload Audio'}
                </h3>
                <p className="text-neutral-600 text-sm">
                  {toolPageText.step1Desc || 'Choose your audio file from your device'}
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 text-brand-600 font-bold text-xl mb-4">
                  2
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">
                  {toolPageText.step2Title || 'Process'}
                </h3>
                <p className="text-neutral-600 text-sm">
                  {toolPageText.step2Desc || 'AI processes your audio automatically'}
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 text-brand-600 font-bold text-xl mb-4">
                  3
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">
                  {toolPageText.step3Title || 'Download'}
                </h3>
                <p className="text-neutral-600 text-sm">
                  {toolPageText.step3Desc || 'Get your processed audio file'}
                </p>
              </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">
                {toolPageText.featuresTitle || 'Key Features'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((num) => {
                  const featureTitle = toolPageText[`feature${num}Title`];
                  const featureDesc = toolPageText[`feature${num}Desc`];
                  if (!featureTitle) return null;

                  return (
                    <div key={num} className="flex gap-4">
                      <CheckCircleIcon className="w-6 h-6 text-brand-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-1">
                          {featureTitle}
                        </h3>
                        <p className="text-neutral-600 text-sm">
                          {featureDesc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">
              {toolPageText.faqTitle || 'Frequently Asked Questions'}
            </h2>
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((num) => {
                const question = toolPageText[`faq${num}Q`];
                const answer = toolPageText[`faq${num}A`];
                if (!question) return null;

                return (
                  <div key={num} className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                    <h3 className="font-semibold text-neutral-900 mb-2">
                      {question}
                    </h3>
                    <p className="text-neutral-600">
                      {answer}
                    </p>
                  </div>
                );
              })}
              </div>
            </div>
          </section>

          {/* SEO Content Section */}
          {toolPageText.seoContent && (
            <section className="bg-neutral-50 py-16">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="prose prose-neutral max-w-none">
                  <Markdown>{toolPageText.seoContent}</Markdown>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      <Footer locale={locale} page="tools" />
    </>
  );
};

export default PageComponent;

