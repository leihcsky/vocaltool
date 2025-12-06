/**
 * API: 关联浏览器指纹与用户
 * POST /api/fingerprint/link
 * 
 * Request Body:
 * {
 *   fingerprint: string,
 *   user_id: string
 * }
 */

import { linkFingerprintToUser } from "~/servers/fingerprint";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { fingerprint, user_id } = json;

    // 验证参数
    if (!fingerprint || !user_id) {
      return Response.json({
        success: false,
        message: 'Fingerprint and user_id are required'
      }, { status: 400 });
    }

    // 关联指纹与用户
    const result = await linkFingerprintToUser(fingerprint, user_id);

    return Response.json(result);
  } catch (error) {
    console.error('Error in fingerprint link API:', error);
    return Response.json({
      success: false,
      message: 'Failed to link fingerprint',
      error: error.message
    }, { status: 500 });
  }
}

