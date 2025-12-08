/**
 * 处理结果服务
 * 管理音频处理结果的存储和查询
 */

import { getDb } from "~/libs/db";
import { R2, r2Bucket, storageURL } from "~/libs/R2";
import { v4 as uuidv4 } from 'uuid';

/**
 * 保存处理结果到 R2 和数据库
 * @param uploadFileId 上传文件ID
 * @param resultType 结果类型（vocals, instrumental, etc.）
 * @param resultBuffer 结果文件 Buffer
 * @param mimeType MIME 类型
 * @param processingTimeMs 处理耗时（毫秒）
 * @returns 处理结果记录
 */
export async function saveProcessingResult(
  uploadFileId: number,
  resultType: string,
  resultBuffer: Buffer,
  mimeType: string,
  processingTimeMs?: number
) {
  const db = getDb();

  try {
    // 生成唯一的 R2 key
    const fileExtension = mimeType.includes('wav') ? 'wav' : 'mp3';
    const r2Key = `results/${resultType}/${uuidv4()}.${fileExtension}`;

    // 上传到 R2
    await R2.upload({
      Bucket: r2Bucket,
      Key: r2Key,
      Body: resultBuffer,
      ContentType: mimeType,
    }).promise();

    console.log(`Processing result uploaded to R2: ${r2Key}`);

    // 创建数据库记录
    const result = await db.query(
      `INSERT INTO processing_results 
       (upload_file_id, result_type, r2_key, file_size, mime_type, processing_time_ms) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [uploadFileId, resultType, r2Key, resultBuffer.length, mimeType, processingTimeMs || null]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error saving processing result:', error);
    throw error;
  }
}

/**
 * 获取文件的所有处理结果
 * @param uploadFileId 上传文件ID
 * @returns 处理结果列表（包含下载URL）
 */
export async function getProcessingResults(uploadFileId: number) {
  const db = getDb();

  try {
    const result = await db.query(
      `SELECT * FROM processing_results WHERE upload_file_id = $1 ORDER BY created_at ASC`,
      [uploadFileId]
    );

    // 为每个结果添加下载 URL
    return result.rows.map(row => ({
      ...row,
      download_url: `${storageURL}/${row.r2_key}`
    }));
  } catch (error) {
    console.error('Error getting processing results:', error);
    throw error;
  }
}

/**
 * 获取特定类型的处理结果
 * @param uploadFileId 上传文件ID
 * @param resultType 结果类型
 */
export async function getProcessingResultByType(
  uploadFileId: number,
  resultType: string
) {
  const db = getDb();

  try {
    const result = await db.query(
      `SELECT * FROM processing_results 
       WHERE upload_file_id = $1 AND result_type = $2`,
      [uploadFileId, resultType]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      download_url: `${storageURL}/${row.r2_key}`
    };
  } catch (error) {
    console.error('Error getting processing result by type:', error);
    throw error;
  }
}

/**
 * 获取批次的所有处理结果
 * @param batchId 批次ID
 */
export async function getProcessingResultsByBatchId(batchId: string) {
  const db = getDb();

  try {
    const result = await db.query(
      `SELECT pr.*, uf.original_file_name, uf.batch_id 
       FROM processing_results pr
       JOIN upload_files uf ON pr.upload_file_id = uf.id
       WHERE uf.batch_id = $1
       ORDER BY uf.created_at ASC, pr.created_at ASC`,
      [batchId]
    );

    // 按文件分组
    const groupedResults: { [key: number]: any } = {};
    
    result.rows.forEach(row => {
      const fileId = row.upload_file_id;
      
      if (!groupedResults[fileId]) {
        groupedResults[fileId] = {
          upload_file_id: fileId,
          original_file_name: row.original_file_name,
          results: []
        };
      }

      groupedResults[fileId].results.push({
        id: row.id,
        result_type: row.result_type,
        r2_key: row.r2_key,
        file_size: row.file_size,
        mime_type: row.mime_type,
        processing_time_ms: row.processing_time_ms,
        created_at: row.created_at,
        download_url: `${storageURL}/${row.r2_key}`
      });
    });

    return Object.values(groupedResults);
  } catch (error) {
    console.error('Error getting processing results by batch ID:', error);
    throw error;
  }
}

/**
 * 删除处理结果（从数据库和 R2）
 * @param resultId 结果ID
 */
export async function deleteProcessingResult(resultId: number) {
  const db = getDb();

  try {
    // 获取结果信息
    const result = await db.query(
      `SELECT * FROM processing_results WHERE id = $1`,
      [resultId]
    );

    if (result.rows.length === 0) {
      throw new Error('Processing result not found');
    }

    const row = result.rows[0];

    // 从 R2 删除
    await R2.deleteObject({
      Bucket: r2Bucket,
      Key: row.r2_key,
    }).promise();

    // 从数据库删除
    await db.query(
      `DELETE FROM processing_results WHERE id = $1`,
      [resultId]
    );

    console.log(`Processing result deleted: ${resultId}`);
  } catch (error) {
    console.error('Error deleting processing result:', error);
    throw error;
  }
}

