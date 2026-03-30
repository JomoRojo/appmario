import { useEffect, useMemo, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Country, State, City } from 'country-state-city';
import * as Localization from 'expo-localization';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { supabase } from '../../lib/supabase';

const TOTAL_STEPS = 5;
const VALID_PHONE = /^\+?\d{7,15}$/;

interface PickerItem {
  label: string;
  value: string;
}

function getDefaultCountryCode(): string {
  try {
    const locales = Localization.getLocales();
    const region = locales?.[0]?.regionCode;
    if (region) return region.toUpperCase();
  } catch {}
  return 'US';
}

function PickerModal({
  visible,
  onClose,
  data,
  onSelect,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  data: PickerItem[];
  onSelect: (item: PickerItem) => void;
  title: string;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((item) => item.label.toLowerCase().includes(q));
  }, [data, search]);

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
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
            value={search}
            onChangeText={setSearch}
            placeholder={t('auth.onboarding_search_placeholder')}
            placeholderTextColor={Colors.placeholder}
            style={styles.pickerSearch}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onSelect(item);
                  handleClose();
                }}
                style={styles.pickerItem}
              >
                <Text style={styles.pickerItemText}>{item.label}</Text>
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

export default function OnboardingScreen() {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const defaultCountryCode = useMemo(getDefaultCountryCode, []);
  const [selectedCountry, setSelectedCountry] = useState<PickerItem | null>(
    null,
  );
  const [selectedRegion, setSelectedRegion] = useState<PickerItem | null>(null);
  const [selectedCity, setSelectedCity] = useState<PickerItem | null>(null);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [regionPickerOpen, setRegionPickerOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  const [phone, setPhone] = useState('');

  const [gender, setGender] = useState('');

  const [birthDateText, setBirthDateText] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthDateError, setBirthDateError] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const all = Country.getAllCountries();
    const match = all.find((c) => c.isoCode === defaultCountryCode);
    if (match)
      setSelectedCountry({ label: match.name, value: match.isoCode });
  }, [defaultCountryCode]);

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const { data } = await supabase
            .from('profiles')
            .select('phone')
            .eq('id', session.user.id)
            .single();
          if (data?.phone) setPhone(data.phone);
        }
      } catch {}
    })();
  }, []);

  const countries = useMemo(
    () =>
      Country.getAllCountries().map((c) => ({
        label: c.name,
        value: c.isoCode,
      })),
    [],
  );

  const regions = useMemo(() => {
    if (!selectedCountry) return [];
    return State.getStatesOfCountry(selectedCountry.value).map((s) => ({
      label: s.name,
      value: s.isoCode,
    }));
  }, [selectedCountry]);

  const cities = useMemo(() => {
    if (!selectedCountry || !selectedRegion) return [];
    return City.getCitiesOfState(
      selectedCountry.value,
      selectedRegion.value,
    ).map((c) => ({
      label: c.name,
      value: c.name,
    }));
  }, [selectedCountry, selectedRegion]);

  const handleBirthDateInput = (text: string) => {
    const digits = text.replace(/\D/g, '');
    let masked = '';
    if (digits.length <= 2) masked = digits;
    else if (digits.length <= 4)
      masked = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    else
      masked = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;

    setBirthDateText(masked);
    setBirthDateError('');

    if (masked.length === 10) {
      const [dd, mm, yyyy] = masked.split('/').map(Number);
      const d = new Date(yyyy, mm - 1, dd);
      if (
        d.getDate() !== dd ||
        d.getMonth() !== mm - 1 ||
        d.getFullYear() !== yyyy
      ) {
        setBirthDateError(t('auth.onboarding_birth_date_invalid'));
        setBirthDate(null);
        return;
      }
      const today = new Date();
      let age = today.getFullYear() - d.getFullYear();
      const mDiff = today.getMonth() - d.getMonth();
      if (mDiff < 0 || (mDiff === 0 && today.getDate() < d.getDate())) age--;
      if (age < 13) {
        setBirthDateError(t('auth.onboarding_birth_date_too_young'));
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

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!firstName.trim())
        e.firstName = t('auth.onboarding_first_name_required');
      if (!lastName.trim())
        e.lastName = t('auth.onboarding_last_name_required');
    } else if (step === 2) {
      if (!selectedCountry)
        e.country = t('auth.onboarding_country_required');
      if (!selectedRegion) e.region = t('auth.onboarding_region_required');
      if (!selectedCity) e.city = t('auth.onboarding_city_required');
    } else if (step === 3) {
      if (phone.trim() && !VALID_PHONE.test(phone.trim())) {
        e.phone = t('auth.onboarding_phone_invalid');
      }
    } else if (step === 5) {
      if (!birthDate)
        e.birthDate =
          birthDateError || t('auth.onboarding_birth_date_required');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('No session');
      const userId = session.user.id;
      const closetName = t('auth.onboarding_default_closet_name');

      const formattedBirthDate = birthDate
        ? `${birthDate.getFullYear()}-${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(birthDate.getDate()).padStart(2, '0')}`
        : null;

      const { error: closetErr } = await supabase.from('closets').upsert({
        user_id: userId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        country: selectedCountry?.label || '',
        region: selectedRegion?.label || '',
        city: selectedCity?.label || '',
        gender: gender || 'unspecified',
        birth_date: formattedBirthDate,
        name: closetName,
        is_default: true,
        position: 1,
      });
      if (closetErr) throw closetErr;

      if (phone.trim()) {
        await supabase
          .from('profiles')
          .update({ phone: phone.trim() })
          .eq('id', userId);
      }

      router.replace('/onboarding/routine');
    } catch {
      setSaveError(t('auth.onboarding_save_error'));
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = () => {
    if (!validateStep()) return;
    if (step === TOTAL_STEPS) {
      handleSave();
    } else {
      setStep(step + 1);
      setErrors({});
    }
  };

  const handleSkip = () => {
    if (step === 3) setPhone('');
    if (step === 4) setGender('unspecified');
    setStep(step + 1);
    setErrors({});
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const canSkip = step === 3 || step === 4;
  const progress = step / TOTAL_STEPS;

  const renderSelector = (
    value: string | undefined,
    placeholder: string,
    onPress: () => void,
    hasError: boolean,
  ) => (
    <Pressable
      onPress={onPress}
      style={[styles.selector, hasError && styles.inputError]}
    >
      <Text
        style={[styles.selectorText, !value && { color: Colors.placeholder }]}
      >
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-down" size={18} color={Colors.textOnDark} />
    </Pressable>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.stepTitle}>
              {t('auth.onboarding_step1_title')}
            </Text>
            <TextInput
              value={firstName}
              onChangeText={(v) => {
                setFirstName(v);
                setErrors({});
              }}
              placeholder={t('auth.onboarding_first_name_placeholder')}
              placeholderTextColor={Colors.placeholder}
              style={[styles.input, errors.firstName && styles.inputError]}
            />
            {!!errors.firstName && (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            )}
            <TextInput
              value={lastName}
              onChangeText={(v) => {
                setLastName(v);
                setErrors({});
              }}
              placeholder={t('auth.onboarding_last_name_placeholder')}
              placeholderTextColor={Colors.placeholder}
              style={[styles.input, errors.lastName && styles.inputError]}
            />
            {!!errors.lastName && (
              <Text style={styles.errorText}>{errors.lastName}</Text>
            )}
          </>
        );

      case 2:
        return (
          <>
            <Text style={styles.stepTitle}>
              {t('auth.onboarding_step2_title')}
            </Text>
            {renderSelector(
              selectedCountry?.label,
              t('auth.onboarding_country_placeholder'),
              () => setCountryPickerOpen(true),
              !!errors.country,
            )}
            {!!errors.country && (
              <Text style={styles.errorText}>{errors.country}</Text>
            )}
            {renderSelector(
              selectedRegion?.label,
              t('auth.onboarding_region_placeholder'),
              () => selectedCountry && setRegionPickerOpen(true),
              !!errors.region,
            )}
            {!!errors.region && (
              <Text style={styles.errorText}>{errors.region}</Text>
            )}
            {renderSelector(
              selectedCity?.label,
              t('auth.onboarding_city_placeholder'),
              () => selectedRegion && setCityPickerOpen(true),
              !!errors.city,
            )}
            {!!errors.city && (
              <Text style={styles.errorText}>{errors.city}</Text>
            )}

            <PickerModal
              visible={countryPickerOpen}
              onClose={() => setCountryPickerOpen(false)}
              data={countries}
              title={t('auth.onboarding_country_placeholder')}
              onSelect={(item) => {
                setSelectedCountry(item);
                setSelectedRegion(null);
                setSelectedCity(null);
              }}
            />
            <PickerModal
              visible={regionPickerOpen}
              onClose={() => setRegionPickerOpen(false)}
              data={regions}
              title={t('auth.onboarding_region_placeholder')}
              onSelect={(item) => {
                setSelectedRegion(item);
                setSelectedCity(null);
              }}
            />
            <PickerModal
              visible={cityPickerOpen}
              onClose={() => setCityPickerOpen(false)}
              data={cities}
              title={t('auth.onboarding_city_placeholder')}
              onSelect={setSelectedCity}
            />
          </>
        );

      case 3:
        return (
          <>
            <Text style={styles.stepTitle}>
              {t('auth.onboarding_step3_title')}
            </Text>
            <TextInput
              value={phone}
              onChangeText={(v) => {
                setPhone(v);
                setErrors({});
              }}
              placeholder={t('auth.onboarding_phone_placeholder')}
              placeholderTextColor={Colors.placeholder}
              keyboardType="phone-pad"
              style={[styles.input, errors.phone && styles.inputError]}
            />
            {!!errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}
          </>
        );

      case 4: {
        const genderOptions = [
          {
            value: 'female',
            label: t('auth.onboarding_gender_female'),
            icon: 'woman-outline' as const,
          },
          {
            value: 'male',
            label: t('auth.onboarding_gender_male'),
            icon: 'man-outline' as const,
          },
          {
            value: 'non_binary',
            label: t('auth.onboarding_gender_non_binary'),
            icon: 'people-outline' as const,
          },
        ];
        return (
          <>
            <Text style={styles.stepTitle}>
              {t('auth.onboarding_step4_title')}
            </Text>
            {genderOptions.map((opt) => {
              const selected = gender === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setGender(opt.value)}
                  style={[
                    styles.genderOption,
                    selected && styles.genderOptionSelected,
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={22}
                    color={Colors.textOnDark}
                    style={{ marginRight: 12 }}
                  />
                  <Text style={styles.genderLabel}>{opt.label}</Text>
                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={Colors.cream}
                      style={{ marginLeft: 'auto' }}
                    />
                  )}
                </Pressable>
              );
            })}
          </>
        );
      }

      case 5:
        return (
          <>
            <Text style={styles.stepTitle}>
              {t('auth.onboarding_step5_title')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                value={birthDateText}
                onChangeText={handleBirthDateInput}
                placeholder={t('auth.onboarding_birth_date_placeholder')}
                placeholderTextColor={Colors.placeholder}
                keyboardType="number-pad"
                maxLength={10}
                style={[
                  styles.input,
                  { flex: 1 },
                  (errors.birthDate || birthDateError) && styles.inputError,
                ]}
              />
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={{ marginLeft: 12, marginBottom: 8 }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={28}
                  color={Colors.orangeMain}
                />
              </Pressable>
            </View>
            {!!(errors.birthDate || birthDateError) && (
              <Text style={styles.errorText}>
                {errors.birthDate || birthDateError}
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
            {!!saveError && (
              <Text style={[styles.errorText, { marginTop: 12 }]}>
                {saveError}
              </Text>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.darkBrown }}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, paddingHorizontal: 24 }}>
          <View style={{ paddingTop: 16, marginBottom: 8 }}>
            <Text style={styles.progressText}>
              {t('auth.onboarding_progress', {
                current: step,
                total: TOTAL_STEPS,
              })}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%` },
                ]}
              />
            </View>
          </View>

          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingTop: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{ width: '100%', maxWidth: 450, alignSelf: 'center' }}
            >
              {renderStep()}
            </View>
          </ScrollView>

          <View
            style={{
              width: '100%',
              maxWidth: 450,
              alignSelf: 'center',
              paddingBottom: 24,
              paddingTop: 12,
            }}
          >
            {canSkip && (
              <Pressable
                onPress={handleSkip}
                style={{ alignItems: 'center', marginBottom: 12 }}
              >
                <Text
                  style={{
                    color: Colors.textDisabled,
                    fontFamily: Fonts.lexend,
                    fontSize: 14,
                  }}
                >
                  {step === 4
                    ? t('auth.onboarding_gender_skip')
                    : t('auth.onboarding_skip')}
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleContinue}
              disabled={saving}
              style={[styles.continueButton, saving && { opacity: 0.7 }]}
            >
              {saving ? (
                <View
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <ActivityIndicator color={Colors.cream} size="small" />
                  <Text style={[styles.continueText, { marginLeft: 10 }]}>
                    {t('auth.onboarding_saving')}
                  </Text>
                </View>
              ) : (
                <Text style={styles.continueText}>
                  {t('auth.onboarding_continue')}
                </Text>
              )}
            </Pressable>

            {step > 1 && (
              <Pressable
                onPress={handleBack}
                style={{
                  marginTop: 12,
                  alignItems: 'center',
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    color: Colors.orangeMain,
                    fontFamily: Fonts.lexend,
                    fontSize: 14,
                  }}
                >
                  {t('auth.onboarding_back')}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  stepTitle: {
    fontFamily: Fonts.gochiHand,
    fontSize: 28,
    color: Colors.textOnDark,
    textAlign: 'center',
    marginBottom: 24,
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
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontFamily: Fonts.lexend,
    fontSize: 12,
    color: Colors.error,
    marginBottom: 8,
  },
  selector: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
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
  progressText: {
    color: Colors.textOnDark,
    fontFamily: Fonts.lexend,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
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
