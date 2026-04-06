import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Country, State, City } from 'country-state-city';
import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';
import * as Localization from 'expo-localization';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { supabase } from '../../lib/supabase';

// ─── Tallas ──────────────────────────────────────────────────────────────────
const TOP_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];
const BOTTOM_SIZES_EU = ['32', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54'];
const BOTTOM_SIZES_US = ['00', '0', '2', '4', '6', '8', '10', '12', '14', '16', '18', '20'];
const BOTTOM_SIZES_UK = ['4', '6', '8', '10', '12', '14', '16', '18', '20', '22', '24', '26'];
const SHOE_SIZES_EU = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
const SHOE_SIZES_US = ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
const SHOE_SIZES_UK = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const LAUNDRY_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo', 'Variable'];

// ─── Rutinas ─────────────────────────────────────────────────────────────────
const WORK_STYLES = [
  { id: 'comfortable', label: 'Cómodo' },
  { id: 'smart',       label: 'Smart casual' },
  { id: 'elegant',     label: 'Elegante' },
  { id: 'random',      label: 'Aleatorio' },
  { id: 'varies',      label: 'Varía según el día' },
];
const STUDY_STYLES = WORK_STYLES;

// ─── Tiempo libre ─────────────────────────────────────────────────────────────
const ACTIVITIES = [
  { id: 'errands',        label: 'Recados / Día a día' },
  { id: 'kids',           label: 'Niños' },
  { id: 'pet',            label: 'Mascota' },
  { id: 'gym',            label: 'Gym / Deporte' },
  { id: 'outdoor_sport',  label: 'Deporte outdoor' },
  { id: 'casual_plans',   label: 'Planes casuales' },
  { id: 'nights_out',     label: 'Salidas nocturnas' },
  { id: 'special_events', label: 'Eventos especiales' },
  { id: 'travel',         label: 'Viajes' },
  { id: 'shopping',       label: 'Compras' },
  { id: 'culture',        label: 'Cultura' },
  { id: 'volunteering',   label: 'Voluntariado' },
];

// ─── Estilo personal ──────────────────────────────────────────────────────────
const STYLE_PRIORITIES = [
  { id: 'comfort',      label: 'Comodidad' },
  { id: 'aesthetics',   label: 'Estética' },
  { id: 'practicality', label: 'Practicidad' },
  { id: 'trend',        label: 'Tendencia' },
  { id: 'discretion',   label: 'Discreción' },
];
const RESTRICTIONS = [
  { id: 'no_skirts_dresses', label: 'Nunca faldas / vestidos' },
  { id: 'no_heels',          label: 'Nunca tacones' },
  { id: 'no_suit',           label: 'Nunca traje' },
  { id: 'no_tight',          label: 'Nunca ropa ceñida' },
  { id: 'no_loose',          label: 'Nunca ropa ancha' },
  { id: 'no_prints',         label: 'Nunca estampados' },
  { id: 'no_restrictions',   label: 'Sin restricciones' },
  { id: 'other',             label: 'Otro' },
];

// Pasos fijos. Los pasos 8 y 9 se saltan si no aplican.
const STEP_NAME      = 1;
const STEP_LOCATION  = 2;
const STEP_GENDER    = 3;
const STEP_BIRTHDATE = 4;
const STEP_SIZES     = 5;
const STEP_LAUNDRY   = 6;
const STEP_ROUTINE   = 7;
const STEP_WORK      = 8;
const STEP_STUDY     = 9;
const STEP_ACTIVITIES = 10;
const STEP_STYLE      = 11;
const MAX_STEPS       = 11;

// ─── Helpers locales ──────────────────────────────────────────────────────────
interface PickerItem { label: string; value: string; phonecode?: string; flag?: string; }

function getDefaultCountryCode(): string {
  try {
    const locales = Localization.getLocales();
    const region = locales?.[0]?.regionCode;
    if (region) return region.toUpperCase();
  } catch {}
  return 'ES';
}

// ─── PickerModal ─────────────────────────────────────────────────────────────
function PickerModal({
  visible, onClose, data, onSelect, title,
}: {
  visible: boolean; onClose: () => void;
  data: PickerItem[]; onSelect: (item: PickerItem) => void; title: string;
}) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(item => item.label.toLowerCase().includes(q));
  }, [data, search]);
  const handleClose = () => { setSearch(''); onClose(); };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <Pressable style={{ height: 80 }} onPress={handleClose} />
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <Pressable onPress={handleClose}>
              <Ionicons name="close" size={24} color={Colors.textOnDark} />
            </Pressable>
          </View>
          <TextInput
            value={search} onChangeText={setSearch}
            placeholder="Buscar..." placeholderTextColor={Colors.placeholder}
            style={styles.pickerSearch}
          />
          <FlatList
            data={filtered} keyExtractor={item => item.value}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable onPress={() => { onSelect(item); handleClose(); }} style={styles.pickerItem}>
                <Text style={styles.pickerItemText}>{item.label}</Text>
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── AutocompleteInput ────────────────────────────────────────────────────────
function AutocompleteInput({
  value, onChangeText, data, placeholder, hasError,
}: {
  value: string; onChangeText: (v: string) => void;
  data: PickerItem[]; placeholder: string; hasError: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const filtered = useMemo(() => {
    if (!value.trim()) return [];
    const q = value.toLowerCase();
    return data.filter(item => item.label.toLowerCase().includes(q)).slice(0, 50);
  }, [data, value]);
  const showDropdown = focused && filtered.length > 0;
  return (
    <View style={{ zIndex: focused ? 1 : 0, marginBottom: 8, width: '100%' }}>
      <TextInput
        value={value} onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        placeholder={placeholder} placeholderTextColor={Colors.placeholder}
        style={[styles.input, { marginBottom: 0 }, hasError && styles.inputError]}
      />
      {showDropdown && (
        <View style={styles.dropdownContainer}>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 150 }} nestedScrollEnabled>
            {filtered.map(item => (
              <Pressable
                key={item.value}
                onPress={() => { onChangeText(item.label); setFocused(false); }}
                style={styles.dropdownItem}
              >
                <Text style={styles.dropdownItemText} numberOfLines={1}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const [step, setStep] = useState(STEP_NAME);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Paso 1: Nombre ─────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');

  // ── Paso 2: Ubicación + Teléfono ───────────────────────────────────────────
  const defaultCountryCode = useMemo(getDefaultCountryCode, []);
  const [countryText, setCountryText] = useState('');
  const [regionText,  setRegionText]  = useState('');
  const [cityText,    setCityText]    = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState<string>(defaultCountryCode);
  const [phoneCountryPickerOpen, setPhoneCountryPickerOpen] = useState(false);

  // ── Paso 3: Género ─────────────────────────────────────────────────────────
  const [gender, setGender] = useState('');

  // ── Paso 4: Fecha nacimiento ───────────────────────────────────────────────
  const [birthDateText,  setBirthDateText]  = useState('');
  const [birthDate,      setBirthDate]      = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthDateError, setBirthDateError] = useState('');

  // ── Paso 5: Tallas ────────────────────────────────────────────────────────
  const [sizeRegion, setSizeRegion] = useState('EU');
  const [sizeTop,    setSizeTop]    = useState<string[]>([]);
  const [sizeBottom, setSizeBottom] = useState<string[]>([]);
  const [sizeShoes,  setSizeShoes]  = useState<string[]>([]);

  // ── Paso 6: Lavadora ─────────────────────────────────────────────────────
  const [laundryDays, setLaundryDays] = useState<string[]>([]);

  // ── Paso 7: Tipo rutina ───────────────────────────────────────────────────
  const [hasWork,          setHasWork]          = useState(false);
  const [hasStudies,       setHasStudies]       = useState(false);
  const [hasNoObligations, setHasNoObligations] = useState(false);

  // ── Paso 8: Trabajo ───────────────────────────────────────────────────────
  const [workUniform, setWorkUniform] = useState(false);
  const [workStyles,  setWorkStyles]  = useState<string[]>([]);

  // ── Paso 9: Estudios ──────────────────────────────────────────────────────
  const [studyUniform, setStudyUniform] = useState(false);
  const [studyStyles,  setStudyStyles]  = useState<string[]>([]);

  // ── Paso 10: Actividades ──────────────────────────────────────────────────
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  // ── Paso 11: Estilo personal ──────────────────────────────────────────────
  const [priorityOrder,        setPriorityOrder]        = useState<string[]>([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);

  // ─── Datos de ubicación derivados ─────────────────────────────────────────
  const countries = useMemo(
    () => Country.getAllCountries().map(c => ({ label: c.name, value: c.isoCode })),
    [],
  );
  const phoneCountries = useMemo(
    () => Country.getAllCountries().map(c => ({
      label: `${c.flag} ${c.name} (+${c.phonecode})`,
      value: c.isoCode, phonecode: c.phonecode, flag: c.flag,
    })),
    [],
  );
  const matchedCountry = useMemo(
    () => countries.find(c => c.label.toLowerCase() === countryText.trim().toLowerCase()),
    [countryText, countries],
  );
  const matchedRegion = useMemo(() => {
    if (!matchedCountry) return undefined;
    return State.getStatesOfCountry(matchedCountry.value)
      .find(r => r.name.toLowerCase() === regionText.trim().toLowerCase());
  }, [regionText, matchedCountry]);
  const regions = useMemo(() => {
    if (!matchedCountry) return [];
    return State.getStatesOfCountry(matchedCountry.value).map(s => ({ label: s.name, value: s.isoCode }));
  }, [matchedCountry]);
  const cities = useMemo(() => {
    if (!matchedCountry || !matchedRegion) return [];
    return City.getCitiesOfState(matchedCountry.value, matchedRegion.isoCode)
      .map(c => ({ label: c.name, value: c.name }));
  }, [matchedCountry, matchedRegion]);

  const getBottomSizes = () => {
    if (sizeRegion === 'US') return BOTTOM_SIZES_US;
    if (sizeRegion === 'UK') return BOTTOM_SIZES_UK;
    return BOTTOM_SIZES_EU;
  };
  const getShoeSizes = () => {
    if (sizeRegion === 'US') return SHOE_SIZES_US;
    if (sizeRegion === 'UK') return SHOE_SIZES_UK;
    return SHOE_SIZES_EU;
  };

  // Precargar país por defecto
  useEffect(() => {
    const all = Country.getAllCountries();
    const match = all.find(c => c.isoCode === defaultCountryCode);
    if (match) setCountryText(match.name);
  }, [defaultCountryCode]);

  // ─── Auto-avance fecha nacimiento ─────────────────────────────────────────
  useEffect(() => {
    if (step === STEP_BIRTHDATE && birthDate && !birthDateError) {
      const timer = setTimeout(() => {
        setErrors({});
        setStep(STEP_SIZES);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [birthDate, birthDateError, step]);

  // ─── Lógica de fecha ──────────────────────────────────────────────────────
  const handleBirthDateInput = (text: string) => {
    const digits = text.replace(/\D/g, '');
    let masked = '';
    if (digits.length <= 2) masked = digits;
    else if (digits.length <= 4) masked = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    else masked = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    setBirthDateText(masked);
    setBirthDateError('');
    if (masked.length === 10) {
      const [dd, mm, yyyy] = masked.split('/').map(Number);
      const d = new Date(yyyy, mm - 1, dd);
      if (d.getDate() !== dd || d.getMonth() !== mm - 1 || d.getFullYear() !== yyyy || yyyy < 1900) {
        setBirthDateError('Fecha no válida');
        setBirthDate(null);
        return;
      }
      const today = new Date();
      let age = today.getFullYear() - d.getFullYear();
      const mDiff = today.getMonth() - d.getMonth();
      if (mDiff < 0 || (mDiff === 0 && today.getDate() < d.getDate())) age--;
      if (age < 13) {
        setBirthDateError('Debes tener al menos 13 años');
        setBirthDate(null);
        return;
      }
      setBirthDate(d);
    } else {
      setBirthDate(null);
    }
  };

  const handleDatePickerChange = (_event: any, date?: Date) => {
    setShowDatePicker(false);
    if (!date) return;
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    handleBirthDateInput(`${dd}${mm}${yyyy}`);
  };

  // ─── Navegación ───────────────────────────────────────────────────────────
  const getNextStep = (current: number): number => {
    if (current === STEP_ROUTINE) {
      if (hasWork)    return STEP_WORK;
      if (hasStudies) return STEP_STUDY;
      return STEP_ACTIVITIES;
    }
    if (current === STEP_WORK) return hasStudies ? STEP_STUDY : STEP_ACTIVITIES;
    return current + 1;
  };

  const getPrevStep = (current: number): number => {
    if (current === STEP_STUDY && !hasWork)   return STEP_ROUTINE;
    if (current === STEP_ACTIVITIES) {
      if (hasStudies) return STEP_STUDY;
      if (hasWork)    return STEP_WORK;
      return STEP_ROUTINE;
    }
    return current - 1;
  };

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (step === STEP_NAME) {
      if (!firstName.trim()) e.firstName = 'El nombre es obligatorio';
      if (!lastName.trim())  e.lastName  = 'El apellido es obligatorio';
    } else if (step === STEP_LOCATION) {
      if (!countryText.trim()) e.country = 'El país es obligatorio';
      if (!regionText.trim())  e.region  = 'La provincia / estado es obligatorio';
      if (!cityText.trim())    e.city    = 'La ciudad es obligatoria';
      if (phone.trim()) {
        try {
          if (!isValidPhoneNumber(phone.trim(), selectedPhoneCountry as CountryCode))
            e.phone = 'Número de teléfono no válido';
        } catch {
          e.phone = 'Número de teléfono no válido';
        }
      }
    } else if (step === STEP_SIZES) {
      if (sizeTop.length    === 0) e.sizeTop    = 'Selecciona al menos una talla superior';
      if (sizeBottom.length === 0) e.sizeBottom = 'Selecciona al menos una talla inferior';
      if (sizeShoes.length  === 0) e.sizeShoes  = 'Selecciona al menos una talla de calzado';
    } else if (step === STEP_LAUNDRY) {
      if (laundryDays.length === 0) e.laundry = 'Indica al menos un día de lavadora';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (!validateStep()) return;
    if (step === STEP_STYLE) {
      handleSave();
      return;
    }
    setErrors({});
    setStep(getNextStep(step));
  };

  const handleBack = () => {
    if (step > STEP_NAME) {
      setErrors({});
      setStep(getPrevStep(step));
    }
  };

  // ─── Guardar todo ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('No session');
      const userId = session.user.id;

      const formattedBirthDate = birthDate
        ? `${birthDate.getFullYear()}-${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(birthDate.getDate()).padStart(2, '0')}`
        : null;

      // 1. Upsert closet con todos los datos
      const { data: closetData, error: closetErr } = await supabase
        .from('closets')
        .upsert({
          user_id:          userId,
          first_name:       firstName.trim(),
          last_name:        lastName.trim(),
          country:          countryText.trim(),
          region:           regionText.trim(),
          city:             cityText.trim(),
          gender:           gender || 'unspecified',
          birth_date:       formattedBirthDate,
          name:             'Mi armario',
          is_default:       true,
          position:         1,
          size_top:         sizeTop,
          size_bottom:      sizeBottom,
          size_shoes:       sizeShoes,
          laundry_day:      laundryDays,
          has_routine_work:  hasWork,
          has_routine_study: hasStudies,
          has_routine_free:  selectedActivities.length > 0,
        })
        .select('id')
        .single();
      if (closetErr) throw closetErr;
      const closetId = closetData.id;

      // 2. Teléfono (opcional)
      if (phone.trim()) {
        try {
          const finalPhone = parsePhoneNumber(phone.trim(), selectedPhoneCountry as CountryCode).number;
          await supabase.from('profiles').update({ phone: finalPhone }).eq('id', userId);
        } catch {}
      }

      // 3. Rutina trabajo
      if (hasWork) {
        await supabase.from('routine_work').upsert({
          closet_id: closetId, uniform: workUniform, styles: workStyles,
        });
      }

      // 4. Rutina estudios
      if (hasStudies) {
        await supabase.from('routine_studies').upsert({
          closet_id: closetId, uniform: studyUniform, styles: studyStyles,
        });
      }

      // 5. Actividades
      if (selectedActivities.length > 0) {
        await supabase.from('routine_activities').upsert({
          closet_id: closetId, activities: selectedActivities,
        });
      }

      // 6. Estilo personal
      await supabase.from('routine_style').upsert({
        closet_id: closetId, priority_order: priorityOrder, restrictions: selectedRestrictions,
      });

      // 7. Marcar onboarding completado → _layout dejará de redirigir aquí
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', userId);
      if (profileErr) throw profileErr;

      router.replace('/(main)/dashboard');
    } catch (e: any) {
      setSaveError('Hubo un error al guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  // ─── UI helpers ───────────────────────────────────────────────────────────
  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, list: string[], item: string) =>
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);

  const renderChips = (items: string[], selected: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 16 }}>
      {items.map(item => {
        const sel = selected.includes(item);
        return (
          <Pressable
            key={item}
            onPress={() => toggle(setter, selected, item)}
            style={{
              paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5,
              borderColor: sel ? Colors.orangeMain : Colors.inputBorder,
              backgroundColor: sel ? Colors.orangeMain + '33' : Colors.inputBg,
            }}
          >
            <Text style={{ color: sel ? Colors.cream : Colors.textOnDark, fontFamily: Fonts.lexend, fontSize: 14 }}>
              {item}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderOptionRows = (
    items: { id: string; label: string }[],
    selected: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => (
    <View style={{ gap: 10, marginTop: 12 }}>
      {items.map(item => {
        const sel = selected.includes(item.id);
        return (
          <Pressable
            key={item.id}
            onPress={() => toggle(setter, selected, item.id)}
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5,
              borderColor: sel ? Colors.orangeMain : Colors.inputBorder,
              backgroundColor: sel ? Colors.orangeMain + '15' : Colors.inputBg,
            }}
          >
            <Text style={{ flex: 1, color: Colors.textOnDark, fontFamily: Fonts.lexend, fontSize: 15, fontWeight: sel ? '600' : '400' }}>
              {item.label}
            </Text>
            <Ionicons name={sel ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={sel ? Colors.orangeMain : Colors.placeholder} />
          </Pressable>
        );
      })}
    </View>
  );

  const renderToggleRow = (label: string, value: boolean, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, borderWidth: 1.5,
        borderColor: value ? Colors.orangeMain : Colors.inputBorder,
        backgroundColor: value ? Colors.orangeMain + '15' : Colors.inputBg,
        marginBottom: 12,
      }}
    >
      <Text style={{ flex: 1, color: Colors.textOnDark, fontFamily: Fonts.lexend, fontSize: 15, fontWeight: value ? '600' : '400' }}>
        {label}
      </Text>
      <Ionicons name={value ? 'checkbox' : 'square-outline'} size={26} color={value ? Colors.orangeMain : Colors.placeholder} />
    </Pressable>
  );

  // ─── Renderizado por paso ─────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {

      // ── 1: Nombre ────────────────────────────────────────────────────────
      case STEP_NAME:
        return (
          <>
            <Text style={styles.stepTitle}>¿Cómo te llamas?</Text>
            <TextInput
              value={firstName} onChangeText={v => { setFirstName(v); setErrors({}); }}
              placeholder="Nombre" placeholderTextColor={Colors.placeholder}
              style={[styles.input, errors.firstName && styles.inputError]}
            />
            {!!errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
            <TextInput
              value={lastName} onChangeText={v => { setLastName(v); setErrors({}); }}
              placeholder="Apellidos" placeholderTextColor={Colors.placeholder}
              style={[styles.input, errors.lastName && styles.inputError]}
            />
            {!!errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
          </>
        );

      // ── 2: Ubicación + Teléfono ───────────────────────────────────────────
      case STEP_LOCATION: {
        const selectedPhoneObj = phoneCountries.find(c => c.value === selectedPhoneCountry);
        return (
          <View style={{ zIndex: 10 }}>
            <Text style={styles.stepTitle}>¿Dónde vives?</Text>
            <View style={{ zIndex: 3 }}>
              <AutocompleteInput
                value={countryText} onChangeText={v => { setCountryText(v); setErrors({}); }}
                data={countries} placeholder="País" hasError={!!errors.country}
              />
              {!!errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
            </View>
            <View style={{ zIndex: 2 }}>
              <AutocompleteInput
                value={regionText} onChangeText={v => { setRegionText(v); setErrors({}); }}
                data={regions} placeholder="Provincia / Estado" hasError={!!errors.region}
              />
              {!!errors.region && <Text style={styles.errorText}>{errors.region}</Text>}
            </View>
            <View style={{ zIndex: 1 }}>
              <AutocompleteInput
                value={cityText} onChangeText={v => { setCityText(v); setErrors({}); }}
                data={cities} placeholder="Ciudad" hasError={!!errors.city}
              />
              {!!errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
            </View>

            <Text style={[styles.stepTitle, { fontSize: 20, marginTop: 20 }]}>Teléfono (opcional)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Pressable
                onPress={() => setPhoneCountryPickerOpen(true)}
                style={[styles.input, { flex: 0.35, marginRight: 8, justifyContent: 'center' }]}
              >
                <Text style={{ color: Colors.textOnDark, fontFamily: Fonts.lexend, fontSize: 13 }} numberOfLines={1}>
                  {selectedPhoneObj ? `${selectedPhoneObj.flag} +${selectedPhoneObj.phonecode}` : '+'}
                </Text>
              </Pressable>
              <TextInput
                value={phone} onChangeText={v => { setPhone(v); if (errors.phone) setErrors({}); }}
                placeholder="Número" placeholderTextColor={Colors.placeholder}
                keyboardType="phone-pad"
                style={[styles.input, { flex: 0.65 }, errors.phone && styles.inputError]}
              />
            </View>
            {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            <PickerModal
              visible={phoneCountryPickerOpen}
              onClose={() => setPhoneCountryPickerOpen(false)}
              data={phoneCountries} title="Indicativo del país"
              onSelect={item => setSelectedPhoneCountry(item.value)}
            />
          </View>
        );
      }

      // ── 3: Género (auto-avance al seleccionar) ───────────────────────────
      case STEP_GENDER: {
        const opts = [
          { value: 'female',     label: 'Mujer',          icon: 'woman-outline' as const },
          { value: 'male',       label: 'Hombre',         icon: 'man-outline' as const },
          { value: 'non_binary', label: 'No binario / otro', icon: 'people-outline' as const },
        ];
        return (
          <>
            <Text style={styles.stepTitle}>¿Cuál es tu género?</Text>
            {opts.map(opt => {
              const sel = gender === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    setGender(opt.value);
                    setErrors({});
                    setTimeout(() => setStep(STEP_BIRTHDATE), 200);
                  }}
                  style={[styles.genderOption, sel && styles.genderOptionSelected]}
                >
                  <Ionicons name={opt.icon} size={22} color={Colors.textOnDark} style={{ marginRight: 12 }} />
                  <Text style={styles.genderLabel}>{opt.label}</Text>
                  {sel && <Ionicons name="checkmark-circle" size={20} color={Colors.cream} style={{ marginLeft: 'auto' }} />}
                </Pressable>
              );
            })}
            <Text style={{ color: Colors.placeholder, fontFamily: Fonts.lexend, fontSize: 13, textAlign: 'center', marginTop: 16 }}>
              Selecciona para continuar
            </Text>
          </>
        );
      }

      // ── 4: Fecha nacimiento (auto-avance cuando la fecha es válida) ───────
      case STEP_BIRTHDATE:
        return (
          <>
            <Text style={styles.stepTitle}>¿Cuándo naciste?</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                value={birthDateText} onChangeText={handleBirthDateInput}
                placeholder="DD/MM/AAAA" placeholderTextColor={Colors.placeholder}
                keyboardType="number-pad" maxLength={10}
                style={[styles.input, { flex: 1 }, (errors.birthDate || birthDateError) && styles.inputError]}
              />
              <Pressable
                onPress={() => Platform.OS !== 'web' && setShowDatePicker(true)}
                style={{ marginLeft: 12, marginBottom: 8, position: 'relative' }}
              >
                <Ionicons name="calendar-outline" size={28} color={Colors.orangeMain} />
                {Platform.OS === 'web' && React.createElement('input', {
                  type: 'date',
                  style: { position: 'absolute', opacity: 0, width: '100%', height: '100%', top: 0, left: 0, cursor: 'pointer' },
                  value: birthDate ? birthDate.toISOString().split('T')[0] : '',
                  onChange: (e: any) => {
                    if (!e.target.value) return;
                    const [y, m, d] = e.target.value.split('-');
                    handleBirthDateInput(`${d}${m}${y}`);
                  },
                })}
              </Pressable>
            </View>
            {!!(errors.birthDate || birthDateError) && (
              <Text style={styles.errorText}>{errors.birthDate || birthDateError}</Text>
            )}
            {birthDate && !birthDateError && (
              <Text style={{ color: Colors.placeholder, fontFamily: Fonts.lexend, fontSize: 13, marginTop: 8 }}>
                Continuando...
              </Text>
            )}
            {showDatePicker && (
              <DateTimePicker
                value={birthDate || new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={handleDatePickerChange}
              />
            )}
          </>
        );

      // ── 5: Tallas ─────────────────────────────────────────────────────────
      case STEP_SIZES:
        return (
          <>
            <Text style={styles.stepTitle}>Tus tallas</Text>
            <Text style={styles.stepSubtitle}>Puedes marcar varias si estás entre tallas.</Text>

            <View style={{ flexDirection: 'row', backgroundColor: Colors.inputBg, borderRadius: 12, padding: 4, marginBottom: 20 }}>
              {(['EU', 'US', 'UK'] as const).map(r => (
                <Pressable
                  key={r} onPress={() => setSizeRegion(r)}
                  style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: sizeRegion === r ? Colors.darkBrown : 'transparent' }}
                >
                  <Text style={{ color: sizeRegion === r ? Colors.cream : Colors.placeholder, fontFamily: Fonts.lexend, fontWeight: sizeRegion === r ? '600' : '400' }}>
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Superior (Top)</Text>
            {renderChips(TOP_SIZES, sizeTop, setSizeTop)}
            {!!errors.sizeTop && <Text style={[styles.errorText, { marginTop: -8 }]}>{errors.sizeTop}</Text>}

            <Text style={styles.sectionLabel}>Inferior (Bottom)</Text>
            {renderChips(getBottomSizes(), sizeBottom, setSizeBottom)}
            {!!errors.sizeBottom && <Text style={[styles.errorText, { marginTop: -8 }]}>{errors.sizeBottom}</Text>}

            <Text style={styles.sectionLabel}>Calzado</Text>
            {renderChips(getShoeSizes(), sizeShoes, setSizeShoes)}
            {!!errors.sizeShoes && <Text style={[styles.errorText, { marginTop: -8 }]}>{errors.sizeShoes}</Text>}
          </>
        );

      // ── 6: Día de lavadora ────────────────────────────────────────────────
      case STEP_LAUNDRY:
        return (
          <>
            <Text style={styles.stepTitle}>Día de lavadora</Text>
            <Text style={styles.stepSubtitle}>¿Cuándo sueles hacer la colada? Puedes marcar varios.</Text>
            {renderChips(LAUNDRY_DAYS, laundryDays, setLaundryDays)}
            {!!errors.laundry && <Text style={styles.errorText}>{errors.laundry}</Text>}
          </>
        );

      // ── 7: Tipo de rutina ─────────────────────────────────────────────────
      case STEP_ROUTINE:
        return (
          <>
            <Text style={styles.stepTitle}>Rutina diaria</Text>
            <Text style={styles.stepSubtitle}>¿A qué te dedicas? Selecciona lo que aplique.</Text>
            {renderToggleRow('Trabajo habitual', hasWork, () => {
              setHasWork(!hasWork);
              if (!hasWork) setHasNoObligations(false);
            })}
            {renderToggleRow('Estudios / Universidad', hasStudies, () => {
              setHasStudies(!hasStudies);
              if (!hasStudies) setHasNoObligations(false);
            })}
            {renderToggleRow('Sin obligaciones fijas', hasNoObligations, () => {
              const next = !hasNoObligations;
              setHasNoObligations(next);
              if (next) { setHasWork(false); setHasStudies(false); }
            })}
            <View style={{ marginTop: 12, padding: 14, backgroundColor: Colors.inputBg, borderRadius: 12 }}>
              <Text style={{ color: Colors.placeholder, fontFamily: Fonts.lexend, fontSize: 13, textAlign: 'center' }}>
                Si no marcas nada pasaremos directamente a las actividades de tiempo libre.
              </Text>
            </View>
          </>
        );

      // ── 8: Trabajo ────────────────────────────────────────────────────────
      case STEP_WORK:
        return (
          <>
            <Text style={styles.stepTitle}>Sobre tu trabajo</Text>
            {renderToggleRow('Utilizo uniforme', workUniform, () => setWorkUniform(!workUniform))}
            {!workUniform && (
              <>
                <Text style={[styles.stepSubtitle, { marginTop: 8 }]}>¿Cómo sueles ir vestido/a?</Text>
                {renderOptionRows(WORK_STYLES, workStyles, setWorkStyles)}
              </>
            )}
          </>
        );

      // ── 9: Estudios ───────────────────────────────────────────────────────
      case STEP_STUDY:
        return (
          <>
            <Text style={styles.stepTitle}>Sobre tus estudios</Text>
            {renderToggleRow('Utilizo uniforme', studyUniform, () => setStudyUniform(!studyUniform))}
            {!studyUniform && (
              <>
                <Text style={[styles.stepSubtitle, { marginTop: 8 }]}>¿Cómo sueles ir a clase?</Text>
                {renderOptionRows(STUDY_STYLES, studyStyles, setStudyStyles)}
              </>
            )}
          </>
        );

      // ── 10: Actividades ───────────────────────────────────────────────────
      case STEP_ACTIVITIES:
        return (
          <>
            <Text style={styles.stepTitle}>Tiempo libre</Text>
            <Text style={styles.stepSubtitle}>¿Qué planes o actividades forman parte de tu vida?</Text>
            {renderOptionRows(ACTIVITIES, selectedActivities, setSelectedActivities)}
          </>
        );

      // ── 11: Estilo personal ───────────────────────────────────────────────
      case STEP_STYLE:
        return (
          <>
            <Text style={styles.stepTitle}>Tu estilo personal</Text>

            <Text style={styles.sectionLabel}>¿Qué priorizas al vestirte?</Text>
            <Text style={styles.stepSubtitle}>Toca en orden de importancia (1 = lo más). Vuelve a tocar para quitar.</Text>
            <View style={{ gap: 10, marginTop: 8, marginBottom: 24 }}>
              {STYLE_PRIORITIES.map(p => {
                const rank = priorityOrder.indexOf(p.id);
                const isRanked = rank !== -1;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => {
                      if (isRanked) setPriorityOrder(priorityOrder.filter(x => x !== p.id));
                      else setPriorityOrder([...priorityOrder, p.id]);
                    }}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5,
                      borderColor: isRanked ? Colors.orangeMain : Colors.inputBorder,
                      backgroundColor: isRanked ? Colors.orangeMain + '15' : Colors.inputBg,
                    }}
                  >
                    <View style={{
                      width: 28, height: 28, borderRadius: 14, marginRight: 14, alignItems: 'center', justifyContent: 'center',
                      ...(isRanked ? { backgroundColor: Colors.orangeMain } : { borderWidth: 1.5, borderColor: Colors.placeholder }),
                    }}>
                      {isRanked && <Text style={{ color: Colors.cream, fontFamily: Fonts.lexendSemiBold, fontSize: 14 }}>{rank + 1}</Text>}
                    </View>
                    <Text style={{ flex: 1, color: Colors.textOnDark, fontFamily: Fonts.lexend, fontSize: 15, fontWeight: isRanked ? '600' : '400' }}>
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Restricciones personales</Text>
            <Text style={styles.stepSubtitle}>¿Hay algo que nunca te pondrías?</Text>
            <View style={{ gap: 10, marginTop: 8 }}>
              {RESTRICTIONS.map(r => {
                const sel = selectedRestrictions.includes(r.id);
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => {
                      if (r.id === 'no_restrictions') {
                        setSelectedRestrictions(sel ? [] : ['no_restrictions']);
                      } else {
                        const next = sel
                          ? selectedRestrictions.filter(x => x !== r.id)
                          : [...selectedRestrictions.filter(x => x !== 'no_restrictions'), r.id];
                        setSelectedRestrictions(next);
                      }
                    }}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5,
                      borderColor: sel ? Colors.orangeMain : Colors.inputBorder,
                      backgroundColor: sel ? Colors.orangeMain + '15' : Colors.inputBg,
                    }}
                  >
                    <Text style={{ flex: 1, color: Colors.textOnDark, fontFamily: Fonts.lexend, fontSize: 15, fontWeight: sel ? '600' : '400' }}>
                      {r.label}
                    </Text>
                    <Ionicons name={sel ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={sel ? Colors.orangeMain : Colors.placeholder} />
                  </Pressable>
                );
              })}
            </View>

            {!!saveError && (
              <Text style={[styles.errorText, { marginTop: 16, textAlign: 'center' }]}>{saveError}</Text>
            )}
          </>
        );

      default:
        return null;
    }
  };

  // El paso 3 (género) y 4 (fecha) auto-avanzan — no muestran botón de continuar.
  const isAutoStep = step === STEP_GENDER || step === STEP_BIRTHDATE;
  const isLastStep = step === STEP_STYLE;
  const progress = step / MAX_STEPS;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.darkBrown }}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 24 }}>

          {/* Barra de progreso */}
          <View style={{ paddingTop: 16, marginBottom: 8 }}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>

          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: 20 }} keyboardShouldPersistTaps="handled">
            <View style={{ width: '100%', maxWidth: 450, alignSelf: 'center' }}>
              {renderStep()}
            </View>
          </ScrollView>

          {/* Botones de acción */}
          {!isAutoStep && (
            <View style={{ width: '100%', maxWidth: 450, alignSelf: 'center', paddingBottom: 24, paddingTop: 12 }}>
              <Pressable
                onPress={handleContinue}
                disabled={saving}
                style={[styles.continueButton, saving && { opacity: 0.7 }]}
              >
                {saving ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator color={Colors.cream} size="small" />
                    <Text style={[styles.continueText, { marginLeft: 10 }]}>Guardando...</Text>
                  </View>
                ) : (
                  <Text style={styles.continueText}>{isLastStep ? 'Finalizar' : 'Continuar'}</Text>
                )}
              </Pressable>

              {step > STEP_NAME && (
                <Pressable onPress={handleBack} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 12 }}>
                  <Text style={{ color: Colors.orangeMain, fontFamily: Fonts.lexend, fontSize: 14 }}>Volver</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Botón volver en pasos auto-avance */}
          {isAutoStep && step > STEP_NAME && (
            <View style={{ paddingBottom: 24, paddingTop: 4, alignItems: 'center' }}>
              <Pressable onPress={handleBack} style={{ paddingVertical: 12, paddingHorizontal: 24 }}>
                <Text style={{ color: Colors.orangeMain, fontFamily: Fonts.lexend, fontSize: 14 }}>Volver</Text>
              </Pressable>
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  stepTitle: {
    fontFamily: Fonts.gochiHand,
    fontSize: 28,
    color: Colors.textOnDark,
    textAlign: 'center',
    marginBottom: 12,
  },
  stepSubtitle: {
    fontFamily: Fonts.lexend,
    fontSize: 14,
    color: Colors.placeholder,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  sectionLabel: {
    fontFamily: Fonts.lexendSemiBold,
    fontSize: 15,
    color: Colors.textOnDark,
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    color: Colors.textOnDark,
    fontFamily: Fonts.lexend,
    fontSize: 14,
  },
  inputError: { borderColor: Colors.error },
  errorText: {
    fontFamily: Fonts.lexend,
    fontSize: 12,
    color: Colors.error,
    marginBottom: 8,
  },
  dropdownContainer: {
    backgroundColor: Colors.inputBg,
    borderColor: Colors.inputBorder,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: -2,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dropdownItemText: {
    color: Colors.textOnDark,
    fontFamily: Fonts.lexend,
    fontSize: 14,
  },
  genderOption: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: Colors.orangeMain,
    borderColor: Colors.orangeMain,
  },
  genderLabel: {
    color: Colors.textOnDark,
    fontFamily: Fonts.lexend,
    fontSize: 15,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.inputBg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.orangeMain,
    borderRadius: 2,
  },
  continueButton: {
    backgroundColor: Colors.orangeMain,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  continueText: {
    fontFamily: Fonts.fuzzyBubblesBold,
    fontSize: 16,
    color: Colors.cream,
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: Colors.darkBrown,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderBottomWidth: 0,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  pickerTitle: {
    color: Colors.textOnDark,
    fontFamily: Fonts.lexendSemiBold,
    fontSize: 16,
  },
  pickerSearch: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    color: Colors.textOnDark,
    fontFamily: Fonts.lexend,
    fontSize: 14,
  },
  pickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  pickerItemText: {
    color: Colors.textOnDark,
    fontFamily: Fonts.lexend,
    fontSize: 14,
  },
});
