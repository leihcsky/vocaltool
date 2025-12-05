'use client'
import React, {useState} from 'react'
import {useRouter} from 'next/navigation'
import {whiteLoadingSvg} from './svg';
import {useCommonContext} from '~/context/common-context';
import {useSession} from "next-auth/react";

const LoginButton = ({
                       buttonType = 0,
                       loginText = 'Log in'
                     }) => {

  const router = useRouter();
  const {data: session, status} = useSession();

  const {
    userData,
    setUserData,
    setShowLoginModal,
    setShowLogoutModal
  } = useCommonContext()
  const [loading, setLoading] = useState(false)

  async function login(event) {
    event.preventDefault();
    setLoading(true)
    let _userData;
    if (userData == null || Object.keys(userData).length == 0) {
      if (status == 'authenticated') {
        setUserData(session?.user)
        _userData = session?.user
      }
    } else {
      _userData = userData
    }

    if (_userData != null && Object.keys(_userData).length != 0) {
      router.refresh();
    } else {
      setShowLoginModal(true)
      setLoading(false)
    }
  }

  async function logout() {
    setShowLogoutModal(true);
  }

  return (
    <>
      {
        buttonType == 0 && (
          <>
            {
              loading ? (
                  <button
                    className="inline-flex w-full items-center justify-center gap-x-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                    disabled
                  >
                    <span>Login</span>
                    {whiteLoadingSvg}
                  </button>
                ) :
                (
                  <button
                    className="inline-flex w-full items-center justify-center gap-x-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors shadow-sm"
                    onClick={login}
                  >
                    {loginText}
                  </button>
                )
            }
          </>
        )
      }
      {
        buttonType == 1 && (
          <>
            {
              <button
                className="inline-flex items-center justify-center rounded-full ring-2 ring-brand-500 hover:ring-brand-600 transition-all"
                onClick={logout}
                title={userData.email}
              >
                <img className="h-8 w-8 rounded-full" src={userData.image} alt={userData.name || userData.email}/>
              </button>
            }
          </>
        )
      }
    </>
  )
}

export default LoginButton
