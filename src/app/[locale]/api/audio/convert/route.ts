/**
 * API: 音频格式转换
 * POST /api/audio/convert
 *
 * Request Body (FormData):
 * - file: File (音频文件)
 * - format: string (目标格式: mp3, wav, flac)
 *
 * 功能：
 * 1. 接收音频文件
 * 2. 调用 Demucs /convert API 进行格式转换
 * 3. 返回转换后的文件
 */

import FormData from 'form-data';
import fetch from 'node-fetch';

// Demucs 服务地址
const demucsUrl = process.env.DEMUCS_SERVICE_URL || 'http://localhost:8000';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const format = formData.get('format') as string || 'mp3';

    if (!file) {
      return Response.json({
        success: false,
        message: 'File is required'
      }, { status: 400 });
    }

    // 验证格式
    if (!['mp3', 'wav', 'flac'].includes(format.toLowerCase())) {
      return Response.json({
        success: false,
        message: 'Invalid format. Supported formats: mp3, wav, flac'
      }, { status: 400 });
    }

    console.log('[Convert] Converting file:', file.name, 'to format:', format);

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 调用 Demucs /convert API
    const demucsFormData = new FormData();
    demucsFormData.append('file', buffer, {
      filename: file.name,
      contentType: file.type || 'audio/wav'
    });

    const convertUrl = `${demucsUrl}/convert?format=${format.toLowerCase()}`;
    console.log('[Convert] Calling Demucs:', convertUrl);

    const convertResponse = await fetch(convertUrl, {
      method: 'POST',
      body: demucsFormData as any,
      headers: demucsFormData.getHeaders()
    });

    if (!convertResponse.ok) {
      const errorText = await convertResponse.text();
      console.error('[Convert] Conversion failed:', errorText);
      return Response.json({
        success: false,
        message: 'Failed to convert audio format',
        error: errorText
      }, { status: 500 });
    }

    // 获取转换后的文件
    const convertedArrayBuffer = await convertResponse.arrayBuffer();
    const convertedBuffer = Buffer.from(convertedArrayBuffer);

    console.log('[Convert] Conversion successful, size:', convertedBuffer.length, 'bytes');

    // 返回转换后的文件
    const contentType = getContentType(format);
    const headers = new Headers();
    headers.set('Content-Type', contentType);

    return new Response(convertedBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('[Convert] Error in convert API:', error);
    return Response.json({
      success: false,
      message: 'Failed to convert audio',
      error: error.message
    }, { status: 500 });
  }
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

