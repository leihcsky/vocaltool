/**
 * API: 处理音频文件（vocal removal）
 * POST /api/audio/process
 * 
 * Request Body:
 * {
 *   file_id: number,
 *   fingerprint?: string,
 *   user_id?: string
 * }
 */

import { getFileById, updateFileStatus, downloadFileFromR2 } from "~/servers/uploadFile";
import { saveProcessingResult } from "~/servers/processingResult";
import { incrementUsageCount } from "~/servers/usageLimit";
import FormData from 'form-data';
import fetch from 'node-fetch';

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { file_id, fingerprint, user_id } = json;

    // 验证参数
    if (!file_id) {
      return Response.json({
        success: false,
        message: 'file_id is required'
      }, { status: 400 });
    }

    // 获取文件信息
    const fileInfo = await getFileById(file_id);
    
    if (!fileInfo) {
      return Response.json({
        success: false,
        message: 'File not found'
      }, { status: 404 });
    }

    // 更新状态为处理中
    await updateFileStatus(file_id, 'processing');

    try {
      // 从 R2 下载文件
      const fileBuffer = await downloadFileFromR2(fileInfo.r2_key);

      // 调用 demucs 服务
      const demucsUrl = process.env.DEMUCS_SERVICE_URL || 'http://localhost:5000';
      const startTime = Date.now();

      // 创建 FormData
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileInfo.original_file_name,
        contentType: fileInfo.mime_type,
      });

      // 调用 demucs API
      const response = await fetch(`${demucsUrl}/separate`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Demucs service error: ${response.statusText}`);
      }

      const result = await response.json();
      const processingTime = Date.now() - startTime;

      // 保存处理结果
      // 假设 demucs 返回格式：{ vocals: Buffer, instrumental: Buffer }
      const vocalsBuffer = Buffer.from(result.vocals, 'base64');
      const instrumentalBuffer = Buffer.from(result.instrumental, 'base64');

      // 保存 vocals
      await saveProcessingResult(
        file_id,
        'vocals',
        vocalsBuffer,
        'audio/wav',
        processingTime
      );

      // 保存 instrumental
      await saveProcessingResult(
        file_id,
        'instrumental',
        instrumentalBuffer,
        'audio/wav',
        processingTime
      );

      // 更新文件状态为已处理
      await updateFileStatus(file_id, 'processed');

      // 增加使用次数
      await incrementUsageCount(
        fingerprint || null,
        user_id || null,
        fileInfo.tool_type
      );

      return Response.json({
        success: true,
        message: 'Audio processed successfully',
        data: {
          file_id,
          processing_time_ms: processingTime
        }
      });
    } catch (error) {
      // 处理失败，更新状态
      await updateFileStatus(file_id, 'failed', error.message);
      throw error;
    }
  } catch (error) {
    console.error('Error in process API:', error);
    return Response.json({
      success: false,
      message: 'Failed to process audio',
      error: error.message
    }, { status: 500 });
  }
}

// 设置超时时间（10分钟）
export const maxDuration = 600;

