import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { supabase } from '../../lib/supabase';
import i18n from '../../src/i18n/i18n';

const GENDERS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Non binary', value: 'non_binary' },
  { label: 'Unspecified', value: 'unspecified' },
];

const LOCALE_COUNTRY = {
  es: 'España',
  en: 'United States',
  fr: 'France',
  pt: 'Portugal',
  it: 'Italia',
  de: 'Deutschland',
};

export default function CompleteProfileScreen() {
  const locale = useMemo(() => (i18n.resolvedLanguage || i18n.language || 'en').slice(0, 2), []);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState(LOCALE_COUNTRY[locale] || '');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('unspecified');
  const [birthDate, setBirthDate] = useState(new Date(1995, 0, 1));
  const [closetName, setClosetName] = useState('Principal');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const saveProfile = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session) {
        router.replace('/(auth)/login');
        return;
      }

      console.log('complete-profile saveProfile user_id:', session.user.id);

      const { error } = await supabase.from('closets').insert({
        user_id: session.user.id,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        country: country.trim() || null,
        region: region.trim() || null,
        city: city.trim() || null,
        gender,
        birth_date: birthDate.toISOString().slice(0, 10),
        name: closetName.trim() || 'Principal',
        is_default: true,
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      router.replace('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.darkBrown, paddingHorizontal: 24 }}>
      <StatusBar barStyle="light-content" />
      <View style={{ width: '100%', maxWidth: 450, alignSelf: 'center', marginTop: 24 }}>
        <Text style={{ color: Colors.textOnDark, fontFamily: Fonts.gochiHand, fontSize: 36, marginBottom: 16 }}>
          Completa tu perfil
        </Text>

        <TextInput placeholder="Nombre" placeholderTextColor={Colors.placeholder} value={firstName} onChangeText={setFirstName} style={{ backgroundColor: Colors.inputBg, borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: 12, padding: 14, marginBottom: 8, color: Colors.textOnDark, fontFamily: Fonts.lexend }} />
        <TextInput placeholder="Apellido" placeholderTextColor={Colors.placeholder} value={lastName} onChangeText={setLastName} style={{ backgroundColor: Colors.inputBg, borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: 12, padding: 14, marginBottom: 8, color: Colors.textOnDark, fontFamily: Fonts.lexend }} />
        <TextInput placeholder="País" placeholderTextColor={Colors.placeholder} value={country} onChangeText={setCountry} style={{ backgroundColor: Colors.inputBg, borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: 12, padding: 14, marginBottom: 8, color: Colors.textOnDark, fontFamily: Fonts.lexend }} />
        <TextInput placeholder="Región" placeholderTextColor={Colors.placeholder} value={region} onChangeText={setRegion} style={{ backgroundColor: Colors.inputBg, borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: 12, padding: 14, marginBottom: 8, color: Colors.textOnDark, fontFamily: Fonts.lexend }} />
        <TextInput placeholder="Ciudad" placeholderTextColor={Colors.placeholder} value={city} onChangeText={setCity} style={{ backgroundColor: Colors.inputBg, borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: 12, padding: 14, marginBottom: 8, color: Colors.textOnDark, fontFamily: Fonts.lexend }} />

        <Pressable onPress={() => setShowGenderPicker(true)} style={{ backgroundColor: Colors.inputBg, borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: 12, padding: 14, marginBottom: 8 }}>
          <Text style={{ color: Colors.textOnDark, fontFamily: Fonts.lexend }}>
            Género: {GENDERS.find((g) => g.value === gender)?.label}
          </Text>
        </Pressable>

        <Pressable onPress={() => setShowDatePicker(true)} style={{ backgroundColor: Colors.inputBg, borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: 12, padding: 14, marginBottom: 8 }}>
          <Text style={{ color: Colors.textOnDark, fontFamily: Fonts.lexend }}>
            Fecha nacimiento: {birthDate.toISOString().slice(0, 10)}
          </Text>
        </Pressable>

        <TextInput placeholder="Nombre del armario" placeholderTextColor={Colors.placeholder} value={closetName} onChangeText={setClosetName} style={{ backgroundColor: Colors.inputBg, borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: 12, padding: 14, marginBottom: 16, color: Colors.textOnDark, fontFamily: Fonts.lexend }} />

        <Pressable onPress={saveProfile} disabled={loading} style={{ backgroundColor: Colors.orangeMain, borderRadius: 12, paddingVertical: 14, alignItems: 'center', opacity: loading ? 0.7 : 1 }}>
          {loading ? <ActivityIndicator color={Colors.cream} size="small" /> : <Text style={{ color: Colors.cream, fontFamily: Fonts.fuzzyBubblesBold, fontSize: 16 }}>Guardar</Text>}
        </Pressable>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={birthDate}
          mode="date"
          display="default"
          onChange={(_event, date) => {
            setShowDatePicker(false);
            if (date) setBirthDate(date);
          }}
        />
      )}

      <Modal visible={showGenderPicker} transparent animationType="fade" onRequestClose={() => setShowGenderPicker(false)}>
        <Pressable onPress={() => setShowGenderPicker(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: Colors.darkBrown, borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: 14, paddingVertical: 6 }}>
            {GENDERS.map((item) => (
              <Pressable key={item.value} onPress={() => { setGender(item.value); setShowGenderPicker(false); }} style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
                <Text style={{ color: Colors.textOnDark, fontFamily: Fonts.lexend }}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

