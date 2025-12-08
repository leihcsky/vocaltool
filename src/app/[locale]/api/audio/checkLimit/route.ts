/**
 * API: 检查用户使用限制
 * POST /api/audio/checkLimit
 * 
 * Request Body:
 * {
 *   fingerprint?: string,
 *   user_id?: string,
 *   tool_code: string
 * }
 */

import { checkUsageLimit } from "~/servers/usageLimit";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { fingerprint, user_id, tool_code } = json;

    // 验证参数
    if (!tool_code) {
      return Response.json({
        success: false,
        message: 'tool_code is required'
      }, { status: 400 });
    }

    if (!fingerprint && !user_id) {
      return Response.json({
        success: false,
        message: 'Either fingerprint or user_id is required'
      }, { status: 400 });
    }

    // 检查使用限制
    const result = await checkUsageLimit(fingerprint || null, user_id || null, tool_code);

    return Response.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in checkLimit API:', error);
    return Response.json({
      success: false,
      message: 'Failed to check usage limit',
      error: error.message
    }, { status: 500 });
  }
}

