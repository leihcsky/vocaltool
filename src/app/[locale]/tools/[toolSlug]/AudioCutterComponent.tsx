'use client'
import { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import { 
  PlayIcon, 
  PauseIcon, 
  ScissorsIcon,
  ArrowDownTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface AudioCutterComponentProps {
  toolPageText: any;
}

export default function AudioCutterComponent({ toolPageText }: AudioCutterComponentProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState<{ start: number; end: number } | null>(null);
  const [exportFormat, setExportFormat] = useState<'mp3' | 'wav'>('wav');
  const [errorMessage, setErrorMessage] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [history, setHistory] = useState<AudioBuffer[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioBufferRef = useRef<AudioBuffer | null>(null);
  const isFirstLoadRef = useRef(true);
  const currentRegionRef = useRef<any>(null);
  const isPlayingRef = useRef(false);

  // 更新选区内的播放进度背景（使用独立的 DOM 元素避免被 Plugin 重置）
  const updateRegionProgress = (region: any, pct: number) => {
    if (!region || !region.element) return;
    
    // 查找或创建进度条元素
    let progressBar = region.element.querySelector('.region-progress-bar');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.className = 'region-progress-bar';
      progressBar.style.position = 'absolute';
      progressBar.style.top = '0';
      progressBar.style.bottom = '0';
      progressBar.style.left = '0';
      progressBar.style.zIndex = '1'; // 位于背景之上，手柄之下
      progressBar.style.pointerEvents = 'none'; // 不影响点击
      progressBar.style.backgroundColor = 'rgba(14, 165, 233, 0.25)'; // 进度颜色
      progressBar.style.borderRight = '1px solid rgba(14, 165, 233, 0.6)'; // 进度线
      region.element.appendChild(progressBar);
    }

    const clamped = Math.min(100, Math.max(0, pct || 0));
    progressBar.style.width = `${clamped}%`;
  };

  // Ensure component is mounted (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize WaveSurfer and load audio whenever a file is selected
  useEffect(() => {
    if (!isMounted || !waveformRef.current || !audioFile) return;

    setIsLoading(true);

    console.log('🎛️ Initializing WaveSurfer instance');

    // Create regions plugin
    const regions = RegionsPlugin.create();
    regionsPluginRef.current = regions;

    // Create WaveSurfer instance with plugins
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      // 波形灰色，全局进度也灰色（隐藏全局进度），完全依靠 region 内部渐变来显示进度
      waveColor: '#9ca3af',
      progressColor: '#9ca3af',
      cursorColor: '#0ea5e9',
      barWidth: 2,
      barRadius: 2,
      cursorWidth: 1,
      height: 100,
      barGap: 1,
      normalize: true,
      minPxPerSec: 1,
      hideScrollbar: false,
      autoScroll: true,
      autoCenter: true,
      dragToSeek: true,
      plugins: [regions],
    });

    // Event listeners - must be set before loading
    wavesurfer.on('loading', (percent) => {
      console.log('🔄 Loading:', percent + '%');
    });

    wavesurfer.on('ready', () => {
      console.log('✅ WaveSurfer ready!');
      const dur = wavesurfer.getDuration();
      console.log('📊 Duration:', dur, 'seconds');
      setDuration(dur);
      setIsLoading(false);

      // Store initial audio buffer for history
      const decodedData = wavesurfer.getDecodedData();
      console.log('🎵 Decoded data:', decodedData ? 'Available' : 'Not available');
      if (decodedData) {
        currentAudioBufferRef.current = decodedData;
        // 只在第一次加载文件时初始化历史记录，后续剪辑/回退不重置历史
        if (isFirstLoadRef.current) {
          setHistory([decodedData]);
          setHistoryIndex(0);
          console.log('💾 Saved to history');
          isFirstLoadRef.current = false;
        }
      }

      // Create initial region (entire audio) with custom styling
      if (dur > 0 && regions) {
        console.log('🎯 Creating region from 0 to', dur);
        
        // 创建主选区
        const region = regions.addRegion({
          start: 0,
          end: dur,
          color: 'rgba(34, 211, 238, 0.18)',
          drag: true,
          resize: true,
        });
        currentRegionRef.current = region;
        // 初始化进度背景
        updateRegionProgress(region, 0);

        setSelectedRegion({ start: 0, end: dur });
        console.log('✅ Region created and selected');
      }
    });

    wavesurfer.on('error', (error) => {
      console.error('WaveSurfer error:', error);
      setErrorMessage('Failed to load audio file. Please try another file.');
      setIsLoading(false);
    });

    wavesurfer.on('decode', () => {
      console.log('Audio decoded successfully');
    });

    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
    });
    wavesurfer.on('finish', () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
    });
    wavesurfer.on('timeupdate', (time) => {
      setCurrentTime(time);
      const region = currentRegionRef.current;
      if (region) {
        // 更新区域内进度背景
        const pct = Math.min(
          100,
          Math.max(0, ((time - region.start) / (region.end - region.start)) * 100)
        );
        updateRegionProgress(region, pct);

        // 如果正在播放
        if (isPlayingRef.current) {
          // 1. 防止播放到选区之前
          if (time < region.start - 0.1) {
            wavesurfer.setTime(region.start);
            return;
          }
          // 2. 动态检测是否到达选区末尾（支持拖动改变 end）
          if (time >= region.end) {
            wavesurfer.pause();
            wavesurfer.setTime(region.start);
            setIsPlaying(false);
            isPlayingRef.current = false;
            updateRegionProgress(region, 0);
          }
        }
      }
    });

    // Region update listener
    regions.on('region-updated', (region: any) => {
      currentRegionRef.current = region;
      setSelectedRegion({ start: region.start, end: region.end });

      // 区域调整时，重置进度背景
      // 如果正在播放，不重置为0，而是实时更新当前进度比例
      if (isPlayingRef.current && wavesurferRef.current) {
        const time = wavesurferRef.current.getCurrentTime();
         const pct = Math.min(
          100,
          Math.max(0, ((time - region.start) / (region.end - region.start)) * 100)
        );
        updateRegionProgress(region, pct);
      } else {
        updateRegionProgress(region, 0);
      }
    });

    wavesurferRef.current = wavesurfer;

    // Load audio file directly as blob
    console.log('📁 Loading audio file:', audioFile.name);
    console.log('📝 File type:', audioFile.type);
    console.log('📏 File size:', (audioFile.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('🎨 Waveform container:', waveformRef.current);

    wavesurfer
      .loadBlob(audioFile)
      .then(() => {
        console.log('✅ Blob loaded successfully');
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('❌ Failed to load blob:', error);
        setErrorMessage('Failed to load audio file: ' + error.message);
        setIsLoading(false);
      });

    return () => {
      console.log('🧹 Cleaning up WaveSurfer');
      wavesurfer.destroy();
      wavesurferRef.current = null;
    };
  }, [audioFile, isMounted]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/m4a', 'audio/ogg'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|flac|m4a|ogg)$/i)) {
      setErrorMessage('Please upload a valid audio file (MP3, WAV, FLAC, M4A, or OGG)');
      return;
    }

    // Validate file size (100MB)
    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage('File size must be less than 100MB');
      return;
    }

    setErrorMessage('');
    setAudioFile(file);
  };

  const togglePlayPause = () => {
    if (!wavesurferRef.current || !currentRegionRef.current) return;

    const wavesurfer = wavesurferRef.current;
    const region = currentRegionRef.current;

    if (isPlayingRef.current) {
      wavesurfer.pause();
      return;
    }

    // 只播放当前选区，播放到 end 自动在 timeupdate 钩子里停下并回到 start
    isPlayingRef.current = true;
    setIsPlaying(true);
    // 关键：只指定 start，不指定 end，让 timeupdate 动态判断 end
    // 这样当用户拖动 end 时，播放不会提前停止
    wavesurfer.play(region.start);
    updateRegionProgress(region, 0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCut = async (keepSelection: boolean) => {
    if (!wavesurferRef.current || !selectedRegion || !currentAudioBufferRef.current) return;

    try {
      setIsLoading(true);

      const audioBuffer = currentAudioBufferRef.current;
      const { start, end } = selectedRegion;
      const sampleRate = audioBuffer.sampleRate;
      const numberOfChannels = audioBuffer.numberOfChannels;

      const audioContext = audioContextRef.current || new AudioContext();
      audioContextRef.current = audioContext;

      let newBuffer: AudioBuffer;

      if (keepSelection) {
        // Trim: Keep only the selected region
        const startSample = Math.floor(start * sampleRate);
        const endSample = Math.floor(end * sampleRate);
        const newLength = endSample - startSample;

        newBuffer = audioContext.createBuffer(numberOfChannels, newLength, sampleRate);

        for (let channel = 0; channel < numberOfChannels; channel++) {
          const oldData = audioBuffer.getChannelData(channel);
          const newData = newBuffer.getChannelData(channel);
          for (let i = 0; i < newLength; i++) {
            newData[i] = oldData[startSample + i];
          }
        }
      } else {
        // Cut: Remove the selected region
        const startSample = Math.floor(start * sampleRate);
        const endSample = Math.floor(end * sampleRate);
        const newLength = audioBuffer.length - (endSample - startSample);

        newBuffer = audioContext.createBuffer(numberOfChannels, newLength, sampleRate);

        for (let channel = 0; channel < numberOfChannels; channel++) {
          const oldData = audioBuffer.getChannelData(channel);
          const newData = newBuffer.getChannelData(channel);

          // Copy before selection
          for (let i = 0; i < startSample; i++) {
            newData[i] = oldData[i];
          }

          // Copy after selection
          for (let i = endSample; i < audioBuffer.length; i++) {
            newData[i - (endSample - startSample)] = oldData[i];
          }
        }
      }

      // Update history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newBuffer);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      // Update current buffer and reload waveform
      currentAudioBufferRef.current = newBuffer;
      await loadBufferToWaveform(newBuffer);

    } catch (error) {
      console.error('Error cutting audio:', error);
      setErrorMessage('Failed to cut audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBufferToWaveform = async (buffer: AudioBuffer) => {
    if (!wavesurferRef.current) return;

    // Load the new buffer into wavesurfer
    const channelData = [];
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channelData.push(buffer.getChannelData(i));
    }

    await wavesurferRef.current.loadBlob(
      new Blob([audioBufferToWav(buffer)], { type: 'audio/wav' })
    );

    // Reset region to entire audio
    const dur = buffer.duration;
    setDuration(dur);

    // Clear existing regions
    const regions = regionsPluginRef.current;
    if (regions) {
      regions.clearRegions();
      const region = regions.addRegion({
        start: 0,
        end: dur,
        color: 'rgba(34, 211, 238, 0.18)',
        drag: true,
        resize: true,
      });
      currentRegionRef.current = region;
      updateRegionProgress(region, 0);

      setSelectedRegion({ start: 0, end: dur });
      setCurrentTime(0);
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  };

  const undo = async () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      currentAudioBufferRef.current = history[newIndex];
      await loadBufferToWaveform(history[newIndex]);
    }
  };

  const redo = async () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      currentAudioBufferRef.current = history[newIndex];
      await loadBufferToWaveform(history[newIndex]);
    }
  };

  const handleExport = async () => {
    if (!currentAudioBufferRef.current) return;

    try {
      setIsLoading(true);
      await exportAudio(currentAudioBufferRef.current, exportFormat);
    } catch (error) {
      console.error('Error exporting audio:', error);
      setErrorMessage('Failed to export audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const exportAudio = async (audioBuffer: AudioBuffer, format: 'mp3' | 'wav') => {
    if (format === 'wav') {
      // Export as WAV
      const wav = audioBufferToWav(audioBuffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      downloadBlob(blob, `audio-cutter-${Date.now()}.wav`);
    } else {
      // For MP3, we'll use WAV for now (MP3 encoding requires additional library)
      // In production, you'd use lamejs or similar
      const wav = audioBufferToWav(audioBuffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      downloadBlob(blob, `audio-cutter-${Date.now()}.wav`);
    }
  };

  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;

    const data = [];
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i];
        const s = Math.max(-1, Math.min(1, sample));
        data.push(s < 0 ? s * 0x8000 : s * 0x7FFF);
      }
    }

    const dataLength = data.length * bytesPerSample;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
      view.setInt16(offset, data[i], true);
      offset += 2;
    }

    return arrayBuffer;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetTool = () => {
    setAudioFile(null);
    setSelectedRegion(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setErrorMessage('');
    setHistory([]);
    setHistoryIndex(-1);
    currentAudioBufferRef.current = null;
    currentRegionRef.current = null;
    isFirstLoadRef.current = true;
    isPlayingRef.current = false;
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }
  };

  return (
    <>
      <style jsx global>{`
        /* WaveSurfer container styling */
        #waveform {
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
        }

        /* Custom styles for WaveSurfer regions */
        /* Region styling */
        .wavesurfer-region {
          border-left: 6px solid #1fb6ff !important;
          border-right: 6px solid #1fb6ff !important;
          box-shadow:
            inset 0 0 0 1px rgba(31, 182, 255, 0.4),
            0 0 0 1px rgba(31, 182, 255, 0.25);
        }

        /* Handles styled closer to the reference: wide, rounded, perforated */
        /* Selectors for WaveSurfer v7 handles using 'part' attribute */
        [part*="region-handle-left"],
        [part*="region-handle-right"] {
          width: 24px !important;
          background: transparent !important;
          z-index: 10;
          cursor: ew-resize !important;
        }

        /* 伪元素画真实手柄，垂直居中 */
        [part*="region-handle-left"]::after,
        [part*="region-handle-right"]::after {
          content: '';
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 14px;
          height: 36px;
          background: linear-gradient(180deg, #70f5ff 0%, #34c6ff 45%, #0ea5e9 100%);
          border-radius: 6px;
          box-shadow:
            0 0 0 1px rgba(14, 165, 233, 0.8),
            0 3px 8px rgba(0, 0, 0, 0.25),
            inset 0 0 0 1px rgba(255, 255, 255, 0.2);
          
          /* 三道杠纹理 */
          background-image: repeating-linear-gradient(
            to bottom,
            transparent,
            transparent 3px,
            rgba(0, 0, 0, 0.15) 3px,
            rgba(0, 0, 0, 0.15) 4px,
            transparent 4px,
            transparent 7px
          );
          background-position: center;
          background-repeat: no-repeat;
          background-size: 8px 16px;
        }

        /* 左手柄对齐 */
        [part*="region-handle-left"]::after {
          left: 5px; /* (24 - 14)/2 = 5 */
        }
        /* 右手柄对齐 */
        [part*="region-handle-right"]::after {
          right: 5px;
        }

        [part*="region-handle-left"]:hover::after,
        [part*="region-handle-right"]:hover::after {
          width: 16px;
          height: 40px;
          background: linear-gradient(180deg, #8ff8ff 0%, #4fd4ff 45%, #10b4ff 100%);
          box-shadow:
            0 0 0 1px rgba(14, 165, 233, 0.95),
            0 5px 12px rgba(14, 165, 233, 0.5);
        }

        /* Waveform canvas styling */
        wave {
          overflow: visible !important;
        }
      `}</style>

      <div className="space-y-6">
        {/* Error Message */}
        {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-800">{errorMessage}</p>
          <button onClick={() => setErrorMessage('')} className="text-red-600 hover:text-red-800">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {!audioFile ? (
        /* Upload Section */
        <div className="text-center">
          <label htmlFor="audio-file-upload" className="cursor-pointer block">
            <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 hover:border-brand-500 transition-colors bg-neutral-50">
              <ScissorsIcon className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
              <p className="text-sm text-neutral-600 mb-4">
                Supports MP3, WAV, FLAC, M4A, OGG • Max 100MB
              </p>
              <div className="inline-block">
                <div className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg">
                  Choose Audio File
                </div>
              </div>
            </div>
            <input
              id="audio-file-upload"
              type="file"
              className="hidden"
              accept="audio/*,.mp3,.wav,.flac,.m4a,.ogg"
              onChange={handleFileSelect}
            />
          </label>
        </div>
      ) : (
        /* Editor Section */
        <div className="space-y-4">
          {/* Waveform */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-neutral-900">Audio Waveform</h3>
              <button
                onClick={resetTool}
                className="text-xs text-neutral-600 hover:text-neutral-900 underline"
              >
                Upload New File
              </button>
            </div>

            {/* Waveform Container - 始终挂在 DOM 上，避免加载状态时被卸载 */}
            <div
              ref={waveformRef}
              id="waveform"
              className="mb-3 bg-neutral-50 rounded-lg border border-neutral-200 p-2"
              style={{ minHeight: '120px', width: '100%' }}
            ></div>

            {/* Loading state */}
            {isLoading && (
              <div className="h-20 flex items-center justify-center bg-neutral-50 rounded-lg mb-3">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600 mx-auto mb-1"></div>
                  <p className="text-xs text-neutral-600">Loading audio...</p>
                </div>
              </div>
            )}

            {/* Controls Row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Playback Controls */}
              <button
                onClick={togglePlayPause}
                disabled={!selectedRegion || isLoading}
                className="p-2 bg-brand-500 text-white rounded-full hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Play selected region"
              >
                {isPlaying ? (
                  <PauseIcon className="w-4 h-4" />
                ) : (
                  <PlayIcon className="w-4 h-4" />
                )}
              </button>

              <div className="text-xs text-neutral-600">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              {/* Undo/Redo */}
              <div className="flex gap-1 ml-auto">
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0 || isLoading}
                  className="p-2 text-neutral-600 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Undo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1 || isLoading}
                  className="p-2 text-neutral-600 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Redo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                  </svg>
                </button>
              </div>

              {/* Edit Buttons */}
              <button
                onClick={() => handleCut(true)}
                disabled={!selectedRegion || isLoading}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Keep only the selected region"
              >
                Trim
              </button>
              <button
                onClick={() => handleCut(false)}
                disabled={!selectedRegion || isLoading}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remove the selected region"
              >
                Cut
              </button>
            </div>
          </div>

          {/* Selection Info & Export */}
          {selectedRegion && !isLoading && (
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                {/* Selection Info */}
                <div className="flex items-center gap-4 text-xs text-neutral-600">
                  <div>
                    <span className="text-neutral-500">Start:</span>{' '}
                    <span className="font-mono text-neutral-900">{formatTime(selectedRegion.start)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">End:</span>{' '}
                    <span className="font-mono text-neutral-900">{formatTime(selectedRegion.end)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Duration:</span>{' '}
                    <span className="font-mono text-neutral-900">
                      {formatTime(selectedRegion.end - selectedRegion.start)}
                    </span>
                  </div>
                </div>

                {/* Export Controls */}
                <div className="flex items-center gap-2">
                  {/* Format Toggle */}
                  <div className="flex items-center bg-neutral-100 rounded-lg p-1">
                    <button
                      onClick={() => setExportFormat('wav')}
                      className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                        exportFormat === 'wav'
                          ? 'bg-white text-brand-600 shadow-sm'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      WAV
                    </button>
                    <button
                      onClick={() => setExportFormat('mp3')}
                      className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                        exportFormat === 'mp3'
                          ? 'bg-white text-brand-600 shadow-sm'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      MP3
                    </button>
                  </div>

                  {/* Export Button */}
                  <button
                    onClick={handleExport}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-semibold rounded-lg hover:from-brand-600 hover:to-brand-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </>
  );
}
