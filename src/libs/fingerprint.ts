/**
 * 浏览器指纹生成工具
 * 使用 FingerprintJS 生成唯一的浏览器指纹
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';

// 缓存指纹实例
let fpPromise: Promise<any> | null = null;

/**
 * 初始化指纹库（仅在客户端执行）
 */
const initFingerprint = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  
  return fpPromise;
};

/**
 * 生成浏览器指纹
 * @returns Promise<string> 返回唯一的指纹字符串
 */
export const generateFingerprint = async (): Promise<string> => {
  try {
    // 确保在客户端环境
    if (typeof window === 'undefined') {
      console.warn('Fingerprint can only be generated in browser environment');
      return '';
    }

    const fp = await initFingerprint();
    if (!fp) {
      return '';
    }

    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error('Failed to generate fingerprint:', error);
    return '';
  }
};

/**
 * 从 localStorage 获取缓存的指纹
 * 如果不存在，则生成新指纹并缓存
 */
export const getOrCreateFingerprint = async (): Promise<string> => {
  try {
    // 确保在客户端环境
    if (typeof window === 'undefined') {
      return '';
    }

    const STORAGE_KEY = 'wavekit_fingerprint';
    
    // 尝试从 localStorage 获取
    const cachedFingerprint = localStorage.getItem(STORAGE_KEY);
    if (cachedFingerprint) {
      return cachedFingerprint;
    }

    // 生成新指纹
    const fingerprint = await generateFingerprint();
    if (fingerprint) {
      // 缓存到 localStorage
      localStorage.setItem(STORAGE_KEY, fingerprint);
    }

    return fingerprint;
  } catch (error) {
    console.error('Failed to get or create fingerprint:', error);
    return '';
  }
};

/**
 * 清除缓存的指纹（用于测试或用户登出）
 */
export const clearFingerprint = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('wavekit_fingerprint');
  }
};

/**
 * 检查是否已有指纹缓存
 */
export const hasFingerprint = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return !!localStorage.getItem('wavekit_fingerprint');
};

