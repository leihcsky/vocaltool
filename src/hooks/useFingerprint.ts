/**
 * 浏览器指纹 Hook
 * 用于在客户端管理浏览器指纹
 */

import { useEffect, useState } from 'react';
import { getOrCreateFingerprint } from '~/libs/fingerprint';

export const useFingerprint = () => {
  const [fingerprint, setFingerprint] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initFingerprint = async () => {
      try {
        const fp = await getOrCreateFingerprint();
        setFingerprint(fp);
      } catch (error) {
        console.error('Failed to initialize fingerprint:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initFingerprint();
  }, []);

  /**
   * 关联指纹与用户
   * @param user_id 用户ID
   */
  const linkToUser = async (user_id: string) => {
    if (!fingerprint || !user_id) {
      console.warn('Fingerprint or user_id is missing');
      return { success: false, message: 'Missing parameters' };
    }

    try {
      const response = await fetch('/api/fingerprint/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fingerprint,
          user_id,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to link fingerprint to user:', error);
      return { success: false, message: 'Network error' };
    }
  };

  return {
    fingerprint,
    isLoading,
    linkToUser,
  };
};

