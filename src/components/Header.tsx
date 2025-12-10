'use client'
import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { GlobeAltIcon } from '@heroicons/react/24/outline'
import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import Link from "next/link";
import { languages } from "~/i18n/config";
import { useCommonContext } from '~/context/common-context'
import LoadingModal from "./LoadingModal";
import GeneratingModal from "~/components/GeneratingModal";
import LoginButton from './LoginButton';
import LoginModal from './LoginModal';
import LogoutModal from "./LogoutModal";
import { getLinkHref } from "~/configs/buildLink";

export default function Header({
  locale,
  page
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const {
    setShowLoadingModal,
    userData,
    commonText,
    authText,
    menuText,
    toolsListText
  } = useCommonContext();

  // Tools list for dropdown
  const toolsList = [
    { name: toolsListText.vocalRemover, slug: 'vocal-remover', emoji: '🎤' },
    { name: toolsListText.audioSplitter, slug: 'audio-splitter', emoji: '🎚️' },
    { name: toolsListText.karaokeMaker, slug: 'karaoke-maker', emoji: '🎵' },
    { name: toolsListText.extractVocals, slug: 'extract-vocals', emoji: '🎙️' },
    { name: toolsListText.acapellaMaker, slug: 'acapella-maker', emoji: '🎶' },
    { name: toolsListText.noiseReducer, slug: 'noise-reducer', emoji: '🔇' },
  ];

  const [pageResult] = useState(getLinkHref(locale, page))

  const checkLocalAndLoading = (lang) => {
    setMobileMenuOpen(false);
    if (locale != lang) {
      setShowLoadingModal(true);
    }
  }

  const checkPageAndLoading = (toPage) => {
    setMobileMenuOpen(false);
    if (page != toPage) {
      setShowLoadingModal(true);
    }
  }

  return (
    <header className="sticky top-0 z-20 w-full background-header">
      <LoadingModal loadingText={commonText.loadingText} />
      <GeneratingModal generatingText={commonText.generateText} />
      <LoginModal
        loadingText={commonText.loadingText}
        redirectPath={pageResult}
        loginModalDesc={authText.loginModalDesc}
        loginModalButtonText={authText.loginModalButtonText}
      />
      <LogoutModal
        logoutModalDesc={authText.logoutModalDesc}
        confirmButtonText={authText.confirmButtonText}
        cancelButtonText={authText.cancelButtonText}
        redirectPath={pageResult}
      />
      <nav className="mx-auto max-w-7xl flex items-center justify-between p-4 lg:px-8" aria-label="Global">
        {/* Logo */}
        <div className="flex items-center">
          <Link
            href={getLinkHref(locale, '')}
            className="flex items-center"
            onClick={() => checkLocalAndLoading(locale)}>
            {/* Desktop: Full horizontal logo */}
            <img
              className="h-12 w-auto hidden sm:block"
              src="/logo-final.svg"
              alt={process.env.NEXT_PUBLIC_BRAND_NAME}
            />
            {/* Mobile: Icon only */}
            <img
              className="h-10 w-auto sm:hidden"
              src="/logo-icon.svg"
              alt={process.env.NEXT_PUBLIC_BRAND_NAME}
            />
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-neutral-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-x-8">
          <Link
            href={getLinkHref(locale, '')}
            onClick={() => checkPageAndLoading('')}
            className={`text-sm font-semibold leading-6 transition-colors ${
              page === ''
                ? 'text-brand-600'
                : 'text-neutral-700 hover:text-brand-600'
            }`}>
            {menuText.header0}
          </Link>

          {/* Tools Dropdown */}
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button
                className={`inline-flex items-center gap-x-1 text-sm font-semibold leading-6 transition-colors ${
                  page === 'tools' || page?.startsWith('tools/')
                    ? 'text-brand-600'
                    : 'text-neutral-700 hover:text-brand-600'
                }`}>
                {menuText.header4}
                <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items
                className="absolute left-0 z-30 mt-2 w-64 origin-top-left rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  {/* Individual Tools */}
                  {toolsList.map((tool) => (
                    <Menu.Item key={tool.slug}>
                      {({ active }) => (
                        <Link
                          href={getLinkHref(locale, `tools/${tool.slug}`)}
                          onClick={() => checkPageAndLoading(`tools/${tool.slug}`)}
                          className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                            active
                              ? 'bg-brand-50 text-brand-700'
                              : 'text-neutral-700'
                          }`}
                        >
                          <span className="text-lg">{tool.emoji}</span>
                          <span className="font-medium">{tool.name}</span>
                        </Link>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          <Link
            href={getLinkHref(locale, 'blog')}
            onClick={() => checkPageAndLoading('blog')}
            className={`text-sm font-semibold leading-6 transition-colors ${
              page === 'blog' || page?.startsWith('blog/')
                ? 'text-brand-600'
                : 'text-neutral-700 hover:text-brand-600'
            }`}>
            {menuText.header5}
          </Link>
          <Link
            href={getLinkHref(locale, 'pricing')}
            onClick={() => checkPageAndLoading('pricing')}
            className={`text-sm font-semibold leading-6 transition-colors ${
              page === 'pricing'
                ? 'text-brand-600'
                : 'text-neutral-700 hover:text-brand-600'
            }`}>
            {menuText.header6}
          </Link>
          {
            userData.email ?
              <Link
                href={getLinkHref(locale, 'my')}
                onClick={() => checkPageAndLoading('my')}
                className={`text-sm font-semibold leading-6 transition-colors ${
                  page === 'my'
                    ? 'text-brand-600'
                    : 'text-neutral-700 hover:text-brand-600'
                }`}>
                {menuText.header1}
              </Link>
              :
              null
          }
        </div>

        {/* Right side: Language + Login */}
        <div className="hidden lg:flex lg:items-center lg:gap-x-3">
          {/* Language Selector */}
          <Menu as="div" className="relative inline-block text-left z-30">
            <div>
              <Menu.Button
                className="inline-flex items-center justify-center gap-x-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                <GlobeAltIcon className="w-5 h-5 text-neutral-600" />
                {locale == 'default' ? 'EN' : locale.toUpperCase()}
                <ChevronDownIcon className="-mr-1 h-5 w-5 text-neutral-600" aria-hidden="true" />
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items
                className="absolute right-0 z-30 mt-2 w-32 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  {
                    languages.map((item) => {
                      let hrefValue = `/${item.lang}`;
                      if (page) {
                        hrefValue = `/${item.lang}/${page}`;
                      }
                      return (
                        <Menu.Item key={item.lang}>
                          <Link href={hrefValue} onClick={() => checkLocalAndLoading(item.lang)}>
                            <span
                              className={`block px-4 py-2 text-sm transition-colors ${
                                locale === item.lang
                                  ? 'bg-brand-50 text-brand-700 font-semibold'
                                  : 'text-neutral-700 hover:bg-neutral-50 hover:text-brand-600'
                              }`}
                            >
                              {item.language}
                            </span>
                          </Link>
                        </Menu.Item>
                      )
                    })
                  }
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Login Button */}
          {
            process.env.NEXT_PUBLIC_CHECK_GOOGLE_LOGIN != '0' ?
              <div className="relative inline-block text-left">
                <LoginButton buttonType={userData.email ? 1 : 0} loginText={authText.loginText} />
              </div>
              :
              null
          }
        </div>
      </nav>

      {/* Mobile menu */}
      <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm" />
        <Dialog.Panel
          className="fixed inset-y-0 right-0 z-30 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-neutral-900/10">
          <div className="flex items-center justify-between">
            <Link
              href={getLinkHref(locale, '')}
              className="flex items-center"
              onClick={() => checkLocalAndLoading(locale)}>
              <img
                className="h-12 w-auto"
                src="/logo-final.svg"
                alt={process.env.NEXT_PUBLIC_BRAND_NAME}
              />
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-neutral-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="divide-y divide-neutral-200">
              <div className="space-y-2 py-6">
                <Link
                  href={getLinkHref(locale, '')}
                  onClick={() => checkPageAndLoading('')}
                  className={`block rounded-lg px-3 py-2 text-base font-semibold leading-7 transition-colors ${
                    page === ''
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-neutral-900 hover:bg-neutral-50'
                  }`}>
                  {menuText.header0}
                </Link>

                {/* Tools Section */}
                <div>
                  <Link
                    href={getLinkHref(locale, 'tools')}
                    onClick={() => checkPageAndLoading('tools')}
                    className={`block rounded-lg px-3 py-2 text-base font-semibold leading-7 transition-colors ${
                      page === 'tools' || page?.startsWith('tools/')
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-neutral-900 hover:bg-neutral-50'
                    }`}>
                    {menuText.header4}
                  </Link>
                  {/* Tools submenu */}
                  <div className="ml-4 mt-1 space-y-1">
                    {toolsList.map((tool) => (
                      <Link
                        key={tool.slug}
                        href={getLinkHref(locale, `tools/${tool.slug}`)}
                        onClick={() => checkPageAndLoading(`tools/${tool.slug}`)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                          page === `tools/${tool.slug}`
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-brand-600'
                        }`}
                      >
                        <span className="text-base">{tool.emoji}</span>
                        <span>{tool.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <Link
                  href={getLinkHref(locale, 'blog')}
                  onClick={() => checkPageAndLoading('blog')}
                  className={`block rounded-lg px-3 py-2 text-base font-semibold leading-7 transition-colors ${
                    page === 'blog' || page?.startsWith('blog/')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-neutral-900 hover:bg-neutral-50'
                  }`}>
                  {menuText.header5}
                </Link>
                <Link
                  href={getLinkHref(locale, 'pricing')}
                  onClick={() => checkPageAndLoading('pricing')}
                  className={`block rounded-lg px-3 py-2 text-base font-semibold leading-7 transition-colors ${
                    page === 'pricing'
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-neutral-900 hover:bg-neutral-50'
                  }`}>
                  {menuText.header6}
                </Link>
                {
                  userData.email ?
                    <Link
                      href={getLinkHref(locale, 'my')}
                      onClick={() => checkPageAndLoading('my')}
                      className={`block rounded-lg px-3 py-2 text-base font-semibold leading-7 transition-colors ${
                        page === 'my'
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-neutral-900 hover:bg-neutral-50'
                      }`}>
                      {menuText.header1}
                    </Link>
                    :
                    null
                }
              </div>
              <div className="py-6">
                <div className="mb-4">
                  <p className="text-sm font-medium text-neutral-500 mb-2">Language</p>
                  <Menu as="div" className="relative inline-block text-left w-full">
                    <div>
                      <Menu.Button
                        className="inline-flex w-full items-center justify-between gap-x-1.5 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <GlobeAltIcon className="w-5 h-5 text-neutral-600" />
                          {locale == 'default' ? 'EN' : locale.toUpperCase()}
                        </div>
                        <ChevronDownIcon className="h-5 w-5 text-neutral-600" aria-hidden="true" />
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items
                        className="absolute left-0 right-0 z-10 mt-2 origin-top rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                          {
                            languages.map((item) => {
                              let hrefValue = `/${item.lang}`;
                              if (page) {
                                hrefValue = `/${item.lang}/${page}`;
                              }
                              return (
                                <Menu.Item key={item.lang}>
                                  <Link href={hrefValue} onClick={() => checkLocalAndLoading(item.lang)}>
                                    <span
                                      className={`block px-4 py-2 text-sm transition-colors ${
                                        locale === item.lang
                                          ? 'bg-brand-50 text-brand-700 font-semibold'
                                          : 'text-neutral-700 hover:bg-neutral-50 hover:text-brand-600'
                                      }`}
                                    >
                                      {item.language}
                                    </span>
                                  </Link>
                                </Menu.Item>
                              )
                            })
                          }
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
                {
                  process.env.NEXT_PUBLIC_CHECK_GOOGLE_LOGIN != '0' ?
                    <div className="w-full">
                      <LoginButton buttonType={userData.email ? 1 : 0} loginText={authText.loginText} />
                    </div>
                    :
                    null
                }
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  )
}
