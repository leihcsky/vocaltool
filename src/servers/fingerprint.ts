/**
 * 浏览器指纹与用户关联的服务端逻辑
 */

import { getDb } from "~/libs/db";

/**
 * 创建指纹与用户的关联记录
 * @param fingerprint 浏览器指纹
 * @param user_id 用户ID
 */
export const linkFingerprintToUser = async (fingerprint: string, user_id: string) => {
  if (!fingerprint || !user_id) {
    throw new Error('Fingerprint and user_id are required');
  }

  const db = getDb();

  try {
    // 检查该指纹是否已经关联了其他用户
    const existingLink = await db.query(
      'SELECT * FROM fingerprint_user_links WHERE fingerprint = $1',
      [fingerprint]
    );

    if (existingLink.rows.length > 0) {
      const existing = existingLink.rows[0];
      
      // 如果已经关联到同一个用户，直接返回
      if (existing.user_id === user_id) {
        return {
          success: true,
          message: 'Fingerprint already linked to this user',
          data: existing
        };
      }

      // 如果关联到不同用户，更新为新用户（可根据业务需求调整）
      await db.query(
        'UPDATE fingerprint_user_links SET user_id = $1, updated_at = NOW() WHERE fingerprint = $2',
        [user_id, fingerprint]
      );

      return {
        success: true,
        message: 'Fingerprint link updated',
        data: { fingerprint, user_id }
      };
    }

    // 创建新的关联记录
    const result = await db.query(
      'INSERT INTO fingerprint_user_links (fingerprint, user_id) VALUES ($1, $2) RETURNING *',
      [fingerprint, user_id]
    );

    return {
      success: true,
      message: 'Fingerprint linked successfully',
      data: result.rows[0]
    };
  } catch (error) {
    console.error('Error linking fingerprint to user:', error);
    throw error;
  }
};

/**
 * 通过指纹查找关联的用户ID
 * @param fingerprint 浏览器指纹
 */
export const getUserIdByFingerprint = async (fingerprint: string) => {
  if (!fingerprint) {
    return null;
  }

  const db = getDb();

  try {
    const result = await db.query(
      'SELECT user_id FROM fingerprint_user_links WHERE fingerprint = $1',
      [fingerprint]
    );

    if (result.rows.length > 0) {
      return result.rows[0].user_id;
    }

    return null;
  } catch (error) {
    console.error('Error getting user by fingerprint:', error);
    return null;
  }
};

/**
 * 通过用户ID查找关联的指纹
 * @param user_id 用户ID
 */
export const getFingerprintByUserId = async (user_id: string) => {
  if (!user_id) {
    return null;
  }

  const db = getDb();

  try {
    const result = await db.query(
      'SELECT fingerprint FROM fingerprint_user_links WHERE user_id = $1',
      [user_id]
    );

    if (result.rows.length > 0) {
      return result.rows[0].fingerprint;
    }

    return null;
  } catch (error) {
    console.error('Error getting fingerprint by user:', error);
    return null;
  }
};

/**
 * 删除指纹与用户的关联（用于测试或特殊情况）
 * @param fingerprint 浏览器指纹
 */
export const unlinkFingerprint = async (fingerprint: string) => {
  if (!fingerprint) {
    throw new Error('Fingerprint is required');
  }

  const db = getDb();

  try {
    await db.query(
      'DELETE FROM fingerprint_user_links WHERE fingerprint = $1',
      [fingerprint]
    );

    return {
      success: true,
      message: 'Fingerprint unlinked successfully'
    };
  } catch (error) {
    console.error('Error unlinking fingerprint:', error);
    throw error;
  }
};

