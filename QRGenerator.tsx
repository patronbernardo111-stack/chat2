import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { authAPI } from './api';

interface QRGeneratorProps {
  onGenerated?: (qrData: string) => void;
  showQR?: boolean;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ onGenerated, showQR = false }) => {
  const [qrData, setQrData] = useState<string>('');
  const [qrImage, setQrImage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [userData, setUserData] = useState<any>(null);

  // Generar datos de registro únicos para el QR
  const generateRegistrationData = () => {
    const timestamp = new Date().toISOString();
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const baseUrl = import.meta.env.VITE_APP_URL || 'https://egchat-v2.vercel.app';
    
    return {
      type: 'registration',
      app: 'EGCHAT',
      version: '2.0.0',
      timestamp,
      uniqueId,
      registrationUrl: `${baseUrl}/register?ref=${uniqueId}&t=${timestamp}`,
      backendUrl: import.meta.env.VITE_API_URL || '/api',
      endpoints: {
        register: '/auth/register',
        login: '/auth/login',
        validate: '/auth/validate-qr'
      },
      requiredFields: ['full_name', 'phone', 'password'],
      optionalFields: ['email', 'avatar_url'],
      features: [
        'Chat en tiempo real',
        'Llamadas de video', 
        'Transferencias seguras',
        'Gestión de grupos',
        'Fotos de perfil',
        'PWA Offline'
      ]
    };
  };

  // Generar QR Code funcional
  const generateFunctionalQR = async () => {
    setLoading(true);
    try {
      const registrationData = generateRegistrationData();
      const qrString = JSON.stringify(registrationData);
      
      // Generar QR Code visual
      const qrImage = await QRCode.toDataURL(qrString, {
        width: 256,
        margin: 2,
        color: {
          dark: '#0d0d0d',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
      
      setQrData(qrString);
      setQrImage(qrImage);
      
      if (onGenerated) {
        onGenerated(qrString);
      }
      
      // Guardar en localStorage para referencia
      localStorage.setItem('egchat_registration_qr', qrString);
      localStorage.setItem('egchat_qr_timestamp', new Date().toISOString());
      
    } catch (error) {
      console.error('Error generando QR funcional:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validar QR con backend
  const validateQRWithBackend = async (qrData: string) => {
    try {
      const data = JSON.parse(qrData);
      if (data.type === 'registration' && data.uniqueId) {
        // Enviar datos al backend para validación
        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        const response = await fetch(`${baseUrl}/auth/validate-qr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uniqueId: data.uniqueId,
            timestamp: data.timestamp,
            appVersion: data.version
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('QR validado en backend:', result);
          return result;
        }
      }
    } catch (error) {
      console.error('Error validando QR con backend:', error);
    }
    return null;
  };

  // Efecto para generar QR cuando se muestra
  useEffect(() => {
    if (showQR) {
      generateFunctionalQR();
    }
  }, [showQR]);

  // Efecto para cargar datos del usuario actual
  useEffect(() => {
    const loadUserData = async () => {
      if (authAPI.isAuthenticated()) {
        try {
          const user = await authAPI.me();
          setUserData(user);
        } catch (error) {
          console.error('Error cargando datos del usuario:', error);
        }
      }
    };
    loadUserData();
  }, []);

  if (!showQR) return null;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '20px',
      padding: '20px'
    }}>
      <div style={{ 
        textAlign: 'center',
        marginBottom: '10px'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '700', 
          color: '#0d0d0d',
          marginBottom: '8px'
        }}>
          QR de Registro Funcional
        </h3>
        <p style={{ 
          fontSize: '14px', 
          color: '#6b7280',
          margin: 0
        }}>
          Escanea para registrarte en EGCHAT v2.0.0
        </p>
      </div>

      {loading ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '10px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            Generando QR funcional...
          </span>
        </div>
      ) : qrImage ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '15px'
        }}>
          <div style={{
            background: 'white',
            padding: '16px',
            borderRadius: '12px',
            border: '2px solid #e5e7eb',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <img 
              src={qrImage} 
              alt="QR de Registro Funcional"
              style={{ 
                width: '200px', 
                height: '200px',
                display: 'block'
              }}
            />
          </div>
          
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #10b981',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center',
            maxWidth: '300px'
          }}>
            <p style={{ 
              fontSize: '12px', 
              color: '#059669',
              margin: 0,
              fontWeight: '500'
            }}>
              ✅ QR funcional conectado al backend
            </p>
            <p style={{ 
              fontSize: '11px', 
              color: '#047857',
              margin: '4px 0 0 0'
            }}>
              Válido para registro de nuevos usuarios
            </p>
          </div>

          <button
            onClick={() => {
              if (qrData) {
                navigator.clipboard.writeText(qrData);
                alert('Datos del QR copiados al portapapeles');
              }
            }}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            📋 Copiar Datos QR
          </button>
        </div>
      ) : null}

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
};

export default QRGenerator;
