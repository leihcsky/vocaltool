/**
 * API: 获取处理结果
 * POST /api/audio/getResults
 * 
 * Request Body:
 * {
 *   file_id?: number,
 *   batch_id?: string
 * }
 */

import { getProcessingResults, getProcessingResultsByBatchId } from "~/servers/processingResult";
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
      // 获取单个文件的结果
      const fileInfo = await getFileById(file_id);
      
      if (!fileInfo) {
        return Response.json({
          success: false,
          message: 'File not found'
        }, { status: 404 });
      }

      const results = await getProcessingResults(file_id);

      return Response.json({
        success: true,
        data: {
          file: fileInfo,
          results
        }
      });
    } else {
      // 获取批次的所有结果
      const files = await getFilesByBatchId(batch_id);
      
      if (files.length === 0) {
        return Response.json({
          success: false,
          message: 'Batch not found'
        }, { status: 404 });
      }

      const batchResults = await getProcessingResultsByBatchId(batch_id);

      return Response.json({
        success: true,
        data: {
          files,
          results: batchResults
        }
      });
    }
  } catch (error) {
    console.error('Error in getResults API:', error);
    return Response.json({
      success: false,
      message: 'Failed to get results',
      error: error.message
    }, { status: 500 });
  }
}

