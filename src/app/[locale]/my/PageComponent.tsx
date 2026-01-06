'use client'
import HeadInfo from "~/components/HeadInfo";
import Header from "~/components/Header";
import Footer from "~/components/Footer";
import { useEffect, useState } from "react";
import { useCommonContext } from "~/context/common-context";
import { getLinkHref } from "~/configs/buildLink";
import TopBlurred from "~/components/TopBlurred";
import Link from "next/link";
import { 
  MusicalNoteIcon, 
  ArrowDownTrayIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline';
// 暂时使用简单的占位符，避免导入问题
const WaveformPreview = ({ audioUrl, height }: { audioUrl: string; height: number }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-pulse flex space-x-1">
        <div className="h-8 w-1 bg-neutral-300 rounded"></div>
        <div className="h-12 w-1 bg-neutral-300 rounded"></div>
        <div className="h-6 w-1 bg-neutral-300 rounded"></div>
        <div className="h-10 w-1 bg-neutral-300 rounded"></div>
      </div>
    </div>
  );
};

interface AudioFile {
  id: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  toolType: string;
  status: string;
  r2Key: string;
  uploadUrl: string;
  createdAt: string;
  updatedAt: string;
  processingStatus: string | null;
  processingMessage: string | null;
  processingTimeMs: number | null;
  results: Array<{
    id: number;
    result_type: string;
    r2_key: string;
    file_size: number;
    mime_type: string;
    download_url: string;
    created_at: string;
  }>;
}

const PageComponent = ({
  locale,
  worksText
}) => {
  const [pagePath] = useState('my');
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const {
    setShowLoadingModal,
    userData,
    commonText,
  } = useCommonContext();

  // 工具类型映射
  const toolTypeMap: { [key: string]: { name: string; emoji: string } } = {
    'vocal_remover': { name: 'Vocal Remover', emoji: '🎤' },
    'audio_splitter': { name: 'Audio Splitter', emoji: '🎚️' },
    'audio_cutter': { name: 'Audio Cutter', emoji: '✂️' },
    'audio_converter': { name: 'Audio Converter', emoji: '🔄' }
  };

  // 状态映射
  const statusMap: { [key: string]: { label: string; color: string; icon: any } } = {
    'uploaded': { label: 'Uploaded', color: 'text-blue-600', icon: ClockIcon },
    'processing': { label: 'Processing', color: 'text-yellow-600', icon: ArrowPathIcon },
    'processed': { label: 'Completed', color: 'text-green-600', icon: CheckCircleIcon },
    'failed': { label: 'Failed', color: 'text-red-600', icon: XCircleIcon }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setShowLoadingModal(true);
    window.scrollTo(0, 0);
    // 只在 userData 存在时加载文件
    if (userData?.user_id) {
      loadFiles(1);
    } else {
      setLoading(false);
      setShowLoadingModal(false);
    }
  }, [userData?.user_id]);

  // 监听滚动事件，显示/隐藏"回到顶部"按钮
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      // 当滚动超过300px时显示按钮
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setShowBackToTop(scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 回到顶部函数
  const scrollToTop = () => {
    if (typeof window === 'undefined') return;
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const loadFiles = async (pageNum: number) => {
    if (!userData?.user_id) {
      setLoading(false);
      setShowLoadingModal(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/audio/getUserFiles?user_id=${userData.user_id}&page=${pageNum}&limit=20`
      );
      const data = await response.json();

      if (data.success) {
        if (pageNum === 1) {
          setFiles(data.files);
        } else {
          setFiles(prev => [...prev, ...data.files]);
        }
        setHasMore(data.pagination.page < data.pagination.totalPages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
      setShowLoadingModal(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadFiles(page + 1);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getToolInfo = (toolType: string) => {
    return toolTypeMap[toolType] || { name: toolType, emoji: '🎵' };
  };

  const getStatusInfo = (status: string) => {
    return statusMap[status] || statusMap['uploaded'];
  };

  const handleDownload = async (result: AudioFile['results'][0], fileName: string) => {
    try {
      // 从r2_key提取文件名
      const baseName = fileName.replace(/\.[^/.]+$/, '');
      const fileExtension = result.mime_type.includes('wav') ? 'wav' : 
                           result.mime_type.includes('flac') ? 'flac' : 'mp3';
      const downloadFileName = `${baseName}-${result.result_type}.${fileExtension}`;
      
      // 使用下载API（如果需要格式转换）或直接下载
      const downloadUrl = result.download_url;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFileName;
      link.target = '_blank'; // 在新标签页打开，避免CORS问题
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      // 如果直接下载失败，尝试打开新窗口
      window.open(result.download_url, '_blank');
    }
  };

  if (!userData?.user_id) {
    return (
      <>
        <HeadInfo
          locale={locale}
          page={pagePath}
          title={worksText.title}
          description={worksText.description}
        />
        <Header locale={locale} page={pagePath} />
        <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
          <TopBlurred />
          <div className="mx-auto max-w-7xl px-4 py-16 text-center">
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">
              {worksText.h1Text}
            </h1>
            <p className="text-lg text-neutral-600 mb-8">
              {worksText.descText || 'Please log in to view your audio files'}
            </p>
            <Link
              href={getLinkHref(locale, '')}
              className="inline-block px-6 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors"
            >
              {commonText.generateNew || 'Get Started'}
            </Link>
          </div>
        </div>
        <Footer locale={locale} page={pagePath} />
      </>
    );
  }

  return (
    <>
      <meta name="robots" content="noindex" />
      <HeadInfo
        locale={locale}
        page={pagePath}
        title={worksText.title}
        description={worksText.description}
      />
      <Header locale={locale} page={pagePath} />
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <TopBlurred />
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-neutral-900 mb-2">
              {worksText.h1Text}
            </h1>
            <p className="text-neutral-600">
              {worksText.descriptionBelowH1Text || 'Manage your audio files and processing history'}
            </p>
          </div>

          {/* Files List */}
          {loading && files.length === 0 ? (
            <div className="text-center py-12">
              <ArrowPathIcon className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-4" />
              <p className="text-neutral-600">Loading your files...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
              <MusicalNoteIcon className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                No files yet
              </h3>
              <p className="text-neutral-600 mb-6">
                Start processing audio files to see them here
              </p>
              <Link
                href={getLinkHref(locale, 'tools')}
                className="inline-block px-6 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors"
              >
                {commonText.generateNew || 'Get Started'}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file) => {
                const toolInfo = getToolInfo(file.toolType);
                const statusInfo = getStatusInfo(file.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={file.id}
                    className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Left: Waveform Preview */}
                      <div className="flex-shrink-0 w-full md:w-64">
                        <div className="bg-neutral-100 rounded-lg p-4 h-32 flex items-center justify-center">
                          <WaveformPreview
                            audioUrl={file.uploadUrl}
                            height={80}
                          />
                        </div>
                      </div>

                      {/* Right: File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">{toolInfo.emoji}</span>
                              <h3 className="text-lg font-semibold text-neutral-900 truncate">
                                {file.fileName}
                              </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
                              <span className="flex items-center gap-1">
                                <span>{toolInfo.name}</span>
                              </span>
                              <span>{formatFileSize(file.fileSize)}</span>
                              <span className="flex items-center gap-1">
                                <ClockIcon className="w-4 h-4" />
                                {formatDate(file.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                            <span className={`text-sm font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>

                        {/* Processing Results */}
                        {file.results && file.results.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-neutral-200">
                            <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                              Results ({file.results.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {file.results.map((result) => (
                                <button
                                  key={result.id}
                                  onClick={() => handleDownload(result, file.fileName)}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors text-sm font-medium"
                                >
                                  <ArrowDownTrayIcon className="w-4 h-4" />
                                  <span>{result.result_type}</span>
                                  <span className="text-xs text-neutral-500">
                                    ({formatFileSize(result.file_size)})
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Processing Message */}
                        {file.processingMessage && (
                          <div className="mt-3 text-sm text-neutral-600">
                            {file.processingMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Load More */}
              {hasMore && (
                <div className="text-center py-6">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-3 bg-neutral-100 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 回到顶部按钮 */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-4 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            aria-label="Back to top"
          >
            <ArrowUpIcon className="w-6 h-6" />
          </button>
        )}
      </div>
      <Footer locale={locale} page={pagePath} />
    </>
  );
};

export default PageComponent;
