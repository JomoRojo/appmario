import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { Ionicons } from '@expo/vector-icons';

// ─── Tallas ───────────────────────────────────────────────────────────────────
const TOP_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];
const BOTTOM_SIZES_EU = ['32', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54'];
const BOTTOM_SIZES_US = ['00', '0', '2', '4', '6', '8', '10', '12', '14', '16', '18', '20'];
const BOTTOM_SIZES_UK = ['4', '6', '8', '10', '12', '14', '16', '18', '20', '22', '24', '26'];
const SHOE_SIZES_EU = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
const SHOE_SIZES_US = ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
const SHOE_SIZES_UK = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const LAUNDRY_DAYS = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo', 'Variable',
];

// ─── Rutinas ──────────────────────────────────────────────────────────────────
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

const TOTAL_STEPS = 6;

export default function CompleteProfileWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // ── Bloque 1: Tallas + Lavadora ───────────────────────────────────────────
  const [region, setRegion] = useState('EU');
  const [sizeTop, setSizeTop] = useState([]);
  const [sizeBottom, setSizeBottom] = useState([]);
  const [sizeShoes, setSizeShoes] = useState([]);
  const [laundryDays, setLaundryDays] = useState([]);

  // ── Bloque 2: Rutinas ─────────────────────────────────────────────────────
  const [hasWork, setHasWork] = useState(false);
  const [hasStudies, setHasStudies] = useState(false);
  const [hasNoObligations, setHasNoObligations] = useState(false);

  const [workUniform, setWorkUniform] = useState(false);
  const [workStyles, setWorkStyles] = useState([]);

  const [studyUniform, setStudyUniform] = useState(false);
  const [studyStyles, setStudyStyles] = useState([]);

  // ── Bloque 3: Tiempo libre ────────────────────────────────────────────────
  const [selectedActivities, setSelectedActivities] = useState([]);

  // ── Bloque 4: Estilo personal ─────────────────────────────────────────────
  // priorityOrder: array ordenado de IDs (el índice = prioridad, 0 = primera)
  const [priorityOrder, setPriorityOrder] = useState([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState([]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const toggle = (setter, list, item) =>
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);

  const getBottomSizes = () => {
    if (region === 'US') return BOTTOM_SIZES_US;
    if (region === 'UK') return BOTTOM_SIZES_UK;
    return BOTTOM_SIZES_EU;
  };

  const getShoeSizes = () => {
    if (region === 'US') return SHOE_SIZES_US;
    if (region === 'UK') return SHOE_SIZES_UK;
    return SHOE_SIZES_EU;
  };

  // ── Navegación ─────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (step === 1) {
      if (sizeTop.length === 0 || sizeBottom.length === 0 || sizeShoes.length === 0) {
        Alert.alert('Faltan tallas', 'Selecciona al menos una talla por categoría.');
        return;
      }
      if (laundryDays.length === 0) {
        Alert.alert('Día de lavadora', 'Indica cuándo sueles hacer la colada.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (hasWork) setStep(3);
      else if (hasStudies) setStep(4);
      else setStep(5); // sin obligaciones → salta a actividades
    } else if (step === 3) {
      if (hasStudies) setStep(4);
      else setStep(5);
    } else if (step === 4) {
      setStep(5);
    } else if (step === 5) {
      setStep(6);
    } else if (step === 6) {
      handleSave();
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(hasWork ? 3 : 2);
    else if (step === 5) {
      if (hasStudies) setStep(4);
      else if (hasWork) setStep(3);
      else setStep(2);
    } else if (step === 6) setStep(5);
  };

  // ── Restricciones: "sin restricciones" limpia las demás ───────────────────
  const handleRestrictionToggle = (id) => {
    if (id === 'no_restrictions') {
      setSelectedRestrictions(
        selectedRestrictions.includes('no_restrictions') ? [] : ['no_restrictions']
      );
      return;
    }
    const next = selectedRestrictions.includes(id)
      ? selectedRestrictions.filter(r => r !== id)
      : [...selectedRestrictions.filter(r => r !== 'no_restrictions'), id];
    setSelectedRestrictions(next);
  };

  // ── Prioridades: tap para ordenar, re-tap para quitar ────────────────────
  const handlePriorityTap = (id) => {
    if (priorityOrder.includes(id)) {
      setPriorityOrder(priorityOrder.filter(p => p !== id));
    } else {
      setPriorityOrder([...priorityOrder, id]);
    }
  };

  // ── Guardar todo ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session) {
        router.replace('/(auth)/login');
        return;
      }
      const userId = session.user.id;

      // 1. Obtener closet_id
      const { data: fetchCloset, error: fetchErr } = await supabase
        .from('closets')
        .select('id')
        .eq('user_id', userId)
        .single();
      if (fetchErr) throw fetchErr;
      const closetId = fetchCloset.id;

      // 2. Tallas + lavadora + flags de rutina
      const { error: closetErr } = await supabase
        .from('closets')
        .update({
          size_top: sizeTop,
          size_bottom: sizeBottom,
          size_shoes: sizeShoes,
          laundry_day: laundryDays,
          has_routine_work:  hasWork,
          has_routine_study: hasStudies,
          has_routine_free:  selectedActivities.length > 0,
        })
        .eq('id', closetId);
      if (closetErr) console.warn('closets update:', closetErr);

      // 3. Rutina trabajo
      if (hasWork) {
        const workPayload = {
          closet_id: closetId,
          uniform: workUniform,
          styles: workStyles,
        };
        await supabase.from('routine_work').upsert(workPayload);
      }

      // 4. Rutina estudios
      if (hasStudies) {
        const studyPayload = {
          closet_id: closetId,
          uniform: studyUniform,
          styles: studyStyles,
        };
        await supabase.from('routine_studies').upsert(studyPayload);
      }

      // 5. Actividades de tiempo libre
      if (selectedActivities.length > 0) {
        await supabase.from('routine_activities').upsert({
          closet_id: closetId,
          activities: selectedActivities,
        });
      }

      // 6. Estilo personal
      await supabase.from('routine_style').upsert({
        closet_id: closetId,
        priority_order: priorityOrder,
        restrictions: selectedRestrictions,
      });

      // 7. Marcar onboarding completo
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', userId);

      // 8. Redirigir a añadir prendas (clothes_total = 0 al salir del onboarding)
      router.replace('/add-items');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Componentes de UI reutilizables ──────────────────────────────────────

  const renderMultiSelect = (items, selectedList, setter) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 24 }}>
      {items.map(item => {
        const isSelected = selectedList.includes(item);
        return (
          <Pressable
            key={item}
            onPress={() => toggle(setter, selectedList, item)}
            style={{
              paddingHorizontal: 16, paddingVertical: 10,
              borderRadius: 20, borderWidth: 1.5,
              borderColor: isSelected ? Colors.orangeMain : Colors.inputBorder,
              backgroundColor: isSelected ? Colors.orangeMain + '33' : Colors.inputBg,
            }}
          >
            <Text style={{ color: isSelected ? Colors.cream : Colors.textOnDark, fontFamily: Fonts.lexend, fontSize: 14 }}>
              {item}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderStyleSelect = (items, selectedList, setter) => (
    <View style={{ gap: 12, marginTop: 16, marginBottom: 24 }}>
      {items.map(item => {
        const isSelected = selectedList.includes(item.id);
        return (
          <Pressable
            key={item.id}
            onPress={() => toggle(setter, selectedList, item.id)}
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 16, paddingVertical: 14,
              borderRadius: 16, borderWidth: 1.5,
              borderColor: isSelected ? Colors.orangeMain : Colors.inputBorder,
              backgroundColor: isSelected ? Colors.orangeMain + '15' : Colors.inputBg,
            }}
          >
            <Text style={{
              flex: 1, color: Colors.textOnDark, fontFamily: Fonts.lexend,
              fontSize: 16, fontWeight: isSelected ? '600' : '400',
            }}>
              {item.label}
            </Text>
            <Ionicons
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={isSelected ? Colors.orangeMain : Colors.placeholder}
            />
          </Pressable>
        );
      })}
    </View>
  );

  const renderToggle = (label, value, onToggle) => (
    <Pressable
      onPress={onToggle}
      style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 16,
        borderRadius: 16, borderWidth: 1.5,
        borderColor: value ? Colors.orangeMain : Colors.inputBorder,
        backgroundColor: value ? Colors.orangeMain + '15' : Colors.inputBg,
        marginBottom: 12,
      }}
    >
      <Text style={{
        flex: 1, color: Colors.textOnDark, fontFamily: Fonts.lexend,
        fontSize: 16, fontWeight: value ? '600' : '400',
      }}>
        {label}
      </Text>
      <Ionicons
        name={value ? 'checkbox' : 'square-outline'}
        size={26}
        color={value ? Colors.orangeMain : Colors.placeholder}
      />
    </Pressable>
  );

  // ─── Paso 1: Tallas + Lavadora ────────────────────────────────────────────
  const renderStep1 = () => (
    <View>
      <Text style={styles.title}>Completa tu perfil</Text>
      <Text style={styles.subtitle}>
        Selecciona las tallas que sueles usar. Puedes marcar varias si estás entre tallas.
      </Text>

      {/* Región de tallas */}
      <View style={{ flexDirection: 'row', backgroundColor: Colors.inputBg, borderRadius: 12, padding: 4, marginBottom: 20 }}>
        {['EU', 'US', 'UK'].map(r => (
          <Pressable
            key={r}
            onPress={() => setRegion(r)}
            style={{
              flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8,
              backgroundColor: region === r ? Colors.darkBrown : 'transparent',
            }}
          >
            <Text style={{ color: region === r ? Colors.cream : Colors.placeholder, fontFamily: Fonts.lexend, fontWeight: region === r ? '600' : '400' }}>
              {r}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Talla Superior (Top)</Text>
      {renderMultiSelect(TOP_SIZES, sizeTop, setSizeTop)}

      <Text style={styles.sectionLabel}>Talla Inferior (Bottom)</Text>
      {renderMultiSelect(getBottomSizes(), sizeBottom, setSizeBottom)}

      <Text style={styles.sectionLabel}>Calzado</Text>
      {renderMultiSelect(getShoeSizes(), sizeShoes, setSizeShoes)}

      {/* Lavadora */}
      <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Día(s) de lavadora</Text>
      <Text style={styles.subtitle}>¿Cuándo sueles hacer la colada? Puedes elegir varios.</Text>
      {renderMultiSelect(LAUNDRY_DAYS, laundryDays, setLaundryDays)}
    </View>
  );

  // ─── Paso 2: Tipo de rutina ───────────────────────────────────────────────
  const renderStep2 = () => (
    <View>
      <Text style={styles.title}>Rutina diaria</Text>
      <Text style={styles.subtitle}>
        ¿A qué te dedicas? Selecciona lo que aplique para adaptar los estilos de tu armario.
      </Text>

      {renderToggle('Trabajo habitual', hasWork, () => {
        setHasWork(!hasWork);
        if (!hasWork) setHasNoObligations(false);
      })}
      {renderToggle('Estudios / Universidad', hasStudies, () => {
        setHasStudies(!hasStudies);
        if (!hasStudies) setHasNoObligations(false);
      })}
      {renderToggle('Sin obligaciones fijas', hasNoObligations, () => {
        const next = !hasNoObligations;
        setHasNoObligations(next);
        if (next) { setHasWork(false); setHasStudies(false); }
      })}

      <View style={{ marginTop: 16, padding: 16, backgroundColor: Colors.inputBg, borderRadius: 12 }}>
        <Text style={{ color: Colors.placeholder, fontFamily: Fonts.lexend, fontSize: 13, textAlign: 'center' }}>
          Si no marcas ninguna, pasaremos directamente a tus actividades de tiempo libre.
        </Text>
      </View>
    </View>
  );

  // ─── Paso 3: Trabajo ──────────────────────────────────────────────────────
  const renderStep3 = () => (
    <View>
      <Text style={styles.title}>Sobre tu trabajo</Text>

      <View style={{ marginBottom: 24 }}>
        {renderToggle('Utilizo uniforme', workUniform, () => setWorkUniform(!workUniform))}
      </View>

      {!workUniform && (
        <>
          <Text style={styles.subtitle}>
            ¿Cómo sueles ir al trabajo? Selecciona el estilo o estilos que apliquen.
          </Text>
          {renderStyleSelect(WORK_STYLES, workStyles, setWorkStyles)}
        </>
      )}
    </View>
  );

  // ─── Paso 4: Estudios ─────────────────────────────────────────────────────
  const renderStep4 = () => (
    <View>
      <Text style={styles.title}>Sobre tus estudios</Text>

      <View style={{ marginBottom: 24 }}>
        {renderToggle('Utilizo uniforme', studyUniform, () => setStudyUniform(!studyUniform))}
      </View>

      {!studyUniform && (
        <>
          <Text style={styles.subtitle}>
            ¿Cómo sueles ir a clase?
          </Text>
          {renderStyleSelect(STUDY_STYLES, studyStyles, setStudyStyles)}
        </>
      )}
    </View>
  );

  // ─── Paso 5: Actividades de tiempo libre ──────────────────────────────────
  const renderStep5 = () => (
    <View>
      <Text style={styles.title}>Tiempo libre</Text>
      <Text style={styles.subtitle}>
        ¿Qué tipo de planes o actividades forman parte de tu vida? Marca todas las que apliquen.
      </Text>
      {renderStyleSelect(ACTIVITIES, selectedActivities, setSelectedActivities)}
    </View>
  );

  // ─── Paso 6: Estilo personal ──────────────────────────────────────────────
  const renderStep6 = () => (
    <View>
      <Text style={styles.title}>Tu estilo personal</Text>

      {/* Prioridades */}
      <Text style={[styles.sectionLabel, { marginBottom: 4 }]}>¿Qué priorizas al vestirte?</Text>
      <Text style={styles.subtitle}>
        Toca en orden de importancia (1 = lo más importante). Vuelve a tocar para quitar.
      </Text>
      <View style={{ gap: 10, marginTop: 12, marginBottom: 28 }}>
        {STYLE_PRIORITIES.map(priority => {
          const rank = priorityOrder.indexOf(priority.id);
          const isRanked = rank !== -1;
          return (
            <Pressable
              key={priority.id}
              onPress={() => handlePriorityTap(priority.id)}
              style={{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 16, paddingVertical: 14,
                borderRadius: 16, borderWidth: 1.5,
                borderColor: isRanked ? Colors.orangeMain : Colors.inputBorder,
                backgroundColor: isRanked ? Colors.orangeMain + '15' : Colors.inputBg,
              }}
            >
              {isRanked ? (
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: Colors.orangeMain,
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 14,
                }}>
                  <Text style={{ color: Colors.cream, fontFamily: Fonts.lexendSemiBold, fontSize: 14 }}>
                    {rank + 1}
                  </Text>
                </View>
              ) : (
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  borderWidth: 1.5, borderColor: Colors.placeholder,
                  marginRight: 14,
                }} />
              )}
              <Text style={{
                flex: 1, color: Colors.textOnDark, fontFamily: Fonts.lexend,
                fontSize: 16, fontWeight: isRanked ? '600' : '400',
              }}>
                {priority.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Restricciones */}
      <Text style={[styles.sectionLabel, { marginBottom: 4 }]}>Restricciones personales</Text>
      <Text style={styles.subtitle}>
        ¿Hay algo que nunca te pondrías?
      </Text>
      <View style={{ gap: 10, marginTop: 12 }}>
        {RESTRICTIONS.map(restriction => {
          const isSelected = selectedRestrictions.includes(restriction.id);
          return (
            <Pressable
              key={restriction.id}
              onPress={() => handleRestrictionToggle(restriction.id)}
              style={{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 16, paddingVertical: 14,
                borderRadius: 16, borderWidth: 1.5,
                borderColor: isSelected ? Colors.orangeMain : Colors.inputBorder,
                backgroundColor: isSelected ? Colors.orangeMain + '15' : Colors.inputBg,
              }}
            >
              <Text style={{
                flex: 1, color: Colors.textOnDark, fontFamily: Fonts.lexend,
                fontSize: 16, fontWeight: isSelected ? '600' : '400',
              }}>
                {restriction.label}
              </Text>
              <Ionicons
                name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={isSelected ? Colors.orangeMain : Colors.placeholder}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return null;
    }
  };

  const isLastStep = step === TOTAL_STEPS;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.darkBrown }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 60 }}>
        <View style={{ width: '100%', maxWidth: 450, alignSelf: 'center' }}>

          {/* Barra de progreso */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 28 }}>
            {step > 1 && (
              <Pressable onPress={handleBack} style={{ padding: 8, marginLeft: -8, marginRight: 16 }}>
                <Ionicons name="arrow-back" size={24} color={Colors.cream} />
              </Pressable>
            )}
            <View style={{ flex: 1, height: 6, backgroundColor: Colors.inputBg, borderRadius: 3 }}>
              <View style={{
                width: `${(step / TOTAL_STEPS) * 100}%`,
                height: '100%',
                backgroundColor: Colors.orangeMain,
                borderRadius: 3,
              }} />
            </View>
            <Text style={{ color: Colors.placeholder, fontFamily: Fonts.lexend, fontSize: 12, marginLeft: 12 }}>
              {step}/{TOTAL_STEPS}
            </Text>
          </View>

          {renderStepContent()}

          <Pressable
            onPress={handleNext}
            disabled={loading}
            style={{
              backgroundColor: Colors.orangeMain, borderRadius: 12, paddingVertical: 16,
              alignItems: 'center', opacity: loading ? 0.7 : 1, marginTop: 40,
            }}
          >
            {loading ? (
              <ActivityIndicator color={Colors.cream} size="small" />
            ) : (
              <Text style={{ color: Colors.cream, fontFamily: Fonts.fuzzyBubblesBold, fontSize: 18 }}>
                {isLastStep ? 'Finalizar' : 'Siguiente'}
              </Text>
            )}
          </Pressable>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  title: {
    color: Colors.textOnDark,
    fontFamily: Fonts.gochiHand,
    fontSize: 32,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.placeholder,
    fontFamily: Fonts.lexend,
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  sectionLabel: {
    color: Colors.textOnDark,
    fontFamily: Fonts.lexendSemiBold,
    fontSize: 16,
    marginBottom: 4,
  },
};
