import Link from "next/link";
import {getLinkHref} from "~/configs/buildLink";
import {useCommonContext} from "~/context/common-context";
import {GoogleAnalytics} from "@next/third-parties/google";

export default function Footer({
                                 locale,
                                 page,
                               }) {
  const {
    userData,
    setShowLoadingModal,
    commonText,
    menuText,
  } = useCommonContext();

  const manageSubscribe = async () => {
    if (!userData?.user_id) {
      return
    }
    const user_id = userData?.user_id;
    const requestData = {
      user_id: user_id
    }
    setShowLoadingModal(true);
    const responseData = await fetch(`/api/stripe/create-portal-link`, {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    const result = await responseData.json();
    setShowLoadingModal(false);
    if (result.url) {
      window.location.href = result.url;
    }
  }

  const checkPageAndLoading = (toPage) => {
    if (page != toPage) {
      setShowLoadingModal(true);
    }
  }

  return (
    <footer aria-labelledby="footer-heading" className="bg-neutral-900">
      <div id="footer-heading" className="sr-only">
        Footer
      </div>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link
              href={getLinkHref(locale, '')}
              className="inline-block mb-4"
            >
              <img
                className="h-10 w-auto"
                src="/logo-final.svg"
                alt={process.env.NEXT_PUBLIC_DOMAIN_NAME}
              />
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {commonText.footerDescText}
            </p>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="text-sm font-semibold leading-6 text-white mb-4">
              {menuText.footerCompany}
            </h3>
            <ul role="list" className="space-y-3">
              <li>
                <Link
                  href={getLinkHref(locale, 'about')}
                  className="text-sm leading-6 text-neutral-400 hover:text-white transition-colors"
                  onClick={()=>checkPageAndLoading('about')}
                >
                  {menuText.footerCompany0}
                </Link>
              </li>
              <li>
                <Link
                  href={getLinkHref(locale, 'contact')}
                  className="text-sm leading-6 text-neutral-400 hover:text-white transition-colors"
                  onClick={()=>checkPageAndLoading('contact')}
                >
                  {menuText.footerCompany2}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          {process.env.NEXT_PUBLIC_CHECK_AVAILABLE_TIME != '0' && (
            <div>
              <h3 className="text-sm font-semibold leading-6 text-white mb-4">
                {menuText.footerSupport}
              </h3>
              <ul role="list" className="space-y-3">
                <li>
                  <Link
                    href={getLinkHref(locale, 'pricing')}
                    className="text-sm leading-6 text-neutral-400 hover:text-white transition-colors"
                    onClick={()=>checkPageAndLoading('pricing')}
                  >
                    {menuText.footerSupport0}
                  </Link>
                </li>
                {userData && (
                  <li>
                    <a
                      onClick={() => manageSubscribe()}
                      className="cursor-pointer text-sm leading-6 text-neutral-400 hover:text-white transition-colors">
                      {menuText.footerSupport1}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Legal Section */}
          <div>
            <h3 className="text-sm font-semibold leading-6 text-white mb-4">
              {menuText.footerLegal}
            </h3>
            <ul role="list" className="space-y-3">
              <li>
                <Link
                  href={getLinkHref(locale, 'privacy-policy')}
                  className="text-sm leading-6 text-neutral-400 hover:text-white transition-colors"
                  onClick={()=>checkPageAndLoading('privacy-policy')}
                >
                  {menuText.footerLegal0}
                </Link>
              </li>
              <li>
                <Link
                  href={getLinkHref(locale, 'terms-of-service')}
                  className="text-sm leading-6 text-neutral-400 hover:text-white transition-colors"
                  onClick={()=>checkPageAndLoading('terms-of-service')}
                >
                  {menuText.footerLegal1}
                </Link>
              </li>
              <li>
                <Link
                  href={getLinkHref(locale, 'disclaimer')}
                  className="text-sm leading-6 text-neutral-400 hover:text-white transition-colors"
                  onClick={()=>checkPageAndLoading('disclaimer')}
                >
                  {menuText.footerLegal2}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border-t border-neutral-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-neutral-400">
              © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_WEBSITE_NAME || 'WaveKit'}. {menuText.footerCopyright || 'All rights reserved.'}
            </p>
            
          </div>
        </div>
      </div>
      <>
        {
          process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ?
            <>
              <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_TAG_ID}/>
            </>
            :
            null
        }
      </>
    </footer>
  )
}
