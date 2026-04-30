// ResponsiveLayout.tsx — Layout adaptativo: móvil / tablet / desktop
import React from 'react';
import { useDevice } from './useDevice';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  navItems: NavItem[];
  header?: React.ReactNode;
  /** Contenido del panel izquierdo en tablet/desktop (lista de chats, etc.) */
  sidePanel?: React.ReactNode;
  /** Si hay un chat abierto en móvil, ocultar bottom nav */
  hideMobileNav?: boolean;
  userAvatar?: string;
  userName?: string;
  userInitials?: string;
  onProfileClick?: () => void;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  currentView,
  onNavigate,
  navItems,
  header,
  sidePanel,
  hideMobileNav = false,
  userAvatar,
  userName,
  userInitials = 'U',
  onProfileClick,
}) => {
  const device = useDevice();

  // ── MÓVIL ─────────────────────────────────────────────────────────────────
  if (device.isMobile) {
    return (
      <div style={{ width: '100%', height: '100dvh', overflow: 'hidden', position: 'relative', background: '#f0f2f5' }}>
        {header}
        <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          {children}
        </div>
        {!hideMobileNav && (
          <nav style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(90deg, #00c8a0 0%, #00b4e6 100%)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around',
            zIndex: 1000, borderTop: '0.5px solid rgba(255,255,255,0.25)',
            paddingTop: '6px',
            paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
            minHeight: '49px',
          }}>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: '2px', padding: 0, outline: 'none',
                  flex: 1, position: 'relative',
                }}
              >
                <div style={{ color: currentView === item.id ? '#fff' : 'rgba(255,255,255,0.65)', position: 'relative' }}>
                  {item.icon}
                  {item.badge && item.badge > 0 ? (
                    <span style={{
                      position: 'absolute', top: '-4px', right: '-6px',
                      background: '#ef4444', color: '#fff', borderRadius: '50%',
                      width: '16px', height: '16px', fontSize: '9px', fontWeight: '700',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{item.badge > 9 ? '9+' : item.badge}</span>
                  ) : null}
                </div>
                <span style={{
                  fontSize: '10px',
                  fontWeight: currentView === item.id ? '600' : '400',
                  color: currentView === item.id ? '#fff' : 'rgba(255,255,255,0.65)',
                  lineHeight: 1,
                }}>
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        )}
      </div>
    );
  }

  // ── TABLET (768–1199px) ────────────────────────────────────────────────────
  if (device.isTablet) {
    const SIDEBAR_W = 72;
    return (
      <div style={{ width: '100%', height: '100dvh', display: 'flex', overflow: 'hidden', background: '#f0f2f5' }}>
        {/* Sidebar izquierda — iconos + labels */}
        <aside style={{
          width: `${SIDEBAR_W}px`, flexShrink: 0,
          background: 'linear-gradient(180deg, #00c8a0 0%, #00b4e6 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          gap: '4px', zIndex: 100,
          boxShadow: '2px 0 12px rgba(0,0,0,0.12)',
        }}>
          {/* Logo */}
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', flexShrink: 0 }}>
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#fff' }}>EG</span>
          </div>

          {/* Nav items */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', alignItems: 'center' }}>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={item.label}
                style={{
                  width: '52px', height: '52px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                  background: currentView === item.id ? 'rgba(255,255,255,0.25)' : 'transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '3px', outline: 'none', position: 'relative',
                  boxShadow: currentView === item.id ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                }}
              >
                <div style={{ color: '#fff' }}>{item.icon}</div>
                <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.85)', fontWeight: '600', lineHeight: 1 }}>
                  {item.label}
                </span>
                {item.badge && item.badge > 0 ? (
                  <span style={{
                    position: 'absolute', top: '6px', right: '6px',
                    background: '#ef4444', color: '#fff', borderRadius: '50%',
                    width: '14px', height: '14px', fontSize: '8px', fontWeight: '700',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{item.badge > 9 ? '9+' : item.badge}</span>
                ) : null}
              </button>
            ))}
          </div>

          {/* Avatar usuario */}
          <button onClick={onProfileClick} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.2)', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {userAvatar
              ? <img src={userAvatar} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{userInitials}</span>
            }
          </button>
        </aside>

        {/* Panel secundario (lista de chats, etc.) si existe */}
        {sidePanel && (
          <div style={{
            width: '280px', flexShrink: 0, background: '#fff',
            borderRight: '1px solid #e5e7eb', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}>
            {sidePanel}
          </div>
        )}

        {/* Contenido principal */}
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {header && <div style={{ flexShrink: 0 }}>{header}</div>}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {children}
          </div>
        </main>
      </div>
    );
  }

  // ── DESKTOP (≥ 1200px) ────────────────────────────────────────────────────
  const SIDEBAR_W_DESKTOP = 240;
  return (
    <div style={{ width: '100%', height: '100dvh', display: 'flex', overflow: 'hidden', background: '#f0f2f5' }}>
      {/* Sidebar izquierda — ancha con labels */}
      <aside style={{
        width: `${SIDEBAR_W_DESKTOP}px`, flexShrink: 0,
        background: 'linear-gradient(180deg, #00c8a0 0%, #00b4e6 100%)',
        display: 'flex', flexDirection: 'column',
        paddingTop: 'calc(20px + env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
        paddingLeft: '12px', paddingRight: '12px',
        gap: '4px', zIndex: 100,
        boxShadow: '2px 0 16px rgba(0,0,0,0.15)',
      }}>
        {/* Logo + nombre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingLeft: '4px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '14px', fontWeight: '900', color: '#fff' }}>EG</span>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', lineHeight: 1 }}>EGCHAT</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.2 }}>Guinea Ecuatorial</div>
          </div>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: currentView === item.id ? 'rgba(255,255,255,0.25)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: '12px', outline: 'none',
                textAlign: 'left', position: 'relative',
                boxShadow: currentView === item.id ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
              }}
            >
              <div style={{ color: '#fff', flexShrink: 0 }}>{item.icon}</div>
              <span style={{ fontSize: '14px', fontWeight: currentView === item.id ? '700' : '500', color: '#fff', flex: 1 }}>
                {item.label}
              </span>
              {item.badge && item.badge > 0 ? (
                <span style={{
                  background: '#ef4444', color: '#fff', borderRadius: '10px',
                  padding: '1px 6px', fontSize: '10px', fontWeight: '700',
                }}>{item.badge > 99 ? '99+' : item.badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Perfil usuario */}
        <button
          onClick={onProfileClick}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: '10px', outline: 'none',
          }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {userAvatar
              ? <img src={userAvatar} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{userInitials}</span>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName || 'Mi perfil'}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>Ver perfil</div>
          </div>
        </button>
      </aside>

      {/* Panel secundario (lista de chats, etc.) si existe */}
      {sidePanel && (
        <div style={{
          width: '340px', flexShrink: 0, background: '#fff',
          borderRight: '1px solid #e5e7eb', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          {sidePanel}
        </div>
      )}

      {/* Contenido principal */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', background: '#f0f2f5' }}>
        {header && <div style={{ flexShrink: 0 }}>{header}</div>}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default ResponsiveLayout;
