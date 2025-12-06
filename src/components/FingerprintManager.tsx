/**
 * 浏览器指纹管理组件
 * 自动处理用户登录后的指纹关联
 */

'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useFingerprint } from '~/hooks/useFingerprint';

const FingerprintManager = () => {
  const { data: session, status } = useSession();
  const { fingerprint, isLoading, linkToUser } = useFingerprint();
  const hasLinked = useRef(false);

  useEffect(() => {
    // 只在用户已登录且指纹已生成时执行
    // @ts-ignore - session.user is extended with user_id in NextAuth callback
    const userId = session?.user?.user_id;

    if (
      status === 'authenticated' &&
      userId &&
      fingerprint &&
      !isLoading &&
      !hasLinked.current
    ) {
      const linkFingerprint = async () => {
        try {
          const result = await linkToUser(userId);

          if (result.success) {
            console.log('Fingerprint linked successfully:', result.message);
            hasLinked.current = true;
          } else {
            console.warn('Failed to link fingerprint:', result.message);
          }
        } catch (error) {
          console.error('Error linking fingerprint:', error);
        }
      };

      linkFingerprint();
    }
  }, [status, session, fingerprint, isLoading, linkToUser]);

  // 这个组件不渲染任何内容
  return null;
};

export default FingerprintManager;

