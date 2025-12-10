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
 *
 * 处理流程：
 * 1. 提交任务到 Demucs 服务
 * 2. 轮询任务状态（每 20 秒）
 * 3. 任务完成后下载结果文件
 * 4. 保存到 R2 和数据库
 */

import { getFileById, updateFileStatus, downloadFileFromR2 } from "~/servers/uploadFile";
import {
  createProcessingTask,
  updateProcessingTask,
  saveProcessingResultDetail
} from "~/servers/processingResult";
import { incrementUsageCount } from "~/servers/usageLimit";
import FormData from 'form-data';
import fetch from 'node-fetch';

// 轮询间隔（毫秒）
const POLL_INTERVAL = 20000; // 20 秒

// 最大轮询次数（避免无限轮询）
const MAX_POLL_COUNT = 180; // 最多轮询 1 小时

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { file_id, fingerprint, user_id, sound_source, tool_code } = json;

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
      const demucsUrl = process.env.DEMUCS_SERVICE_URL || 'http://localhost:8000';

      // 步骤 1: 提交任务到 Demucs 服务
      console.log(`[Process] Submitting task for file ${file_id} to Demucs service...`);

      // 从 R2 下载文件
      const fileBuffer = await downloadFileFromR2(fileInfo.r2_key);

      // 创建 FormData
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileInfo.original_file_name,
        contentType: fileInfo.mime_type,
      });

      // 根据 sound_source 参数确定 model 和 stems
      let model = 'htdemucs';
      let stems = '4stems';
      let soundSourceParam = '';

      if (sound_source) {
        // 如果选择了 piano 或 guitar，使用 htdemucs_6s 模型和 6stems
        if (sound_source === 'piano' || sound_source === 'guitar') {
          model = 'htdemucs_6s';
          stems = '6stems';
          soundSourceParam = `&sound_source=${sound_source}`;
        }
        // 如果选择了 bass 或 drums，使用 2stems
        else if (sound_source === 'bass' || sound_source === 'drums') {
          stems = '2stems';
          soundSourceParam = `&sound_source=${sound_source}`;
        }
        // vocals 不在 audio-splitter 中使用，但保留兼容性
        else if (sound_source === 'vocals') {
          stems = '2stems';
          soundSourceParam = `&sound_source=${sound_source}`;
        }
      } else {
        // 默认行为：vocal-remover 使用 2stems
        // audio-splitter 选择 all 时使用 4stems
        if (tool_code === 'vocal_remover') {
          stems = '2stems';
        }
      }

      // 提交任务（使用队列模式）
      const submitUrl = `${demucsUrl}/separate?use_queue=true&model=${model}&stems=${stems}&mp3=false${soundSourceParam}`;
      console.log(`[Process] Submitting to Demucs: ${submitUrl}`);

      const submitResponse = await fetch(submitUrl, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
        timeout: 60000, // 60 秒超时
      });

      if (!submitResponse.ok) {
        throw new Error(`Failed to submit task: ${submitResponse.statusText}`);
      }

      const submitResult = await submitResponse.json();
      const taskId = submitResult.task_id;
      const taskStatus = submitResult.status;
      const taskMessage = submitResult.message || '';

      console.log(`[Process] Task submitted: ${taskId}, status: ${taskStatus}`);

      // 保存任务信息到数据库
      await createProcessingTask(file_id, taskId, taskStatus, taskMessage);

      // 步骤 2: 轮询任务状态
      let pollCount = 0;
      let currentStatus = taskStatus;
      let taskResult = null;

      while (pollCount < MAX_POLL_COUNT) {
        // 如果任务已完成或失败，退出轮询
        if (currentStatus === 'completed' || currentStatus === 'failed') {
          break;
        }

        // 等待 20 秒
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        pollCount++;

        console.log(`[Process] Polling task ${taskId}, attempt ${pollCount}...`);

        // 查询任务状态
        const pollResponse = await fetch(`${demucsUrl}/task/${taskId}`, {
          timeout: 30000, // 30 秒超时
        });

        if (!pollResponse.ok) {
          console.error(`[Process] Failed to poll task: ${pollResponse.statusText}`);
          continue; // 继续轮询
        }

        taskResult = await pollResponse.json();
        currentStatus = taskResult.status;

        console.log(`[Process] Task status: ${currentStatus}, progress: ${taskResult.progress || 0}`);

        // 更新任务状态到数据库
        await updateProcessingTask(
          file_id,
          currentStatus,
          taskResult.message || ''
        );
      }

      // 检查任务是否成功完成
      if (currentStatus !== 'completed') {
        throw new Error(
          currentStatus === 'failed'
            ? `Task failed: ${taskResult?.error || 'Unknown error'}`
            : 'Task timeout or incomplete'
        );
      }

      // 步骤 3: 下载结果文件
      console.log(`[Process] Task completed, downloading results...`);

      const outputFiles = taskResult.output_files || [];
      if (outputFiles.length === 0) {
        throw new Error('No output files returned from Demucs service');
      }

      // 计算处理耗时
      let processingTimeMs = 0;
      if (taskResult.created_at && taskResult.completed_at) {
        const createdAt = new Date(taskResult.created_at).getTime();
        const completedAt = new Date(taskResult.completed_at).getTime();
        processingTimeMs = completedAt - createdAt;
      }

      // 更新处理耗时
      await updateProcessingTask(
        file_id,
        currentStatus,
        taskResult.message || '处理完成',
        processingTimeMs
      );

      // 下载并保存每个结果文件
      for (const filename of outputFiles) {
        console.log(`[Process] Downloading ${filename}...`);

        const downloadResponse = await fetch(
          `${demucsUrl}/download/${taskId}/${filename}`,
          {
            timeout: 600000, // 10 分钟超时
          }
        );

        if (!downloadResponse.ok) {
          console.error(`[Process] Failed to download ${filename}: ${downloadResponse.statusText}`);
          continue;
        }

        const resultBuffer = Buffer.from(await downloadResponse.arrayBuffer());
        const mimeType = 'audio/mpeg'; // MP3 格式

        // 保存到 R2 和数据库
        await saveProcessingResultDetail(
          file_id,
          filename, // result_type 使用文件名
          resultBuffer,
          mimeType
        );

        console.log(`[Process] Saved ${filename}, size: ${resultBuffer.length} bytes`);
      }

      // 更新文件状态为已处理
      await updateFileStatus(file_id, 'processed');

      // 增加使用次数
      await incrementUsageCount(
        fingerprint || null,
        user_id || null,
        fileInfo.tool_type
      );

      console.log(`[Process] File ${file_id} processed successfully`);

      return Response.json({
        success: true,
        message: 'Audio processed successfully',
        data: {
          file_id,
          task_id: taskId,
          processing_time_ms: processingTimeMs,
          output_files: outputFiles
        }
      });
    } catch (error) {
      // 处理失败，更新状态
      console.error(`[Process] Error processing file ${file_id}:`, error);
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

