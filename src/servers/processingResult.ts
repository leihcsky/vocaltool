/**
 * 处理结果服务
 * 管理音频处理结果的存储和查询
 */

import { getDb } from "~/libs/db";
import { R2, r2Bucket, storageURL } from "~/libs/R2";
import { v4 as uuidv4 } from 'uuid';

/**
 * 创建处理任务记录
 * @param uploadFileId 上传文件ID
 * @param taskId 任务ID
 * @param taskStatus 任务状态
 * @param taskMessage 任务消息
 * @returns 处理结果记录
 */
export async function createProcessingTask(
  uploadFileId: number,
  taskId: string,
  taskStatus: string,
  taskMessage: string
) {
  const db = getDb();

  try {
    const result = await db.query(
      `INSERT INTO processing_results
       (upload_file_id, task_id, task_status, task_message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [uploadFileId, taskId, taskStatus, taskMessage]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error creating processing task:', error);
    throw error;
  }
}

/**
 * 更新处理任务状态
 * @param uploadFileId 上传文件ID
 * @param taskStatus 任务状态
 * @param taskMessage 任务消息
 * @param processingTimeMs 处理耗时（毫秒，可选）
 */
export async function updateProcessingTask(
  uploadFileId: number,
  taskStatus: string,
  taskMessage: string,
  processingTimeMs?: number
) {
  const db = getDb();

  try {
    const result = await db.query(
      `UPDATE processing_results
       SET task_status = $1,
           task_message = $2,
           processing_time_ms = $3,
           updated_at = NOW()
       WHERE upload_file_id = $4
       RETURNING *`,
      [taskStatus, taskMessage, processingTimeMs || null, uploadFileId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error updating processing task:', error);
    throw error;
  }
}

/**
 * 获取处理任务信息
 * @param uploadFileId 上传文件ID
 * @returns 处理任务记录
 */
export async function getProcessingTask(uploadFileId: number) {
  const db = getDb();

  try {
    const result = await db.query(
      `SELECT * FROM processing_results WHERE upload_file_id = $1`,
      [uploadFileId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error getting processing task:', error);
    throw error;
  }
}

/**
 * 保存处理结果详情到 R2 和数据库
 * @param uploadFileId 上传文件ID
 * @param resultType 结果类型（文件名）
 * @param resultBuffer 结果文件 Buffer
 * @param mimeType MIME 类型
 * @returns 处理结果详情记录
 */
export async function saveProcessingResultDetail(
  uploadFileId: number,
  resultType: string,
  resultBuffer: Buffer,
  mimeType: string
) {
  const db = getDb();

  try {
    // 生成唯一的 R2 key
    const fileExtension = mimeType.includes('wav') ? 'wav' : 'mp3';
    // const r2Key = `results/${resultType}/${uuidv4()}.${fileExtension}`;
    const r2Key = `results/${uploadFileId}/${resultType}`;

    // 上传到 R2
    await R2.upload({
      Bucket: r2Bucket,
      Key: r2Key,
      Body: resultBuffer,
      ContentType: mimeType,
    }).promise();

    console.log(`Processing result detail uploaded to R2: ${r2Key}`);

    // 创建数据库记录
    const result = await db.query(
      `INSERT INTO processing_results_detail
       (upload_file_id, result_type, r2_key, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [uploadFileId, resultType, r2Key, resultBuffer.length, mimeType]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error saving processing result detail:', error);
    throw error;
  }
}

/**
 * 获取文件的所有处理结果详情
 * @param uploadFileId 上传文件ID
 * @returns 处理结果详情列表（包含下载URL）
 */
export async function getProcessingResultDetails(uploadFileId: number) {
  const db = getDb();

  try {
    const result = await db.query(
      `SELECT * FROM processing_results_detail WHERE upload_file_id = $1 ORDER BY created_at ASC`,
      [uploadFileId]
    );

    // 为每个结果添加下载 URL
    return result.rows.map(row => ({
      ...row,
      download_url: `${storageURL}/${row.r2_key}`
    }));
  } catch (error) {
    console.error('Error getting processing result details:', error);
    throw error;
  }
}

/**
 * 获取批次的所有处理结果（包含任务状态和详情）
 * @param batchId 批次ID
 */
export async function getProcessingResultsByBatchId(batchId: string) {
  const db = getDb();

  try {
    // 获取批次的所有文件及其任务状态
    const taskResult = await db.query(
      `SELECT pr.*, uf.original_file_name, uf.batch_id, uf.id as file_id
       FROM processing_results pr
       JOIN upload_files uf ON pr.upload_file_id = uf.id
       WHERE uf.batch_id = $1
       ORDER BY uf.created_at ASC`,
      [batchId]
    );

    // 获取所有结果详情
    const detailResult = await db.query(
      `SELECT prd.*, uf.id as file_id
       FROM processing_results_detail prd
       JOIN upload_files uf ON prd.upload_file_id = uf.id
       WHERE uf.batch_id = $1
       ORDER BY prd.created_at ASC`,
      [batchId]
    );

    // 按文件分组
    const groupedResults: { [key: number]: any } = {};

    taskResult.rows.forEach(row => {
      const fileId = row.file_id;

      if (!groupedResults[fileId]) {
        groupedResults[fileId] = {
          upload_file_id: fileId,
          original_file_name: row.original_file_name,
          task_id: row.task_id,
          task_status: row.task_status,
          task_message: row.task_message,
          processing_time_ms: row.processing_time_ms,
          results: []
        };
      }
    });

    // 添加结果详情
    detailResult.rows.forEach(row => {
      const fileId = row.file_id;

      if (groupedResults[fileId]) {
        groupedResults[fileId].results.push({
          id: row.id,
          result_type: row.result_type,
          r2_key: row.r2_key,
          file_size: row.file_size,
          mime_type: row.mime_type,
          created_at: row.created_at,
          download_url: `${storageURL}/${row.r2_key}`
        });
      }
    });

    return Object.values(groupedResults);
  } catch (error) {
    console.error('Error getting processing results by batch ID:', error);
    throw error;
  }
}

/**
 * 删除处理结果详情（从数据库和 R2）
 * @param resultId 结果详情ID
 */
export async function deleteProcessingResultDetail(resultId: number) {
  const db = getDb();

  try {
    // 获取结果信息
    const result = await db.query(
      `SELECT * FROM processing_results_detail WHERE id = $1`,
      [resultId]
    );

    if (result.rows.length === 0) {
      throw new Error('Processing result detail not found');
    }

    const row = result.rows[0];

    // 从 R2 删除
    await R2.deleteObject({
      Bucket: r2Bucket,
      Key: row.r2_key,
    }).promise();

    // 从数据库删除
    await db.query(
      `DELETE FROM processing_results_detail WHERE id = $1`,
      [resultId]
    );

    console.log(`Processing result detail deleted: ${resultId}`);
  } catch (error) {
    console.error('Error deleting processing result detail:', error);
    throw error;
  }
}

