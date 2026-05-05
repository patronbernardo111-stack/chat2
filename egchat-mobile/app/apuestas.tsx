import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { EGButton, EGCard } from '../src/components/ui';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';

const GAMES = [
  { id: 'lottery',  icon: '🎰', name: 'Lotería Nacional',  desc: 'Sorteo diario a las 20:00',    minBet: 500,  maxWin: '10,000,000 XAF', color: '#F59E0B' },
  { id: 'sports',   icon: '⚽', name: 'Apuestas Deportivas',desc: 'Fútbol, baloncesto y más',     minBet: 1000, maxWin: 'Variable',        color: '#3B82F6' },
  { id: 'scratch',  icon: '🎟️', name: 'Rasca y Gana',      desc: 'Premios instantáneos',         minBet: 500,  maxWin: '500,000 XAF',    color: '#10B981' },
  { id: 'bingo',    icon: '🎱', name: 'Bingo Online',       desc: 'Partidas cada 15 minutos',     minBet: 1000, maxWin: '1,000,000 XAF',  color: '#8B5CF6' },
];

const MATCHES = [
  { id: 'm1', home: '🇬🇶 Guinea Ec.', away: '🇨🇲 Camerún',  time: '18:00', odds: { home: 2.5, draw: 3.1, away: 2.8 } },
  { id: 'm2', home: '🇬🇦 Gabón',      away: '🇨🇬 Congo',     time: '20:00', odds: { home: 1.9, draw: 3.4, away: 3.8 } },
  { id: 'm3', home: '🇪🇸 España',      away: '🇫🇷 Francia',   time: '21:00', odds: { home: 2.1, draw: 3.2, away: 3.3 } },
];

export default function ApuestasScreen() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [selectedOdd, setSelectedOdd] = useState<{ match: string; type: string; odd: number } | null>(null);

  const placeBet = () => {
    if (!betAmount || isNaN(Number(betAmount))) { Alert.alert('Error', 'Introduce un importe válido'); return; }
    Alert.alert(
      '⚠️ Juega con responsabilidad',
      'Las apuestas pueden causar adicción. ¿Confirmas la apuesta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => { Alert.alert('✅', `Apuesta de ${Number(betAmount).toLocaleString()} XAF registrada`); setBetAmount(''); setSelectedOdd(null); } },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Juegos y Apuestas</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Aviso responsabilidad */}
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>⚠️ Juega con responsabilidad. Solo mayores de 18 años.</Text>
        </View>

        {/* Juegos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>JUEGOS DISPONIBLES</Text>
          <View style={styles.gamesGrid}>
            {GAMES.map(g => (
              <TouchableOpacity
                key={g.id}
                style={[styles.gameCard, activeGame === g.id && { borderColor: g.color, borderWidth: 2 }]}
                onPress={() => setActiveGame(activeGame === g.id ? null : g.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.gameIcon}>{g.icon}</Text>
                <Text style={styles.gameName}>{g.name}</Text>
                <Text style={styles.gameDesc}>{g.desc}</Text>
                <Text style={[styles.gameMin, { color: g.color }]}>Desde {g.minBet.toLocaleString()} XAF</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Partidos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PARTIDOS EN VIVO</Text>
          {MATCHES.map(m => (
            <EGCard key={m.id} style={styles.matchCard}>
              <View style={styles.matchHeader}>
                <Text style={styles.matchTeams}>{m.home} vs {m.away}</Text>
                <Text style={styles.matchTime}>🕐 {m.time}</Text>
              </View>
              <View style={styles.oddsRow}>
                {[
                  { label: '1', value: m.odds.home, type: 'home' },
                  { label: 'X', value: m.odds.draw, type: 'draw' },
                  { label: '2', value: m.odds.away, type: 'away' },
                ].map(o => (
                  <TouchableOpacity
                    key={o.type}
                    style={[styles.oddBtn, selectedOdd?.match === m.id && selectedOdd?.type === o.type && styles.oddBtnActive]}
                    onPress={() => setSelectedOdd({ match: m.id, type: o.type, odd: o.value })}
                  >
                    <Text style={styles.oddLabel}>{o.label}</Text>
                    <Text style={[styles.oddValue, selectedOdd?.match === m.id && selectedOdd?.type === o.type && { color: Colors.white }]}>{o.value}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </EGCard>
          ))}
        </View>

        {/* Apuesta */}
        {selectedOdd && (
          <View style={styles.betSection}>
            <Text style={styles.sectionTitle}>TU APUESTA</Text>
            <EGCard style={styles.betCard}>
              <Text style={styles.betInfo}>Cuota seleccionada: <Text style={styles.betOdd}>{selectedOdd.odd}x</Text></Text>
              <View style={styles.betAmounts}>
                {[500, 1000, 2000, 5000].map(a => (
                  <TouchableOpacity key={a} onPress={() => setBetAmount(String(a))} style={[styles.amountChip, betAmount === String(a) && styles.amountChipActive]}>
                    <Text style={[styles.amountText, betAmount === String(a) && styles.amountTextActive]}>{a.toLocaleString()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {betAmount && <Text style={styles.potentialWin}>Ganancia potencial: {(Number(betAmount) * selectedOdd.odd).toLocaleString()} XAF</Text>}
              <EGButton title="Apostar" onPress={placeBet} />
            </EGCard>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, backgroundColor: Colors.bgSecondary, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  headerTitle: { ...Typography.headerTitle, flex: 1, textAlign: 'center', color: Colors.textPrimary },
  warningBanner: { backgroundColor: '#FEF3C7', padding: Spacing.md, margin: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: '#FCD34D' },
  warningText: { fontSize: FontSize.sm, color: '#92400E', textAlign: 'center', fontWeight: FontWeight.semibold },
  section: { paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.md },
  sectionTitle: { ...Typography.sectionTitle, color: Colors.textTertiary, marginBottom: Spacing.sm, marginLeft: 4 },
  gamesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  gameCard: { width: '47%', backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', gap: 4, ...Shadow.sm, borderWidth: 1, borderColor: Colors.borderLight },
  gameIcon: { fontSize: 32 },
  gameName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  gameDesc: { fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'center' },
  gameMin: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  matchCard: { padding: Spacing.md, marginBottom: Spacing.sm },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  matchTeams: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  matchTime: { fontSize: FontSize.sm, color: Colors.textTertiary },
  oddsRow: { flexDirection: 'row', gap: Spacing.sm },
  oddBtn: { flex: 1, alignItems: 'center', padding: Spacing.sm, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgTertiary, borderWidth: 1, borderColor: Colors.border },
  oddBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  oddLabel: { fontSize: FontSize.xs, color: Colors.textTertiary },
  oddValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  betSection: { paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.xl },
  betCard: { padding: Spacing.lg, gap: Spacing.md },
  betInfo: { fontSize: FontSize.base, color: Colors.textSecondary },
  betOdd: { fontWeight: FontWeight.bold, color: Colors.accent },
  betAmounts: { flexDirection: 'row', gap: Spacing.sm },
  amountChip: { flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgTertiary, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  amountChipActive: { backgroundColor: Colors.accentLight, borderColor: Colors.accent },
  amountText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  amountTextActive: { color: Colors.accent },
  potentialWin: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.accent, textAlign: 'center' },
});
