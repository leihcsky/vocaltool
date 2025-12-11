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
  const [exportingType, setExportingType] = useState<'selection' | 'full' | null>(null);
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

  // Ensure component is mounted (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize WaveSurfer and load audio whenever a file is selected
  useEffect(() => {
    if (!isMounted || !waveformRef.current || !audioFile) return;

    setIsLoading(true);

    // Create regions plugin
    const regions = RegionsPlugin.create();
    regionsPluginRef.current = regions;

    // Create WaveSurfer instance with plugins
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#9ca3af',
      progressColor: '#9ca3af',
      cursorColor: '#0ea5e9',
      barWidth: 2,
      barRadius: 2,
      cursorWidth: 2,
      height: 100,
      barGap: 1,
      normalize: true,
      minPxPerSec: 1,
      hideScrollbar: false,
      autoScroll: true,
      autoCenter: true,
      dragToSeek: false, // 禁用点击跳转，只在选区内播放
      plugins: [regions],
    });

    wavesurfer.on('ready', () => {
      const dur = wavesurfer.getDuration();
      setDuration(dur);
      setIsLoading(false);

      const decodedData = wavesurfer.getDecodedData();
      if (decodedData) {
        currentAudioBufferRef.current = decodedData;
        if (isFirstLoadRef.current) {
          setHistory([decodedData]);
          setHistoryIndex(0);
          isFirstLoadRef.current = false;
        }
      }

      if (dur > 0 && regions) {
        const region = regions.addRegion({
          start: 0,
          end: dur,
          color: 'rgba(14, 165, 233, 0.08)',
          drag: true,
          resize: true,
        });
        currentRegionRef.current = region;
        setSelectedRegion({ start: 0, end: dur });
      }
    });

    wavesurfer.on('error', (error) => {
      console.error('WaveSurfer error:', error);
      setErrorMessage('Failed to load audio file.');
      setIsLoading(false);
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
      if (region && isPlayingRef.current) {
        // 动态检测是否到达选区末尾
        if (time >= region.end) {
          wavesurfer.pause();
          wavesurfer.setTime(region.start);
          setIsPlaying(false);
          isPlayingRef.current = false;
        }
      }
    });

    regions.on('region-updated', (region: any) => {
      currentRegionRef.current = region;
      setSelectedRegion({ start: region.start, end: region.end });
    });

    wavesurferRef.current = wavesurfer;

    // Load audio
    wavesurfer
      .loadBlob(audioFile)
      .then(() => {
        setIsLoading(false);
      })
      .catch((error) => {
        setErrorMessage('Failed to load audio file: ' + error.message);
        setIsLoading(false);
      });

    return () => {
      wavesurfer.destroy();
      wavesurferRef.current = null;
    };
  }, [audioFile, isMounted]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/m4a', 'audio/ogg'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|flac|m4a|ogg)$/i)) {
      setErrorMessage('Please upload a valid audio file');
      return;
    }
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

    isPlayingRef.current = true;
    setIsPlaying(true);
    wavesurfer.setTime(region.start);
    wavesurfer.play();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCut = async (keepSelection: boolean) => {
    if (!wavesurferRef.current || !selectedRegion || !currentAudioBufferRef.current) return;

    try {
      const audioBuffer = currentAudioBufferRef.current;
      const { start, end } = selectedRegion;
      const audioDuration = audioBuffer.length / audioBuffer.sampleRate;
      const selectionDuration = end - start;

      // 检测操作是否会导致无效音频
      if (!keepSelection) {
        // Cut操作：检测剩余音频是否足够
        const remainingDuration = audioDuration - selectionDuration;
        
        // 如果剩余时长小于0.1秒，阻止操作
        if (remainingDuration < 0.1) {
          setErrorMessage('Cannot cut the entire audio. Please adjust the selection to keep some audio, or use the Reset button to start over.');
          return;
        }
        
        // 如果选区几乎覆盖整个音频（>95%），给出警告提示
        if (selectionDuration / audioDuration > 0.95) {
          setErrorMessage('Warning: This will remove almost all of the audio. Only ' + formatTime(remainingDuration) + ' will remain.');
          // 仍然允许操作，但给出警告
          setTimeout(() => setErrorMessage(''), 3000); // 3秒后自动清除警告
        }
      } else {
        // Trim操作：检测选区是否足够大
        if (selectionDuration < 0.1) {
          setErrorMessage('Selection is too short to trim. Please select at least 0.1 seconds of audio.');
          return;
        }
      }

      setIsLoading(true);
      const sampleRate = audioBuffer.sampleRate;
      const numberOfChannels = audioBuffer.numberOfChannels;
      const audioContext = audioContextRef.current || new AudioContext();
      audioContextRef.current = audioContext;

      let newBuffer: AudioBuffer;

      if (keepSelection) {
        // Trim
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
        // Cut
        const startSample = Math.floor(start * sampleRate);
        const endSample = Math.floor(end * sampleRate);
        const newLength = audioBuffer.length - (endSample - startSample);
        newBuffer = audioContext.createBuffer(numberOfChannels, newLength, sampleRate);
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const oldData = audioBuffer.getChannelData(channel);
          const newData = newBuffer.getChannelData(channel);
          for (let i = 0; i < startSample; i++) {
            newData[i] = oldData[i];
          }
          for (let i = endSample; i < audioBuffer.length; i++) {
            newData[i - (endSample - startSample)] = oldData[i];
          }
        }
      }

      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newBuffer);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      currentAudioBufferRef.current = newBuffer;
      await loadBufferToWaveform(newBuffer);

    } catch (error) {
      console.error('Error cutting audio:', error);
      setErrorMessage('Failed to cut audio.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBufferToWaveform = async (buffer: AudioBuffer) => {
    if (!wavesurferRef.current) return;

    await wavesurferRef.current.loadBlob(
      new Blob([audioBufferToWav(buffer)], { type: 'audio/wav' })
    );

    const dur = buffer.duration;
    setDuration(dur);

    const regions = regionsPluginRef.current;
    if (regions) {
      regions.clearRegions();
      const region = regions.addRegion({
        start: 0,
        end: dur,
        color: 'rgba(14, 165, 233, 0.1)',
        drag: true,
        resize: true,
      });
      currentRegionRef.current = region;
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

  // 导出选区内的音频
  const handleExportSelection = async () => {
    if (!currentAudioBufferRef.current || !selectedRegion) return;
    try {
      setExportingType('selection');
      const audioBuffer = currentAudioBufferRef.current;
      const { start, end } = selectedRegion;
      const sampleRate = audioBuffer.sampleRate;
      const numberOfChannels = audioBuffer.numberOfChannels;
      const audioContext = audioContextRef.current || new AudioContext();
      audioContextRef.current = audioContext;

      // 创建选区的 AudioBuffer（不修改当前音频）
      const startSample = Math.floor(start * sampleRate);
      const endSample = Math.floor(end * sampleRate);
      const newLength = endSample - startSample;
      const selectionBuffer = audioContext.createBuffer(numberOfChannels, newLength, sampleRate);
      
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const oldData = audioBuffer.getChannelData(channel);
        const newData = selectionBuffer.getChannelData(channel);
        newData.set(oldData.subarray(startSample, endSample));
      }

      await exportAudio(selectionBuffer, exportFormat, 'selection');
    } catch (error) {
      console.error('Export selection failed:', error);
      // 如果是MP3转换失败，尝试回退到WAV
      if (exportFormat === 'mp3' && currentAudioBufferRef.current && selectedRegion) {
        try {
          const audioBuffer = currentAudioBufferRef.current;
          const { start, end } = selectedRegion;
          const sampleRate = audioBuffer.sampleRate;
          const numberOfChannels = audioBuffer.numberOfChannels;
          const audioContext = audioContextRef.current || new AudioContext();
          const startSample = Math.floor(start * sampleRate);
          const endSample = Math.floor(end * sampleRate);
          const newLength = endSample - startSample;
          const selectionBuffer = audioContext.createBuffer(numberOfChannels, newLength, sampleRate);
          for (let channel = 0; channel < numberOfChannels; channel++) {
            const oldData = audioBuffer.getChannelData(channel);
            const newData = selectionBuffer.getChannelData(channel);
            newData.set(oldData.subarray(startSample, endSample));
          }
          const wav = audioBufferToWav(selectionBuffer);
          const blob = new Blob([wav], { type: 'audio/wav' });
          downloadBlob(blob, `audio-cutter-selection-${Date.now()}.wav`);
          setErrorMessage('MP3 conversion failed. Exported as WAV instead.');
        } catch (fallbackError) {
          setErrorMessage('Failed to export selection');
        }
      } else {
        setErrorMessage('Failed to export selection');
      }
    } finally {
      setExportingType(null);
    }
  };

  // 导出完整音频
  const handleExportFull = async () => {
    if (!currentAudioBufferRef.current) return;
    try {
      setExportingType('full');
      await exportAudio(currentAudioBufferRef.current, exportFormat, 'full');
    } catch (error) {
      console.error('Export full audio failed:', error);
      // 如果是MP3转换失败，尝试回退到WAV
      if (exportFormat === 'mp3' && currentAudioBufferRef.current) {
        try {
          const wav = audioBufferToWav(currentAudioBufferRef.current);
          const blob = new Blob([wav], { type: 'audio/wav' });
          downloadBlob(blob, `audio-cutter-full-${Date.now()}.wav`);
          setErrorMessage('MP3 conversion failed. Exported as WAV instead.');
        } catch (fallbackError) {
          setErrorMessage('Failed to export audio');
        }
      } else {
        setErrorMessage('Failed to export audio');
      }
    } finally {
      setExportingType(null);
    }
  };

  const exportAudio = async (audioBuffer: AudioBuffer, format: 'mp3' | 'wav', type: 'selection' | 'full' = 'full') => {
    // 先转换为WAV（浏览器端）
    const wav = audioBufferToWav(audioBuffer);
    const wavBlob = new Blob([wav], { type: 'audio/wav' });

    if (format === 'wav') {
      // 直接下载WAV
      const filename = `audio-cutter-${type}-${Date.now()}.wav`;
      downloadBlob(wavBlob, filename);
    } else {
      // MP3格式：使用后端API转换
      const formData = new FormData();
      formData.append('file', wavBlob, `audio-${Date.now()}.wav`);
      formData.append('format', 'mp3');

      const response = await fetch('/api/audio/convert', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Conversion failed' }));
        throw new Error(errorData.message || 'Failed to convert to MP3');
      }

      // 获取转换后的MP3文件
      const mp3Blob = await response.blob();
      const filename = `audio-cutter-${type}-${Date.now()}.mp3`;
      downloadBlob(mp3Blob, filename);
    }
  };

  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
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
        #waveform {
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
        }
        wave {
          overflow: visible !important;
        }
        
        #waveform ::part(region-handle-left),
        #waveform ::part(handle-left),
        #waveform ::part(region-handle) {
          position: absolute !important;
          width: 8px !important;
          min-width: 8px !important;
          max-width: 8px !important;
          height: 100% !important;
          background: linear-gradient(180deg, #60d5ff 0%, #0ea5e9 50%, #0284c7 100%) !important;
          border: 2px solid #0369a1 !important;
          border-radius: 6px 0 0 6px !important;
          box-shadow: 
            0 2px 8px rgba(14, 165, 233, 0.6),
            inset 0 1px 3px rgba(255, 255, 255, 0.4) !important;
          cursor: ew-resize !important;
          opacity: 1 !important;
          z-index: 10 !important;
        }
        
        #waveform ::part(region-handle-right),
        #waveform ::part(handle-right) {
          position: absolute !important;
          width: 8px !important;
          min-width: 8px !important;
          max-width: 8px !important;
          height: 100% !important;
          background: linear-gradient(180deg, #60d5ff 0%, #0ea5e9 50%, #0284c7 100%) !important;
          border: 2px solid #0369a1 !important;
          border-radius: 0 6px 6px 0 !important;
          box-shadow: 
            0 2px 8px rgba(14, 165, 233, 0.6),
            inset 0 1px 3px rgba(255, 255, 255, 0.4) !important;
          cursor: ew-resize !important;
          opacity: 1 !important;
          z-index: 10 !important;
        }
        
        #waveform ::part(region-handle-left)::before,
        #waveform ::part(region-handle-right)::before {
          content: '';
          position: absolute;
          left: 50%;
          top: 40%;
          transform: translate(-50%, -50%);
          width: 2.5px;
          height: 2.5px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          box-shadow: 
            0 1px 2px rgba(0, 0, 0, 0.3),
            0 10px 0 0 rgba(255, 255, 255, 0.9),
            0 11px 2px 0 rgba(0, 0, 0, 0.3),
            0 20px 0 0 rgba(255, 255, 255, 0.9),
            0 21px 2px 0 rgba(0, 0, 0, 0.3);
        }
        
        #waveform ::part(region-handle-left):hover,
        #waveform ::part(region-handle-right):hover {
          background: linear-gradient(180deg, #38bdf8 0%, #0284c7 50%, #075985 100%) !important;
          box-shadow: 
            0 3px 12px rgba(14, 165, 233, 0.8),
            inset 0 1px 3px rgba(255, 255, 255, 0.5) !important;
        }
      `}</style>

      <div className="space-y-6">
        {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-800">{errorMessage}</p>
          <button onClick={() => setErrorMessage('')} className="text-red-600 hover:text-red-800">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {!audioFile ? (
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
        <div className="space-y-4">
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

            <div
              ref={waveformRef}
              id="waveform"
              className="mb-3 bg-neutral-50 rounded-lg border border-neutral-200 p-2"
              style={{ minHeight: '120px', width: '100%' }}
            ></div>

            {isLoading && (
              <div className="h-20 flex items-center justify-center bg-neutral-50 rounded-lg mb-3">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600 mx-auto mb-1"></div>
                  <p className="text-xs text-neutral-600">Loading audio...</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
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

          {selectedRegion && (
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
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

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center bg-neutral-100 rounded-lg p-1">
                    <button
                      onClick={() => setExportFormat('wav')}
                      disabled={exportingType !== null}
                      className={`px-3 py-1 text-xs font-medium rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        exportFormat === 'wav'
                          ? 'bg-white text-brand-600 shadow-sm'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      WAV
                    </button>
                    <button
                      onClick={() => setExportFormat('mp3')}
                      disabled={exportingType !== null}
                      className={`px-3 py-1 text-xs font-medium rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        exportFormat === 'mp3'
                          ? 'bg-white text-brand-600 shadow-sm'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      MP3
                    </button>
                  </div>

                  {/* 主按钮：导出选区 */}
                  <button
                    onClick={handleExportSelection}
                    disabled={isLoading || exportingType !== null || !selectedRegion}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Download the selected region only"
                  >
                    {exportingType === 'selection' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Export Selection
                      </>
                    )}
                  </button>

                  {/* 次要按钮：导出完整音频 */}
                  <button
                    onClick={handleExportFull}
                    disabled={isLoading || exportingType !== null}
                    className="px-4 py-2 bg-gradient-to-r from-neutral-500 to-neutral-600 text-white text-sm font-semibold rounded-lg hover:from-neutral-600 hover:to-neutral-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Download the full audio"
                  >
                    {exportingType === 'full' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Export Full
                      </>
                    )}
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
