import React, { useState, useEffect, useRef } from 'react';
import { authAPI } from './api';
import { useTranslation } from './translations';

const BASE = import.meta.env.VITE_API_URL || '/api';

interface WhatsAppAuthProps {
  onAuthSuccess: (user: any) => void;
  onBack: () => void;
}

export const WhatsAppAuth: React.FC<WhatsAppAuthProps> = ({ onAuthSuccess, onBack }) => {
  const [currentStep, setCurrentStep] = useState<'phone' | 'verification' | 'profile' | 'window'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [windowData, setWindowData] = useState<any>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation('es');

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handlePhoneSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await authAPI.sendVerification(phoneNumber, 'sms');
      if (result?.sent) {
        setCurrentStep('verification');
        setCountdown(60);
      } else {
        setError(result?.message || 'Error al enviar código de verificación');
      }
    } catch (err: any) {
      setError(err?.message || 'Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await authAPI.verifyCode(phoneNumber, verificationCode);
      if (result?.verified) {
        setCurrentStep('profile');
      } else {
        setError(result?.message || 'Código incorrecto. Intenta nuevamente.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    if (!fullName.trim()) {
      setError('Por favor ingresa tu nombre completo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await authAPI.registerWindow({
        phone: phoneNumber,
        full_name: fullName,
        verification_code: verificationCode,
        window_registration: true
      });

      setWindowData(data);
      setCurrentStep('window');
      localStorage.setItem('egchat_user', JSON.stringify(data));
      localStorage.setItem('egchat_authenticated', 'true');
      localStorage.setItem('egchat_welcome_shown', 'true');
      await authAPI.sendSMS(phoneNumber, `¡Bienvenido a EGCHAT! ${fullName}, tu cuenta ha sido creada exitosamente.`);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const sendNotificationMessage = async (phone: string, name: string) => {
    try {
      // Send notification message for window registration
      await fetch(`${BASE}/auth/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: phone,
          message: `¡Bienvenido a EGCHAT! ${name}, tu cuenta ha sido creada exitosamente. Para completar tu inscripción por ventana, por favor acércate a nuestra oficina más cercana con tu DNI. Código de referencia: ${windowData?.reference_code || 'EG' + Date.now()}`
        })
      });
    } catch (err) {
      console.error('Error sending notification message:', err);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      await handlePhoneSubmit();
    } finally {
      setLoading(false);
    }
  };

  const renderPhoneStep = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#f0f2f5'
    }}>
      {/* Header */}
      <div style={{
        background: '#075e54',
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            padding: 0
          }}
        >
          ×
        </button>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>
            Verificación de teléfono
          </div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>
            EGCHAT
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Phone Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          background: '#075e54',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </div>

        {/* Instructions */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111b21', marginBottom: '8px' }}>
            Verifica tu número de teléfono
          </h2>
          <p style={{ fontSize: '14px', color: '#667781', lineHeight: '1.5' }}>
            EGCHAT enviará un mensaje SMS con un código de verificación a tu número de teléfono.
            <br />
            Se aplicarán las tarifas de mensajes y datos estándar.
          </p>
        </div>

        {/* Phone Input */}
        <div style={{ width: '100%', maxWidth: '400px', marginBottom: '24px' }}>
          <div style={{
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ color: '#667781', fontSize: '16px' }}>+34</span>
            <input
              ref={phoneInputRef}
              type="tel"
              placeholder="Número de teléfono"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '16px',
                color: '#111b21'
              }}
              maxLength={15}
              autoFocus
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '24px',
            color: '#92400e',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handlePhoneSubmit}
          disabled={loading || phoneNumber.length < 9}
          style={{
            background: phoneNumber.length >= 9 ? '#00a884' : '#e8f5f1',
            color: phoneNumber.length >= 9 ? 'white' : '#8696a0',
            border: 'none',
            borderRadius: '24px',
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: phoneNumber.length >= 9 ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s'
          }}
        >
          {loading ? 'Enviando...' : 'Siguiente'}
        </button>
      </div>
    </div>
  );

  const renderVerificationStep = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#f0f2f5'
    }}>
      {/* Header */}
      <div style={{
        background: '#075e54',
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <button
          onClick={() => setCurrentStep('phone')}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            padding: 0
          }}
        >
          ×
        </button>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>
            Verificar código
          </div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>
            EGCHAT
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Lock Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          background: '#075e54',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        {/* Instructions */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111b21', marginBottom: '8px' }}>
            Ingresa el código
          </h2>
          <p style={{ fontSize: '14px', color: '#667781', lineHeight: '1.5' }}>
            Hemos enviado un código SMS a:
            <br />
            <strong>+34 {phoneNumber}</strong>
          </p>
        </div>

        {/* Code Input */}
        <div style={{ width: '100%', maxWidth: '300px', marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center'
          }}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={verificationCode[index] || ''}
                onChange={(e) => {
                  const newCode = verificationCode.split('');
                  newCode[index] = e.target.value;
                  setVerificationCode(newCode.join(''));
                  
                  // Auto focus next input
                  if (e.target.value && index < 5) {
                    const inputs = document.querySelectorAll('input[type="text"]');
                    (inputs[index + 1] as HTMLInputElement)?.focus();
                  }
                }}
                style={{
                  width: '45px',
                  height: '45px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111b21',
                  outline: 'none'
                }}
              />
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '24px',
            color: '#92400e',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Resend Code */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ fontSize: '14px', color: '#667781', marginBottom: '8px' }}>
            ¿No recibiste el código?
          </p>
          <button
            onClick={handleResendCode}
            disabled={countdown > 0 || loading}
            style={{
              background: 'none',
              border: 'none',
              color: countdown > 0 ? '#8696a0' : '#00a884',
              fontSize: '14px',
              fontWeight: '600',
              cursor: countdown > 0 ? 'not-allowed' : 'pointer',
              textDecoration: countdown > 0 ? 'none' : 'underline'
            }}
          >
            {countdown > 0 ? `Reenviar en ${countdown}s` : 'Reenviar código'}
          </button>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleVerificationSubmit}
          disabled={loading || verificationCode.length !== 6}
          style={{
            background: verificationCode.length === 6 ? '#00a884' : '#e8f5f1',
            color: verificationCode.length === 6 ? 'white' : '#8696a0',
            border: 'none',
            borderRadius: '24px',
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: verificationCode.length === 6 ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s'
          }}
        >
          {loading ? 'Verificando...' : 'Verificar'}
        </button>
      </div>
    </div>
  );

  const renderProfileStep = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#f0f2f5'
    }}>
      {/* Header */}
      <div style={{
        background: '#075e54',
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <button
          onClick={() => setCurrentStep('verification')}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            padding: 0
          }}
        >
          ×
        </button>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>
            Tu perfil
          </div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>
            EGCHAT
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Profile Icon */}
        <div style={{
          width: '100px',
          height: '100px',
          background: '#075e54',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>

        {/* Instructions */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111b21', marginBottom: '8px' }}>
            Completa tu perfil
          </h2>
          <p style={{ fontSize: '14px', color: '#667781', lineHeight: '1.5' }}>
            Ingresa tu nombre completo para crear tu cuenta EGCHAT
          </p>
        </div>

        {/* Name Input */}
        <div style={{ width: '100%', maxWidth: '400px', marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Nombre completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              color: '#111b21',
              outline: 'none'
            }}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '24px',
            color: '#92400e',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleProfileSubmit}
          disabled={loading || !fullName.trim()}
          style={{
            background: fullName.trim() ? '#00a884' : '#e8f5f1',
            color: fullName.trim() ? 'white' : '#8696a0',
            border: 'none',
            borderRadius: '24px',
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: fullName.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s'
          }}
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </div>
    </div>
  );

  const renderWindowStep = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#f0f2f5'
    }}>
      {/* Header */}
      <div style={{
        background: '#075e54',
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>
            Inscripción por ventana
          </div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>
            EGCHAT
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Success Icon */}
        <div style={{
          width: '100px',
          height: '100px',
          background: '#25d366',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        {/* Success Message */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111b21', marginBottom: '8px' }}>
            ¡Cuenta creada exitosamente!
          </h2>
          <p style={{ fontSize: '14px', color: '#667781', lineHeight: '1.5' }}>
            Te hemos enviado un mensaje con las instrucciones para completar tu inscripción por ventana.
          </p>
        </div>

        {/* Reference Code */}
        <div style={{
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#667781', marginBottom: '8px' }}>
            Código de referencia:
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#075e54' }}>
            {windowData?.reference_code || 'EG' + Date.now()}
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          background: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '32px',
          textAlign: 'left'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111b21', marginBottom: '12px' }}>
            Pasos siguientes:
          </h3>
          <ol style={{ fontSize: '14px', color: '#667781', lineHeight: '1.6', paddingLeft: '20px' }}>
            <li>Acércate a nuestra oficina más cercana</li>
            <li>Presenta tu DNI y el código de referencia</li>
            <li>Completa el proceso de verificación</li>
            <li>Recibirás acceso completo a EGCHAT</li>
          </ol>
        </div>

        {/* Complete Button */}
        <button
          onClick={() => onAuthSuccess(windowData)}
          style={{
            background: '#00a884',
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Comenzar a usar EGCHAT
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {currentStep === 'phone' && renderPhoneStep()}
      {currentStep === 'verification' && renderVerificationStep()}
      {currentStep === 'profile' && renderProfileStep()}
      {currentStep === 'window' && renderWindowStep()}
    </div>
  );
};

export default WhatsAppAuth;
