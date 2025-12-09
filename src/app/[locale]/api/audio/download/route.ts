/**
 * API: 下载处理结果文件（代理下载 + 格式转换）
 * GET /api/audio/download?r2_key=xxx&filename=xxx&format=mp3|wav
 *
 * 功能：
 * 1. 从 R2 下载文件
 * 2. 检查用户权限（WAV 格式需要订阅）
 * 3. 调用 Demucs /convert API 进行格式转换
 * 4. 返回转换后的文件供用户下载
 */

import { R2, r2Bucket } from "~/libs/R2";
import { checkSubscribe } from "~/servers/subscribe";
import FormData from 'form-data';
import fetch from 'node-fetch';

// Demucs 服务地址
const demucsUrl = process.env.DEMUCS_SERVICE_URL || 'http://localhost:8000';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const r2_key = searchParams.get('r2_key');
    const filename = searchParams.get('filename');
    const format = searchParams.get('format') || 'mp3'; // 默认 MP3
    const user_id = searchParams.get('user_id');

    console.log('[Download] Request params:', { r2_key, filename, format, user_id });

    // 验证参数
    if (!r2_key) {
      return Response.json({
        success: false,
        message: 'r2_key is required'
      }, { status: 400 });
    }

    // 验证格式
    if (!['mp3', 'wav', 'flac'].includes(format.toLowerCase())) {
      return Response.json({
        success: false,
        message: 'Invalid format. Supported formats: mp3, wav, flac'
      }, { status: 400 });
    }

    // 检查 WAV 格式权限（只有订阅用户可以下载 WAV）
    if (format === 'wav') {
      if (!user_id) {
        return Response.json({
          success: false,
          message: 'WAV format requires login and premium subscription'
        }, { status: 401 });
      }

      const isSubscribed = await checkSubscribe(user_id);
      if (!isSubscribed) {
        return Response.json({
          success: false,
          message: 'WAV format requires premium subscription'
        }, { status: 403 });
      }
    }

    // 从 R2 获取原始文件
    console.log('[Download] Fetching file from R2:', r2_key);
    const result = await R2.getObject({
      Bucket: r2Bucket,
      Key: r2_key
    }).promise();

    if (!result.Body) {
      return Response.json({
        success: false,
        message: 'File not found in storage'
      }, { status: 404 });
    }

    // 获取文件内容
    const originalBuffer = result.Body as Buffer;
    console.log('[Download] Original file size:', originalBuffer.length, 'bytes');

    // 检测原始文件格式
    const originalFormat = detectAudioFormat(r2_key, result.ContentType);
    console.log('[Download] Original format:', originalFormat, 'Target format:', format);

    let finalBuffer = originalBuffer;
    let contentType = result.ContentType || 'application/octet-stream';

    // 如果目标格式与原始格式不同，需要转换
    if (originalFormat !== format.toLowerCase()) {
      console.log('[Download] Format conversion needed, calling Demucs /convert API...');

      try {
        // 调用 Demucs /convert API 进行格式转换
        const formData = new FormData();
        formData.append('file', originalBuffer, {
          filename: `audio.${originalFormat}`,
          contentType: contentType
        });

        const convertUrl = `${demucsUrl}/convert?format=${format.toLowerCase()}`;
        console.log('[Download] Calling:', convertUrl);

        const convertResponse = await fetch(convertUrl, {
          method: 'POST',
          body: formData as any,
          headers: formData.getHeaders()
        });

        if (!convertResponse.ok) {
          const errorText = await convertResponse.text();
          console.error('[Download] Conversion failed:', errorText);
          throw new Error(`Conversion failed: ${convertResponse.statusText}`);
        }

        // 获取转换后的文件
        const arrayBuffer = await convertResponse.arrayBuffer();
        finalBuffer = Buffer.from(arrayBuffer);
        console.log('[Download] Converted file size:', finalBuffer.length, 'bytes');

        // 更新 Content-Type
        contentType = getContentType(format);
      } catch (convertError) {
        console.error('[Download] Format conversion error:', convertError);
        return Response.json({
          success: false,
          message: 'Failed to convert audio format',
          error: convertError.message
        }, { status: 500 });
      }
    } else {
      console.log('[Download] No conversion needed, formats match');
    }

    // 生成下载文件名
    const downloadFilename = generateFilename(filename, format);
    console.log('[Download] Download filename:', downloadFilename);

    // 设置响应头，强制下载
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', finalBuffer.length.toString());
    headers.set('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    headers.set('Cache-Control', 'no-cache'); // 不缓存，因为可能有格式转换

    console.log('[Download] Sending file to client...');
    return new Response(finalBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('[Download] Error in download API:', error);
    return Response.json({
      success: false,
      message: 'Failed to download file',
      error: error.message
    }, { status: 500 });
  }
}

/**
 * 检测音频文件格式
 */
function detectAudioFormat(r2_key: string, contentType?: string): string {
  // 优先从文件名检测
  if (r2_key.endsWith('.wav')) return 'wav';
  if (r2_key.endsWith('.mp3')) return 'mp3';
  if (r2_key.endsWith('.flac')) return 'flac';

  // 从 Content-Type 检测
  if (contentType) {
    if (contentType.includes('wav')) return 'wav';
    if (contentType.includes('mpeg') || contentType.includes('mp3')) return 'mp3';
    if (contentType.includes('flac')) return 'flac';
  }

  // 默认假设为 WAV（因为 Demucs 默认输出 WAV）
  return 'wav';
}

/**
 * 获取 Content-Type
 */
function getContentType(format: string): string {
  switch (format.toLowerCase()) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'flac':
      return 'audio/flac';
    default:
      return 'application/octet-stream';
  }
}

/**
 * 生成下载文件名
 */
function generateFilename(originalFilename: string | null, format: string): string {
  if (!originalFilename) {
    return `audio.${format}`;
  }

  // 移除原有扩展名，添加新扩展名
  const nameWithoutExt = originalFilename.replace(/\.(wav|mp3|flac)$/i, '');
  return `${nameWithoutExt}.${format}`;
}

