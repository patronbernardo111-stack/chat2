/**
 * CapacitorPluginsExample.tsx — Componente de ejemplo para usar todos los plugins Capacitor
 * Muestra cómo integrar los plugins en tu aplicación
 */
import React, { useState, useEffect } from 'react';
import { useCamera } from './hooks/useCamera';
import { useShare } from './hooks/useShare';
import { useDeviceInfo } from './hooks/useDeviceInfo';
import { usePushNotifications } from './hooks/usePushNotifications';
import {
  impact,
  notification as hapticsNotification,
  selection,
} from './capacitor/hapticsPlugin';
import {
  writeFile,
  readFile,
  createDirectory,
} from './capacitor/filesystemPlugin';
import { Directory } from '@capacitor/filesystem';

export const CapacitorPluginsExample: React.FC = () => {
  const camera = useCamera();
  const share = useShare();
  const deviceInfo = useDeviceInfo();
  const pushNotif = usePushNotifications(
    (notif) => console.log('Push recibida:', notif),
    (action) => console.log('Push acción:', action)
  );

  const [fileContent, setFileContent] = useState<string>('');

  // Sincronizar permisos al cargar
  useEffect(() => {
    camera.checkPermission();
    share.checkCanShare();
  }, []);

  // Manejadores de ejemplo
  const handleCamera = async () => {
    // Pedir permiso y tomar foto
    if (!camera.hasPermission) {
      await camera.requestPermission();
    }
    await camera.takePhoto(false);
    // Retroalimentación háptica
    await selection();
  };

  const handleSharePhoto = async () => {
    if (camera.photo) {
      await share.shareUrl(camera.photo.webPath || camera.photo.path || '');
      await impact('medium');
    }
  };

  const handleSaveFile = async () => {
    try {
      await createDirectory('egchat-data', {
        directory: Directory.Documents,
      });
      await writeFile(
        'egchat-data/example.json',
        JSON.stringify(
          { timestamp: new Date().toISOString(), message: 'EGCHAT example' },
          null,
          2
        ),
        { directory: Directory.Documents }
      );
      await hapticsNotification('success');
    } catch (error) {
      console.error('Error saving file:', error);
      await hapticsNotification('error');
    }
  };

  const handleReadFile = async () => {
    try {
      const content = await readFile('egchat-data/example.json', {
        directory: Directory.Documents,
      });
      if (content) {
        setFileContent(content);
        await impact('light');
      }
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 Capacitor Plugins Example</h1>

      {/* DEVICE INFO */}
      <section style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h2>📱 Device Info</h2>
        {deviceInfo.loading ? (
          <p>Cargando información del dispositivo...</p>
        ) : deviceInfo.error ? (
          <p style={{ color: 'red' }}>{deviceInfo.error}</p>
        ) : (
          <>
            <p><strong>Plataforma:</strong> {deviceInfo.info?.platform || 'Web'}</p>
            <p><strong>Modelo:</strong> {deviceInfo.info?.model || 'N/A'}</p>
            <p><strong>SO:</strong> {deviceInfo.info?.operatingSystem}</p>
            <p><strong>ES nativo:</strong> {deviceInfo.isNative ? '✅ Sí' : '❌ No'}</p>
          </>
        )}
      </section>

      {/* CAMERA */}
      <section style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h2>📷 Camera</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button onClick={handleCamera} disabled={camera.loading}>
            {camera.loading ? 'Tomando foto...' : 'Tomar foto'}
          </button>
          <button onClick={() => camera.pickPhoto()} disabled={camera.loading}>
            Seleccionar de galería
          </button>
          <button onClick={() => camera.resetPhoto()}>Limpiar</button>
        </div>
        {camera.error && <p style={{ color: 'red' }}>{camera.error}</p>}
        {camera.photo && (
          <div>
            <p>✅ Foto capturada</p>
            <img
              src={camera.photo.webPath || camera.photo.path}
              alt="Captured"
              style={{ maxWidth: '200px', borderRadius: '8px' }}
            />
          </div>
        )}
      </section>

      {/* SHARE */}
      <section style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h2>📤 Share</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() =>
              share.shareText(
                '¡Mira esta increíble app EGCHAT!',
                'EGCHAT App'
              )
            }
            disabled={share.loading}
          >
            Compartir texto
          </button>
          <button
            onClick={() =>
              share.shareUrl('https://chat2-phi-ten.vercel.app', 'EGCHAT')
            }
            disabled={share.loading}
          >
            Compartir URL
          </button>
          <button onClick={handleSharePhoto} disabled={!camera.photo}>
            Compartir foto
          </button>
        </div>
        <p>
          <strong>Disponible en este dispositivo:</strong>{' '}
          {share.canShare ? '✅ Sí' : '❌'}
        </p>
        {share.error && <p style={{ color: 'red' }}>{share.error}</p>}
      </section>

      {/* HAPTICS */}
      <section style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h2>📳 Haptics (Vibración)</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => impact('light')}>Vibración ligera</button>
          <button onClick={() => impact('medium')}>Vibración media</button>
          <button onClick={() => impact('heavy')}>Vibración fuerte</button>
          <button onClick={() => selection()}>Selección</button>
          <button onClick={() => hapticsNotification('success')}>
            ✅ Éxito
          </button>
          <button onClick={() => hapticsNotification('warning')}>
            ⚠️ Advertencia
          </button>
          <button onClick={() => hapticsNotification('error')}>❌ Error</button>
        </div>
      </section>

      {/* FILESYSTEM */}
      <section style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h2>📁 Filesystem</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button onClick={handleSaveFile}>💾 Guardar archivo</button>
          <button onClick={handleReadFile}>📖 Leer archivo</button>
        </div>
        {fileContent && (
          <div
            style={{
              backgroundColor: '#f0f0f0',
              padding: '10px',
              borderRadius: '4px',
              maxHeight: '200px',
              overflow: 'auto',
            }}
          >
            <pre>{fileContent}</pre>
          </div>
        )}
      </section>

      {/* PUSH NOTIFICATIONS */}
      <section style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h2>🔔 Push Notifications</h2>
        <p>
          <strong>Inicializado:</strong> {pushNotif.isInitialized ? '✅' : '❌'}
        </p>
        <p>
          <strong>Token:</strong>{' '}
          {pushNotif.token ? `${pushNotif.token.substring(0, 20)}...` : 'N/A'}
        </p>
        {pushNotif.error && <p style={{ color: 'red' }}>Error: {pushNotif.error}</p>}
        {pushNotif.lastNotification && (
          <div style={{ backgroundColor: '#e3f2fd', padding: '10px', borderRadius: '4px' }}>
            <p>
              <strong>Última notificación:</strong>{' '}
              {pushNotif.lastNotification.title}
            </p>
          </div>
        )}
      </section>

      <div style={{ marginTop: '40px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3>📚 Documentación</h3>
        <p>
          Ver <code>src/capacitor/README.md</code> para más detalles sobre cómo
          usar cada plugin.
        </p>
      </div>
    </div>
  );
};

export default CapacitorPluginsExample;
