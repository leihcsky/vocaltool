/**
 * API: 通过指纹查找关联的用户
 * POST /api/fingerprint/getUserByFingerprint
 * 
 * Request Body:
 * {
 *   fingerprint: string
 * }
 */

import { getUserIdByFingerprint } from "~/servers/fingerprint";
import { getUserById } from "~/servers/user";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { fingerprint } = json;

    // 验证参数
    if (!fingerprint) {
      return Response.json({
        success: false,
        message: 'Fingerprint is required'
      }, { status: 400 });
    }

    // 查找关联的用户ID
    const user_id = await getUserIdByFingerprint(fingerprint);

    if (!user_id) {
      return Response.json({
        success: true,
        message: 'No user linked to this fingerprint',
        data: null
      });
    }

    // 获取用户详细信息
    const user = await getUserById(user_id);

    return Response.json({
      success: true,
      message: 'User found',
      data: user
    });
  } catch (error) {
    console.error('Error in getUserByFingerprint API:', error);
    return Response.json({
      success: false,
      message: 'Failed to get user by fingerprint',
      error: error.message
    }, { status: 500 });
  }
}

