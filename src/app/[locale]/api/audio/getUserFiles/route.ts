/**
 * API: 获取用户的音频文件列表
 * GET /api/audio/getUserFiles?user_id=xxx&page=1&limit=20
 *
 * 返回用户的所有音频文件，包含：
 * - 文件信息（文件名、大小、上传时间）
 * - 工具类型
 * - 处理状态
 * - 处理结果（如果有）
 */

import { getDb } from "~/libs/db";
import { storageURL } from "~/libs/R2";

export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId || userId === 'undefined') {
      return Response.json({
        success: false,
        message: 'user_id is required'
      }, { status: 400 });
    }

    const db = getDb();
    const offset = (page - 1) * limit;

    // 查询用户的文件列表，只通过 user_id 查询（登录用户的文件才会保存）
    const query = `
      SELECT 
        uf.id,
        uf.original_file_name,
        uf.file_size,
        uf.mime_type,
        uf.tool_type,
        uf.status,
        uf.r2_key,
        uf.created_at,
        uf.updated_at,
        pr.task_status,
        pr.task_message,
        pr.processing_time_ms,
        (
          SELECT json_agg(
            json_build_object(
              'id', prd.id,
              'result_type', prd.result_type,
              'r2_key', prd.r2_key,
              'file_size', prd.file_size,
              'mime_type', prd.mime_type,
              'download_url', $1 || '/' || prd.r2_key,
              'created_at', prd.created_at
            )
          )
          FROM processing_results_detail prd
          WHERE prd.upload_file_id = uf.id
        ) as results
      FROM upload_files uf
      LEFT JOIN processing_results pr ON pr.upload_file_id = uf.id
      WHERE uf.user_id = $2
      ORDER BY uf.created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const result = await db.query(query, [storageURL, userId, limit, offset]);

    // 获取总数
    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM upload_files WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].total);

    // 格式化数据
    const files = result.rows.map(row => ({
      id: row.id,
      fileName: row.original_file_name,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      toolType: row.tool_type,
      status: row.status,
      r2Key: row.r2_key,
      uploadUrl: `${storageURL}/${row.r2_key}`,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      processingStatus: row.task_status || null,
      processingMessage: row.task_message || null,
      processingTimeMs: row.processing_time_ms || null,
      results: row.results || []
    }));

    return Response.json({
      success: true,
      files,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('[GetUserFiles] Error:', error);
    return Response.json({
      success: false,
      message: 'Failed to get user files',
      error: error.message
    }, { status: 500 });
  }
}
