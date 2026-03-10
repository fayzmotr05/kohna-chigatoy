'use client';

import { useEffect, useRef, useState } from 'react';

interface ARViewerProps {
  glbUrl: string;
  usdzUrl?: string | null;
  itemName: string;
  onClose: () => void;
}

export default function ARViewer({ glbUrl, usdzUrl, itemName, onClose }: ARViewerProps) {
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load model-viewer script if not already loaded
    if (!customElements.get('model-viewer')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
      script.onload = () => setLoaded(true);
      document.head.appendChild(script);
    } else {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    // Close on escape
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-dark/80 backdrop-blur-sm">
      <div className="relative w-full h-full sm:w-[90vw] sm:h-[80vh] sm:max-w-3xl bg-white-warm sm:rounded-t-[20px] sm:rounded-b-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-bg-dark-soft">
          <h3 className="font-display text-lg text-cream font-semibold truncate pr-4">
            {itemName}
          </h3>
          <button
            onClick={onClose}
            className="text-brown-light hover:text-cream transition-colors shrink-0"
            aria-label="Yopish"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Model viewer */}
        <div ref={containerRef} className="w-full h-[calc(100%-52px)] bg-sand-light">
          {loaded ? (
            <div
              dangerouslySetInnerHTML={{
                __html: `
                  <model-viewer
                    src="${glbUrl}"
                    ${usdzUrl ? `ios-src="${usdzUrl}"` : ''}
                    ar
                    ar-modes="webxr scene-viewer quick-look"
                    camera-controls
                    touch-action="pan-y"
                    loading="lazy"
                    style="width:100%;height:100%;"
                    shadow-intensity="1"
                    shadow-softness="1"
                  >
                    <div slot="poster" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%">
                      <div style="text-align:center;color:#7A6355">
                        <div style="width:40px;height:40px;border:3px solid #D4B896;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 8px"></div>
                        <p style="font-size:14px">Yuklanmoqda...</p>
                      </div>
                    </div>
                  </model-viewer>
                  <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
                `,
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-text-secondary">
              <div className="text-center">
                <div className="w-10 h-10 border-3 border-tan border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm">AR yuklanmoqda...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
