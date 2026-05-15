/**
 * ImageViewer.tsx
 * Visor de imágenes completo estilo WhatsApp/IMO
 * Funciones: zoom pinch, editar, recortar, reenviar, descargar, eliminar, info
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Contact {
  id: string;
  title: string;
  avatarUrl?: string;
  initials?: string;
  color?: string;
}

interface ImageViewerProps {
  imageUrl: string;
  senderName?: string;
  sentAt?: string;
  onClose: () => void;
  onDelete?: () => void;
  onForward?: (contactIds: string[]) => void;
  onEdit?: (editedUrl: string) => void;
  contacts?: Contact[];
}

// ── Iconos SVG inline ────────────────────────────────────────────────────────
const Icon = {
  close: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  download: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  edit: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  forward: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg>,
  trash: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  info: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  crop: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>,
  zoomIn: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  zoomOut: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

// ── Tipos de herramienta de edición ─────────────────────────────────────────
type EditTool = 'filters' | 'adjust' | 'rotate' | 'crop' | 'text' | 'draw';

const FILTERS = [
  { id: 'none',  label: 'Original', css: '' },
  { id: 'bw',    label: 'B&N',      css: 'grayscale(100%)' },
  { id: 'warm',  label: 'Cálido',   css: 'sepia(40%) saturate(150%)' },
  { id: 'cool',  label: 'Frío',     css: 'hue-rotate(30deg) saturate(120%)' },
  { id: 'vivid', label: 'Vívido',   css: 'saturate(180%) contrast(110%)' },
  { id: 'fade',  label: 'Fade',     css: 'opacity(0.88) saturate(70%) brightness(105%)' },
  { id: 'drama', label: 'Drama',    css: 'contrast(130%) brightness(90%)' },
  { id: 'retro', label: 'Retro',    css: 'sepia(60%) hue-rotate(-10deg)' },
];

export const ImageViewer: React.FC<ImageViewerProps> = ({
  imageUrl, senderName, sentAt, onClose, onDelete, onForward, onEdit, contacts = [],
}) => {
  // ── Zoom & pan ──────────────────────────────────────────────────────────────
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const lastTouchDist = useRef<number | null>(null);

  // ── Modos de UI ─────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<'view' | 'edit' | 'crop' | 'forward' | 'info'>('view');
  const [showToolbar, setShowToolbar] = useState(true);

  // ── Edición ─────────────────────────────────────────────────────────────────
  const [editTool, setEditTool] = useState<EditTool>('filters');
  const [filter, setFilter] = useState('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [overlayText, setOverlayText] = useState('');
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // ── Recorte ─────────────────────────────────────────────────────────────────
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, w: 80, h: 80 }); // % del contenedor
  const cropDragRef = useRef<{ corner: string; startX: number; startY: number; box: typeof cropBox } | null>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  // ── Reenviar ─────────────────────────────────────────────────────────────────
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  // ── Ocultar toolbar al hacer zoom ───────────────────────────────────────────
  useEffect(() => {
    setShowToolbar(scale <= 1.1);
  }, [scale]);

  // ── CSS filter activo ────────────────────────────────────────────────────────
  const filterDef = FILTERS.find(f => f.id === filter) || FILTERS[0];
  const cssFilter = [
    filterDef.css,
    `brightness(${brightness}%)`,
    `contrast(${contrast}%)`,
    `saturate(${saturation}%)`,
  ].filter(Boolean).join(' ');
  const cssTransform = `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`;

  // ── Zoom con rueda del ratón ─────────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.min(5, Math.max(1, s - e.deltaY * 0.001)));
  }, []);

  // ── Pinch zoom (touch) ───────────────────────────────────────────────────────
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastTouchDist.current !== null) {
        const delta = dist - lastTouchDist.current;
        setScale(s => Math.min(5, Math.max(1, s + delta * 0.01)));
      }
      lastTouchDist.current = dist;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastTouchDist.current = null;
  }, []);

  // ── Pan con mouse ────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }, [scale, offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  // ── Doble tap para zoom ──────────────────────────────────────────────────────
  const lastTap = useRef(0);
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setScale(s => s > 1 ? 1 : 2.5);
      setOffset({ x: 0, y: 0 });
    }
    lastTap.current = now;
  }, []);

  // ── Exportar imagen editada ──────────────────────────────────────────────────
  const exportEdited = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const img = imgRef.current;
      const canvas = canvasRef.current;
      if (!img || !canvas) { resolve(imageUrl); return; }
      const w = img.naturalWidth || 800;
      const h = img.naturalHeight || 600;
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      if (flipH) ctx.scale(-1, 1);
      ctx.translate(-w / 2, -h / 2);
      ctx.filter = cssFilter || 'none';
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();
      if (overlayText) {
        const fs = Math.max(24, w / 18);
        ctx.font = `bold ${fs}px sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = Math.max(2, w / 200);
        ctx.textAlign = 'center';
        ctx.strokeText(overlayText, w / 2, h - h / 10);
        ctx.fillText(overlayText, w / 2, h - h / 10);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    });
  }, [imageUrl, rotation, flipH, cssFilter, overlayText]);

  // ── Descargar imagen ─────────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    try {
      const url = mode === 'edit' ? await exportEdited() : imageUrl;
      const a = document.createElement('a');
      a.href = url;
      a.download = `egchat-foto-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // fallback
      window.open(imageUrl, '_blank');
    }
  }, [imageUrl, mode, exportEdited]);

  // ── Guardar edición ──────────────────────────────────────────────────────────
  const handleSaveEdit = useCallback(async () => {
    const url = await exportEdited();
    onEdit?.(url);
    setMode('view');
  }, [exportEdited, onEdit]);

  // ── Recorte: mover esquinas ──────────────────────────────────────────────────
  const handleCropMouseDown = useCallback((e: React.MouseEvent, corner: string) => {
    e.stopPropagation();
    cropDragRef.current = { corner, startX: e.clientX, startY: e.clientY, box: { ...cropBox } };
  }, [cropBox]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!cropDragRef.current || !cropContainerRef.current) return;
      const rect = cropContainerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - cropDragRef.current.startX) / rect.width) * 100;
      const dy = ((e.clientY - cropDragRef.current.startY) / rect.height) * 100;
      const b = cropDragRef.current.box;
      let { x, y, w, h } = b;
      const c = cropDragRef.current.corner;
      if (c === 'tl') { x = Math.min(b.x + dx, b.x + b.w - 10); y = Math.min(b.y + dy, b.y + b.h - 10); w = b.w - dx; h = b.h - dy; }
      if (c === 'tr') { y = Math.min(b.y + dy, b.y + b.h - 10); w = b.w + dx; h = b.h - dy; }
      if (c === 'bl') { x = Math.min(b.x + dx, b.x + b.w - 10); w = b.w - dx; h = b.h + dy; }
      if (c === 'br') { w = b.w + dx; h = b.h + dy; }
      setCropBox({
        x: Math.max(0, Math.min(x, 90)),
        y: Math.max(0, Math.min(y, 90)),
        w: Math.max(10, Math.min(w, 100 - x)),
        h: Math.max(10, Math.min(h, 100 - y)),
      });
    };
    const onUp = () => { cropDragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // ── Aplicar recorte ──────────────────────────────────────────────────────────
  const handleApplyCrop = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const cx = (cropBox.x / 100) * w;
    const cy = (cropBox.y / 100) * h;
    const cw = (cropBox.w / 100) * w;
    const ch = (cropBox.h / 100) * h;
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
    const url = canvas.toDataURL('image/jpeg', 0.95);
    onEdit?.(url);
    setMode('view');
  }, [cropBox, onEdit]);

  // ── Reenviar ─────────────────────────────────────────────────────────────────
  const handleForward = useCallback(() => {
    if (selectedContacts.length === 0) return;
    onForward?.(selectedContacts);
    setMode('view');
    setSelectedContacts([]);
  }, [selectedContacts, onForward]);

  // ── Botón de acción en toolbar ───────────────────────────────────────────────
  const ActionBtn: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }> = ({ icon, label, onClick, danger }) => (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
      color: danger ? '#ef4444' : 'rgba(255,255,255,0.9)', padding: '6px 10px',
    }}>
      {icon}
      <span style={{ fontSize: '10px', fontWeight: '600' }}>{label}</span>
    </button>
  );

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 6000, background: '#000', display: 'flex', flexDirection: 'column', userSelect: 'none' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <img ref={imgRef} src={imageUrl} alt="" crossOrigin="anonymous" style={{ display: 'none' }} />

      {/* ── HEADER ── */}
      {showToolbar && mode === 'view' && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
          padding: '12px 16px 24px', display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', display: 'flex' }}>
            {Icon.close}
          </button>
          <div style={{ flex: 1 }}>
            {senderName && <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{senderName}</div>}
            {sentAt && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{sentAt}</div>}
          </div>
          <ActionBtn icon={Icon.info} label="Info" onClick={() => setMode('info')} />
        </div>
      )}

      {/* ── IMAGEN PRINCIPAL ── */}
      {mode !== 'crop' && (
        <div
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleDoubleTap}
        >
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={imageUrl}
              alt="foto"
              style={{
                maxWidth: '100vw', maxHeight: '100vh',
                objectFit: 'contain',
                transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px) ${cssTransform}`,
                filter: cssFilter || undefined,
                transition: isDragging ? 'none' : 'transform 0.15s ease',
                display: 'block',
              }}
              onClick={e => e.stopPropagation()}
              draggable={false}
            />
            {overlayText && mode === 'edit' && (
              <div style={{
                position: 'absolute', bottom: '10%', left: 0, right: 0,
                textAlign: 'center', fontSize: '22px', fontWeight: '800',
                color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                pointerEvents: 'none', padding: '0 16px',
              }}>{overlayText}</div>
            )}
          </div>
        </div>
      )}

      {/* ── MODO RECORTE ── */}
      {mode === 'crop' && (
        <div ref={cropContainerRef} style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
          <img src={imageUrl} alt="crop" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', opacity: 0.5 }} draggable={false} />
          {/* Overlay de recorte */}
          <div style={{
            position: 'absolute',
            left: `${cropBox.x}%`, top: `${cropBox.y}%`,
            width: `${cropBox.w}%`, height: `${cropBox.h}%`,
            border: '2px solid #00c8a0',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
            cursor: 'move',
          }}>
            {/* Esquinas arrastrables */}
            {(['tl','tr','bl','br'] as const).map(c => (
              <div key={c} onMouseDown={e => handleCropMouseDown(e, c)} style={{
                position: 'absolute',
                width: '18px', height: '18px',
                background: '#00c8a0', borderRadius: '3px',
                cursor: 'nwse-resize',
                ...(c === 'tl' ? { top: -4, left: -4 } : c === 'tr' ? { top: -4, right: -4 } : c === 'bl' ? { bottom: -4, left: -4 } : { bottom: -4, right: -4 }),
              }} />
            ))}
            {/* Líneas de la regla de tercios */}
            <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', pointerEvents: 'none' }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{ border: '0.5px solid rgba(255,255,255,0.2)' }} />
              ))}
            </div>
          </div>
          {/* Botones recorte */}
          <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button onClick={() => setMode('view')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '20px', padding: '10px 24px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleApplyCrop} style={{ background: '#00c8a0', border: 'none', borderRadius: '20px', padding: '10px 24px', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Aplicar recorte</button>
          </div>
        </div>
      )}

      {/* ── MODO REENVIAR ── */}
      {mode === 'forward' && (
        <div style={{ flex: 1, background: '#1a1a2e', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Reenviar a...</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{selectedContacts.length} seleccionados</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {contacts.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>No hay contactos disponibles</div>
            )}
            {contacts.map(c => {
              const sel = selectedContacts.includes(c.id);
              return (
                <div key={c.id} onClick={() => setSelectedContacts(p => sel ? p.filter(x => x !== c.id) : [...p, c.id])}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', background: sel ? 'rgba(0,200,160,0.1)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: c.color || '#00c8a0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                    {c.avatarUrl ? <img src={c.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (c.initials || c.title.slice(0, 2).toUpperCase())}
                  </div>
                  <div style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: '#fff' }}>{c.title}</div>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${sel ? '#00c8a0' : 'rgba(255,255,255,0.3)'}`, background: sel ? '#00c8a0' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                    {sel && Icon.check}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setMode('view')} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleForward} disabled={selectedContacts.length === 0}
              style={{ flex: 2, background: selectedContacts.length > 0 ? '#00c8a0' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: selectedContacts.length > 0 ? 'pointer' : 'default' }}>
              Reenviar {selectedContacts.length > 0 ? `(${selectedContacts.length})` : ''}
            </button>
          </div>
        </div>
      )}

      {/* ── MODO INFO ── */}
      {mode === 'info' && (
        <div style={{ flex: 1, background: '#1a1a2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '24px' }}>
          <img src={imageUrl} alt="" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }} />
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
            {[
              { label: 'Remitente', value: senderName || 'Desconocido' },
              { label: 'Fecha', value: sentAt || 'No disponible' },
              { label: 'Tipo', value: 'Imagen JPEG' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{row.label}</span>
                <span style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>{row.value}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setMode('view')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', padding: '12px 32px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cerrar</button>
        </div>
      )}

      {/* ── PANEL DE EDICIÓN ── */}
      {mode === 'edit' && (
        <div style={{ background: 'rgba(0,0,0,0.9)', flexShrink: 0 }}>
          {/* Filtros */}
          {editTool === 'filters' && (
            <div style={{ padding: '10px 16px 8px' }}>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
                {FILTERS.map(f => (
                  <button key={f.id} onClick={() => setFilter(f.id)} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden', border: `2px solid ${filter === f.id ? '#00c8a0' : 'transparent'}` }}>
                      <img src={imageUrl} alt={f.label} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: f.css || undefined }} />
                    </div>
                    <span style={{ fontSize: '10px', color: filter === f.id ? '#00c8a0' : 'rgba(255,255,255,0.7)', fontWeight: filter === f.id ? '700' : '500' }}>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Ajustes */}
          {editTool === 'adjust' && (
            <div style={{ padding: '12px 20px 8px' }}>
              {[{ label: 'Brillo', value: brightness, set: setBrightness, min: 50, max: 150 }, { label: 'Contraste', value: contrast, set: setContrast, min: 50, max: 200 }, { label: 'Saturación', value: saturation, set: setSaturation, min: 0, max: 200 }].map(s => (
                <div key={s.label} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>{s.label}</span>
                    <span style={{ fontSize: '11px', color: '#00c8a0', fontWeight: '700' }}>{s.value}%</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} value={s.value} onChange={e => s.set(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#00c8a0', cursor: 'pointer' }} />
                </div>
              ))}
              <button onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '6px 14px', color: 'rgba(255,255,255,0.7)', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>Restablecer</button>
            </div>
          )}
          {/* Rotar */}
          {editTool === 'rotate' && (
            <div style={{ padding: '12px 20px 8px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[{ label: '↺ -90°', action: () => setRotation(r => (r - 90 + 360) % 360) }, { label: '↻ +90°', action: () => setRotation(r => (r + 90) % 360) }, { label: '↔ Voltear', action: () => setFlipH(p => !p) }, { label: '⟳ Reset', action: () => { setRotation(0); setFlipH(false); } }].map(b => (
                <button key={b.label} onClick={b.action} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '9px 16px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>{b.label}</button>
              ))}
              <div style={{ width: '100%', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Ángulo libre</span>
                  <span style={{ fontSize: '11px', color: '#00c8a0', fontWeight: '700' }}>{rotation}°</span>
                </div>
                <input type="range" min="0" max="359" value={rotation} onChange={e => setRotation(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#00c8a0', cursor: 'pointer' }} />
              </div>
            </div>
          )}
          {/* Texto */}
          {editTool === 'text' && (
            <div style={{ padding: '12px 20px 8px' }}>
              {showTextInput ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input autoFocus value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="Escribe el texto..." style={{ flex: 1, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '9px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
                  <button onClick={() => { setOverlayText(textInput); setShowTextInput(false); }} style={{ background: '#00c8a0', border: 'none', borderRadius: '10px', padding: '9px 16px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>OK</button>
                  <button onClick={() => { setShowTextInput(false); setTextInput(''); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', padding: '9px 12px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => { setTextInput(overlayText); setShowTextInput(true); }} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '9px 18px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>{overlayText ? '✏️ Editar texto' : '+ Añadir texto'}</button>
                  {overlayText && <button onClick={() => setOverlayText('')} style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '9px 14px', color: '#EF4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Quitar</button>}
                </div>
              )}
            </div>
          )}
          {/* Barra de herramientas de edición */}
          <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '4px 0' }}>
            {([{ id: 'filters', label: 'Filtros', icon: '🎨' }, { id: 'adjust', label: 'Ajustar', icon: '⚙️' }, { id: 'rotate', label: 'Rotar', icon: '🔄' }, { id: 'text', label: 'Texto', icon: '✏️' }] as { id: EditTool; label: string; icon: string }[]).map(t => (
              <button key={t.id} onClick={() => setEditTool(t.id)} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '8px 4px', color: editTool === t.id ? '#00c8a0' : 'rgba(255,255,255,0.5)' }}>
                <span style={{ fontSize: '18px' }}>{t.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: editTool === t.id ? '700' : '500' }}>{t.label}</span>
              </button>
            ))}
          </div>
          {/* Botones guardar/cancelar edición */}
          <div style={{ display: 'flex', gap: '10px', padding: '8px 16px 12px' }}>
            <button onClick={() => setMode('view')} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', padding: '11px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleSaveEdit} style={{ flex: 2, background: '#00c8a0', border: 'none', borderRadius: '12px', padding: '11px', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Guardar cambios</button>
          </div>
        </div>
      )}

      {/* ── TOOLBAR INFERIOR (modo vista) ── */}
      {showToolbar && mode === 'view' && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
          padding: '24px 8px 16px',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        }}>
          <ActionBtn icon={Icon.download} label="Guardar" onClick={handleDownload} />
          {onEdit && <ActionBtn icon={Icon.edit} label="Editar" onClick={() => setMode('edit')} />}
          {onEdit && <ActionBtn icon={Icon.crop} label="Recortar" onClick={() => setMode('crop')} />}
          {onForward && <ActionBtn icon={Icon.forward} label="Reenviar" onClick={() => setMode('forward')} />}
          {onDelete && <ActionBtn icon={Icon.trash} label="Eliminar" onClick={onDelete} danger />}
        </div>
      )}

      {/* ── CONTROLES DE ZOOM ── */}
      {mode === 'view' && scale > 1 && (
        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => setScale(s => Math.min(5, s + 0.5))} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon.zoomIn}</button>
          <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon.zoomOut}</button>
        </div>
      )}
    </div>
  );
};
