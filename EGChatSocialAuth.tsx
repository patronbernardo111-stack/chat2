import React, { useState, useEffect, useRef } from 'react';
import { authAPI } from './api';
import { useTranslation } from './translations';

const BASE = import.meta.env.VITE_API_URL || '/api';

interface WeChatAuthProps {
  onAuthSuccess: (user: any) => void;
  onBack: () => void;
}

export const WeChatAuth: React.FC<WeChatAuthProps> = ({ onAuthSuccess, onBack }) => {
  const [currentStep, setCurrentStep] = useState<'phone' | 'verification' | 'profile' | 'password' | 'security' | 'complete'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('other');
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [userData, setUserData] = useState<any>(null);
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
      const response = await fetch(`${BASE}/auth/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: phoneNumber,
          method: 'sms',
          platform: 'egchat'
        })
      });

      if (response.ok) {
        setCurrentStep('verification');
        setCountdown(60);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al enviar código de verificación');
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${BASE}/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: phoneNumber,
          code: verificationCode,
          platform: 'egchat'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.verified) {
          setCurrentStep('profile');
        } else {
          setError('Código incorrecto. Intenta nuevamente.');
        }
      } else {
        setError('Error al verificar código');
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    if (!fullName.trim()) {
      setError('Por favor ingresa tu nombre completo');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }
    if (!birthday) {
      setError('Por favor selecciona tu fecha de nacimiento');
      return;
    }

    setLoading(true);
    setError('');

    try {
      setCurrentStep('password');
    } catch (err) {
      setError('Error al procesar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError('');

    try {
      setCurrentStep('security');
    } catch (err) {
      setError('Error al procesar contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = async () => {
    if (!securityQuestion.trim() || !securityAnswer.trim()) {
      setError('Por favor completa la pregunta y respuesta de seguridad');
      return;
    }
    if (!agreedToTerms) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${BASE}/auth/register-social`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: phoneNumber,
          full_name: fullName,
          email: email,
          password: password,
          birthday: birthday,
          gender: gender,
          region: region,
          security_question: securityQuestion,
          security_answer: securityAnswer,
          verification_code: verificationCode,
          platform: 'egchat'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setCurrentStep('complete');
        
        // Guardar sesión y redirigir
        localStorage.setItem('egchat_user', JSON.stringify(data));
        localStorage.setItem('egchat_authenticated', 'true');
        localStorage.setItem('egchat_welcome_shown', 'true');
        
        // Redirigir a la app principal
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al crear cuenta');
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
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
      background: '#07c160'
    }}>
      {/* Header WeChat */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.1)',
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
            EGCHAT
          </div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>
            Registro de cuenta
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
        {/* EGCHAT Logo */}
        <div style={{
          width: '100px',
          height: '100px',
          background: 'white',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: '#07c160',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <path d="M17 8v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/>
              <circle cx="9" cy="13" r="2"/>
              <circle cx="15" cy="13" r="2"/>
            </svg>
          </div>
        </div>

        {/* Instructions */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>
            Registra tu número de teléfono
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.5' }}>
            Ingresa tu número de teléfono para crear tu cuenta EGCHAT
            <br />
            Te enviaremos un código de verificación por SMS
          </p>
        </div>

        {/* Phone Input */}
        <div style={{ width: '100%', maxWidth: '400px', marginBottom: '32px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>+34</span>
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
                color: 'white',
                background: 'transparent'
              }}
              maxLength={15}
              autoFocus
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '24px',
            color: 'white',
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
            background: phoneNumber.length >= 9 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)',
            color: phoneNumber.length >= 9 ? '#07c160' : 'rgba(255, 255, 255, 0.7)',
            border: 'none',
            borderRadius: '25px',
            padding: '14px 40px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: phoneNumber.length >= 9 ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s'
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
      background: '#07c160'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.1)',
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
        {/* Shield Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
        </div>

        {/* Instructions */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>
            Ingresa el código de verificación
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.5' }}>
            Hemos enviado un código SMS a:
            <br />
            <strong>+34 {phoneNumber}</strong>
          </p>
        </div>

        {/* Code Input */}
        <div style={{ width: '100%', maxWidth: '300px', marginBottom: '32px' }}>
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
                  
                  if (e.target.value && index < 5) {
                    const inputs = document.querySelectorAll('input[type="text"]');
                    (inputs[index + 1] as HTMLInputElement)?.focus();
                  }
                }}
                style={{
                  width: '45px',
                  height: '45px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '20px',
                  fontWeight: '600',
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.1)',
                  outline: 'none'
                }}
              />
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '24px',
            color: 'white',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Resend Code */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '8px' }}>
            ¿No recibiste el código?
          </p>
          <button
            onClick={handleResendCode}
            disabled={countdown > 0 || loading}
            style={{
              background: 'none',
              border: 'none',
              color: countdown > 0 ? 'rgba(255, 255, 255, 0.5)' : 'white',
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
            background: verificationCode.length === 6 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)',
            color: verificationCode.length === 6 ? '#07c160' : 'rgba(255, 255, 255, 0.7)',
            border: 'none',
            borderRadius: '25px',
            padding: '14px 40px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: verificationCode.length === 6 ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s'
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
      background: '#07c160'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.1)',
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
            Información personal
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
        overflowY: 'auto'
      }}>
        {/* Profile Icon */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        </div>

        {/* Form Fields */}
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          {/* Full Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
              Nombre completo *
            </label>
            <input
              type="text"
              placeholder="Ingresa tu nombre completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                fontSize: '16px',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                outline: 'none'
              }}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
              Correo electrónico *
            </label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                fontSize: '16px',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                outline: 'none'
              }}
            />
          </div>

          {/* Birthday */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
              Fecha de nacimiento *
            </label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                fontSize: '16px',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                outline: 'none'
              }}
            />
          </div>

          {/* Gender */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
              Género
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              {[
                { value: 'male', label: 'Masculino' },
                { value: 'female', label: 'Femenino' },
                { value: 'other', label: 'Otro' }
              ].map((option) => (
                <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="gender"
                    value={option.value}
                    checked={gender === option.value}
                    onChange={(e) => setGender(e.target.value as any)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ color: 'white', fontSize: '14px' }}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Region */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
              Región
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                fontSize: '16px',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                outline: 'none'
              }}
            >
              <option value="">Selecciona tu región</option>
              <option value="es">España</option>
              <option value="mx">México</option>
              <option value="ar">Argentina</option>
              <option value="co">Colombia</option>
              <option value="pe">Perú</option>
              <option value="ve">Venezuela</option>
              <option value="cl">Chile</option>
              <option value="other">Otro</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '24px',
              color: 'white',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleProfileSubmit}
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.9)',
              color: loading ? 'rgba(255, 255, 255, 0.7)' : '#07c160',
              border: 'none',
              borderRadius: '25px',
              padding: '14px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s'
            }}
          >
            {loading ? 'Procesando...' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderPasswordStep = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#07c160'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.1)',
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <button
          onClick={() => setCurrentStep('profile')}
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
            Configurar contraseña
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
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        {/* Form */}
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
              Contraseña *
            </label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                fontSize: '16px',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                outline: 'none'
              }}
            />
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
              Confirmar contraseña *
            </label>
            <input
              type="password"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                fontSize: '16px',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                outline: 'none'
              }}
            />
          </div>

          {/* Password Requirements */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ color: 'white', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>
              Requisitos de contraseña:
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: password.length >= 6 ? '#4ade80' : '#f87171' }}>×</span>
                Mínimo 6 caracteres
              </div>
              <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: password === confirmPassword && password ? '#4ade80' : '#f87171' }}>×</span>
                Las contraseñas coinciden
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '24px',
              color: 'white',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handlePasswordSubmit}
            disabled={loading || password.length < 6 || password !== confirmPassword}
            style={{
              width: '100%',
              background: (password.length >= 6 && password === confirmPassword) && !loading ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)',
              color: (password.length >= 6 && password === confirmPassword) && !loading ? '#07c160' : 'rgba(255, 255, 255, 0.7)',
              border: 'none',
              borderRadius: '25px',
              padding: '14px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: (password.length >= 6 && password === confirmPassword) && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s'
            }}
          >
            {loading ? 'Verificando...' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecurityStep = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#07c160'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.1)',
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <button
          onClick={() => setCurrentStep('password')}
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
            Seguridad de cuenta
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
        overflowY: 'auto'
      }}>
        {/* Security Icon */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
        </div>

        {/* Form */}
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          {/* Security Question */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
              Pregunta de seguridad *
            </label>
            <select
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                fontSize: '16px',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                outline: 'none'
              }}
            >
              <option value="">Selecciona una pregunta</option>
              <option value="pet">¿Cuál es el nombre de tu primera mascota?</option>
              <option value="school">¿Cuál es el nombre de tu escuela primaria?</option>
              <option value="city">¿En qué ciudad naciste?</option>
              <option value="friend">¿Cuál es el nombre de tu mejor amigo de la infancia?</option>
              <option value="food">¿Cuál es tu comida favorita?</option>
              <option value="custom">Pregunta personalizada</option>
            </select>
          </div>

          {/* Custom Question */}
          {securityQuestion === 'custom' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: 'white', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                Tu pregunta *
              </label>
              <input
                type="text"
                placeholder="Escribe tu pregunta personalizada"
                value={securityQuestion === 'custom' ? '' : securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  fontSize: '16px',
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.1)',
                  outline: 'none'
                }}
              />
            </div>
          )}

          {/* Security Answer */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
              Respuesta de seguridad *
            </label>
            <input
              type="text"
              placeholder="Tu respuesta secreta"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                fontSize: '16px',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                outline: 'none'
              }}
            />
          </div>

          {/* Terms and Conditions */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                style={{ marginTop: '4px', cursor: 'pointer' }}
              />
              <div style={{ color: 'white', fontSize: '14px', lineHeight: '1.6' }}>
                Acepto los <a href="#" style={{ color: 'white', textDecoration: 'underline' }}>términos y condiciones</a> y la <a href="#" style={{ color: 'white', textDecoration: 'underline' }}>política de privacidad</a> de EGCHAT. Entiendo que mis datos serán procesados según las políticas de protección de datos.
              </div>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '24px',
              color: 'white',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSecuritySubmit}
            disabled={loading || !agreedToTerms || !securityQuestion.trim() || !securityAnswer.trim()}
            style={{
              width: '100%',
              background: (!loading && agreedToTerms && securityQuestion.trim() && securityAnswer.trim()) ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)',
              color: (!loading && agreedToTerms && securityQuestion.trim() && securityAnswer.trim()) ? '#07c160' : 'rgba(255, 255, 255, 0.7)',
              border: 'none',
              borderRadius: '25px',
              padding: '14px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: (!loading && agreedToTerms && securityQuestion.trim() && securityAnswer.trim()) ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s'
            }}
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#07c160'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.1)',
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>
            ¡Cuenta creada!
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
          width: '120px',
          height: '120px',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        {/* Success Message */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'white', marginBottom: '16px' }}>
            ¡Bienvenido a EGCHAT!
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.5' }}>
            Tu cuenta ha sido creada exitosamente
          </p>
        </div>

        {/* User Info */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{ color: 'white', fontSize: '16px', marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px' }}><strong>Nombre:</strong> {fullName}</div>
            <div style={{ marginBottom: '8px' }}><strong>Teléfono:</strong> +34 {phoneNumber}</div>
            <div style={{ marginBottom: '8px' }}><strong>Email:</strong> {email}</div>
            <div><strong>ID de Usuario:</strong> EG{Date.now().toString().slice(-6)}</div>
          </div>
        </div>

        {/* Features */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '32px',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '16px', textAlign: 'center' }}>
            ¡Todo listo para empezar!
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#4ade80' }}>×</span>
              Chat en tiempo real
            </div>
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#4ade80' }}>×</span>
              Llamadas de video
            </div>
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#4ade80' }}>×</span>
              Transferencias seguras
            </div>
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#4ade80' }}>×</span>
              Fotos de perfil
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#4ade80' }}>×</span>
              PWA Offline
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={() => onAuthSuccess(userData)}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            color: '#07c160',
            border: 'none',
            borderRadius: '25px',
            padding: '16px 40px',
            fontSize: '18px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: '0 4px 20px rgba(255, 255, 255, 0.3)'
          }}
        >
          Comenzar a usar EGCHAT
        </button>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.9; }
          }
        `
      }} />
    </div>
  );

  return (
    <div>
      {currentStep === 'phone' && renderPhoneStep()}
      {currentStep === 'verification' && renderVerificationStep()}
      {currentStep === 'profile' && renderProfileStep()}
      {currentStep === 'password' && renderPasswordStep()}
      {currentStep === 'security' && renderSecurityStep()}
      {currentStep === 'complete' && renderCompleteStep()}
    </div>
  );
};

export default WeChatAuth;
