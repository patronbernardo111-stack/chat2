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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [uploadError, setUploadError] = useState('');
  const [uploadProcessing, setUploadProcessing] = useState(false);

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

        // Fallback: BarcodeDetector nativo (Chrome/Samsung modernos)
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

    // Verificar si mediaDevices está disponible (falla en HTTP o WebViews sin permisos)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador no permite acceso a la cámara.\nUsa la opción "Subir imagen" para escanear el QR.');
      setStatus('error');
      return;
    }

    // Intentar primero cámara trasera, luego cualquier cámara disponible
    const constraints: MediaStreamConstraints[] = [
      { video: { facingMode: { exact: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: 'environment' } },
      { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: true },
    ];

    let stream: MediaStream | null = null;
    let lastErr: any = null;
    for (const constraint of constraints) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraint);
        break;
      } catch (e) {
        lastErr = e;
      }
    }

    if (!stream) {
      const errName = lastErr?.name || '';
      let msg = 'No se pudo acceder a la cámara.';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        msg = 'Permiso de cámara denegado.\nVe a Ajustes del navegador → Permisos → Cámara → Permitir.\nO usa "Subir imagen" para escanear el QR.';
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        msg = 'No se encontró ninguna cámara en este dispositivo.\nUsa "Subir imagen" para escanear el QR.';
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        msg = 'La cámara está siendo usada por otra app.\nCiérrala e inténtalo de nuevo, o usa "Subir imagen".';
      } else if (errName === 'OverconstrainedError') {
        msg = 'La cámara no soporta la configuración requerida.\nUsa "Subir imagen" para escanear el QR.';
      } else {
        msg = 'No se pudo acceder a la cámara.\nUsa "Subir imagen" para escanear el QR.';
      }
      setError(msg);
      setStatus('error');
      return;
    }

    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;
    video.setAttribute('playsinline', 'true');
    video.muted = true;

    const startScan = () => {
      setStatus('ready');
      scanningRef.current = true;
      animRef.current = requestAnimationFrame(scanFrame);
    };

    video.onloadedmetadata = () => video.play().then(startScan).catch(startScan);
    video.oncanplay = () => { if (status !== 'ready') startScan(); };

    setTimeout(() => {
      if (status === 'loading') {
        video.play().catch(() => {});
        startScan();
      }
    }, 2500);

    try {
      await video.play();
      startScan();
    } catch (_) {}
  }, [scanFrame, status]);

  // Procesar imagen subida — decodificar QR con jsQR
  const processUploadedImage = useCallback((file: File) => {
    setUploadError('');
    setUploadProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) { setUploadError('Error procesando imagen.'); setUploadProcessing(false); return; }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Intentar jsQR directamente
        let code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });

        // Si falla, escalar la imagen (algunos QR son muy pequeños)
        if (!code && (img.width > 1200 || img.height > 1200)) {
          const scale = 1200 / Math.max(img.width, img.height);
          const c2 = document.createElement('canvas');
          c2.width = Math.round(img.width * scale);
          c2.height = Math.round(img.height * scale);
          const ctx2 = c2.getContext('2d', { willReadFrequently: true })!;
          ctx2.drawImage(img, 0, 0, c2.width, c2.height);
          const id2 = ctx2.getImageData(0, 0, c2.width, c2.height);
          code = jsQR(id2.data, id2.width, id2.height, { inversionAttempts: 'attemptBoth' });
        }

        setUploadProcessing(false);
        if (code?.data) {
          if ('vibrate' in navigator) navigator.vibrate(100);
          onScan(code.data);
        } else {
          // Intentar BarcodeDetector como último recurso
          if ('BarcodeDetector' in window) {
            const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
            detector.detect(img).then((barcodes: any[]) => {
              if (barcodes.length > 0) {
                onScan(barcodes[0].rawValue);
              } else {
                setUploadError('No se encontró ningún código QR en la imagen. Asegúrate de que el QR sea visible y esté bien enfocado.');
              }
            }).catch(() => {
              setUploadError('No se encontró ningún código QR en la imagen. Asegúrate de que el QR sea visible y esté bien enfocado.');
            });
          } else {
            setUploadError('No se encontró ningún código QR en la imagen. Asegúrate de que el QR sea visible y esté bien enfocado.');
          }
        }
      };
      img.onerror = () => { setUploadError('No se pudo cargar la imagen.'); setUploadProcessing(false); };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => { setUploadError('Error leyendo el archivo.'); setUploadProcessing(false); };
    reader.readAsDataURL(file);
  }, [onScan]);

  useEffect(() => {
    if (mode === 'camera') {
      scanningRef.current = true;
      startCamera();
    } else {
      stopCamera();
      setStatus('ready');
    }
    return () => stopCamera();
  }, [mode]);

  const switchToUpload = () => {
    stopCamera();
    setMode('upload');
    setError('');
    setUploadError('');
  };

  const switchToCamera = () => {
    setMode('camera');
    setUploadError('');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 6000, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.8)' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <span style={{ color: '#fff', fontSize: '16px', fontWeight: '600', flex: 1 }}>Escanear QR</span>
        {/* Toggle cámara / subir imagen */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', padding: '3px', gap: '2px' }}>
          <button
            onClick={switchToCamera}
            style={{ background: mode === 'camera' ? '#00c8a0' : 'transparent', border: 'none', borderRadius: '16px', padding: '5px 12px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
          >
            📷 Cámara
          </button>
          <button
            onClick={switchToUpload}
            style={{ background: mode === 'upload' ? '#00c8a0' : 'transparent', border: 'none', borderRadius: '16px', padding: '5px 12px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
          >
            🖼️ Imagen
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>

        {/* ── MODO CÁMARA ── */}
        {mode === 'camera' && (
          <>
            {error ? (
              <div style={{ textAlign: 'center', padding: '32px 24px', color: '#fff', maxWidth: '320px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
                <div style={{ fontSize: '13px', color: '#fca5a5', marginBottom: '24px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{error}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button onClick={() => { setError(''); setStatus('loading'); startCamera(); }} style={{ background: '#00c8a0', border: 'none', borderRadius: '12px', padding: '13px 20px', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                    🔄 Reintentar cámara
                  </button>
                  <button onClick={switchToUpload} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '12px', padding: '13px 20px', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                    🖼️ Subir imagen del QR
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
                  playsInline muted autoPlay
                />
                <canvas ref={canvasRef} style={{ display: 'none' }}/>
                {status === 'ready' && (
                  <div style={{ position: 'absolute', width: '240px', height: '240px', border: '3px solid #00c8a0', borderRadius: '16px', boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}>
                    {[['0','0','right','bottom'],['0','auto','right','auto'],['auto','0','auto','bottom'],['auto','auto','auto','auto']].map(([t,r,b,l], i) => (
                      <div key={i} style={{ position: 'absolute', width: '24px', height: '24px', top: t === 'auto' ? 'auto' : -3, right: r === 'auto' ? 'auto' : -3, bottom: b === 'auto' ? 'auto' : -3, left: l === 'auto' ? 'auto' : -3, borderTop: (i < 2) ? '4px solid #00c8a0' : 'none', borderBottom: (i >= 2) ? '4px solid #00c8a0' : 'none', borderLeft: (i === 0 || i === 2) ? '4px solid #00c8a0' : 'none', borderRight: (i === 1 || i === 3) ? '4px solid #00c8a0' : 'none' }}/>
                    ))}
                    <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #00c8a0, transparent)', animation: 'scanLine 2s linear infinite', top: '50%' }}/>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── MODO SUBIR IMAGEN ── */}
        {mode === 'upload' && (
          <div style={{ textAlign: 'center', padding: '32px 24px', color: '#fff', maxWidth: '320px', width: '100%' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🖼️</div>
            <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Subir imagen del QR</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '28px', lineHeight: '1.6' }}>
              Toma una foto del código QR con tu cámara nativa y súbela aquí, o selecciona una imagen de tu galería.
            </div>

            {uploadProcessing ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#00c8a0' }}>
                <div style={{ width: '36px', height: '36px', border: '3px solid rgba(0,200,160,0.3)', borderTop: '3px solid #00c8a0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
                Procesando imagen...
              </div>
            ) : (
              <>
                {/* Input oculto — acepta imagen y cámara nativa */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processUploadedImage(file);
                    e.target.value = '';
                  }}
                />
                {/* Input sin capture para galería */}
                <input
                  id="qr-gallery-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processUploadedImage(file);
                    e.target.value = '';
                  }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{ background: '#00c8a0', border: 'none', borderRadius: '14px', padding: '15px 20px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  >
                    📸 Tomar foto del QR
                  </button>
                  <button
                    onClick={() => document.getElementById('qr-gallery-input')?.click()}
                    style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: '14px', padding: '15px 20px', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  >
                    🗂️ Elegir de galería
                  </button>
                </div>

                {uploadError && (
                  <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#fca5a5', fontSize: '13px', lineHeight: '1.5' }}>
                    {uploadError}
                  </div>
                )}

                <button onClick={switchToCamera} style={{ marginTop: '20px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
                  Volver a intentar con cámara
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: '16px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.8)', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
        {mode === 'camera' ? 'Apunta la cámara al código QR del contacto' : 'Sube una foto clara del código QR'}
      </div>

      <style>{`
        @keyframes scanLine { 0%{top:10%} 50%{top:90%} 100%{top:10%} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
