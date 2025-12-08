/**
 * 使用限制服务
 * 管理匿名用户和注册用户的每日使用限制
 */

import { getDb } from "~/libs/db";

/**
 * 检查用户使用限制
 * @param fingerprint 浏览器指纹（匿名用户）
 * @param userId 用户ID（注册用户）
 * @param toolCode 工具代码，如 'vocal_remover'
 * @returns { allowed: boolean, remaining: number, limit: number }
 */
export async function checkUsageLimit(
  fingerprint: string | null,
  userId: string | null,
  toolCode: string
): Promise<{ allowed: boolean; remaining: number; limit: number; message?: string }> {
  const db = getDb();
  
  // 确定用户标识和每日限额
  const identifier = userId || fingerprint;
  if (!identifier) {
    return {
      allowed: false,
      remaining: 0,
      limit: 0,
      message: 'No user identifier provided'
    };
  }

  // 注册用户每日限额3次，匿名用户每日限额1次
  const dailyLimit = userId ? 3 : 1;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    // 查询使用记录
    const result = await db.query(
      `SELECT * FROM anonymous_usage_limits 
       WHERE fingerprint = $1 AND tool_code = $2`,
      [identifier, toolCode]
    );

    if (result.rows.length === 0) {
      // 首次使用，创建记录
      await db.query(
        `INSERT INTO anonymous_usage_limits 
         (fingerprint, tool_code, initial_limit, used_count, reset_date) 
         VALUES ($1, $2, $3, 0, $4)`,
        [identifier, toolCode, dailyLimit, today]
      );

      return {
        allowed: true,
        remaining: dailyLimit,
        limit: dailyLimit
      };
    }

    const record = result.rows[0];
    
    // 检查是否需要重置（新的一天）
    if (record.reset_date !== today) {
      // 重置计数
      await db.query(
        `UPDATE anonymous_usage_limits 
         SET used_count = 0, 
             reset_date = $1, 
             initial_limit = $2,
             updated_at = NOW() 
         WHERE id = $3`,
        [today, dailyLimit, record.id]
      );

      return {
        allowed: true,
        remaining: dailyLimit,
        limit: dailyLimit
      };
    }

    // 检查是否超过限额
    const remaining = record.initial_limit - record.used_count;
    
    if (remaining <= 0) {
      return {
        allowed: false,
        remaining: 0,
        limit: record.initial_limit,
        message: userId 
          ? `You have reached your daily limit of ${record.initial_limit} files. Please try again tomorrow.`
          : `You have reached your daily limit of ${record.initial_limit} file. Please register for more usage.`
      };
    }

    return {
      allowed: true,
      remaining,
      limit: record.initial_limit
    };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    throw error;
  }
}

/**
 * 增加使用次数
 * @param fingerprint 浏览器指纹（匿名用户）
 * @param userId 用户ID（注册用户）
 * @param toolCode 工具代码
 * @param ipAddress 可选：IP地址
 * @param userAgent 可选：User Agent
 */
export async function incrementUsageCount(
  fingerprint: string | null,
  userId: string | null,
  toolCode: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const db = getDb();
  const identifier = userId || fingerprint;

  if (!identifier) {
    throw new Error('No user identifier provided');
  }

  try {
    await db.query(
      `UPDATE anonymous_usage_limits 
       SET used_count = used_count + 1, 
           last_used_at = NOW(), 
           updated_at = NOW(),
           ip_address = COALESCE($3, ip_address),
           user_agent = COALESCE($4, user_agent)
       WHERE fingerprint = $1 AND tool_code = $2`,
      [identifier, toolCode, ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Error incrementing usage count:', error);
    throw error;
  }
}

/**
 * 获取用户使用统计
 * @param fingerprint 浏览器指纹（匿名用户）
 * @param userId 用户ID（注册用户）
 * @param toolCode 工具代码
 */
export async function getUsageStats(
  fingerprint: string | null,
  userId: string | null,
  toolCode: string
) {
  const db = getDb();
  const identifier = userId || fingerprint;

  if (!identifier) {
    return null;
  }

  try {
    const result = await db.query(
      `SELECT * FROM anonymous_usage_limits 
       WHERE fingerprint = $1 AND tool_code = $2`,
      [identifier, toolCode]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error getting usage stats:', error);
    throw error;
  }
}

