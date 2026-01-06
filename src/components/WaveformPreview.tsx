'use client'
import { useEffect, useRef, useState } from 'react';

interface WaveformPreviewProps {
  audioUrl: string;
  height?: number;
  width?: number;
}

export default function WaveformPreview({ 
  audioUrl, 
  height = 60,
  width = 200 
}: WaveformPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 确保只在客户端渲染
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // 只在客户端且容器存在时初始化
    if (!isMounted || !containerRef.current || typeof window === 'undefined') return;

    let WaveSurfer: any;
    
    // 动态导入 wavesurfer.js（只在客户端）
    import('wavesurfer.js')
      .then((module) => {
        WaveSurfer = module.default;
        
        if (!containerRef.current) return;

        // 创建 WaveSurfer 实例
        const waveSurfer = WaveSurfer.create({
          container: containerRef.current,
          waveColor: '#6366f1',
          progressColor: '#4f46e5',
          cursorColor: '#4f46e5',
          barWidth: 2,
          barRadius: 1,
          height: height,
          normalize: true,
          backend: 'WebAudio',
          mediaControls: false,
          interact: false, // 禁用交互，仅显示波形
        });

        waveSurferRef.current = waveSurfer;

        // 加载音频
        waveSurfer.load(audioUrl)
          .then(() => {
            setIsLoading(false);
          })
          .catch((error) => {
            console.error('Error loading audio for waveform:', error);
            setIsLoading(false);
            setHasError(true);
          });
      })
      .catch((error) => {
        console.error('Error loading wavesurfer.js:', error);
        setIsLoading(false);
        setHasError(true);
      });

    // 清理
    return () => {
      if (waveSurferRef.current) {
        try {
          waveSurferRef.current.destroy();
        } catch (e) {
          console.error('Error destroying wavesurfer:', e);
        }
        waveSurferRef.current = null;
      }
    };
  }, [audioUrl, height, isMounted]);

  // 服务端渲染时显示占位符
  if (!isMounted) {
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
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-400 text-xs">
        Preview unavailable
      </div>
    );
  }

  if (isLoading) {
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
  }

  return (
    <div 
      ref={containerRef} 
      style={{ width: '100%', height: `${height}px` }}
      className="waveform-container"
    />
  );
}
