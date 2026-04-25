import React, { useRef, useState, useEffect, useCallback } from 'react';

interface Props {
  imageUrl: string;
  onSave: (croppedUrl: string) => void;
  onClose: () => void;
}

export const AvatarCropModal: React.FC<Props> = ({ imageUrl, onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);

  const SIZE = 280; // tamaño del círculo de preview

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      // Centrar imagen inicialmente
      const scaleX = SIZE / img.naturalWidth;
      const scaleY = SIZE / img.naturalHeight;
      const initialScale = Math.max(scaleX, scaleY) * 1.1;
      setScale(initialScale);
      setOffset({ x: 0, y: 0 });
      setImgLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, SIZE, SIZE);

    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = SIZE / 2 - w / 2 + offset.x;
    const y = SIZE / 2 - h / 2 + offset.y;

    // Clip circular
    ctx.save();
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();

    // Borde
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = '#00c8a0';
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [offset, scale, imgLoaded]);

  useEffect(() => { draw(); }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragging(true);
    setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y });
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    const t = e.touches[0];
    setOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Comprimir a 150x150 JPEG 60% — ~10-15KB en base64
    const out = document.createElement('canvas');
    out.width = 150; out.height = 150;
    const ctx2 = out.getContext('2d')!;
    ctx2.drawImage(canvas, 0, 0, 150, 150);
    const url = out.toDataURL('image/jpeg', 0.6);
    onSave(url);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 6000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', marginBottom: '8px' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>Cancelar</button>
        <span style={{ color: '#fff', fontWeight: '600', fontSize: '15px' }}>Ajustar foto</span>
        <button onClick={handleSave} style={{ background: '#00c8a0', border: 'none', borderRadius: '20px', padding: '7px 18px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Guardar</button>
      </div>

      {/* Instrucción */}
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '16px' }}>Arrastra para posicionar · Desliza para zoom</p>

      {/* Canvas circular */}
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        style={{ borderRadius: '50%', cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none', boxShadow: '0 0 0 4px rgba(0,200,160,0.4)' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      />

      {/* Zoom slider */}
      <div style={{ marginTop: '24px', width: '280px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        <input
          type="range" min="0.5" max="3" step="0.05" value={scale}
          onChange={e => setScale(parseFloat(e.target.value))}
          style={{ flex: 1, accentColor: '#00c8a0', cursor: 'pointer' }}
        />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>
    </div>
  );
};
