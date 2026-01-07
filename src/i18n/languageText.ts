import {getTranslations} from "next-intl/server";

export const getIndexPageText = async () => {
  const tIndex = await getTranslations('IndexPageText');
  return {
    title: tIndex('title'),
    description: tIndex('description'),
    h1Text: tIndex('h1Text'),
    descriptionBelowH1Text: tIndex('descriptionBelowH1Text'),
    ctaPrimary: tIndex('ctaPrimary'),
    ctaSecondary: tIndex('ctaSecondary'),
  }
}

export const getFeaturesText = async () => {
  const tFeatures = await getTranslations('FeaturesText');
  return {
    title: tFeatures('title'),
    subtitle: tFeatures('subtitle'),
    feature1Title: tFeatures('feature1Title'),
    feature1Desc: tFeatures('feature1Desc'),
    feature2Title: tFeatures('feature2Title'),
    feature2Desc: tFeatures('feature2Desc'),
    feature3Title: tFeatures('feature3Title'),
    feature3Desc: tFeatures('feature3Desc'),
    feature4Title: tFeatures('feature4Title'),
    feature4Desc: tFeatures('feature4Desc'),
    feature5Title: tFeatures('feature5Title'),
    feature5Desc: tFeatures('feature5Desc'),
    feature6Title: tFeatures('feature6Title'),
    feature6Desc: tFeatures('feature6Desc'),
  }
}

export const getTargetAudienceText = async () => {
  const tTarget = await getTranslations('TargetAudienceText');
  return {
    title: tTarget('title'),
    subtitle: tTarget('subtitle'),
    audience1Title: tTarget('audience1Title'),
    audience1Desc: tTarget('audience1Desc'),
    audience2Title: tTarget('audience2Title'),
    audience2Desc: tTarget('audience2Desc'),
    audience3Title: tTarget('audience3Title'),
    audience3Desc: tTarget('audience3Desc'),
    audience4Title: tTarget('audience4Title'),
    audience4Desc: tTarget('audience4Desc'),
  }
}

export const getToolsListText = async () => {
  const tTools = await getTranslations('ToolsListText');
  return {
    vocalRemover: tTools('vocalRemover'),
    vocalRemoverDesc: tTools('vocalRemoverDesc'),
    audioSplitter: tTools('audioSplitter'),
    audioSplitterDesc: tTools('audioSplitterDesc'),
    audioCutter: tTools('audioCutter'),
    audioCutterDesc: tTools('audioCutterDesc'),
    karaokeMaker: tTools('karaokeMaker'),
    karaokeMakerDesc: tTools('karaokeMakerDesc'),
    extractVocals: tTools('extractVocals'),
    extractVocalsDesc: tTools('extractVocalsDesc'),
    acapellaMaker: tTools('acapellaMaker'),
    acapellaMakerDesc: tTools('acapellaMakerDesc'),
    noiseReducer: tTools('noiseReducer'),
    noiseReducerDesc: tTools('noiseReducerDesc'),
    audioConverter: tTools('audioConverter'),
    audioConverterDesc: tTools('audioConverterDesc'),
  }
}

export const getToolsPageText = async () => {
  const tTools = await getTranslations('ToolsText');
  return {
    title: tTools('title') + ' | ' + process.env.NEXT_PUBLIC_WEBSITE_NAME,
    description: tTools('description'),
    h1Text: tTools('h1Text'),
    descriptionBelowH1Text: tTools('descriptionBelowH1Text'),
  }
}

export const getToolPageText = async (toolSlug: string) => {
  // Convert tool-slug to ToolSlug format for translation key
  const toolKey = toolSlug
    .split('-')
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join('');

  const tTool = await getTranslations(`Tool.${toolKey}` as any);

  // Helper function to safely get translation
  const safeGet = (key: string) => {
    try {
      return tTool(key);
    } catch {
      return undefined;
    }
  };

  // Only audio-splitter uses sound source options.
  // For other tools we avoid even attempting to resolve these keys
  // to prevent next-intl from logging missing translation warnings.
  const includeSoundSourceFields = toolSlug === 'audio-splitter';
  
  // Only audio-splitter and audio-cutter have step4
  // For other tools we avoid even attempting to resolve these keys
  // to prevent next-intl from logging missing translation warnings.
  const includeStep4Fields = toolSlug === 'audio-splitter' || toolSlug === 'audio-cutter';

  // Only audio-converter uses fromUrl
  const includeFromUrl = toolSlug === 'audio-converter';

  return {
    title: tTool('title') + ' | ' + process.env.NEXT_PUBLIC_WEBSITE_NAME,
    description: tTool('description'),
    h1Text: tTool('h1Text'),
    descriptionBelowH1Text: tTool('descriptionBelowH1Text'),
    uploadTitle: tTool('uploadTitle'),
    uploadDesc: tTool('uploadDesc'),
    fromUrl: includeFromUrl ? safeGet('fromUrl') : undefined,
    processButton: tTool('processButton'),
    usageLimitNotice: safeGet('usageLimitNotice'),
    // Sound source options (only for audio-splitter)
    soundSourceLabel: includeSoundSourceFields ? safeGet('soundSourceLabel') : undefined,
    presetsLabel: includeSoundSourceFields ? safeGet('presetsLabel') : undefined,
    presetKaraoke: includeSoundSourceFields ? safeGet('presetKaraoke') : undefined,
    presetKaraokeDesc: includeSoundSourceFields ? safeGet('presetKaraokeDesc') : undefined,
    presetVocal: includeSoundSourceFields ? safeGet('presetVocal') : undefined,
    presetVocalDesc: includeSoundSourceFields ? safeGet('presetVocalDesc') : undefined,
    presetDrums: includeSoundSourceFields ? safeGet('presetDrums') : undefined,
    presetDrumsDesc: includeSoundSourceFields ? safeGet('presetDrumsDesc') : undefined,
    presetPiano: includeSoundSourceFields ? safeGet('presetPiano') : undefined,
    presetPianoDesc: includeSoundSourceFields ? safeGet('presetPianoDesc') : undefined,
    presetRemix: includeSoundSourceFields ? safeGet('presetRemix') : undefined,
    presetRemixDesc: includeSoundSourceFields ? safeGet('presetRemixDesc') : undefined,
    advancedLabel: includeSoundSourceFields ? safeGet('advancedLabel') : undefined,
    advancedToggleShow: includeSoundSourceFields ? safeGet('advancedToggleShow') : undefined,
    advancedToggleHide: includeSoundSourceFields ? safeGet('advancedToggleHide') : undefined,
    soundSourceAll: includeSoundSourceFields ? safeGet('soundSourceAll') : undefined,
    soundSourceAllDesc: includeSoundSourceFields ? safeGet('soundSourceAllDesc') : undefined,
    soundSourceBass: includeSoundSourceFields ? safeGet('soundSourceBass') : undefined,
    soundSourceBassDesc: includeSoundSourceFields ? safeGet('soundSourceBassDesc') : undefined,
    soundSourceDrums: includeSoundSourceFields ? safeGet('soundSourceDrums') : undefined,
    soundSourceDrumsDesc: includeSoundSourceFields ? safeGet('soundSourceDrumsDesc') : undefined,
    soundSourcePiano: includeSoundSourceFields ? safeGet('soundSourcePiano') : undefined,
    soundSourcePianoDesc: includeSoundSourceFields ? safeGet('soundSourcePianoDesc') : undefined,
    soundSourceGuitar: includeSoundSourceFields ? safeGet('soundSourceGuitar') : undefined,
    soundSourceGuitarDesc: includeSoundSourceFields ? safeGet('soundSourceGuitarDesc') : undefined,
    // How to use steps
    howToUseTitle: tTool('howToUseTitle'),
    step1Title: tTool('step1Title'),
    step1Desc: tTool('step1Desc'),
    step2Title: tTool('step2Title'),
    step2Desc: tTool('step2Desc'),
    step3Title: tTool('step3Title'),
    step3Desc: tTool('step3Desc'),
    step4Title: includeStep4Fields ? safeGet('step4Title') : undefined,
    step4Desc: includeStep4Fields ? safeGet('step4Desc') : undefined,
    // Features
    featuresTitle: tTool('featuresTitle'),
    feature1Title: tTool('feature1Title'),
    feature1Desc: tTool('feature1Desc'),
    feature2Title: tTool('feature2Title'),
    feature2Desc: tTool('feature2Desc'),
    feature3Title: tTool('feature3Title'),
    feature3Desc: tTool('feature3Desc'),
    feature4Title: tTool('feature4Title'),
    feature4Desc: tTool('feature4Desc'),
    // FAQ
    faqTitle: tTool('faqTitle'),
    faq1Q: tTool('faq1Q'),
    faq1A: tTool('faq1A'),
    faq2Q: tTool('faq2Q'),
    faq2A: tTool('faq2A'),
    faq3Q: tTool('faq3Q'),
    faq3A: tTool('faq3A'),
    faq4Q: tTool('faq4Q'),
    faq4A: tTool('faq4A'),
    faq5Q: tTool('faq5Q'),
    faq5A: tTool('faq5A'),
    // SEO content
    seoContent: tTool('seoContent'),
  };
}

export const getCommonText = async () => {
  const tCommon = await getTranslations('CommonText');
  return {
    loadingText: tCommon('loadingText'),
    generateText: tCommon('generateText'),
    placeholderText: tCommon('placeholderText'),
    buttonText: tCommon('buttonText'),
    footerDescText: tCommon('footerDescText'),
    timesLeft: tCommon('timesLeft'),
    timesRight: tCommon('timesRight'),
    download: tCommon('download'),
    result: tCommon('result'),
    moreWorks: tCommon('moreWorks'),
    generateNew: tCommon('generateNew'),
    displayPublic: tCommon('displayPublic'),
    similarText: tCommon('similarText'),
    prompt: tCommon('prompt'),
    revised: tCommon('revised'),
    exploreMore: tCommon('exploreMore'),
    keyword: tCommon('keyword'),
    searchButtonText: tCommon('searchButtonText'),
  }
}

export const getAuthText = async () => {
  const tAuth = await getTranslations('AuthText');
  return {
    loginText: tAuth('loginText'),
    loginModalDesc: tAuth('loginModalDesc'),
    loginModalButtonText: tAuth('loginModalButtonText'),
    logoutModalDesc: tAuth('logoutModalDesc'),
    confirmButtonText: tAuth('confirmButtonText'),
    cancelButtonText: tAuth('cancelButtonText'),
  }
}


export const getPricingText = async () => {
  const tPricing = await getTranslations('PricingText');
  
  // Helper to safely get raw array/object
  const getRaw = (key: string) => {
    try {
      return tPricing.raw(key);
    } catch {
      return [];
    }
  };

  return {
    title: tPricing('title') + ' | ' + process.env.NEXT_PUBLIC_WEBSITE_NAME,
    description: tPricing('description'),
    h1Text: tPricing('h1Text'),
    subtitle: tPricing('subtitle'),
    buyText: tPricing('buyText'),
    popularText: tPricing('popularText'),
    currentPlanText: tPricing('currentPlanText'),
    
    // Plan Names
    free: tPricing('free'),
    creator: tPricing('creator'),
    studio: tPricing('studio'),
    
    // Billing
    creatorMonthly: tPricing('creatorMonthly'),
    creatorYearly: tPricing('creatorYearly'),
    studioMonthly: tPricing('studioMonthly'),
    studioYearly: tPricing('studioYearly'),
    monthText: tPricing('monthText'),
    monthlyText: tPricing('monthlyText'),
    annualText: tPricing('annualText'),
    annuallyText: tPricing('annuallyText'),
    annuallySaveText: tPricing('annuallySaveText'),
    
    // Features Lists (Arrays)
    freeFeatures: getRaw('freeFeatures'),
    creatorFeatures: getRaw('creatorFeatures'),
    studioFeatures: getRaw('studioFeatures'),
    
    // Matrix
    matrixTitle: tPricing('matrixTitle'),
    matrixColFree: tPricing('matrixColFree'),
    matrixColCreator: tPricing('matrixColCreator'),
    matrixColStudio: tPricing('matrixColStudio'),
    matrixLabels: getRaw('matrixLabels'),
    matrixBadgePreview: tPricing('matrixBadgePreview'),
    matrixBadgeLimited: tPricing('matrixBadgeLimited'),
    matrixBadgeNA: tPricing('matrixBadgeNA'),
    
    // Common
    allPlansIncludeTitle: tPricing('allPlansIncludeTitle'),
    allPlansInclude: getRaw('allPlansInclude'),
    
    // FAQ
    faqTitle: tPricing('faqTitle'),
    faq: getRaw('faq'),
  }
}

export const getPrivacyPolicyText = async () => {
  const tPrivacyPolicy = await getTranslations('PrivacyPolicyText');
  return {
    title: tPrivacyPolicy('title') + ' | ' + process.env.NEXT_PUBLIC_WEBSITE_NAME,
    description: tPrivacyPolicy('description'),
    h1Text: tPrivacyPolicy('h1Text'),
    detailText: tPrivacyPolicy('detailText'),
  }
}


export const getTermsOfServiceText = async () => {
  const tTermsOfService = await getTranslations('TermsOfServiceText');
  return {
    title: tTermsOfService('title') + ' | ' + process.env.NEXT_PUBLIC_WEBSITE_NAME,
    description: tTermsOfService('description'),
    h1Text: tTermsOfService('h1Text'),
    detailText: tTermsOfService('detailText'),
  }
}

export const getWorksText = async () => {
  const tWorks = await getTranslations('WorksText');
  return {
    title: tWorks('title') + ' | ' + process.env.NEXT_PUBLIC_WEBSITE_NAME,
    description: tWorks('description'),
    h1Text: tWorks('h1Text'),
    descriptionBelowH1Text: tWorks('descriptionBelowH1Text'),
    descText: tWorks('descText'),
    toContinue: tWorks('toContinue'),
  }
}

// Legacy functions for old sticker pages - kept for backward compatibility
export const getExploreText = async (countSticker: string, page: any) => {
  // Placeholder return for legacy pages
  return {
    title: 'Explore | ' + process.env.NEXT_PUBLIC_WEBSITE_NAME,
    description: 'Explore audio tools',
    h1Text: 'Explore Audio Tools',
    descriptionBelowH1Text: 'Discover our audio processing tools',
    h2Text: 'Audio Tools'
  }
}

export const getDetailText = async (workDetail: any) => {
  // Placeholder return for legacy pages
  return {
    title: 'Detail | ' + process.env.NEXT_PUBLIC_WEBSITE_NAME,
    description: 'Audio detail',
    h1Text: 'Audio Detail',
    descriptionBelowH1Text: 'Audio processing detail',
    h2Text: 'Detail'
  }
}

export const getQuestionText = async () => {
  const tQuestion = await getTranslations('QuestionText');
  return {
    detailText: tQuestion('detailText')
  }
}

export const getMenuText = async () => {
  const tMenu = await getTranslations('MenuText');
  return {
    // New menu structure
    header0: tMenu('home'),
    header1: tMenu('myAudio'),
    header4: tMenu('tools'),
    header5: tMenu('blog'),
    header6: tMenu('pricing'),
    // Footer sections
    footerLegal: tMenu('footerLegal'),
    footerLegal0: tMenu('footerLegal0'),
    footerLegal1: tMenu('footerLegal1'),
    footerSupport: tMenu('footerSupport'),
    footerSupport0: tMenu('footerSupport0'),
    footerSupport1: tMenu('footerSupport1'),
    footerTools: tMenu('footerTools'),
    footerCompany: tMenu('footerCompany'),
    footerCompany0: tMenu('footerCompany0'),
    footerCompany1: tMenu('footerCompany1'),
    footerCompany2: tMenu('footerCompany2'),
    footerCopyright: tMenu('footerCopyright'),
  }
}

// Legacy function for old search page - kept for backward compatibility
export const getSearchText = async (countSticker: any, sticker: string, countStickerAll: any) => {
  const tSearch = await getTranslations('SearchText');
  const title = tSearch('title') + ' | ' + process.env.NEXT_PUBLIC_WEBSITE_NAME;
  const description = tSearch('description');
  const h1Text = tSearch('h1Text');
  const h2Text = tSearch('h2Text');

  return {
    title: title,
    description: description,
    h1Text: h1Text,
    h2Text: h2Text,
  }
}

// Blog page text
export const getBlogText = async () => {
  const tBlog = await getTranslations('BlogText');
  return {
    title: tBlog('title'),
    description: tBlog('description'),
    h1Text: tBlog('h1Text'),
    descriptionBelowH1Text: tBlog('descriptionBelowH1Text'),
  }
}

// Blog post text
export const getBlogPostText = async (slug: string) => {
  // Convert slug to camelCase for translation namespace
  const camelCaseSlug = slug.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  const tBlogPost = await getTranslations(`BlogPosts.${camelCaseSlug}` as any);

  return {
    title: tBlogPost('title'),
    description: tBlogPost('description'),
    h1Text: tBlogPost('h1Text'),
    category: tBlogPost('category'),
    date: tBlogPost('date'),
    author: tBlogPost('author'),
    readTime: tBlogPost('readTime'),
    content: tBlogPost('content'),
    relatedPosts: [
      {
        slug: tBlogPost('related1Slug'),
        title: tBlogPost('related1Title'),
        excerpt: tBlogPost('related1Excerpt'),
        category: tBlogPost('related1Category'),
      },
      {
        slug: tBlogPost('related2Slug'),
        title: tBlogPost('related2Title'),
        excerpt: tBlogPost('related2Excerpt'),
        category: tBlogPost('related2Category'),
      }
    ]
  }
}
