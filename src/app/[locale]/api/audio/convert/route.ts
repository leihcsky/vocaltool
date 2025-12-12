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

import NodeFormData from 'form-data';
import fetch from 'node-fetch';

// Demucs 服务地址
const demucsUrl = process.env.DEMUCS_SERVICE_URL || 'http://localhost:8000';

/**
 * 验证URL格式
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const url = formData.get('url') as string;
    const format = formData.get('format') as string || 'mp3';

    if (!file && !url) {
      return Response.json({
        success: false,
        message: 'File or URL is required'
      }, { status: 400 });
    }

    // 验证URL格式
    if (url && !isValidUrl(url)) {
      return Response.json({
        success: false,
        message: 'Invalid URL format. Please provide a valid HTTP or HTTPS URL'
      }, { status: 400 });
    }

    // 验证格式
    if (!['mp3', 'wav', 'flac', 'm4a', 'ogg'].includes(format.toLowerCase())) {
      return Response.json({
        success: false,
        message: 'Invalid format. Supported formats: mp3, wav, flac, m4a, ogg'
      }, { status: 400 });
    }

    let buffer: Buffer;
    let filename: string;
    let contentType: string;

    if (file) {
      console.log('[Convert] Converting file:', file.name, 'to format:', format);
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      filename = file.name;
      contentType = file.type || 'audio/wav';
    } else {
      console.log('[Convert] Converting URL:', url, 'to format:', format);
      
      // 验证URL格式
      if (!isValidUrl(url)) {
        return Response.json({
          success: false,
          message: 'Invalid URL format. Please provide a valid HTTP or HTTPS URL'
        }, { status: 400 });
      }

      try {
        // 创建AbortController用于超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          return Response.json({
            success: false,
            message: `Failed to fetch audio from URL: ${response.status} ${response.statusText}`
          }, { status: response.status });
        }

        // 检查Content-Type是否是音频类型
        const contentTypeHeader = response.headers.get('content-type') || '';
        if (!contentTypeHeader.startsWith('audio/') && 
            !contentTypeHeader.includes('application/octet-stream') &&
            contentTypeHeader !== '') {
          console.warn('[Convert] Warning: Content-Type is not audio:', contentTypeHeader);
        }

        const arrayBuffer = await response.arrayBuffer();
        
        // 检查文件大小（限制100MB）
        if (arrayBuffer.byteLength > 100 * 1024 * 1024) {
          return Response.json({
            success: false,
            message: 'Audio file is too large. Maximum size is 100MB'
          }, { status: 400 });
        }

        buffer = Buffer.from(arrayBuffer);
        filename = url.split('/').pop()?.split('?')[0] || `audio-${Date.now()}`;
        contentType = contentTypeHeader || 'audio/wav';
      } catch (fetchError: any) {
        console.error('[Convert] Error fetching URL:', fetchError);
        
        if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError') {
          return Response.json({
            success: false,
            message: 'Request timeout. The URL may be unreachable or taking too long to respond'
          }, { status: 408 });
        }
        
        if (fetchError.code === 'ENOTFOUND' || fetchError.code === 'ECONNREFUSED') {
          return Response.json({
            success: false,
            message: 'Cannot connect to the URL. Please check if the URL is correct and accessible'
          }, { status: 400 });
        }

        return Response.json({
          success: false,
          message: `Failed to fetch audio from URL: ${fetchError.message || 'Unknown error'}`
        }, { status: 400 });
      }
    }

    // 调用 Demucs /convert API
    const demucsFormData = new NodeFormData();
    demucsFormData.append('file', buffer, {
      filename: filename,
      contentType: contentType
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
    const outputContentType = getContentType(format);
    const headers = new Headers();
    headers.set('Content-Type', outputContentType);

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
    case 'm4a':
      return 'audio/mp4';
    case 'ogg':
      return 'audio/ogg';
    default:
      return 'application/octet-stream';
  }
}

