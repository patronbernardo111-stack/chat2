import React, { useState, useEffect } from 'react';
import QRGenerator from './QRGenerator';
import { useTranslation } from './translations';
import EGChatAuth from './EGChatAuth';
import SocialAuth from './EGChatSocialAuth';

interface Props {
  onComplete: () => void;
}

export const WelcomeScreen: React.FC<Props> = ({ onComplete }) => {
  const [showQR, setShowQR] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [showSocialAuth, setShowSocialAuth] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('es');
  
  const { t, direction } = useTranslation(currentLanguage);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Detectar idioma y región automáticamente
    const browserLang = navigator.language.split('-')[0];
    const supportedLanguages = ['es', 'en', 'pt', 'fr', 'de', 'it', 'ja', 'zh'];
    
    // Detectar zona horaria para determinar región
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const currentTimeZone = new Date().getTimezoneOffset();
    
    let detectedLanguage = 'es'; // Por defecto español para África
    
    // Priorizar español para Guinea Ecuatorial (GMT+1)
    // Si el usuario está en zona horaria de África Central o habla español
    if (browserLang === 'es' || 
        currentTimeZone === -60 || // GMT+1 (Guinea Ecuatorial)
        timezone.includes('Africa/Malabo') ||
        timezone.includes('Africa/Douala') ||
        timezone.includes('Africa/Lagos')) {
      detectedLanguage = 'es';
    } else if (supportedLanguages.includes(browserLang)) {
      detectedLanguage = browserLang;
    }
    
    setCurrentLanguage(detectedLanguage);
    
    // Guardar idioma detectado
    localStorage.setItem('egchat_language', detectedLanguage);
  }, []);

  const handlePhoneAuth = () => {
    setShowPhoneAuth(true);
  };

  const handleSocialAuth = () => {
    setShowSocialAuth(true);
  };

  const handleAuthSuccess = (user: any) => {
    // Guardar usuario autenticado
    localStorage.setItem('egchat_user', JSON.stringify(user));
    localStorage.setItem('egchat_authenticated', 'true');
    onComplete();
  };

  const handleBackToWelcome = () => {
    setShowPhoneAuth(false);
    setShowSocialAuth(false);
  };

  const handleStart = () => {
    // Guardar que ya se mostró la bienvenida
    localStorage.setItem('egchat_welcome_shown', 'true');
    localStorage.setItem('egchat_startup', JSON.stringify({
      firstLaunch: new Date().toISOString(),
      version: '2.0.0',
      language: currentLanguage,
      features: {
        profilePhotos: true,
        qrRegistration: true,
        multiLanguage: true,
        glassmorphism: true,
        egchatAuth: true,
        socialAuth: true
      }
    }));
    onComplete();
  };

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.85) 0%, rgba(59, 130, 246, 0.85) 50%, rgba(139, 92, 246, 0.85) 100%)',
        backdropFilter: 'blur(30px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Logo EGCHAT girando */}
          <div style={{
            width: '120px',
            height: '120px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
            animation: 'spin 2s linear infinite',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden'
          }}>
            <img 
              src="/logo-transparent.png" 
              alt="EGCHAT Logo"
              style={{
                width: '90px',
                height: '90px',
                objectFit: 'contain'
              }}
            />
          </div>
          <div style={{
            marginTop: '24px',
            fontSize: '18px',
            fontWeight: '600',
            color: 'white',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}>
            EGCHAT v2.0.0
          </div>
          <div style={{
            marginTop: '8px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.8)',
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)'
          }}>
            Cargando experiencia moderna...
          </div>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `
        }} />
      </div>
    );
  }

  return (
    <div>
      {/* Mostrar EGChatAuth cuando se active */}
      {showPhoneAuth && (
        <EGChatAuth
          onAuthSuccess={handleAuthSuccess}
          onBack={handleBackToWelcome}
        />
      )}
      
      {/* Registro social */}
      {showSocialAuth && (
        <SocialAuth
          onAuthSuccess={handleAuthSuccess}
          onBack={handleBackToWelcome}
        />
      )}
      
      {/* WelcomeScreen normal */}
      {!showPhoneAuth && !showSocialAuth && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.85) 0%, rgba(59, 130, 246, 0.85) 50%, rgba(139, 92, 246, 0.85) 100%)',
          backdropFilter: 'blur(30px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          direction: direction
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderRadius: '24px',
            padding: '32px 24px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center'
          }}>
            {/* Logo EGCHAT con animación sutil */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                animation: 'spin 2s linear infinite',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                overflow: 'hidden'
              }}>
                <img 
                  src="/logo-transparent.png" 
                  alt="EGCHAT Logo"
                  style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'contain'
                  }}
                />
              </div>
            </div>

            <div style={{ 
              fontSize: '18px',
              fontWeight: '900',
              color: '#111827',
              marginBottom: '8px'
            }}>
              EGCHAT v2.0.0 - {new Date().toLocaleTimeString()}
            </div>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              color: 'white', 
              marginBottom: '12px',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}>
              {t.welcome.title}
            </div>

            <div style={{ 
              fontSize: '14px', 
              color: 'rgba(255, 255, 255, 0.9)', 
              marginBottom: '20px',
              lineHeight: '1.5',
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)'
            }}>
              {t.welcome.subtitle}
            </div>

            {/* Características */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              borderRadius: '16px', 
              padding: '16px', 
              marginBottom: '20px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>
                {t.welcome.features.title}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.6' }}>
                {t.welcome.features.items.map((item: string, index: number) => (
                  <div key={index} style={{ 
                    marginBottom: '8px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Funcional */}
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => setShowQR(!showQR)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
              >
                {showQR ? t.welcome.buttons.hideQR : t.welcome.buttons.showQR}
              </button>

              {showQR && (
                <div style={{ marginTop: '16px' }}>
                  <QRGenerator 
                    showQR={showQR}
                    onGenerated={(qrData) => {
                      console.log('QR funcional generado:', qrData);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Botones de Acción */}
            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <button
                onClick={handlePhoneAuth}
                style={{
                  width: '100%',
                  background: '#00c8a0',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
                  boxShadow: '0 4px 20px rgba(0, 200, 160, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#00a88a';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#00c8a0';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                Crear cuenta con teléfono
              </button>

              <button
                onClick={handleSocialAuth}
                style={{
                  width: '100%',
                  background: '#00c8a0',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
                  boxShadow: '0 4px 20px rgba(0, 200, 160, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#00a88a';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#00c8a0';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  <path d="M17 8v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/>
                  <circle cx="9" cy="13" r="2"/>
                  <circle cx="15" cy="13" r="2"/>
                </svg>
                Crear cuenta con correo
              </button>

              <button
                onClick={handleStart}
                style={{
                  width: '100%',
                  background: 'rgba(16, 185, 129, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.9)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {t.welcome.buttons.start}
              </button>
            </div>
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              
              @media (max-width: 480px) {
                .welcome-container {
                  padding: 20px 16px;
                  margin: 20px;
                }
              }
            `
          }} />
        </div>
      )}
    </div>
  );
};

export default WelcomeScreen;
