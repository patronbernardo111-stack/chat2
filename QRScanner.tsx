import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';

interface Props {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<Props> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);
  const scanningRef = useRef(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !scanningRef.current) return;

    if (video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Intentar con jsQR — probar todas las inversiones para mayor compatibilidad
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code?.data) {
          scanningRef.current = false;
          stopCamera();
          if ('vibrate' in navigator) navigator.vibrate(100);
          onScan(code.data);
          return;
        }

        // Fallback: BarcodeDetector (Chrome/Edge/Samsung Browser modernos)
        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          detector.detect(video).then((barcodes: any[]) => {
            if (barcodes.length > 0 && scanningRef.current) {
              scanningRef.current = false;
              stopCamera();
              onScan(barcodes[0].rawValue);
            }
          }).catch(() => {});
        }
      }
    }

    animRef.current = requestAnimationFrame(scanFrame);
  }, [onScan, stopCamera]);

  const startCamera = useCallback(async () => {
    setStatus('loading');
    setError('');

    // Intentar primero cámara trasera, luego cualquier cámara disponible
    const constraints: MediaStreamConstraints[] = [
      { video: { facingMode: { exact: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: true },
    ];

    let stream: MediaStream | null = null;
    for (const constraint of constraints) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraint);
        break;
      } catch (_) {
        // Probar siguiente opción
      }
    }

    if (!stream) {
      setError('No se pudo acceder a la cámara. Verifica los permisos en tu navegador.');
      setStatus('error');
      return;
    }

    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;
    video.setAttribute('playsinline', 'true');
    video.muted = true;

    // Usar múltiples eventos para mayor compatibilidad entre dispositivos
    const startScan = () => {
      setStatus('ready');
      scanningRef.current = true;
      animRef.current = requestAnimationFrame(scanFrame);
    };

    video.onloadedmetadata = () => video.play().then(startScan).catch(startScan);
    video.oncanplay = () => {
      if (status !== 'ready') startScan();
    };

    // Fallback por timeout por si los eventos no disparan
    setTimeout(() => {
      if (scanningRef.current === false || status === 'loading') {
        video.play().catch(() => {});
        startScan();
      }
    }, 2000);

    try {
      await video.play();
      startScan();
    } catch (_) {
      // Los eventos de arriba lo manejarán
    }
  }, [scanFrame, status]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 6000, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.7)' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <span style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>Escanear QR de contacto</span>
      </div>

      {/* Cámara */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {error ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#fff' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
            <div style={{ fontSize: '14px', color: '#fca5a5', marginBottom: '16px' }}>{error}</div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={startCamera} style={{ background: '#00c8a0', border: 'none', borderRadius: '10px', padding: '12px 20px', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Reintentar
              </button>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '10px', padding: '12px 20px', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <>
            {status === 'loading' && (
              <div style={{ position: 'absolute', zIndex: 10, color: '#fff', fontSize: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid #00c8a0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
                Iniciando cámara...
              </div>
            )}
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              playsInline
              muted
              autoPlay
            />
            <canvas ref={canvasRef} style={{ display: 'none' }}/>
            {/* Marco de escaneo */}
            {status === 'ready' && (
              <div style={{ position: 'absolute', width: '240px', height: '240px', border: '3px solid #00c8a0', borderRadius: '16px', boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}>
                {[['0','0','right','bottom'],['0','auto','right','auto'],['auto','0','auto','bottom'],['auto','auto','auto','auto']].map(([t,r,b,l], i) => (
                  <div key={i} style={{ position: 'absolute', width: '24px', height: '24px', top: t === 'auto' ? 'auto' : -3, right: r === 'auto' ? 'auto' : -3, bottom: b === 'auto' ? 'auto' : -3, left: l === 'auto' ? 'auto' : -3, borderTop: (i < 2) ? '4px solid #00c8a0' : 'none', borderBottom: (i >= 2) ? '4px solid #00c8a0' : 'none', borderLeft: (i === 0 || i === 2) ? '4px solid #00c8a0' : 'none', borderRight: (i === 1 || i === 3) ? '4px solid #00c8a0' : 'none' }}/>
                ))}
                <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #00c8a0, transparent)', animation: 'scanLine 2s linear infinite', top: '50%' }}/>
              </div>
            )}
            <style>{`
              @keyframes scanLine { 0%{top:10%} 50%{top:90%} 100%{top:10%} }
              @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
          </>
        )}
      </div>

      <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
        Apunta la cámara al código QR del contacto
      </div>
    </div>
  );
};
