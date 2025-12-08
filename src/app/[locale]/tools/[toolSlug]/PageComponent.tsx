'use client'
import HeadInfo from "~/components/HeadInfo";
import Header from "~/components/Header";
import Footer from "~/components/Footer";
import ToolsSidebar from "~/components/ToolsSidebar";
import { useState, useEffect, useRef } from "react";
import { useCommonContext } from "~/context/common-context";
import { useFingerprint } from "~/hooks/useFingerprint";
import { useSession } from "next-auth/react";
import {
  CloudArrowUpIcon,
  MusicalNoteIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  PlayIcon,
  PauseIcon
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
  results: {
    vocals?: { download_url: string; file_size: number };
    instrumental?: { download_url: string; file_size: number };
  };
}

const PageComponent = ({
  locale,
  toolSlug,
  toolPageText,
}: {
  locale: string;
  toolSlug: string;
  toolPageText: any;
}) => {
  // 状态管理
  const [stage, setStage] = useState<ProcessingStage>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([]);
  const [batchId, setBatchId] = useState<string>('');
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<{ remaining: number; limit: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 音频播放状态
  const [playingTrack, setPlayingTrack] = useState<'vocals' | 'instrumental' | null>(null);
  const vocalsAudioRef = useRef<HTMLAudioElement>(null);
  const instrumentalAudioRef = useRef<HTMLAudioElement>(null);

  const { setShowLoadingModal, userData } = useCommonContext();
  const { fingerprint, isLoading: fingerprintLoading } = useFingerprint();
  const { data: session, status } = useSession();

  // 获取用户ID
  // @ts-ignore
  const userId = userData?.user_id || session?.user?.user_id || null;

  // 工具代码映射
  const toolCodeMap: { [key: string]: string } = {
    'vocal-remover': 'vocal_remover',
    'karaoke-maker': 'karaoke_maker',
    'extract-vocals': 'extract_vocals',
    'acapella-maker': 'acapella_maker',
    'noise-reducer': 'noise_reducer',
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
    return () => { }
  }, []);

  // 检查使用限制
  useEffect(() => {
    if (!fingerprintLoading && fingerprint) {
      checkLimit();
    }
  }, [fingerprint, fingerprintLoading, userId]);

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
  };

  // 开始上传
  const handleStartUpload = async () => {
    if (uploadedFiles.length === 0) return;

    setStage('uploading');
    const batch = uuidv4();
    setBatchId(batch);

    try {
      const formData = new FormData();
      formData.append('fingerprint', fingerprint);
      if (userId) formData.append('user_id', userId);
      formData.append('tool_type', toolCode);
      formData.append('batch_id', batch);

      uploadedFiles.forEach((fileInfo, index) => {
        formData.append(`file${index}`, fileInfo.file);
      });

      const response = await fetch('/api/audio/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        setErrorMessage(result.message);
        setStage('error');
        return;
      }

      // 更新文件ID
      const updatedFiles = uploadedFiles.map((fileInfo, index) => ({
        ...fileInfo,
        id: result.data.files[index].id,
        status: 'uploaded' as const
      }));
      setUploadedFiles(updatedFiles);

      // 开始处理
      await startProcessing(updatedFiles);
    } catch (error) {
      console.error('Upload failed:', error);
      setErrorMessage('Upload failed. Please try again.');
      setStage('error');
    }
  };

  // 开始处理
  const startProcessing = async (files: UploadedFileInfo[]) => {
    setStage('processing');

    try {
      // 并行处理所有文件
      const processingPromises = files.map(async (fileInfo) => {
        const response = await fetch('/api/audio/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_id: fileInfo.id,
            fingerprint,
            user_id: userId
          })
        });

        const result = await response.json();
        return { fileInfo, result };
      });

      await Promise.all(processingPromises);

      // 获取处理结果
      await fetchResults();
    } catch (error) {
      console.error('Processing failed:', error);
      setErrorMessage('Processing failed. Please try again.');
      setStage('error');
    }
  };

  // 获取处理结果
  const fetchResults = async () => {
    try {
      const response = await fetch('/api/audio/getResults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: batchId })
      });

      const result = await response.json();

      if (result.success) {
        // 转换结果格式
        const formattedResults: ProcessingResult[] = result.data.results.map((item: any) => ({
          file_id: item.upload_file_id,
          original_file_name: item.original_file_name,
          results: {
            vocals: item.results.find((r: any) => r.result_type === 'vocals'),
            instrumental: item.results.find((r: any) => r.result_type === 'instrumental')
          }
        }));

        setProcessingResults(formattedResults);
        setStage('completed');
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
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

  // 音频播放控制
  const togglePlay = (track: 'vocals' | 'instrumental') => {
    const audioRef = track === 'vocals' ? vocalsAudioRef : instrumentalAudioRef;
    const otherRef = track === 'vocals' ? instrumentalAudioRef : vocalsAudioRef;

    if (playingTrack === track) {
      audioRef.current?.pause();
      setPlayingTrack(null);
    } else {
      otherRef.current?.pause();
      audioRef.current?.play();
      setPlayingTrack(track);
    }
  };

  // 下载文件
  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Generate tool-specific keywords
  const getToolKeywords = (slug: string) => {
    const baseKeywords = "AI audio editing, audio processing, music editing, online audio tool";
    const toolKeywords = {
      'vocal-remover': 'vocal remover, remove vocals, instrumental maker, karaoke track, stem separation',
      'karaoke-maker': 'karaoke maker, karaoke creator, backing track, remove vocals, sing along',
      'extract-vocals': 'extract vocals, vocal isolation, acapella extraction, voice extractor',
      'acapella-maker': 'acapella maker, vocal only, isolated vocals, voice track',
      'noise-reducer': 'noise reducer, audio cleanup, remove background noise, denoise audio',
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
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4">
                {toolPageText.h1Text}
              </h1>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
                {toolPageText.descriptionBelowH1Text}
              </p>
            </div>

            {/* Upload Section */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8 sm:p-12">
                {/* 使用限制提示 */}
                {usageLimit && stage === 'upload' && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {userId
                        ? `You have ${usageLimit.remaining} of ${usageLimit.limit} daily uploads remaining.`
                        : `Free users can upload ${usageLimit.remaining} file per day. Register for more!`
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
                  <div className="text-center">
                    <label htmlFor="file-upload" className="cursor-pointer block">
                      <div className="border-2 border-dashed border-neutral-300 rounded-xl p-12 hover:border-brand-500 transition-colors">
                        <CloudArrowUpIcon className="w-16 h-16 mx-auto text-neutral-400 mb-4" />
                        <p className="text-lg font-semibold text-neutral-900 mb-2">
                          {toolPageText.uploadTitle || 'Upload your audio file'}
                        </p>
                        <p className="text-neutral-600 mb-4">
                          {toolPageText.uploadDesc || 'Click to browse or drag and drop'}
                        </p>
                        <p className="text-sm text-neutral-500">
                          Supports MP3, WAV, FLAC (Max 100MB)
                          {userId && ' • Upload up to 3 files at once'}
                        </p>
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
                )}

                {/* 文件列表（上传前） */}
                {stage === 'upload' && uploadedFiles.length > 0 && (
                  <div className="space-y-4">
                    {uploadedFiles.map((fileInfo, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <MusicalNoteIcon className="w-8 h-8 text-brand-600" />
                          <div>
                            <p className="font-semibold text-neutral-900">{fileInfo.file.name}</p>
                            <p className="text-sm text-neutral-600">
                              {(fileInfo.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setUploadedFiles(files => files.filter((_, i) => i !== index))}
                          className="text-neutral-600 hover:text-neutral-900"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ))}

                    <div className="flex gap-3">
                      <button
                        onClick={handleStartUpload}
                        className="flex-1 btn-primary"
                      >
                        Start Processing
                      </button>
                      <button
                        onClick={() => setUploadedFiles([])}
                        className="px-6 py-3 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                      >
                        Clear All
                      </button>
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
                        <h4 className="font-semibold text-neutral-900 text-center">
                          {processingResults[selectedFileIndex].original_file_name}
                        </h4>

                        {/* Vocals 音轨 */}
                        {processingResults[selectedFileIndex].results.vocals && (
                          <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <MusicalNoteIcon className="w-6 h-6 text-purple-600" />
                                <div>
                                  <h5 className="font-semibold text-neutral-900">Vocals</h5>
                                  <p className="text-sm text-neutral-600">
                                    {(processingResults[selectedFileIndex].results.vocals!.file_size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => togglePlay('vocals')}
                                  className="p-3 bg-white rounded-lg hover:bg-purple-100 transition-colors"
                                >
                                  {playingTrack === 'vocals' ? (
                                    <PauseIcon className="w-5 h-5 text-purple-600" />
                                  ) : (
                                    <PlayIcon className="w-5 h-5 text-purple-600" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDownload(
                                    processingResults[selectedFileIndex].results.vocals!.download_url,
                                    `${processingResults[selectedFileIndex].original_file_name}_vocals.wav`
                                  )}
                                  className="p-3 bg-white rounded-lg hover:bg-purple-100 transition-colors"
                                >
                                  <ArrowDownTrayIcon className="w-5 h-5 text-purple-600" />
                                </button>
                              </div>
                            </div>
                            <audio
                              ref={vocalsAudioRef}
                              src={processingResults[selectedFileIndex].results.vocals!.download_url}
                              onEnded={() => setPlayingTrack(null)}
                              className="w-full"
                              controls
                            />
                          </div>
                        )}

                        {/* Instrumental 音轨 */}
                        {processingResults[selectedFileIndex].results.instrumental && (
                          <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <MusicalNoteIcon className="w-6 h-6 text-blue-600" />
                                <div>
                                  <h5 className="font-semibold text-neutral-900">Instrumental</h5>
                                  <p className="text-sm text-neutral-600">
                                    {(processingResults[selectedFileIndex].results.instrumental!.file_size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => togglePlay('instrumental')}
                                  className="p-3 bg-white rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                  {playingTrack === 'instrumental' ? (
                                    <PauseIcon className="w-5 h-5 text-blue-600" />
                                  ) : (
                                    <PlayIcon className="w-5 h-5 text-blue-600" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDownload(
                                    processingResults[selectedFileIndex].results.instrumental!.download_url,
                                    `${processingResults[selectedFileIndex].original_file_name}_instrumental.wav`
                                  )}
                                  className="p-3 bg-white rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                  <ArrowDownTrayIcon className="w-5 h-5 text-blue-600" />
                                </button>
                              </div>
                            </div>
                            <audio
                              ref={instrumentalAudioRef}
                              src={processingResults[selectedFileIndex].results.instrumental!.download_url}
                              onEnded={() => setPlayingTrack(null)}
                              className="w-full"
                              controls
                            />
                          </div>
                        )}
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
                            <a href="#" className="underline font-semibold ml-1">Register</a> to save your work!
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
              </div>
            </div>
          </section>

          {/* How to Use Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">
              {toolPageText.howToUseTitle || 'How to Use'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                    <p className="text-neutral-600">
                      {answer}
                    </p>
                  </div>
                );
              })}
              </div>
            </div>
          </section>

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
    </>
  );
};

export default PageComponent;

