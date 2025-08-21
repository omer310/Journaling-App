'use client';

import React, { useEffect, useState } from 'react';
import { RiCloseLine, RiFullscreenExitLine, RiFullscreenLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { sanitizeRichTextHtml } from '@/lib/sanitize';

interface ImmersiveViewProps {
  isOpen: boolean;
  onClose: () => void;
  entry: {
    id: string;
    title: string;
    content: string;
    date: string;
    mood?: 'happy' | 'neutral' | 'sad';
    tags?: string[];
  } | null;
}

export function ImmersiveView({ isOpen, onClose, entry }: ImmersiveViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [isUIManuallyHidden, setIsUIManuallyHidden] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [maxWidth, setMaxWidth] = useState(800);

  // Get current font from localStorage
  const getCurrentFont = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('soul-pages-font') || 'Indie Flower';
    }
    return 'Indie Flower';
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Prevent body scrolling when immersive view is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Auto-hide UI after 3 seconds of inactivity
  useEffect(() => {
    if (!isOpen || isUIManuallyHidden) return;

    let timeout: NodeJS.Timeout;
    const resetTimeout = () => {
      clearTimeout(timeout);
      if (!showUI && !isUIManuallyHidden) {
        setShowUI(true);
      }
      timeout = setTimeout(() => {
        if (!isUIManuallyHidden) {
          setShowUI(false);
        }
      }, 3000);
    };

    const handleMouseMove = () => resetTimeout();
    const handleKeyPress = () => resetTimeout();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyPress);
    resetTimeout();

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isOpen, showUI, isUIManuallyHidden]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'f':
        case 'F':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
                 case 'h':
         case 'H':
           if (e.ctrlKey || e.metaKey) {
             e.preventDefault();
             setIsUIManuallyHidden(!isUIManuallyHidden);
             setShowUI(!showUI);
           }
           break;
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setFontSize(prev => Math.min(prev + 2, 32));
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setFontSize(prev => Math.max(prev - 2, 12));
          }
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setFontSize(18);
            setLineHeight(1.8);
            setMaxWidth(800);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !entry) return null;

  const sanitizedContent = sanitizeRichTextHtml(entry.content);
  const currentFont = getCurrentFont();

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
      </div>

      {/* Main Content */}
      <div className="relative h-full flex flex-col">
        {/* Header UI */}
        <div 
          className={`absolute top-0 left-0 right-0 z-10 transition-all duration-500 ${
            showUI ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
          }`}
        >
          <div className="bg-black/80 backdrop-blur-xl border-b border-white/10 p-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Close (Esc)"
                >
                  <RiCloseLine className="w-5 h-5" />
                </button>
                <div className="text-white">
                  <h1 className="text-lg font-semibold truncate max-w-md">{entry.title}</h1>
                  <p className="text-sm text-white/70">
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mood indicator */}
                {entry.mood && (
                  <div className="px-3 py-1 rounded-full bg-white/10 text-white text-sm">
                    {entry.mood === 'happy' && '😊'}
                    {entry.mood === 'neutral' && '😐'}
                    {entry.mood === 'sad' && '😢'}
                    <span className="ml-1 capitalize">{entry.mood}</span>
                  </div>
                )}

                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex gap-1">
                    {entry.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {entry.tags.length > 3 && (
                      <span className="px-2 py-1 rounded-full bg-white/10 text-white/70 text-xs">
                        +{entry.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Controls */}
                <div className="flex items-center gap-1">
                                     <button
                     onClick={() => {
                       setIsUIManuallyHidden(!isUIManuallyHidden);
                       setShowUI(!showUI);
                     }}
                     className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                     title="Toggle UI (Ctrl+H)"
                   >
                                         {showUI ? <RiEyeOffLine className="w-4 h-4" /> : <RiEyeLine className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Toggle Fullscreen (Ctrl+F)"
                  >
                                         {isFullscreen ? <RiFullscreenExitLine className="w-4 h-4" /> : <RiFullscreenLine className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

                 {/* Reading Content */}
         <div className="flex-1 overflow-auto">
           <div 
             className="min-h-full flex items-center justify-center p-8"
             style={{ 
               paddingTop: showUI ? '120px' : '40px',
               paddingBottom: showUI ? '120px' : '40px'
             }}
           >
            <div
              className="prose prose-lg dark:prose-invert max-w-none"
              style={{
                maxWidth: `${maxWidth}px`,
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
                fontFamily: currentFont,
              }}
            >
              <div
                className="text-white/90 leading-relaxed immersive-view-content"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                style={{
                  fontFamily: currentFont,
                  fontSize: `${fontSize}px`,
                  lineHeight: lineHeight,
                }}
              />
            </div>
          </div>
        </div>

                 {/* Floating Controls - appears when UI is hidden */}
         {!showUI && (
           <div className="absolute top-4 right-4 z-20 flex gap-2">
             <button
               onClick={onClose}
               className="p-3 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 text-white hover:bg-black/90 transition-all duration-200 shadow-lg"
               title="Close (Esc)"
             >
               <RiCloseLine className="w-5 h-5" />
             </button>
             <button
               onClick={() => {
                 setIsUIManuallyHidden(false);
                 setShowUI(true);
               }}
               className="p-3 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 text-white hover:bg-black/90 transition-all duration-200 shadow-lg"
               title="Show UI (Ctrl+H)"
             >
               <RiEyeLine className="w-5 h-5" />
             </button>
           </div>
         )}

         {/* Footer UI */}
         <div 
           className={`absolute bottom-0 left-0 right-0 z-10 transition-all duration-500 ${
             showUI ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
           }`}
         >
          <div className="bg-black/80 backdrop-blur-xl border-t border-white/10 p-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4 text-white/70 text-sm">
                <span>Ctrl+F: Fullscreen</span>
                <span>Ctrl+H: Toggle UI</span>
                <span>Ctrl+/-: Font Size</span>
                <span>Ctrl+0: Reset</span>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Font size controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFontSize(prev => Math.max(prev - 2, 12))}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Decrease font size (Ctrl+-)"
                  >
                    A-
                  </button>
                  <span className="text-white/70 text-sm min-w-[3rem] text-center">
                    {fontSize}px
                  </span>
                  <button
                    onClick={() => setFontSize(prev => Math.min(prev + 2, 32))}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Increase font size (Ctrl+=)"
                  >
                    A+
                  </button>
                </div>

                {/* Line height controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLineHeight(prev => Math.max(prev - 0.1, 1.2))}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    ↓
                  </button>
                  <span className="text-white/70 text-sm min-w-[2rem] text-center">
                    {lineHeight.toFixed(1)}
                  </span>
                  <button
                    onClick={() => setLineHeight(prev => Math.min(prev + 0.1, 2.5))}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    ↑
                  </button>
                </div>

                {/* Width controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMaxWidth(prev => Math.max(prev - 50, 400))}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    ←
                  </button>
                  <span className="text-white/70 text-sm min-w-[4rem] text-center">
                    {maxWidth}px
                  </span>
                  <button
                    onClick={() => setMaxWidth(prev => Math.min(prev + 50, 1200))}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    →
                  </button>
                </div>

                <button
                  onClick={() => {
                    setFontSize(18);
                    setLineHeight(1.8);
                    setMaxWidth(800);
                  }}
                  className="px-3 py-1 rounded bg-primary/20 text-primary text-sm hover:bg-primary/30 transition-colors"
                  title="Reset to defaults (Ctrl+0)"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
