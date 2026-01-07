import {getStripe} from '~/libs/stripeClient';
import React, {useMemo, useState} from 'react';
import {useCommonContext} from "~/context/common-context";
import LoadingDots from "./LoadingDots";
import {priceList} from "~/configs/stripeConfig";
import { CheckIcon } from '@heroicons/react/24/outline';

export default function Pricing({
                                  redirectUrl,
                                  isPricing = false
                                }) {
  const [priceIdLoading, setPriceIdLoading] = useState<string>();
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year');
  
  const {
    setShowLoginModal,
    userData,
    pricingText
  } = useCommonContext();

  const creatorMonthlyPriceObj = useMemo(() => priceList?.find(p => p.interval === 'month'), []);
  const creatorYearlyPriceObj = useMemo(() => priceList?.find(p => p.interval === 'year'), []);
  const creatorMonthlyDisplay = useMemo(() => {
    const amt = (creatorMonthlyPriceObj?.unit_amount || 0) / 100;
    return amt ? `$${amt}` : `$9`;
  }, [creatorMonthlyPriceObj]);
  const creatorYearlyDisplay = useMemo(() => {
    const amt = (creatorYearlyPriceObj?.unit_amount || 0) / 100;
    return amt ? `$${amt}` : `$79`;
  }, [creatorYearlyPriceObj]);
  const creatorYearlyMonthlyEquivalent = useMemo(() => {
    const yearly = (creatorYearlyPriceObj?.unit_amount || 0) / 100;
    const perMonth = yearly ? (yearly / 12).toFixed(2) : '6.58';
    return `$${perMonth}/${pricingText.monthText} ${pricingText.annuallyText}`;
  }, [creatorYearlyPriceObj, pricingText]);

  const handleCheckout = async (price) => {
    setPriceIdLoading(price.id);
    if (!userData || !userData.user_id) {
      setShowLoginModal(true);
      return
    }
    const user_id = userData.user_id;
    try {
      const data = {
        price,
        redirectUrl,
        user_id
      }
      const url = `/api/stripe/create-checkout-session`;
      const response = await fetch(url, {
        method: 'POST',
        headers: new Headers({'Content-Type': 'application/json'}),
        credentials: 'same-origin',
        body: JSON.stringify(data)
      });
      const res = await response.json();
      const sessionId = res.sessionId;
      const stripe = await getStripe();
      stripe?.redirectToCheckout({sessionId});
    } catch (error) {
      return alert((error as Error)?.message);
    } finally {
      setPriceIdLoading(undefined);
    }
  }

  // Helper to find price ID from priceList based on interval
  // Note: This is a provisional mapping since we don't have distinct IDs for Creator/Studio in the current config
  const getPriceId = (interval: 'month' | 'year') => {
    return priceList?.find(p => p.interval === interval);
  };

  const renderFeatureList = (features: string[]) => {
    if (!Array.isArray(features)) return null;
    return (
      <ul className="space-y-4 flex-grow mt-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckIcon className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-neutral-700">{feature}</span>
          </li>
        ))}
      </ul>
    );
  };
  const MatrixRow = ({ label, free, creator, studio }) => {
    const Cell = ({ value }) => {
      if (value === true) {
        return <div className="flex items-center justify-center"><CheckIcon className="w-5 h-5 text-brand-600" /></div>;
      }
      if (value === 'preview') {
        return <span className="text-xs bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full">{pricingText.matrixBadgePreview}</span>;
      }
      if (value === 'limited') {
        return <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">{pricingText.matrixBadgeLimited}</span>;
      }
      return <span className="text-xs text-neutral-400">—</span>;
    };
    return (
      <div className="grid grid-cols-4 gap-4 py-4 px-4 border-b border-neutral-200 last:border-b-0 hover:bg-neutral-50 transition-colors">
        <div className="text-sm text-neutral-900 flex items-center">{label}</div>
        <div className="flex items-center justify-center"><Cell value={free} /></div>
        <div className="flex items-center justify-center"><Cell value={creator} /></div>
        <div className="flex items-center justify-center"><Cell value={studio} /></div>
      </div>
    );
  };

  return (
    <section className="bg-white py-12 md:py-20">
      <div className="mx-auto w-full max-w-7xl px-5 md:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
            {pricingText.h1Text}
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            {pricingText.subtitle}
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-neutral-100 p-1 rounded-full inline-flex relative">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                billingInterval === 'month'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {pricingText.monthlyText}
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                billingInterval === 'year'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {pricingText.annuallyText}
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {pricingText.annuallySaveText}
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-8 max-w-7xl mx-auto">
          
          {/* Free Plan */}
          <div className="flex flex-col rounded-2xl border-2 border-neutral-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                {pricingText.free}
              </h3>
              <div className="flex items-baseline mb-4">
                <span className="text-5xl font-bold text-neutral-900">$0</span>
                <span className="text-neutral-600 ml-2">/{billingInterval === 'month' ? pricingText.monthText : pricingText.annualText}</span>
              </div>
              <p className="text-sm text-neutral-600 min-h-[40px]">{pricingText.subtitle}</p>
            </div>

            <button
              className="w-full py-3 px-6 rounded-full bg-neutral-100 text-neutral-900 font-semibold hover:bg-neutral-200 transition-colors mt-8"
              disabled
            >
              {pricingText.currentPlanText}
            </button>

            {renderFeatureList(pricingText.freeFeatures)}
          </div>

          {/* Creator Plan */}
          <div className="flex flex-col rounded-2xl border-2 border-brand-600 bg-gradient-to-br from-brand-50 to-white p-8 shadow-lg hover:shadow-xl transition-shadow relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-accent-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-md">
                {pricingText.popularText}
              </span>
            </div>
            
            <div className="mt-2">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                {pricingText.creator}
              </h3>
              <div className="flex items-baseline mb-2">
                <span className="text-5xl font-bold text-neutral-900">
                  {billingInterval === 'month' ? creatorMonthlyDisplay : creatorYearlyDisplay}
                </span>
                <span className="text-neutral-600 ml-2">/{billingInterval === 'month' ? pricingText.monthText : pricingText.annualText}</span>
              </div>
              <p className="text-sm text-neutral-600 min-h-[40px]">
                {billingInterval === 'year' 
                  ? creatorYearlyMonthlyEquivalent 
                  : pricingText.monthlyText}
              </p>
            </div>

            <button
              className="w-full py-3 px-6 rounded-full bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors mt-8 flex items-center justify-center shadow-md"
              onClick={() => {
                const price = getPriceId(billingInterval);
                if (price) handleCheckout(price);
              }}
              disabled={!!priceIdLoading}
            >
              {pricingText.buyText}
              {priceIdLoading && priceIdLoading === getPriceId(billingInterval)?.id && (
                <i className="flex pl-2 m-0">
                  <LoadingDots/>
                </i>
              )}
            </button>

            {renderFeatureList(pricingText.creatorFeatures)}
          </div>

          {/* Studio Plan */}
          <div className="flex flex-col rounded-2xl border-2 border-neutral-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                {pricingText.studio}
              </h3>
              <div className="flex items-baseline mb-2">
                <span className="text-5xl font-bold text-neutral-900">
                  {billingInterval === 'month' ? '$19' : '$144'}
                </span>
                <span className="text-neutral-600 ml-2">/{billingInterval === 'month' ? pricingText.monthText : pricingText.annualText}</span>
              </div>
              <p className="text-sm text-neutral-600 min-h-[40px]">
                {billingInterval === 'year' 
                  ? `$12/${pricingText.monthText} ${pricingText.annuallyText}` 
                  : pricingText.monthlyText}
              </p>
            </div>

            <button
              className="w-full py-3 px-6 rounded-full bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition-colors mt-8 flex items-center justify-center"
              onClick={() => alert("Coming soon!")}
            >
              {pricingText.buyText}
            </button>

            {renderFeatureList(pricingText.studioFeatures)}
          </div>

        </div>
        <div className="mt-16 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">{pricingText.matrixTitle}</h2>
          <div className="grid grid-cols-4 gap-4 p-4 rounded-t-xl border border-neutral-200 bg-neutral-50">
            <div className="text-sm font-semibold text-neutral-700"></div>
            <div className="text-sm font-semibold text-neutral-700 text-center">{pricingText.matrixColFree}</div>
            <div className="text-sm font-semibold text-neutral-700 text-center">{pricingText.matrixColCreator}</div>
            <div className="text-sm font-semibold text-neutral-700 text-center">{pricingText.matrixColStudio}</div>
          </div>
          <div className="rounded-b-xl border-x border-b border-neutral-200">
            <MatrixRow
              label={pricingText.matrixLabels?.[0]}
              free={true}
              creator={true}
              studio={true}
            />
            <MatrixRow
              label={pricingText.matrixLabels?.[1]}
              free={'limited'}
              creator={true}
              studio={true}
            />
            <MatrixRow
              label={pricingText.matrixLabels?.[2]}
              free={'preview'}
              creator={true}
              studio={true}
            />
            <MatrixRow
              label={pricingText.matrixLabels?.[3]}
              free={false}
              creator={false}
              studio={true}
            />
            <MatrixRow
              label={pricingText.matrixLabels?.[4]}
              free={false}
              creator={'limited'}
              studio={true}
            />
            <MatrixRow
              label={pricingText.matrixLabels?.[5]}
              free={false}
              creator={false}
              studio={true}
            />
            <MatrixRow
              label={pricingText.matrixLabels?.[6]}
              free={false}
              creator={true}
              studio={true}
            />
            <MatrixRow
              label={pricingText.matrixLabels?.[7]}
              free={false}
              creator={true}
              studio={true}
            />
          </div>
        </div>
        <div className="mt-16 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">{pricingText.allPlansIncludeTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pricingText.allPlansInclude?.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckIcon className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-neutral-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        {pricingText.faq && pricingText.faq.length > 0 && (
          <div className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-neutral-900 mb-10 text-center">{pricingText.faqTitle}</h2>
            <div className="grid gap-6">
              {pricingText.faq.map((item, idx) => (
                <div key={idx} className="bg-neutral-50 rounded-xl p-6 border border-neutral-100">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">{item.q}</h3>
                  <p className="text-neutral-600 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
