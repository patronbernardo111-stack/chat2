// CountrySelector.tsx — Selector de país para React Native
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  TextInput, StyleSheet, SafeAreaView,
} from 'react-native';

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  language: string;
}

const COUNTRIES: Country[] = [
  { code: 'GQ', name: 'Guinea Ecuatorial', flag: '🇬🇶', dialCode: '+240', language: 'es' },
  { code: 'ES', name: 'España', flag: '🇪🇸', dialCode: '+34', language: 'es' },
  { code: 'MX', name: 'México', flag: '🇲🇽', dialCode: '+52', language: 'es' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54', language: 'es' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57', language: 'es' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪', dialCode: '+51', language: 'es' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', dialCode: '+58', language: 'es' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56', language: 'es' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', dialCode: '+593', language: 'es' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', language: 'en' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', language: 'en' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', language: 'fr' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', language: 'de' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', dialCode: '+55', language: 'pt' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351', language: 'pt' },
  { code: 'CM', name: 'Camerún', flag: '🇨🇲', dialCode: '+237', language: 'fr' },
  { code: 'GA', name: 'Gabón', flag: '🇬🇦', dialCode: '+241', language: 'fr' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234', language: 'en' },
];

interface CountrySelectorProps {
  onCountrySelect: (country: Country) => void;
  selectedCountry?: Country;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  onCountrySelect,
  selectedCountry = COUNTRIES[0],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dialCode.includes(search)
  );

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setIsOpen(true)}>
        <Text style={styles.flag}>{selectedCountry.flag}</Text>
        <View style={styles.info}>
          <Text style={styles.name}>{selectedCountry.name}</Text>
          <Text style={styles.sub}>{selectedCountry.dialCode} · {selectedCountry.language.toUpperCase()}</Text>
        </View>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar país</Text>
            <TouchableOpacity onPress={() => { setIsOpen(false); setSearch(''); }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrap}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar país..."
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={item => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => { onCountrySelect(item); setIsOpen(false); setSearch(''); }}
              >
                <Text style={styles.itemFlag}>{item.flag}</Text>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSub}>{item.dialCode} · {item.language.toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  flag: { fontSize: 24 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: '#111827' },
  sub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  chevron: { fontSize: 14, color: '#9CA3AF' },
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeBtn: { fontSize: 18, color: '#6B7280', padding: 4 },
  searchWrap: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  searchInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  item: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  itemFlag: { fontSize: 22 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '500', color: '#111827' },
  itemSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  separator: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 60 },
});

export default CountrySelector;
