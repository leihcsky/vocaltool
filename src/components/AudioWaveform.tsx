'use client';

import { useEffect, useRef, useState } from 'react';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';

interface AudioWaveformProps {
  audioUrl: string;
  waveColor?: string;
  progressColor?: string;
  height?: number;
}

export default function AudioWaveform({
  audioUrl,
  waveColor = '#9333ea',
  progressColor = '#c084fc',
  height = 60
}: AudioWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 立即生成占位波形
  useEffect(() => {
    generatePlaceholderWaveform();
  }, []);

  // 加载音频并生成波形数据
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      generateWaveformFromAudio();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  // 从真实音频数据生成波形
  const generateWaveformFromAudio = async () => {
    try {
      setIsLoading(true);
      const audio = audioRef.current;
      if (!audio) {
        console.log('[AudioWaveform] Audio element not ready');
        generateFallbackWaveform();
        return;
      }

      console.log('[AudioWaveform] Generating waveform from:', audioUrl);

      // 使用 Web Audio API 分析音频
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // 尝试使用 fetch 获取音频数据
      let arrayBuffer: ArrayBuffer;
      try {
        const response = await fetch(audioUrl, {
          mode: 'cors',
          credentials: 'omit'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        arrayBuffer = await response.arrayBuffer();
        console.log('[AudioWaveform] Audio data fetched, size:', arrayBuffer.byteLength);
      } catch (fetchError) {
        console.warn('[AudioWaveform] Fetch failed, using fallback waveform:', fetchError);
        generateFallbackWaveform();
        setIsLoading(false);
        return;
      }

      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      console.log('[AudioWaveform] Audio decoded, duration:', audioBuffer.duration);

      // 获取音频数据（如果是立体声，混合两个声道）
      const rawData = audioBuffer.getChannelData(0);
      const samples = 200; // 采样点数量
      const blockSize = Math.floor(rawData.length / samples);
      const filteredData: number[] = [];

      // 对数据进行采样 - 使用峰值检测而不是平均值
      for (let i = 0; i < samples; i++) {
        const blockStart = blockSize * i;
        let max = 0;

        // 找出每个块中的最大振幅（峰值）
        for (let j = 0; j < blockSize; j++) {
          const value = Math.abs(rawData[blockStart + j]);
          if (value > max) {
            max = value;
          }
        }

        filteredData.push(max);
      }

      // 归一化数据到 0-1 范围
      const maxValue = Math.max(...filteredData, 0.001); // 避免除以0
      const normalizedData = filteredData.map(val => val / maxValue);

      // 应用轻微的平滑处理，使波形更自然
      const smoothedData: number[] = [];
      for (let i = 0; i < normalizedData.length; i++) {
        if (i === 0 || i === normalizedData.length - 1) {
          smoothedData.push(normalizedData[i]);
        } else {
          // 3点移动平均
          const avg = (normalizedData[i - 1] + normalizedData[i] + normalizedData[i + 1]) / 3;
          smoothedData.push(avg);
        }
      }

      console.log('[AudioWaveform] Waveform generated successfully, samples:', smoothedData.length);
      setAudioData(smoothedData);
      setIsLoading(false);
    } catch (error) {
      console.error('[AudioWaveform] Error generating waveform:', error);
      // 如果失败，使用模拟数据
      generateFallbackWaveform();
      setIsLoading(false);
    }
  };

  // 占位波形生成（立即显示，加载时使用）
  const generatePlaceholderWaveform = () => {
    const samples = 200;
    const data: number[] = [];

    for (let i = 0; i < samples; i++) {
      // 创建简单的占位波形
      const t = i / samples;
      const sine1 = Math.sin(t * Math.PI * 4) * 0.3;
      const sine2 = Math.sin(t * Math.PI * 8) * 0.2;
      const value = Math.abs(sine1 + sine2) + 0.1;
      data.push(Math.min(0.6, value)); // 限制高度，显示为占位状态
    }

    setAudioData(data);
    setIsLoading(true);
  };

  // 备用波形生成（如果真实数据加载失败）
  const generateFallbackWaveform = () => {
    const samples = 200;
    const data: number[] = [];

    for (let i = 0; i < samples; i++) {
      // 创建更自然的波形模式
      const t = i / samples;
      const sine1 = Math.sin(t * Math.PI * 4) * 0.3;
      const sine2 = Math.sin(t * Math.PI * 8) * 0.2;
      const sine3 = Math.sin(t * Math.PI * 16) * 0.1;
      const random = (Math.random() - 0.5) * 0.4;
      const value = Math.abs(sine1 + sine2 + sine3 + random);
      data.push(Math.min(1, value));
    }

    setAudioData(data);
    setIsLoading(false);
  };

  // 绘制波形
  useEffect(() => {
    if (!canvasRef.current || audioData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / audioData.length;
    const progress = duration > 0 ? currentTime / duration : 0;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制波形 - 使用圆角矩形使其更精致
    audioData.forEach((value, index) => {
      const barHeight = Math.max(2, value * height * 0.85); // 最小高度2px
      const x = index * barWidth;
      const y = (height - barHeight) / 2;

      // 根据播放进度设置颜色
      const isPlayed = index / audioData.length < progress;

      // 如果正在加载，使用半透明颜色显示占位波形
      if (isLoading) {
        ctx.fillStyle = isPlayed ? progressColor + '40' : waveColor + '40'; // 添加透明度
      } else {
        ctx.fillStyle = isPlayed ? progressColor : waveColor;
      }

      // 绘制圆角矩形
      const radius = Math.min(barWidth / 4, 1.5);
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(1, barWidth - 1.5), barHeight, radius);
      ctx.fill();
    });

    // 绘制播放进度指示线
    if (progress > 0) {
      const progressX = progress * width;
      ctx.strokeStyle = progressColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(progressX, 0);
      ctx.lineTo(progressX, height);
      ctx.stroke();
    }
  }, [audioData, currentTime, duration, waveColor, progressColor]);

  // 播放/暂停控制
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 点击或拖动波形跳转
  const [isDragging, setIsDragging] = useState(false);

  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));
    audio.currentTime = progress * duration;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    handleCanvasInteraction(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      handleCanvasInteraction(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // 格式化时间
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className="w-full">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center gap-4">
        {/* 播放/暂停按钮 */}
        <button
          onClick={togglePlayPause}
          className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-brand-600 hover:bg-brand-700 text-white rounded-full transition-all shadow-md hover:shadow-lg"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <PauseIcon className="w-6 h-6" />
          ) : (
            <PlayIcon className="w-6 h-6 ml-0.5" />
          )}
        </button>

        {/* 波形画布 - 支持点击和拖动 */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            width={1200}
            height={height}
            className={`w-full rounded-lg ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'} transition-shadow hover:shadow-sm`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleCanvasInteraction}
            style={{ height: `${height}px` }}
          />
        </div>

        {/* 时间显示 */}
        <div className="flex-shrink-0 text-sm text-neutral-600 font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}

