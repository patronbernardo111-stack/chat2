// QRGenerator.tsx — Generador de QR para React Native
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface QRGeneratorProps {
  userId?: string;
  userName?: string;
  userPhone?: string;
  onGenerated?: (qrData: string) => void;
  size?: number;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({
  userId,
  userName,
  userPhone,
  onGenerated,
  size = 200,
}) => {
  const [qrData, setQrData] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const generateQRData = () => {
    setLoading(true);
    const timestamp = new Date().toISOString();
    const uniqueId = Math.random().toString(36).substring(2, 15);

    const data = JSON.stringify({
      type: 'egchat_contact',
      app: 'EGCHAT',
      version: '2.0.0',
      userId,
      userName,
      userPhone,
      timestamp,
      uniqueId,
    });

    setQrData(data);
    onGenerated?.(data);
    setLoading(false);
  };

  useEffect(() => {
    generateQRData();
  }, [userId, userPhone]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Agrégame en EGCHAT: ${userPhone || userId}`,
        title: 'Mi código EGCHAT',
      });
    } catch {}
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00c8a0" />
        <Text style={styles.loadingText}>Generando QR...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi código QR</Text>
      <Text style={styles.subtitle}>Comparte para que te agreguen en EGCHAT</Text>

      {qrData ? (
        <View style={styles.qrWrap}>
          <QRCode
            value={qrData}
            size={size}
            color="#0d0d0d"
            backgroundColor="#ffffff"
          />
        </View>
      ) : null}

      {userName && <Text style={styles.name}>{userName}</Text>}
      {userPhone && <Text style={styles.phone}>{userPhone}</Text>}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnRefresh} onPress={generateQRData}>
          <Text style={styles.btnRefreshText}>↻ Regenerar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnShare} onPress={handleShare}>
          <Text style={styles.btnShareText}>Compartir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 20, gap: 12 },
  center: { alignItems: 'center', padding: 40, gap: 12 },
  loadingText: { fontSize: 14, color: '#6B7280' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  qrWrap: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  phone: { fontSize: 14, color: '#6B7280' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnRefresh: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  btnRefreshText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  btnShare: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#00c8a0',
    borderRadius: 10,
  },
  btnShareText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

export default QRGenerator;
