'use client'
import { useState, useRef, useEffect } from 'react';
import { 
  CloudArrowUpIcon, 
  LinkIcon, 
  ArrowDownTrayIcon, 
  ArrowPathIcon,
  MusicalNoteIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface AudioConverterComponentProps {
  toolPageText: any;
}

type TabType = 'file' | 'url';
type ConvertStatus = 'idle' | 'converting' | 'completed' | 'error';

export default function AudioConverterComponent({ toolPageText }: AudioConverterComponentProps) {
  const [activeTab, setActiveTab] = useState<TabType>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [targetFormat, setTargetFormat] = useState('mp3');
  const [status, setStatus] = useState<ConvertStatus>('idle');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [fileName, setFileName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = ['mp3', 'wav', 'flac', 'm4a', 'ogg'];

  // 清理Blob URL，防止内存泄漏
  useEffect(() => {
    return () => {
      if (resultUrl && resultUrl.startsWith('blob:')) {
        URL.revokeObjectURL(resultUrl);
      }
    };
  }, [resultUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 100 * 1024 * 1024) {
        setErrorMessage(toolPageText.fileSizeError || 'File size must be less than 100MB');
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setErrorMessage('');
      setStatus('idle');
      setResultUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
       if (droppedFile.size > 100 * 1024 * 1024) {
        setErrorMessage(toolPageText.fileSizeError || 'File size must be less than 100MB');
        return;
      }
      setFile(droppedFile);
      setFileName(droppedFile.name);
      setErrorMessage('');
      setStatus('idle');
      setResultUrl(null);
    }
  };

  const isValidUrl = (urlString: string): boolean => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleConvert = async () => {
    if (activeTab === 'file' && !file) {
      setErrorMessage(toolPageText.selectFileError || 'Please select a file first');
      return;
    }
    if (activeTab === 'url') {
      if (!url) {
        setErrorMessage(toolPageText.enterUrlError || 'Please enter a valid URL');
        return;
      }
      if (!isValidUrl(url)) {
        setErrorMessage(toolPageText.invalidUrlError || 'Please enter a valid HTTP or HTTPS URL');
        return;
      }
    }

    setStatus('converting');
    setErrorMessage('');
    setResultUrl(null);

    const formData = new FormData();
    if (activeTab === 'file' && file) {
      formData.append('file', file);
    } else if (activeTab === 'url') {
      formData.append('url', url);
    }
    formData.append('format', targetFormat);

    try {
      const response = await fetch('/api/audio/convert', {
        method: 'POST',
        body: formData,
      });

      // 检查响应类型
      const contentType = response.headers.get('content-type') || '';
      
      if (!response.ok) {
        // 尝试解析JSON错误响应
        let errorMessage = 'Conversion failed';
        try {
          if (contentType.includes('application/json')) {
            const data = await response.json();
            errorMessage = data.message || data.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch (parseError) {
          // 如果无法解析错误响应，使用状态文本
          errorMessage = response.statusText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      // 检查响应是否是有效的音频文件
      if (!contentType.includes('audio/') && !contentType.includes('application/octet-stream')) {
        // 可能是错误响应，尝试解析JSON
        try {
          const data = await response.json();
          throw new Error(data.message || 'Invalid response from server');
        } catch {
          throw new Error('Server returned an invalid response');
        }
      }

      const blob = await response.blob();
      
      // 检查blob大小
      if (blob.size === 0) {
        throw new Error('Received empty file from server');
      }
      
      const downloadUrl = URL.createObjectURL(blob);
      setResultUrl(downloadUrl);
      setStatus('completed');
      
      // Update filename for download
      const name = activeTab === 'file' && file ? file.name : (url.split('/').pop()?.split('?')[0] || 'audio');
      const baseName = name.substring(0, name.lastIndexOf('.')) || name;
      setFileName(`${baseName}.${targetFormat}`);

    } catch (error: any) {
      console.error('Conversion error:', error);
      setErrorMessage(error.message || 'An error occurred during conversion');
      setStatus('error');
    }
  };

  const reset = () => {
    // 清理之前的Blob URL
    if (resultUrl && resultUrl.startsWith('blob:')) {
      URL.revokeObjectURL(resultUrl);
    }
    setFile(null);
    setUrl('');
    setStatus('idle');
    setResultUrl(null);
    setErrorMessage('');
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-800">{errorMessage}</p>
          <button onClick={() => setErrorMessage('')} className="text-red-600 hover:text-red-800">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Source selector - Compact and centered */}
      <div className="flex justify-center items-center">
        <div className="bg-neutral-100 p-1.5 rounded-xl inline-flex gap-1">
          <button
            onClick={() => setActiveTab('file')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'file'
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-white'
            }`}
          >
            <CloudArrowUpIcon className="w-5 h-5" />
            {toolPageText.uploadTitle || 'Upload Audio'}
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'url'
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-white'
            }`}
          >
            <LinkIcon className="w-5 h-5" />
            {toolPageText.fromUrl || 'From URL'}
          </button>
        </div>
      </div>

      {/* Input Area */}
      {activeTab === 'file' ? (
        !file ? (
          <div className="text-center">
            <label htmlFor="audio-converter-upload" className="cursor-pointer block">
              <div
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={handleDrop}
                className="border-2 border-dashed border-neutral-300 rounded-xl p-8 hover:border-brand-500 transition-colors bg-neutral-50"
              >
                <CloudArrowUpIcon className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
                <p className="text-sm text-neutral-600 mb-4">
                  {toolPageText.uploadDesc || 'Supports MP3, WAV, FLAC, M4A, OGG • Max 100MB'}
                </p>
                <div className="inline-block">
                  <div className="px-8 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-lg hover:from-brand-600 hover:to-brand-700 transition-all shadow-md hover:shadow-lg">
                    {toolPageText.uploadTitle || 'Choose Audio File'}
                  </div>
                </div>
              </div>
              <input
                id="audio-converter-upload"
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="audio/*,.mp3,.wav,.flac,.m4a,.ogg"
                onChange={handleFileChange}
              />
            </label>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MusicalNoteIcon className="w-8 h-8 text-brand-500" />
                <div>
                  <p className="font-semibold text-neutral-900">{file.name}</p>
                  <p className="text-sm text-neutral-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                onClick={reset}
                className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove file"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-neutral-700">Audio URL</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/audio.mp3"
                className="block w-full pl-10 pr-3 py-2.5 border border-neutral-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 transition-colors text-sm"
              />
            </div>
            <p className="text-xs text-neutral-500">Enter a direct link to an audio file</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="w-full md:w-auto">
            <label className="block text-sm font-semibold text-neutral-700 mb-3">{toolPageText.step2Title || 'Choose Format'}</label>
            <div className="flex flex-wrap gap-2">
              {supportedFormats.map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setTargetFormat(fmt)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    targetFormat === fmt
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full md:w-auto md:ml-auto">
            <button
              onClick={handleConvert}
              disabled={status === 'converting' || (activeTab === 'file' && !file) || (activeTab === 'url' && !url)}
              className={`w-full md:w-auto px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-lg hover:from-brand-600 hover:to-brand-700 transition-all shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-brand-500 disabled:hover:to-brand-600`}
            >
              {status === 'converting' ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  {toolPageText.generateText || 'Processing...'}
                </>
              ) : (
                <>
                  <ArrowPathIcon className="w-5 h-5" />
                  {toolPageText.processButton || 'Convert Audio'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Result */}
      {status === 'completed' && resultUrl && (
        <div className="p-6 bg-green-50 rounded-xl border border-green-200 animation-fade-in">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">
                  {toolPageText.conversionSuccess || 'Conversion Successful!'}
                </h3>
                <p className="text-sm text-neutral-600">{fileName}</p>
              </div>
            </div>
            <a
              href={resultUrl}
              download={fileName}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-green-600 hover:to-green-700 transition-colors shadow-md"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              {toolPageText.download || 'Download'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
