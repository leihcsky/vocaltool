/**
 * API: 获取文件处理状态
 * POST /api/audio/getStatus
 * 
 * Request Body:
 * {
 *   file_id?: number,
 *   batch_id?: string
 * }
 */

import { getFileById, getFilesByBatchId } from "~/servers/uploadFile";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { file_id, batch_id } = json;

    // 验证参数
    if (!file_id && !batch_id) {
      return Response.json({
        success: false,
        message: 'Either file_id or batch_id is required'
      }, { status: 400 });
    }

    if (file_id) {
      // 获取单个文件状态
      const fileInfo = await getFileById(file_id);
      
      if (!fileInfo) {
        return Response.json({
          success: false,
          message: 'File not found'
        }, { status: 404 });
      }

      return Response.json({
        success: true,
        data: {
          file_id: fileInfo.id,
          status: fileInfo.status,
          error_message: fileInfo.error_message,
          original_file_name: fileInfo.original_file_name
        }
      });
    } else {
      // 获取批次所有文件状态
      const files = await getFilesByBatchId(batch_id);
      
      if (files.length === 0) {
        return Response.json({
          success: false,
          message: 'Batch not found'
        }, { status: 404 });
      }

      const statuses = files.map(file => ({
        file_id: file.id,
        status: file.status,
        error_message: file.error_message,
        original_file_name: file.original_file_name
      }));

      // 计算整体状态
      const allProcessed = files.every(f => f.status === 'processed');
      const anyFailed = files.some(f => f.status === 'failed');
      const anyProcessing = files.some(f => f.status === 'processing');

      let overallStatus = 'uploaded';
      if (allProcessed) {
        overallStatus = 'processed';
      } else if (anyFailed) {
        overallStatus = 'failed';
      } else if (anyProcessing) {
        overallStatus = 'processing';
      }

      return Response.json({
        success: true,
        data: {
          batch_id,
          overall_status: overallStatus,
          files: statuses,
          total: files.length,
          processed: files.filter(f => f.status === 'processed').length,
          failed: files.filter(f => f.status === 'failed').length
        }
      });
    }
  } catch (error) {
    console.error('Error in getStatus API:', error);
    return Response.json({
      success: false,
      message: 'Failed to get status',
      error: error.message
    }, { status: 500 });
  }
}

