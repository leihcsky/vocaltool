import {getStripe} from '~/libs/stripeClient';
import React, {useState} from 'react';
import {useCommonContext} from "~/context/common-context";
import LoadingDots from "./LoadingDots";
import {priceList} from "~/configs/stripeConfig";
import { CheckIcon } from '@heroicons/react/24/outline';

export default function Pricing({
                                  redirectUrl,
                                  isPricing = false
                                }) {
  const [priceIdLoading, setPriceIdLoading] = useState<string>();
  const {
    setShowLoginModal,
    userData,
    pricingText
  } = useCommonContext();

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

  if (!priceList?.length)
    return (
      <div className="flex flex-col items-center py-12">
        <div className="max-w-screen-lg text-center">
          <p className="text-neutral-600">Pricing information is currently unavailable.</p>
        </div>
      </div>
    );

  // Free tier features
  const freeFeatures = [
    pricingText.freeIntro0,
    pricingText.freeIntro1,
    pricingText.freeIntro2,
    pricingText.freeIntro3,
    pricingText.freeIntro4,
  ];

  // Pro tier features
  const proFeatures = [
    pricingText.proIntro0,
    pricingText.proIntro1,
    pricingText.proIntro2,
    pricingText.proIntro3,
    pricingText.proIntro4,
    pricingText.proIntro5,
    pricingText.proIntro6,
    pricingText.proIntro7,
  ];

  return (
    <section className="bg-white py-12 md:py-20">
      <div className="mx-auto w-full max-w-7xl px-5 md:px-6">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
            {pricingText.h1Text}
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            {pricingText.subtitle}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-3 md:gap-6 lg:gap-8 max-w-6xl mx-auto">

          {/* Free Plan */}
          <div className="flex flex-col rounded-2xl border-2 border-neutral-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                {pricingText.free}
              </h3>
              <div className="flex items-baseline mb-4">
                <span className="text-5xl font-bold text-neutral-900">$0</span>
              </div>
              <p className="text-sm text-neutral-600">{pricingText.subtitle}</p>
            </div>

            <button
              className="w-full py-3 px-6 rounded-full bg-neutral-100 text-neutral-900 font-semibold hover:bg-neutral-200 transition-colors mb-8"
              disabled
            >
              {pricingText.currentPlanText}
            </button>

            <ul className="space-y-4 flex-grow">
              {freeFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-neutral-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Plans */}
          {priceList?.map((price, index) => {
            if (!price) return null;

            const priceString = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: price.currency!,
              minimumFractionDigits: 2
            }).format((price?.unit_amount || 0) / 100);

            const isYearly = price.interval === 'year' || index === 0;
            const monthlyPrice = isYearly
              ? ((price?.unit_amount || 0) / 100 / 12).toFixed(2)
              : ((price?.unit_amount || 0) / 100).toFixed(2);

            if (!isYearly) {
              // Pro Monthly Plan
              return (
                <div key={price.id} className="flex flex-col rounded-2xl border-2 border-neutral-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      {pricingText.proMonthly}
                    </h3>
                    <div className="flex items-baseline mb-2">
                      <span className="text-5xl font-bold text-neutral-900">${monthlyPrice}</span>
                      <span className="text-neutral-600 ml-2">/{pricingText.monthText}</span>
                    </div>
                    <p className="text-sm text-neutral-600">{pricingText.monthlyText}</p>
                  </div>

                  <button
                    className="w-full py-3 px-6 rounded-full bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors mb-8 flex items-center justify-center"
                    onClick={() => handleCheckout(price)}
                    disabled={!!priceIdLoading}
                  >
                    {pricingText.buyText}
                    {priceIdLoading && priceIdLoading === price.id && (
                      <i className="flex pl-2 m-0">
                        <LoadingDots/>
                      </i>
                    )}
                  </button>

                  <ul className="space-y-4 flex-grow">
                    {proFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckIcon className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-neutral-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            } else {
              // Pro Yearly Plan (Most Popular)
              return (
                <div key={price.id} className="flex flex-col rounded-2xl border-2 border-brand-600 bg-gradient-to-br from-brand-50 to-white p-8 shadow-lg hover:shadow-xl transition-shadow relative">
                  {/* Popular Badge */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-accent-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-md">
                      {pricingText.popularText}
                    </span>
                  </div>

                  <div className="mb-6 mt-2">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      {pricingText.proYearly}
                    </h3>
                    <div className="flex items-baseline mb-2">
                      <span className="text-5xl font-bold text-neutral-900">${monthlyPrice}</span>
                      <span className="text-neutral-600 ml-2">/{pricingText.monthText}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm text-neutral-600">{priceString} {pricingText.annuallyText}</p>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                        {pricingText.annuallySaveText}
                      </span>
                    </div>
                  </div>

                  <button
                    className="w-full py-3 px-6 rounded-full bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors mb-8 flex items-center justify-center shadow-md"
                    onClick={() => handleCheckout(price)}
                    disabled={!!priceIdLoading}
                  >
                    {pricingText.buyText}
                    {priceIdLoading && priceIdLoading === price.id && (
                      <i className="flex pl-2 m-0">
                        <LoadingDots/>
                      </i>
                    )}
                  </button>

                  <ul className="space-y-4 flex-grow">
                    {proFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckIcon className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-neutral-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }
          })}
        </div>
      </div>
    </section>
  );
}
