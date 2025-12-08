/**
 * 文件上传服务
 * 管理音频文件上传到 R2 和数据库记录
 */

import { getDb } from "~/libs/db";
import { R2, r2Bucket } from "~/libs/R2";
import { v4 as uuidv4 } from 'uuid';

/**
 * 上传文件到 R2 并创建数据库记录
 * @param file 文件 Buffer
 * @param fileName 原始文件名
 * @param fileSize 文件大小
 * @param mimeType MIME 类型
 * @param userId 用户ID（可选）
 * @param fingerprint 浏览器指纹（可选）
 * @param toolType 工具类型
 * @param batchId 批次ID（可选，用于批量上传）
 * @returns 上传文件记录
 */
export async function uploadFileToR2(
  file: Buffer,
  fileName: string,
  fileSize: number,
  mimeType: string,
  userId: string | null,
  fingerprint: string | null,
  toolType: string,
  batchId?: string
) {
  const db = getDb();
  
  try {
    // 生成唯一的 R2 key
    const fileExtension = fileName.split('.').pop();
    const r2Key = `uploads/${toolType}/${uuidv4()}.${fileExtension}`;
    
    // 上传到 R2
    await R2.upload({
      Bucket: r2Bucket,
      Key: r2Key,
      Body: file,
      ContentType: mimeType,
    }).promise();

    console.log(`File uploaded to R2: ${r2Key}`);

    // 创建数据库记录
    const batch = batchId || uuidv4();
    const result = await db.query(
      `INSERT INTO upload_files 
       (user_id, fingerprint, batch_id, tool_type, original_file_name, file_size, mime_type, r2_key, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [userId, fingerprint, batch, toolType, fileName, fileSize, mimeType, r2Key, 'uploaded']
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error uploading file to R2:', error);
    throw error;
  }
}

/**
 * 更新文件状态
 * @param fileId 文件ID
 * @param status 新状态
 * @param errorMessage 错误信息（可选）
 */
export async function updateFileStatus(
  fileId: number,
  status: 'uploaded' | 'processing' | 'processed' | 'failed',
  errorMessage?: string
) {
  const db = getDb();

  try {
    await db.query(
      `UPDATE upload_files 
       SET status = $1, 
           error_message = $2, 
           updated_at = NOW() 
       WHERE id = $3`,
      [status, errorMessage || null, fileId]
    );
  } catch (error) {
    console.error('Error updating file status:', error);
    throw error;
  }
}

/**
 * 根据ID获取文件信息
 * @param fileId 文件ID
 */
export async function getFileById(fileId: number) {
  const db = getDb();

  try {
    const result = await db.query(
      `SELECT * FROM upload_files WHERE id = $1`,
      [fileId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error getting file by ID:', error);
    throw error;
  }
}

/**
 * 根据批次ID获取所有文件
 * @param batchId 批次ID
 */
export async function getFilesByBatchId(batchId: string) {
  const db = getDb();

  try {
    const result = await db.query(
      `SELECT * FROM upload_files WHERE batch_id = $1 ORDER BY created_at ASC`,
      [batchId]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting files by batch ID:', error);
    throw error;
  }
}

/**
 * 根据用户ID获取文件列表
 * @param userId 用户ID
 * @param toolType 工具类型（可选）
 * @param limit 限制数量
 */
export async function getFilesByUserId(
  userId: string,
  toolType?: string,
  limit: number = 50
) {
  const db = getDb();

  try {
    let query = `SELECT * FROM upload_files WHERE user_id = $1`;
    const params: any[] = [userId];

    if (toolType) {
      query += ` AND tool_type = $2`;
      params.push(toolType);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error getting files by user ID:', error);
    throw error;
  }
}

/**
 * 从 R2 下载文件
 * @param r2Key R2 存储路径
 */
export async function downloadFileFromR2(r2Key: string): Promise<Buffer> {
  try {
    const result = await R2.getObject({
      Bucket: r2Bucket,
      Key: r2Key,
    }).promise();

    return result.Body as Buffer;
  } catch (error) {
    console.error('Error downloading file from R2:', error);
    throw error;
  }
}

