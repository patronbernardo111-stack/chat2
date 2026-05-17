import React from 'react';

// Genera un color único y consistente basado en el nombre
const nameToColor = (name: string): { bg: string; text: string } => {
  const palettes = [
    { bg: 'linear-gradient(135deg,#00c8a0,#00b4e6)', text: '#fff' },
    { bg: 'linear-gradient(135deg,#6B5BD6,#8B5CF6)', text: '#fff' },
    { bg: 'linear-gradient(135deg,#F59E0B,#EF4444)', text: '#fff' },
    { bg: 'linear-gradient(135deg,#EC4899,#F43F5E)', text: '#fff' },
    { bg: 'linear-gradient(135deg,#0EA5E9,#6366F1)', text: '#fff' },
    { bg: 'linear-gradient(135deg,#10B981,#059669)', text: '#fff' },
    { bg: 'linear-gradient(135deg,#F97316,#EF4444)', text: '#fff' },
    { bg: 'linear-gradient(135deg,#8B5CF6,#EC4899)', text: '#fff' },
    { bg: 'linear-gradient(135deg,#06B6D4,#0EA5E9)', text: '#fff' },
    { bg: 'linear-gradient(135deg,#84CC16,#22C55E)', text: '#fff' },
    { bg: 'linear-gradient(135deg,#F59E0B,#84CC16)', text: '#fff' },
    { bg: 'linear-gradient(135deg,#EF4444,#F97316)', text: '#fff' },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palettes[Math.abs(hash) % palettes.length];
};

// Obtiene las iniciales del nombre (máx 2 letras)
const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface AvatarProps {
  name: string;
  size?: number;
  photo?: string; // URL de foto real si existe
  status?: 'online' | 'offline' | 'away';
  showStatus?: boolean;
  style?: React.CSSProperties;
}

export const Avatar: React.FC<AvatarProps> = ({
  name, size = 40, photo, status, showStatus = false, style
}) => {
  const { bg, text } = nameToColor(name);
  const initials = getInitials(name);
  const fontSize = Math.max(10, Math.round(size * 0.35));
  const statusSize = Math.max(8, Math.round(size * 0.22));
  const statusColor = status === 'online' ? '#22c55e' : status === 'away' ? '#f59e0b' : '#9CA3AF';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, ...style }}>
      {photo ? (
        <img src={photo} alt={name}
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize, fontWeight: 700, color: text, userSelect: 'none',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
        }}>
          {initials}
        </div>
      )}
      {showStatus && status && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: statusSize, height: statusSize, borderRadius: '50%',
          background: statusColor, border: `${Math.max(1, statusSize * 0.2)}px solid #fff`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}/>
      )}
    </div>
  );
};

export { nameToColor, getInitials };
