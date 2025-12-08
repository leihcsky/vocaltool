/**
 * API: 下载处理结果文件（代理下载）
 * GET /api/audio/download?r2_key=xxx&filename=xxx
 * 
 * 通过后端代理下载 R2 文件，避免跨域问题
 */

import { R2, r2Bucket } from "~/libs/R2";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const r2_key = searchParams.get('r2_key');
    const filename = searchParams.get('filename');

    if (!r2_key) {
      return Response.json({
        success: false,
        message: 'r2_key is required'
      }, { status: 400 });
    }

    // 从 R2 获取文件
    const result = await R2.getObject({
      Bucket: r2Bucket,
      Key: r2_key
    }).promise();

    if (!result.Body) {
      return Response.json({
        success: false,
        message: 'File not found'
      }, { status: 404 });
    }

    // 获取文件内容
    const buffer = result.Body as Buffer;

    // 设置响应头，强制下载
    const headers = new Headers();
    headers.set('Content-Type', result.ContentType || 'application/octet-stream');
    headers.set('Content-Length', result.ContentLength?.toString() || '0');
    headers.set('Content-Disposition', `attachment; filename="${filename || 'download'}"`);
    headers.set('Cache-Control', 'public, max-age=31536000');

    return new Response(buffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error in download API:', error);
    return Response.json({
      success: false,
      message: 'Failed to download file',
      error: error.message
    }, { status: 500 });
  }
}

