'use client'
import HeadInfo from "~/components/HeadInfo";
import Header from "~/components/Header";
import Footer from "~/components/Footer";
import {useCommonContext} from "~/context/common-context";
import {useEffect, useState} from "react";
import PricingModal from "~/components/PricingModal";
import Link from "next/link";
import Markdown from "react-markdown";
import {getLinkHref} from "~/configs/buildLink";
import {WebsiteStructuredData, OrganizationStructuredData} from "~/components/StructuredData";
import {
  SparklesIcon,
  CheckIcon,
  BoltIcon,
  GlobeAltIcon,
  CursorArrowRaysIcon,
  RocketLaunchIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

const PageComponent = ({
                         locale,
                         indexText,
                         questionText,
                         featuresText,
                         toolsListText,
                         pricingText,
                         targetAudienceText,
                         searchParams,
                       }: {
                         locale: string;
                         indexText: any;
                         questionText: any;
                         featuresText: any;
                         toolsListText: any;
                         pricingText: any;
                         targetAudienceText: any;
                         searchParams: any;
                       }) => {
  const [pagePath] = useState("");

  const {
    setShowLoadingModal
  } = useCommonContext();

  useEffect(() => {
    setShowLoadingModal(false);
    window.scrollTo(0, 0);
  }, [setShowLoadingModal]);

  const hasAnyKey = (obj: Record<string, any>) => {
    return Object.keys(obj).length > 0;
  }

  // Features data with icons
  const features = [
    {
      icon: BoltIcon,
      title: featuresText.feature1Title,
      description: featuresText.feature1Desc,
    },
    {
      icon: SparklesIcon,
      title: featuresText.feature2Title,
      description: featuresText.feature2Desc,
    },
    {
      icon: GlobeAltIcon,
      title: featuresText.feature3Title,
      description: featuresText.feature3Desc,
    },
    {
      icon: CursorArrowRaysIcon,
      title: featuresText.feature4Title,
      description: featuresText.feature4Desc,
    },
    {
      icon: RocketLaunchIcon,
      title: featuresText.feature5Title,
      description: featuresText.feature5Desc,
    },
    {
      icon: MusicalNoteIcon,
      title: featuresText.feature6Title,
      description: featuresText.feature6Desc,
    },
  ];

  // Target audiences data
  const audiences = [
    {
      icon: VideoCameraIcon,
      title: targetAudienceText.audience1Title,
      description: targetAudienceText.audience1Desc,
    },
    {
      icon: MusicalNoteIcon,
      title: targetAudienceText.audience2Title,
      description: targetAudienceText.audience2Desc,
    },
    {
      icon: MicrophoneIcon,
      title: targetAudienceText.audience3Title,
      description: targetAudienceText.audience3Desc,
    },
    {
      icon: AdjustmentsHorizontalIcon,
      title: targetAudienceText.audience4Title,
      description: targetAudienceText.audience4Desc,
    },
  ];

  // Tools data
  const tools = [
    {
      name: toolsListText.vocalRemover,
      description: toolsListText.vocalRemoverDesc,
      href: getLinkHref(locale, 'tools/vocal-remover'),
      icon: '🎤',
      gradient: 'from-brand-500 to-brand-600',
    },
    {
      name: toolsListText.audioSplitter,
      description: toolsListText.audioSplitterDesc,
      href: getLinkHref(locale, 'tools/audio-splitter'),
      icon: '🎚️',
      gradient: 'from-orange-500 to-orange-600',
    },
    {
      name: toolsListText.audioCutter,
      description: toolsListText.audioCutterDesc,
      href: getLinkHref(locale, 'tools/audio-cutter'),
      icon: '✂️',
      gradient: 'from-red-500 to-red-600',
    },
  ];

  const renderFeatureList = (features: string[]) => {
    if (!Array.isArray(features)) return null;
    return (
      <ul className="mt-8 space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <CheckIcon className="h-6 w-6 text-brand-600 flex-shrink-0" />
            <span className="ml-3 text-neutral-600">{feature}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <>
      {
        hasAnyKey(searchParams) ?
          <meta name="robots" content="noindex"/>
          :
          null
      }
      <HeadInfo
        locale={locale}
        page={pagePath}
        title={indexText.title}
        description={indexText.description}
        keywords="AI audio tools, AI audio toolkit, vocal remover, stem splitter, audio cutter, audio converter, karaoke maker, podcast audio cleanup, YouTube audio, TikTok audio, music editing online, remove vocals from songs, split stems online"
      />
      <WebsiteStructuredData
        name={process.env.NEXT_PUBLIC_BRAND_NAME || "WaveKit"}
        url={process.env.NEXT_PUBLIC_SITE_URL || "https://wavekit.org"}
        description={indexText.description}
      />
      <OrganizationStructuredData
        name={process.env.NEXT_PUBLIC_BRAND_NAME || "WaveKit"}
        url={process.env.NEXT_PUBLIC_SITE_URL || "https://wavekit.org"}
        logo={`${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`}
        description={indexText.description}
      />
      <Header
        locale={locale}
        page={pagePath}
      />
      <PricingModal
        locale={locale}
        page={pagePath}
      />

      {/* Hero Section */}
      <div className="bg-gradient-hero">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
              <span className="block">{indexText.h1Text}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
              {indexText.descriptionBelowH1Text}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href={getLinkHref(locale, 'tools/vocal-remover')}
                className="btn-primary"
              >
                {indexText.ctaPrimary}
              </Link>
              <Link
                href={getLinkHref(locale, 'tools')}
                className="btn-outline"
              >
                {indexText.ctaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </div>


      {/* Target Audience Section */}
      <div className="py-16 bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
              {targetAudienceText.title}
            </h2>
            <p className="mt-4 text-lg text-neutral-600">
              {targetAudienceText.subtitle}
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map((audience, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto flex items-center justify-center w-16 h-16 bg-brand-50 rounded-full mb-6">
                  <audience.icon className="w-8 h-8 text-brand-600" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  {audience.title}
                </h3>
                <p className="text-neutral-600">
                  {audience.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

          {/* Features Section */}
          <div className="py-16 bg-neutral-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                  {featuresText.title}
                </h2>
                <p className="mt-4 text-lg text-neutral-600">
                  {featuresText.subtitle}
                </p>
              </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div key={index} className="card p-6 hover:shadow-medium transition-shadow">
                <div className="flex items-center justify-center w-12 h-12 bg-brand-100 rounded-xl mb-4">
                  <feature.icon className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-neutral-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Tools Grid Section */}
      <div className="py-16 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
              Our AI Audio Tools
            </h2>
            <p className="mt-4 text-lg text-neutral-600">
              Choose the perfect tool for your audio editing needs
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool, index) => (
              <Link
                key={index}
                href={tool.href}
                className="card-hover p-8 group"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.gradient} text-white text-3xl mb-4`}>
                  {tool.icon}
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors">
                  {tool.name}
                </h3>
                <p className="text-neutral-600">
                  {tool.description}
                </p>
                <div className="mt-4 flex items-center text-brand-600 font-medium">
                  Try it now
                  <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href={getLinkHref(locale, 'tools')}
              className="inline-flex items-center text-brand-600 hover:text-brand-700 font-semibold"
            >
              View all tools
              <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

          {/* Pricing Preview Section */}
          <div className="py-16 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                  {pricingText.h1Text}
                </h2>
                <p className="mt-4 text-lg text-neutral-600">
                  {pricingText.subtitle}
                </p>
              </div>
              <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Free Plan */}
                <div className="card p-8">
                  <h3 className="text-2xl font-bold text-neutral-900">{pricingText.free}</h3>
                  <p className="mt-4 flex items-baseline">
                    <span className="text-5xl font-bold tracking-tight text-neutral-900">$0</span>
                    <span className="ml-2 text-neutral-600">/ {pricingText.monthText}</span>
                  </p>
                  {renderFeatureList(pricingText.freeFeatures)}
                  <Link
                    href={getLinkHref(locale, 'tools/vocal-remover')}
                    className="mt-8 block w-full btn-outline text-center"
                  >
                    {pricingText.buyText}
                  </Link>
                </div>

                {/* Creator Monthly Plan */}
                <div className="card p-8 ring-2 ring-brand-500 relative">
                  <div className="absolute top-0 right-6 transform -translate-y-1/2">
                    <span className="inline-flex rounded-full bg-brand-500 px-4 py-1 text-sm font-semibold text-white">
                      {pricingText.popularText}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900">{pricingText.creatorMonthly}</h3>
                  <p className="mt-4 flex items-baseline">
                    <span className="text-5xl font-bold tracking-tight text-neutral-900">$9.9</span>
                    <span className="ml-2 text-neutral-600">/ {pricingText.monthText}</span>
                  </p>
                  {renderFeatureList(pricingText.creatorFeatures)}
                  <Link
                    href={getLinkHref(locale, 'pricing')}
                    className="mt-8 block w-full btn-primary text-center"
                  >
                    {pricingText.buyText}
                  </Link>
                </div>

                {/* Creator Yearly Plan */}
                <div className="card p-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-neutral-900">{pricingText.creatorYearly}</h3>
                    <span className="inline-flex rounded-full bg-accent-100 px-3 py-1 text-sm font-semibold text-accent-700">
                      {pricingText.annuallySaveText}
                    </span>
                  </div>
                  <p className="mt-4 flex items-baseline">
                    <span className="text-5xl font-bold tracking-tight text-neutral-900">$79</span>
                    <span className="ml-2 text-neutral-600">/ {pricingText.annualText}</span>
                  </p>
                  {renderFeatureList(pricingText.creatorFeatures)}
                  <Link
                    href={getLinkHref(locale, 'pricing')}
                    className="mt-8 block w-full btn-outline text-center"
                  >
                    {pricingText.buyText}
                  </Link>
                </div>
          </div>
          <div className="mt-12 text-center">
            <Link
              href={getLinkHref(locale, 'pricing')}
              className="inline-flex items-center text-brand-600 hover:text-brand-700 font-semibold"
            >
              View full pricing details
              <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* SEO Content Section */}
      {questionText.detailText && (
        <div className="py-16 bg-neutral-50">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none div-markdown-color">
              <Markdown>
                {questionText.detailText}
              </Markdown>
            </div>
          </div>
        </div>
      )}

      <Footer
        locale={locale}
        page={pagePath}
      />
    </>
  )
}

export default PageComponent
