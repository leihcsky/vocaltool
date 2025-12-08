/**
 * API: 上传音频文件
 * POST /api/audio/upload
 * 
 * 支持单个或多个文件上传（最多3个）
 */

import { uploadFileToR2 } from "~/servers/uploadFile";
import { checkUsageLimit } from "~/servers/usageLimit";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    const fingerprint = formData.get('fingerprint') as string | null;
    const userId = formData.get('user_id') as string | null;
    const toolType = formData.get('tool_type') as string;
    const batchId = formData.get('batch_id') as string | null;

    // 验证参数
    if (!toolType) {
      return Response.json({
        success: false,
        message: 'tool_type is required'
      }, { status: 400 });
    }

    if (!fingerprint && !userId) {
      return Response.json({
        success: false,
        message: 'Either fingerprint or user_id is required'
      }, { status: 400 });
    }

    // 获取所有文件
    const files: File[] = [];
    const entries = Array.from(formData.entries());
    for (const [key, value] of entries) {
      if (key.startsWith('file') && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return Response.json({
        success: false,
        message: 'No files provided'
      }, { status: 400 });
    }

    // 限制最多3个文件
    if (files.length > 3) {
      return Response.json({
        success: false,
        message: 'Maximum 3 files allowed'
      }, { status: 400 });
    }

    // 检查使用限制
    const limitCheck = await checkUsageLimit(fingerprint, userId, toolType);
    
    if (!limitCheck.allowed) {
      return Response.json({
        success: false,
        message: limitCheck.message || 'Usage limit exceeded',
        data: {
          remaining: limitCheck.remaining,
          limit: limitCheck.limit
        }
      }, { status: 403 });
    }

    // 检查剩余次数是否足够
    if (limitCheck.remaining < files.length) {
      return Response.json({
        success: false,
        message: `You can only upload ${limitCheck.remaining} more file(s) today. You tried to upload ${files.length} file(s).`,
        data: {
          remaining: limitCheck.remaining,
          limit: limitCheck.limit,
          requested: files.length
        }
      }, { status: 403 });
    }

    // 上传所有文件
    const uploadedFiles = [];
    
    for (const file of files) {
      // 验证文件大小（最大 100MB）
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        return Response.json({
          success: false,
          message: `File ${file.name} exceeds maximum size of 100MB`
        }, { status: 400 });
      }

      // 验证文件类型
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp3', 'audio/x-wav'];
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|flac)$/i)) {
        return Response.json({
          success: false,
          message: `File ${file.name} is not a supported audio format`
        }, { status: 400 });
      }

      // 读取文件内容
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 上传到 R2
      const uploadedFile = await uploadFileToR2(
        buffer,
        file.name,
        file.size,
        file.type || 'audio/mpeg',
        userId,
        fingerprint,
        toolType,
        batchId || undefined
      );

      uploadedFiles.push(uploadedFile);
    }

    return Response.json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      data: {
        files: uploadedFiles,
        batch_id: uploadedFiles[0].batch_id
      }
    });
  } catch (error) {
    console.error('Error in upload API:', error);
    return Response.json({
      success: false,
      message: 'Failed to upload files',
      error: error.message
    }, { status: 500 });
  }
}

// 配置最大请求体大小（100MB）
export const maxDuration = 300; // 5 minutes timeout
export const dynamic = 'force-dynamic';
