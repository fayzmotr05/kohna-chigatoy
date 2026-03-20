'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';
import { useTelegram } from '@/telegram/TelegramProvider';

interface ARViewerProps {
  glbUrl?: string | null;
  usdzUrl?: string | null;
  itemName: string;
  onClose: () => void;
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export default function ARViewer({ glbUrl, usdzUrl, itemName, onClose }: ARViewerProps) {
  const [loaded, setLoaded] = useState(false);
  const [arLaunched, setArLaunched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { isTelegram, webApp } = useTelegram();

  // The src for model-viewer (prefers GLB, falls back to USDZ)
  const viewerSrc = glbUrl || usdzUrl || '';

  useEffect(() => {
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
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  /** Launch native AR viewer */
  function launchNativeAR() {
    if (arLaunched) return;
    setArLaunched(true);

    if (isIOS() && usdzUrl) {
      // iOS: AR Quick Look — open USDZ directly
      if (isTelegram && webApp) {
        webApp.openLink(usdzUrl);
      } else {
        // Create an <a> tag with rel="ar" for Quick Look
        const a = document.createElement('a');
        a.rel = 'ar';
        a.href = usdzUrl;
        const img = document.createElement('img');
        a.appendChild(img);
        a.click();
      }
    } else if (isAndroid() && glbUrl) {
      // Android: Scene Viewer via intent URL
      const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(glbUrl)}&mode=ar_preferred#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;end;`;
      if (isTelegram && webApp) {
        webApp.openLink(intentUrl);
      } else {
        window.location.href = intentUrl;
      }
    } else if (usdzUrl) {
      // Fallback: try opening USDZ directly
      if (isTelegram && webApp) {
        webApp.openLink(usdzUrl);
      } else {
        window.open(usdzUrl, '_blank');
      }
    } else if (glbUrl) {
      // Fallback: try opening GLB
      if (isTelegram && webApp) {
        webApp.openLink(glbUrl);
      } else {
        window.open(glbUrl, '_blank');
      }
    }

    setTimeout(() => setArLaunched(false), 2000);
  }

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
            aria-label={t.ar.close}
          >
            <X size={22} />
          </button>
        </div>

        {/* 3D Viewer + AR launch */}
        <div ref={containerRef} className="w-full h-[calc(100%-52px)] bg-sand-light relative">
          {loaded && viewerSrc ? (
            <>
              <div
                dangerouslySetInnerHTML={{
                  __html: `
                    <model-viewer
                      src="${viewerSrc}"
                      ${usdzUrl ? `ios-src="${usdzUrl}"` : ''}
                      ar
                      ar-modes="scene-viewer quick-look webxr"
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
                          <p style="font-size:14px">${t.ar.loading}</p>
                        </div>
                      </div>
                    </model-viewer>
                    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
                  `,
                }}
              />
              {/* AR launch button — always visible */}
              <button
                onClick={launchNativeAR}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-brown-deep text-cream px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
              >
                📱 {t.menu.arView}
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-text-secondary">
              <div className="text-center">
                <div className="w-10 h-10 border-3 border-tan border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm">{t.ar.arLoading}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
