'use client'
import HeadInfo from "~/components/HeadInfo";
import Header from "~/components/Header";
import Footer from "~/components/Footer";
import ToolsSidebar from "~/components/ToolsSidebar";
import AudioWaveform from "~/components/AudioWaveform";
import PricingModal from "~/components/PricingModal";
import ToolInternalLinks from "~/components/ToolInternalLinks";
import AudioCutterComponent from "./AudioCutterComponent";
import AudioConverterComponent from "./AudioConverterComponent";
import { useState, useEffect, useRef } from "react";
import { useCommonContext } from "~/context/common-context";
import { useFingerprint } from "~/hooks/useFingerprint";
import { useSession } from "next-auth/react";
import {
  CloudArrowUpIcon,
  MusicalNoteIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Markdown from "react-markdown";
import { v4 as uuidv4 } from 'uuid';

// 定义类型
type ProcessingStage = 'upload' | 'uploading' | 'processing' | 'completed' | 'error';

interface UploadedFileInfo {
  file: File;
  id?: number;
  progress: number;
  status: 'pending' | 'uploading' | 'uploaded' | 'processing' | 'processed' | 'failed';
  error?: string;
}

interface ProcessingResult {
  file_id: number;
  original_file_name: string;
  task_id?: string;
  task_status?: string;
  task_message?: string;
  processing_time_ms?: number;
  results: Array<{
    id: number;
    result_type: string;
    r2_key: string;
    download_url: string;
    file_size: number;
  }>;
}

const PageComponent = ({
  locale,
  toolSlug,
  toolPageText,
  toolsListText,
}: {
  locale: string;
  toolSlug: string;
  toolPageText: any;
  toolsListText: any;
}) => {
  // 状态管理
  const [stage, setStage] = useState<ProcessingStage>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([]);
  const [batchId, setBatchId] = useState<string>('');
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<{ remaining: number; limit: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  // 为每个音轨单独管理格式状态 (key: result_type, value: format)
  const [audioFormats, setAudioFormats] = useState<Record<string, 'mp3' | 'wav'>>({});
  const [subscribeStatus, setSubscribeStatus] = useState<string>('');
  // Audio Splitter 声源选择
  const [soundSource, setSoundSource] = useState<string>('all');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const { setShowLoadingModal, setShowPricingModal, setShowLoginModal, userData } = useCommonContext();
  const { fingerprint, isLoading: fingerprintLoading } = useFingerprint();
  const { data: session, status } = useSession();

  // 获取用户ID
  // @ts-ignore
  const userId = userData?.user_id || session?.user?.user_id || null;

  // 定义内部链接配置
  const getInternalLinks = () => {
    const tools = {
      'vocal-remover': {
        slug: 'vocal-remover',
        name: toolsListText.vocalRemover,
        description: toolsListText.vocalRemoverDesc,
        emoji: '🎤'
      },
      'audio-splitter': {
        slug: 'audio-splitter',
        name: toolsListText.audioSplitter,
        description: toolsListText.audioSplitterDesc,
        emoji: '🎚️'
      },
      'audio-cutter': {
        slug: 'audio-cutter',
        name: toolsListText.audioCutter,
        description: toolsListText.audioCutterDesc,
        emoji: '✂️'
      },
      'audio-converter': {
        slug: 'audio-converter',
        name: toolsListText.audioConverter,
        description: toolsListText.audioConverterDesc,
        emoji: '🔄'
      }
    };

    // 根据当前工具返回相关链接
    switch (toolSlug) {
      case 'vocal-remover':
        // Vocal Remover → Audio Cutter (分离后可以剪辑)
        return [tools['audio-cutter']];
      case 'audio-splitter':
        // Audio Splitter → Vocal Remover (不提供人声分离，可以链接到vocal remover)
        return [tools['vocal-remover']];
      case 'audio-cutter':
        // Audio Cutter → Vocal Remover 和 Audio Splitter (剪辑前可以先分离)
        return [tools['vocal-remover'], tools['audio-splitter']];
      default:
        return [];
    }
  };

  // 工具代码映射
  const toolCodeMap: { [key: string]: string } = {
    'vocal-remover': 'vocal_remover',
    'audio-splitter': 'audio_splitter',
    'karaoke-maker': 'karaoke_maker',
    'extract-vocals': 'extract_vocals',
    'acapella-maker': 'acapella_maker',
    'noise-reducer': 'noise_reducer',
    'audio-converter': 'audio_converter',
  };
  const toolCode = toolCodeMap[toolSlug] || 'vocal_remover';

  const useCustomEffect = (effect, deps) => {
    const isInitialMount = useRef(true);

    useEffect(() => {
      if (process.env.NODE_ENV === 'production' || isInitialMount.current) {
        isInitialMount.current = false;
        return effect();
      }
    }, deps);
  };

  useCustomEffect(() => {
    setShowLoadingModal(false);
    window.scrollTo(0, 0);
    return () => { }
  }, []);

  // 检查使用限制
  useEffect(() => {
    if (!fingerprintLoading && fingerprint) {
      checkLimit();
    }
  }, [fingerprint, fingerprintLoading, userId]);

  // 获取用户订阅状态
  useEffect(() => {
    if (userId) {
      fetchSubscribeStatus();
    }
  }, [userId]);

  const checkLimit = async () => {
    try {
      const response = await fetch('/api/audio/checkLimit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint,
          user_id: userId,
          tool_code: toolCode
        })
      });

      const result = await response.json();
      if (result.success) {
        setUsageLimit(result.data);
      }
    } catch (error) {
      console.error('Failed to check usage limit:', error);
    }
  };

  const fetchSubscribeStatus = async () => {
    try {
      const response = await fetch(`/api/user/getAvailableTimes?userId=${userId}`);
      const result = await response.json();
      if (result.subscribeStatus) {
        setSubscribeStatus(result.subscribeStatus);
      }
    } catch (error) {
      console.error('Failed to fetch subscribe status:', error);
    }
  };

  // 文件选择处理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // 限制最多3个文件
    const maxFiles = userId ? 3 : 1;
    if (files.length > maxFiles) {
      setErrorMessage(`You can only upload ${maxFiles} file(s) at a time.`);
      return;
    }

    // 检查剩余次数
    if (usageLimit && files.length > usageLimit.remaining) {
      setErrorMessage(`You can only upload ${usageLimit.remaining} more file(s) today.`);
      return;
    }

    // 验证文件
    const validFiles: UploadedFileInfo[] = [];
    for (const file of files) {
      // 检查文件大小（最大100MB）
      if (file.size > 100 * 1024 * 1024) {
        setErrorMessage(`File ${file.name} exceeds 100MB limit.`);
        return;
      }

      // 检查文件类型
      if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|flac)$/i)) {
        setErrorMessage(`File ${file.name} is not a supported audio format.`);
        return;
      }

      validFiles.push({
        file,
        progress: 0,
        status: 'pending'
      });
    }

    setUploadedFiles(validFiles);
    setErrorMessage('');

    // 自动开始上传和处理
    setTimeout(() => {
      handleStartUpload(validFiles);
    }, 100);
  };

  // 开始上传
  const handleStartUpload = async (filesToUpload?: UploadedFileInfo[]) => {
    const files = filesToUpload || uploadedFiles;
    console.log('[Upload] Starting upload with files:', files.length);

    if (files.length === 0) {
      console.error('[Upload] No files to upload');
      return;
    }

    setStage('uploading');
    const batch = uuidv4();
    setBatchId(batch);
    console.log('[Upload] Batch ID:', batch);

    try {
      const formData = new FormData();
      formData.append('fingerprint', fingerprint);
      if (userId) formData.append('user_id', userId);
      formData.append('tool_type', toolCode);
      formData.append('batch_id', batch);

      files.forEach((fileInfo, index) => {
        formData.append(`file${index}`, fileInfo.file);
      });

      console.log('[Upload] Sending upload request...');
      const response = await fetch('/api/audio/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      console.log('[Upload] Upload response:', result);

      if (!result.success) {
        console.error('[Upload] Upload failed:', result.message);
        setErrorMessage(result.message);
        setStage('error');
        return;
      }

      // 更新文件ID - 使用传入的 files 参数而不是 uploadedFiles 状态
      console.log('[Upload] Files uploaded successfully, updating file IDs...');
      const updatedFiles = files.map((fileInfo, index) => ({
        ...fileInfo,
        id: result.data.files[index].id,
        status: 'uploaded' as const
      }));
      setUploadedFiles(updatedFiles);
      console.log('[Upload] Updated files:', updatedFiles);

      // 开始处理，传递 batch ID
      console.log('[Upload] Starting processing...');
      await startProcessing(updatedFiles, batch);
    } catch (error) {
      console.error('[Upload] Upload failed with error:', error);
      setErrorMessage('Upload failed. Please try again.');
      setStage('error');
    }
  };

  // 开始处理 - 调用后端 process API
  const startProcessing = async (files: UploadedFileInfo[], batch: string) => {
    console.log('[Processing] Starting processing for', files.length, 'files');
    setStage('processing');

    try {
      // 为每个文件调用 process API
      // 后端会自动处理：提交任务 → 轮询状态 → 下载结果 → 保存到数据库
      const processPromises = files.map(async (fileInfo, index) => {
        console.log(`[Processing] Processing file ${index + 1}/${files.length}, ID:`, fileInfo.id);

        // 构建请求体，audio-splitter 需要传递 sound_source 参数
        const requestBody: any = {
          file_id: fileInfo.id,
          fingerprint,
          user_id: userId,
          tool_code: toolCode
        };

        // 如果是 audio-splitter 且选择了非 all 的声源，添加 sound_source 参数
        if (toolSlug === 'audio-splitter' && soundSource !== 'all') {
          requestBody.sound_source = soundSource;
        }

        const response = await fetch('/api/audio/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        console.log(`[Processing] File ${index + 1} result:`, result);

        if (result.success) {
          return {
            ...fileInfo,
            status: 'processed' as const
          };
        } else {
          throw new Error(result.message);
        }
      });

      console.log('[Processing] Waiting for all files to complete...');
      await Promise.all(processPromises);
      console.log('[Processing] All files processed successfully');

      // 处理完成，获取结果
      console.log('[Processing] Fetching results...');
      await fetchResults(batch);
    } catch (error) {
      console.error('[Processing] Failed to process files:', error);
      setErrorMessage('Failed to process audio files. Please try again.');
      setStage('error');
    }
  };

  // 获取处理结果
  const fetchResults = async (batch?: string) => {
    const targetBatchId = batch || batchId;
    console.log('[Results] Fetching results for batch:', targetBatchId);

    if (!targetBatchId) {
      console.error('[Results] No batch_id available');
      setErrorMessage('No batch ID found.');
      setStage('error');
      return;
    }

    try {
      const response = await fetch('/api/audio/getResults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: targetBatchId })
      });

      const result = await response.json();
      console.log('[Results] Results response:', result);

      if (result.success) {
        // 转换结果格式
        const formattedResults: ProcessingResult[] = result.data.results.map((item: any) => ({
          file_id: item.upload_file_id,
          original_file_name: item.original_file_name,
          task_id: item.task_id,
          task_status: item.task_status,
          task_message: item.task_message,
          processing_time_ms: item.processing_time_ms,
          results: item.results || []
        }));

        console.log('[Results] Formatted results:', formattedResults);
        setProcessingResults(formattedResults);
        setStage('completed');
        console.log('[Results] Stage set to completed');
      } else {
        console.error('[Results] Failed to get results:', result.message);
        setErrorMessage(result.message || 'Failed to fetch results.');
        setStage('error');
      }
    } catch (error) {
      console.error('[Results] Failed to fetch results:', error);
      setErrorMessage('Failed to fetch results.');
      setStage('error');
    }
  };

  // 取消操作
  const handleCancel = () => {
    setStage('upload');
    setUploadedFiles([]);
    setBatchId('');
    setProcessingResults([]);
    setErrorMessage('');
    setSelectedFileIndex(0);
  };

  // 下载文件
  const handleDownload = async (r2_key: string, filename: string, format: 'mp3' | 'wav') => {
    try {
      console.log('[Download] Starting download:', { r2_key, filename, format, subscribeStatus });

      // WAV 格式已移除订阅限制，所有用户都可以下载
      console.log('[Download] Starting download');

      // 使用后端代理下载，避免跨域问题
      let downloadUrl = `/api/audio/download?r2_key=${encodeURIComponent(r2_key)}&filename=${encodeURIComponent(filename)}&format=${format}`;
      if (userId) {
        downloadUrl += `&user_id=${userId}`;
      }

      console.log('[Download] Download URL:', downloadUrl);

      // 创建下载链接
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename.replace(/\.(mp3|wav)$/i, `.${format}`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      console.log('[Download] Download triggered successfully');
    } catch (error) {
      console.error('[Download] Download failed:', error);
      setErrorMessage('Failed to download file. Please try again.');
    }
  };

  // Generate tool-specific keywords
  const getToolKeywords = (slug: string) => {
    const baseKeywords = "AI audio editing, audio processing, music editing, online audio tool";
    const toolKeywords = {
      'vocal-remover': 'vocal remover, remove vocals, vocal removal, AI vocal remover, remove vocals from song, vocal separator, instrumental maker, karaoke track, stem separation, extract instrumental, isolate vocals, vocal isolation, music separation, AI audio separation, online vocal remover, free vocal remover',
      'karaoke-maker': 'karaoke maker, karaoke creator, backing track, remove vocals, sing along, karaoke track maker',
      'extract-vocals': 'extract vocals, vocal isolation, acapella extraction, voice extractor, isolate vocals',
      'acapella-maker': 'acapella maker, vocal only, isolated vocals, voice track, acapella extractor',
      'noise-reducer': 'noise reducer, audio cleanup, remove background noise, denoise audio, audio noise removal',
      'audio-converter': 'audio converter, mp3 converter, wav converter, audio format converter, online audio converter',
    };
    return `${baseKeywords}, ${toolKeywords[slug] || ''}`;
  };

  return (
    <>
      <HeadInfo
        locale={locale}
        page={`tools/${toolSlug}`}
        title={toolPageText.title}
        description={toolPageText.description}
        keywords={getToolKeywords(toolSlug)}
      />
      <Header locale={locale} page={`tools/${toolSlug}`} />

      {/* Layout with Sidebar */}
      <div className="flex">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:block">
          <ToolsSidebar locale={locale} currentToolSlug={toolSlug} />
        </div>

        {/* Main Content */}
        <main className="flex-1 min-h-screen bg-gradient-to-b from-white to-neutral-50">
          {/* Hero Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4">
                {toolPageText.h1Text}
              </h1>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
                {toolPageText.descriptionBelowH1Text}
              </p>
            </div>

            {/* Upload Section */}
            <div className={
              stage === 'completed'
                ? 'max-w-6xl mx-auto'
                : toolSlug === 'audio-splitter'
                  ? 'max-w-5xl mx-auto'
                  : 'max-w-4xl mx-auto'
            }>
              <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8 sm:p-12">
                {/* Audio Cutter & Converter - 使用独立组件 */}
                {toolSlug === 'audio-cutter' ? (
                  <AudioCutterComponent toolPageText={toolPageText} />
                ) : toolSlug === 'audio-converter' ? (
                  <AudioConverterComponent toolPageText={toolPageText} />
                ) : (
                  <>
                    {/* 使用限制提示 - 仅非 audio-splitter 显示 */}
                    {usageLimit && stage === 'upload' && toolSlug !== 'audio-splitter' && (
                      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          {userId
                            ? `You have ${usageLimit.remaining} of ${usageLimit.limit} daily uploads remaining.`
                            : (
                              <>
                                Free users can upload {usageLimit.remaining} file per day.{' '}
                                <button
                                  onClick={() => setShowLoginModal(true)}
                                  className="underline font-semibold hover:text-blue-900 transition-colors"
                                >
                                  Register
                                </button> for more!
                              </>
                            )
                          }
                        </p>
                      </div>
                    )}

                    {/* 错误提示 */}
                    {errorMessage && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                        <p className="text-sm text-red-800">{errorMessage}</p>
                        <button onClick={() => setErrorMessage('')} className="text-red-600 hover:text-red-800">
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    {/* 上传阶段 */}
                    {stage === 'upload' && uploadedFiles.length === 0 && (
                  <div className="space-y-5">
                    {/* 声源选择 - 仅 Audio Splitter 显示 */}
                    {toolSlug === 'audio-splitter' && toolPageText.soundSourceLabel && (
                      <div className="bg-white border border-neutral-200 rounded-xl p-5">
                        {/* Layer 1: Use-case Presets */}
                        <div className="mb-6">
                          <h3 className="text-base font-semibold text-neutral-900 mb-3">
                            {toolPageText.presetsLabel || 'Select a Use-case'}
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {[
                              { id: 'karaoke', label: toolPageText.presetKaraoke, desc: toolPageText.presetKaraokeDesc, value: 'all', icon: '🎤' },
                              { id: 'vocal', label: toolPageText.presetVocal, desc: toolPageText.presetVocalDesc, value: 'all', icon: '👤' },
                              { id: 'drums', label: toolPageText.presetDrums, desc: toolPageText.presetDrumsDesc, value: 'drums', icon: '🥁' },
                              { id: 'piano', label: toolPageText.presetPiano, desc: toolPageText.presetPianoDesc, value: 'piano', icon: '🎹' },
                              { id: 'remix', label: toolPageText.presetRemix, desc: toolPageText.presetRemixDesc, value: 'all', icon: '🎚️' },
                            ].map((preset) => (
                              <button
                                key={preset.id}
                                onClick={() => {
                                  setSoundSource(preset.value);
                                  setActivePreset(preset.id);
                                }}
                                className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                                  activePreset === preset.id
                                    ? 'border-brand-500 bg-brand-50'
                                    : 'border-neutral-200 hover:border-brand-300 bg-white'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="text-2xl">{preset.icon}</span>
                                  <div>
                                    <p className={`font-semibold ${activePreset === preset.id ? 'text-brand-700' : 'text-neutral-900'}`}>
                                      {preset.label}
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-1">
                                      {preset.desc}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Layer 2: Advanced (Manual Stem Selection) */}
                        <div>
                          <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-brand-600 transition-colors mb-3"
                          >
                            <span>{showAdvanced ? (toolPageText.advancedToggleHide || 'Hide Advanced Options') : (toolPageText.advancedToggleShow || 'Show Advanced Options')}</span>
                            <svg
                              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {showAdvanced && (
                            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 animate-fadeIn">
                              <h4 className="text-sm font-semibold text-neutral-700 mb-3">
                                {toolPageText.advancedLabel || 'Manual Stem Selection'}
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                {/* All Stems */}
                                <button
                                  onClick={() => {
                                    setSoundSource('all');
                                    setActivePreset(null);
                                  }}
                                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                                    soundSource === 'all'
                                      ? 'border-brand-500 bg-brand-500 text-white shadow-md'
                                      : 'border-neutral-200 hover:border-brand-300 bg-white'
                                  }`}
                                >
                                  <p className={`text-sm font-semibold ${soundSource === 'all' ? 'text-white' : 'text-neutral-900'}`}>
                                    {toolPageText.soundSourceAll?.replace(' (4 tracks)', '') || 'All Stems'}
                                  </p>
                                </button>

                                {/* Bass Only */}
                                <button
                                  onClick={() => {
                                    setSoundSource('bass');
                                    setActivePreset(null);
                                  }}
                                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                                    soundSource === 'bass'
                                      ? 'border-brand-500 bg-brand-500 text-white shadow-md'
                                      : 'border-neutral-200 hover:border-brand-300 bg-white'
                                  }`}
                                >
                                  <p className={`text-sm font-semibold ${soundSource === 'bass' ? 'text-white' : 'text-neutral-900'}`}>
                                    {toolPageText.soundSourceBass?.replace(' Only', '') || 'Bass'}
                                  </p>
                                </button>

                                {/* Drums Only */}
                                <button
                                  onClick={() => {
                                    setSoundSource('drums');
                                    setActivePreset(null);
                                  }}
                                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                                    soundSource === 'drums'
                                      ? 'border-brand-500 bg-brand-500 text-white shadow-md'
                                      : 'border-neutral-200 hover:border-brand-300 bg-white'
                                  }`}
                                >
                                  <p className={`text-sm font-semibold ${soundSource === 'drums' ? 'text-white' : 'text-neutral-900'}`}>
                                    {toolPageText.soundSourceDrums?.replace(' Only', '') || 'Drums'}
                                  </p>
                                </button>

                                {/* Piano Only */}
                                <button
                                  onClick={() => {
                                    setSoundSource('piano');
                                    setActivePreset(null);
                                  }}
                                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                                    soundSource === 'piano'
                                      ? 'border-brand-500 bg-brand-500 text-white shadow-md'
                                      : 'border-neutral-200 hover:border-brand-300 bg-white'
                                  }`}
                                >
                                  <p className={`text-sm font-semibold ${soundSource === 'piano' ? 'text-white' : 'text-neutral-900'}`}>
                                    {toolPageText.soundSourcePiano?.replace(' Only', '') || 'Piano'}
                                  </p>
                                </button>

                                {/* Guitar Only */}
                                <button
                                  onClick={() => {
                                    setSoundSource('guitar');
                                    setActivePreset(null);
                                  }}
                                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                                    soundSource === 'guitar'
                                      ? 'border-brand-500 bg-brand-500 text-white shadow-md'
                                      : 'border-neutral-200 hover:border-brand-300 bg-white'
                                  }`}
                                >
                                  <p className={`text-sm font-semibold ${soundSource === 'guitar' ? 'text-white' : 'text-neutral-900'}`}>
                                    {toolPageText.soundSourceGuitar?.replace(' Only', '') || 'Guitar'}
                                  </p>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 上传区域 */}
                    <div className="text-center">
                      <label htmlFor="file-upload" className="cursor-pointer block">
                        <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 hover:border-brand-500 transition-colors bg-neutral-50">
                          <CloudArrowUpIcon className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
                          <p className="text-sm text-neutral-600 mb-4">
                            Supports MP3, WAV, FLAC • Max 100MB{userId && ' • Upload up to 3 files'}
                          </p>
                          <div className="inline-block">
                            <div className="px-8 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-lg hover:from-brand-600 hover:to-brand-700 transition-all shadow-md hover:shadow-lg">
                              Choose Audio File{userId && 's'}
                            </div>
                          </div>
                        </div>
                        <input
                          id="file-upload"
                          type="file"
                          className="hidden"
                          accept="audio/*,.mp3,.wav,.flac"
                          multiple={!!userId}
                          onChange={handleFileSelect}
                        />
                      </label>
                    </div>
                  </div>
                )}



                {/* 上传中 */}
                {stage === 'uploading' && (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 mb-4">
                        <CloudArrowUpIcon className="w-8 h-8 text-brand-600 animate-bounce" />
                      </div>
                      <h3 className="text-xl font-semibold text-neutral-900 mb-2">Uploading Files...</h3>
                      <p className="text-neutral-600">Please wait while we upload your audio files</p>
                    </div>
                    <button onClick={handleCancel} className="w-full btn-secondary">
                      Cancel
                    </button>
                  </div>
                )}

                {/* 处理中 */}
                {stage === 'processing' && (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 mb-4">
                        <svg className="animate-spin h-8 w-8 text-brand-600" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-neutral-900 mb-2">Processing Audio...</h3>
                      <p className="text-neutral-600">AI is separating vocals and instrumentals</p>
                      <p className="text-sm text-neutral-500 mt-2">This may take 1-3 minutes per file</p>
                    </div>

                    {/* 显示处理进度 */}
                    <div className="space-y-3">
                      {uploadedFiles.map((fileInfo, index) => (
                        <div key={index} className="p-4 bg-neutral-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <MusicalNoteIcon className="w-6 h-6 text-brand-600" />
                              <div>
                                <p className="font-semibold text-neutral-900">{fileInfo.file.name}</p>
                                <p className="text-sm text-neutral-600">Processing audio...</p>
                              </div>
                            </div>
                            <svg className="animate-spin h-5 w-5 text-brand-600" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button onClick={handleCancel} className="w-full btn-secondary">
                      Cancel
                    </button>
                  </div>
                )}

                {/* 处理完成 - 结果展示 */}
                {stage === 'completed' && processingResults.length > 0 && (
                  <div className="space-y-6">
                    {/* 成功提示 */}
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                        <CheckCircleIcon className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-neutral-900 mb-2">Processing Complete!</h3>
                      <p className="text-neutral-600">Your audio has been successfully separated</p>
                    </div>

                    {/* 文件选择器（多文件时） */}
                    {processingResults.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {processingResults.map((result, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedFileIndex(index)}
                            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                              selectedFileIndex === index
                                ? 'bg-brand-600 text-white'
                                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                            }`}
                          >
                            {result.original_file_name}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 当前选中文件的结果 */}
                    {processingResults[selectedFileIndex] && (
                      <div className="space-y-4">
                        <div className="text-center">
                          <h4 className="font-semibold text-neutral-900">
                            {processingResults[selectedFileIndex].original_file_name}
                          </h4>
                          {processingResults[selectedFileIndex].processing_time_ms && (
                            <p className="text-sm text-neutral-600 mt-1">
                              Processing time: {(processingResults[selectedFileIndex].processing_time_ms! / 1000).toFixed(1)}s
                            </p>
                          )}
                        </div>

                        {/* 显示所有结果文件 */}
                        {processingResults[selectedFileIndex].results.map((result, idx) => {
                          const isNoVocals = result.result_type.includes('no_vocals');
                          const isVocals = result.result_type.includes('vocals') && !isNoVocals;
                          const currentFormat = audioFormats[result.result_type] || 'mp3';

                          return (
                            <div
                              key={idx}
                              className={`p-6 rounded-xl border ${
                                isVocals
                                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'
                                  : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <MusicalNoteIcon className={`w-6 h-6 ${isVocals ? 'text-purple-600' : 'text-blue-600'}`} />
                                  <div>
                                    <h5 className="font-semibold text-neutral-900">
                                      {isVocals ? 'Vocals' : isNoVocals ? 'Instrumental (No Vocals)' : result.result_type}
                                    </h5>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {/* 格式选择 */}
                                  <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
                                    <button
                                      onClick={() => setAudioFormats(prev => ({ ...prev, [result.result_type]: 'mp3' }))}
                                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                        currentFormat === 'mp3'
                                          ? 'bg-brand-600 text-white'
                                          : 'text-neutral-600 hover:bg-neutral-100'
                                      }`}
                                    >
                                      MP3
                                    </button>
                                    <button
                                      onClick={() => setAudioFormats(prev => ({ ...prev, [result.result_type]: 'wav' }))}
                                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                        currentFormat === 'wav'
                                          ? 'bg-brand-600 text-white'
                                          : 'text-neutral-600 hover:bg-neutral-100'
                                      }`}
                                    >
                                      WAV
                                    </button>
                                  </div>

                                  {/* 下载按钮 */}
                                  <button
                                    onClick={() => handleDownload(
                                      result.r2_key,
                                      result.result_type,
                                      currentFormat
                                    )}
                                    className={`p-3 bg-white rounded-lg shadow-sm transition-colors ${
                                      isVocals
                                        ? 'hover:bg-purple-100'
                                        : 'hover:bg-blue-100'
                                    }`}
                                  >
                                    <ArrowDownTrayIcon className={`w-5 h-5 ${isVocals ? 'text-purple-600' : 'text-blue-600'}`} />
                                  </button>
                                </div>
                              </div>

                              {/* 音频波形播放器 */}
                              <AudioWaveform
                                audioUrl={result.download_url}
                                waveColor={isVocals ? '#9333ea' : '#2563eb'}
                                progressColor={isVocals ? '#c084fc' : '#60a5fa'}
                                height={60}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 提示信息 */}
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        {userId ? (
                          <>
                            Your results are saved in <a href={`/${locale}/my`} className="underline font-semibold">My Audio</a>.
                            You can access them anytime.
                          </>
                        ) : (
                          <>
                            ⚠️ Results are not saved for anonymous users.
                            <button
                              onClick={() => setShowLoginModal(true)}
                              className="underline font-semibold ml-1 hover:text-brand-700 transition-colors"
                            >
                              Register
                            </button> to save your work!
                          </>
                        )}
                      </p>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancel}
                        className="flex-1 btn-primary"
                      >
                        Process Another File
                      </button>
                    </div>
                  </div>
                )}
                  </>
                )}
              </div>
            </div>
          </section>

          {/* How to Use Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">
              {toolPageText.howToUseTitle || 'How to Use'}
            </h2>
            <div className={`grid grid-cols-1 gap-8 ${toolPageText.step4Title && toolPageText.step4Desc ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 text-brand-600 font-bold text-xl mb-4">
                  1
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">
                  {toolPageText.step1Title || 'Upload Audio'}
                </h3>
                <p className="text-neutral-600 text-sm">
                  {toolPageText.step1Desc || 'Choose your audio file from your device'}
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 text-brand-600 font-bold text-xl mb-4">
                  2
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">
                  {toolPageText.step2Title || 'Process'}
                </h3>
                <p className="text-neutral-600 text-sm">
                  {toolPageText.step2Desc || 'AI processes your audio automatically'}
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 text-brand-600 font-bold text-xl mb-4">
                  3
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">
                  {toolPageText.step3Title || 'Download'}
                </h3>
                <p className="text-neutral-600 text-sm">
                  {toolPageText.step3Desc || 'Get your processed audio file'}
                </p>
              </div>
              {toolPageText.step4Title && toolPageText.step4Desc && (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 text-brand-600 font-bold text-xl mb-4">
                    4
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-2">
                    {toolPageText.step4Title}
                  </h3>
                  <p className="text-neutral-600 text-sm">
                    {toolPageText.step4Desc}
                  </p>
                </div>
              )}
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">
                {toolPageText.featuresTitle || 'Key Features'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((num) => {
                  const featureTitle = toolPageText[`feature${num}Title`];
                  const featureDesc = toolPageText[`feature${num}Desc`];
                  if (!featureTitle) return null;

                  return (
                    <div key={num} className="flex gap-4">
                      <CheckCircleIcon className="w-6 h-6 text-brand-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-1">
                          {featureTitle}
                        </h3>
                        <p className="text-neutral-600 text-sm">
                          {featureDesc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">
              {toolPageText.faqTitle || 'Frequently Asked Questions'}
            </h2>
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((num) => {
                const question = toolPageText[`faq${num}Q`];
                const answer = toolPageText[`faq${num}A`];
                if (!question) return null;

                return (
                  <div key={num} className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                    <h3 className="font-semibold text-neutral-900 mb-2">
                      {question}
                    </h3>
                    <div className="text-neutral-600 prose prose-sm max-w-none">
                      <Markdown>{answer}</Markdown>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </section>

          {/* Internal Links Section */}
          {getInternalLinks().length > 0 && (
            <ToolInternalLinks
              locale={locale}
              currentToolSlug={toolSlug}
              links={getInternalLinks()}
              title={toolPageText.relatedToolsTitle || "Related Tools"}
            />
          )}

          {/* SEO Content Section */}
          {toolPageText.seoContent && (
            <section className="bg-neutral-50 py-16">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="prose prose-neutral max-w-none">
                  <Markdown>{toolPageText.seoContent}</Markdown>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      <Footer locale={locale} page="tools" />

      {/* Pricing Modal */}
      <PricingModal locale={locale} page={`tools/${toolSlug}`} />
    </>
  );
};

export default PageComponent;

