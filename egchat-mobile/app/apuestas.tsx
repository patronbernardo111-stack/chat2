import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';

const GAMES = [
  { icon: '⚽', name: 'Apuestas deportivas', desc: 'Fútbol, baloncesto, tenis y más', color: '#22c55e', available: true },
  { icon: '🎰', name: 'Casino online', desc: 'Ruleta, blackjack, tragaperras', color: '#F59E0B', available: true },
  { icon: '🎱', name: 'Lotería Nacional', desc: 'Lotería oficial de Guinea Ecuatorial', color: '#6366F1', available: true },
  { icon: '🃏', name: 'Poker', desc: 'Texas Hold\'em y variantes', color: '#EF4444', available: false },
  { icon: '🎲', name: 'Bingo', desc: 'Bingo online en tiempo real', color: '#EC4899', available: false },
];

const DISCLAIMER = '⚠️ El juego puede crear adicción. Juega con responsabilidad. Solo mayores de 18 años. Si tienes problemas con el juego, llama al +240 333 09 99 99.';

export default function ApuestasScreen() {
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const openGame = (game: typeof GAMES[0]) => {
    if (!game.available) { Alert.alert('Próximamente', `${game.name} estará disponible pronto.`); return; }
    Alert.alert(game.icon + ' ' + game.name, 'Serás redirigido al operador de juego autorizado.\n\n' + DISCLAIMER, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Continuar', onPress: () => {} }]);
  };
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: C.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.textPrimary }]}>🎰 Apuestas y Juegos</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.disclaimer}><Text style={styles.disclaimerText}>{DISCLAIMER}</Text></View>
        {GAMES.map(g => (
          <TouchableOpacity key={g.name} style={[styles.card, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }, !g.available && styles.cardDisabled]} onPress={() => openGame(g)} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: g.color + '20' }]}><Text style={styles.icon}>{g.icon}</Text></View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: C.textPrimary }]}>{g.name}</Text>
              <Text style={[styles.desc, { color: C.textTertiary }]}>{g.desc}</Text>
            </View>
            {g.available ? <Text style={styles.badge}>Disponible</Text> : <Text style={[styles.badgeSoon, { backgroundColor: C.bgTertiary, color: C.textTertiary }]}>Pronto</Text>}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.helpBtn, { backgroundColor: C.bgSecondary, borderColor: C.border }]} onPress={() => Linking.openURL('tel:+240333099999')}>
          <Text style={[styles.helpBtnText, { color: C.textSecondary }]}>🆘 Ayuda con el juego responsable</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  title: { ...Typography.headerTitle, color: Colors.textPrimary },
  content: { padding: Spacing.md, gap: Spacing.sm },
  disclaimer: {
    backgroundColor: '#FEF3C7', borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: '#F59E0B',
  },
  disclaimerText: { fontSize: FontSize.xs, color: '#92400E', lineHeight: 18 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight, ...Shadow.sm,
  },
  cardDisabled: { opacity: 0.5 },
  iconBox: { width: 52, height: 52, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 26 },
  info: { flex: 1 },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  desc: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  badge: {
    fontSize: FontSize.xs, color: '#22c55e', fontWeight: FontWeight.bold,
    backgroundColor: '#dcfce7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeSoon: {
    fontSize: FontSize.xs, color: Colors.textTertiary, fontWeight: FontWeight.bold,
    backgroundColor: Colors.bgTertiary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  helpBtn: {
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.md,
  },
  helpBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
