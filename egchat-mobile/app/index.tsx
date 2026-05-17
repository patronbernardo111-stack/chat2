// ══════════════════════════════════════════════════════════════════
// app/index.tsx — Entry point raíz
// Expo Router necesita este archivo para saber la ruta inicial.
// El _layout.tsx se encarga de redirigir a login o tabs según auth.
// Este componente solo muestra el spinner mientras eso ocurre.
// ══════════════════════════════════════════════════════════════════
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../src/theme';

export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
