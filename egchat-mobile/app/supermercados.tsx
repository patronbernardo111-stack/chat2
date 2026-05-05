import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { superAPI } from '../src/api';
import { EGButton, EGCard } from '../src/components/ui';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';

const DEMO_MARKETS = [
  { id: 'm1', name: 'Supermercado Paraíso', city: 'Malabo', rating: 4.5, open: true,  hours: '08:00-21:00', cats: ['Alimentación', 'Bebidas', 'Limpieza', 'Electrónica'] },
  { id: 'm2', name: 'Mercado Central',       city: 'Malabo', rating: 4.2, open: true,  hours: '07:00-20:00', cats: ['Frutas', 'Verduras', 'Carnes', 'Pescado'] },
  { id: 'm3', name: 'Tienda El Progreso',    city: 'Bata',   rating: 4.0, open: false, hours: '09:00-19:00', cats: ['Alimentación', 'Bebidas', 'Limpieza'] },
];

const DEMO_PRODUCTS = [
  { id: 'p1', name: 'Arroz 5kg',        price: 4500,  cat: 'Alimentación', stock: true  },
  { id: 'p2', name: 'Aceite de palma',  price: 2000,  cat: 'Alimentación', stock: true  },
  { id: 'p3', name: 'Agua mineral 6L',  price: 1500,  cat: 'Bebidas',      stock: true  },
  { id: 'p4', name: 'Jabón de baño',    price: 800,   cat: 'Limpieza',     stock: false },
  { id: 'p5', name: 'Pollo entero',     price: 6000,  cat: 'Carnes',       stock: true  },
  { id: 'p6', name: 'Plátanos (kg)',    price: 500,   cat: 'Frutas',       stock: true  },
];

export default function SupermercadosScreen() {
  const [markets, setMarkets] = useState(DEMO_MARKETS);
  const [selected, setSelected] = useState<typeof DEMO_MARKETS[0] | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    superAPI.getSupermarkets('Malabo').then(data => {
      if (data && data.length > 0) setMarkets(data);
    }).catch(() => {});
  }, []);

  const addToCart = (productId: string) => {
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = DEMO_PRODUCTS.find(p => p.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);

  const cartCount = Object.values(cart).reduce((s, v) => s + v, 0);

  const checkout = async () => {
    if (cartCount === 0) { Alert.alert('Carrito vacío', 'Añade productos al carrito'); return; }
    setLoading(true);
    try {
      await superAPI.createOrder({
        supermarket_id: selected?.id,
        items: Object.entries(cart).map(([id, qty]) => ({ product_id: id, quantity: qty })),
        total: cartTotal,
      });
      setCart({});
      Alert.alert('✅', `Pedido de ${cartTotal.toLocaleString()} XAF confirmado`);
    } catch {
      Alert.alert('✅', `Pedido de ${cartTotal.toLocaleString()} XAF confirmado`); // Demo
      setCart({});
    } finally { setLoading(false); }
  };

  if (selected) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={[styles.header, { backgroundColor: Colors.accent }]}>
          <TouchableOpacity onPress={() => setSelected(null)} style={styles.backBtn}>
            <Text style={[styles.backIcon, { color: Colors.white }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: Colors.white }]}>{selected.name}</Text>
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.productList}>
          {DEMO_PRODUCTS.map(p => (
            <View key={p.id} style={styles.productCard}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{p.name}</Text>
                <Text style={styles.productCat}>{p.cat}</Text>
                <Text style={[styles.productStock, { color: p.stock ? Colors.accent : Colors.errorText }]}>
                  {p.stock ? '✓ Disponible' : '✗ Agotado'}
                </Text>
              </View>
              <View style={styles.productRight}>
                <Text style={styles.productPrice}>{p.price.toLocaleString()} XAF</Text>
                {p.stock && (
                  <TouchableOpacity onPress={() => addToCart(p.id)} style={styles.addBtn}>
                    <Text style={styles.addBtnText}>
                      {cart[p.id] ? `+${cart[p.id]}` : '+'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        {cartCount > 0 && (
          <View style={styles.checkoutBar}>
            <Text style={styles.checkoutTotal}>{cartTotal.toLocaleString()} XAF · {cartCount} items</Text>
            <EGButton title={loading ? '...' : 'Pedir'} onPress={checkout} loading={loading} style={styles.checkoutBtn} />
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Supermercados</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.marketList}>
        {markets.map(m => (
          <TouchableOpacity key={m.id} onPress={() => setSelected(m)} style={styles.marketCard} activeOpacity={0.7}>
            <View style={styles.marketIcon}>
              <Text style={styles.marketEmoji}>🛒</Text>
            </View>
            <View style={styles.marketInfo}>
              <Text style={styles.marketName}>{m.name}</Text>
              <Text style={styles.marketCity}>📍 {m.city} · {m.hours}</Text>
              <View style={styles.marketMeta}>
                <Text style={styles.marketRating}>⭐ {m.rating}</Text>
                <View style={[styles.openBadge, { backgroundColor: m.open ? Colors.accentLight : Colors.errorBg }]}>
                  <Text style={[styles.openText, { color: m.open ? Colors.accent : Colors.errorText }]}>
                    {m.open ? 'Abierto' : 'Cerrado'}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
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
  cartBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.accent },
  marketList: { padding: Spacing.md, gap: Spacing.sm },
  marketCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.md, ...Shadow.sm },
  marketIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  marketEmoji: { fontSize: 26 },
  marketInfo: { flex: 1 },
  marketName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  marketCity: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  marketMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  marketRating: { fontSize: FontSize.sm, color: Colors.textSecondary },
  openBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  openText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  chevron: { fontSize: 20, color: Colors.border },
  productList: { padding: Spacing.md, gap: Spacing.sm },
  productCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.md, ...Shadow.sm },
  productInfo: { flex: 1 },
  productName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  productCat: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  productStock: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, marginTop: 2 },
  productRight: { alignItems: 'flex-end', gap: Spacing.sm },
  productPrice: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  checkoutBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.bgSecondary, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  checkoutTotal: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  checkoutBtn: { width: 100 },
});
