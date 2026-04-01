import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, SafeAreaView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { Ionicons } from '@expo/vector-icons';

const TOP_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];
const BOTTOM_SIZES_EU = ['32', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54'];
const BOTTOM_SIZES_US = ['00', '0', '2', '4', '6', '8', '10', '12', '14', '16', '18', '20'];
const BOTTOM_SIZES_UK = ['4', '6', '8', '10', '12', '14', '16', '18', '20', '22', '24', '26'];

const SHOE_SIZES_EU = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
const SHOE_SIZES_US = ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
const SHOE_SIZES_UK = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const WORK_STYLES = [
  { id: 'style_comfortable', label: 'Cómodo' },
  { id: 'style_elegant', label: 'Elegante' },
  { id: 'style_casual', label: 'Casual' },
  { id: 'style_creative', label: 'Creativo' },
  { id: 'style_classic', label: 'Clásico' },
];

const STUDY_STYLES = WORK_STYLES;

const ACTIVITIES = [
  { id: 'activity_errands', label: 'Recados / Día a día' },
  { id: 'activity_gym', label: 'Gimnasio / Deporte' },
  { id: 'activity_nights_out', label: 'Salir de Noche' },
  { id: 'activity_formal_events', label: 'Eventos Formales' },
  { id: 'activity_outdoor', label: 'Al aire libre' },
];

export default function CompleteProfileWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Sizes
  const [region, setRegion] = useState('EU'); // 'EU' | 'US' | 'UK'
  const [sizeTop, setSizeTop] = useState([]);
  const [sizeBottom, setSizeBottom] = useState([]);
  const [sizeShoes, setSizeShoes] = useState([]);

  // Step 2: Routine Decision
  const [hasWork, setHasWork] = useState(false);
  const [hasStudies, setHasStudies] = useState(false);
  
  // Optional steps data
  const [workUniform, setWorkUniform] = useState(false);
  const [workStyles, setWorkStyles] = useState([]);

  const [studyUniform, setStudyUniform] = useState(false);
  const [studyStyles, setStudyStyles] = useState([]);

  // Step 5: Activities
  const [selectedActivities, setSelectedActivities] = useState([]);

  const toggleSelection = (setter, list, item) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const getBottomSizes = () => {
    switch(region) {
      case 'US': return BOTTOM_SIZES_US;
      case 'UK': return BOTTOM_SIZES_UK;
      default: return BOTTOM_SIZES_EU;
    }
  };

  const getShoeSizes = () => {
    switch(region) {
      case 'US': return SHOE_SIZES_US;
      case 'UK': return SHOE_SIZES_UK;
      default: return SHOE_SIZES_EU;
    }
  };

  const currentBottomSizes = getBottomSizes();
  const currentShoeSizes = getShoeSizes();

  // Dynamic Step Rendering
  // 1: Sizes, 2: Routine Type, 3: Work (cond), 4: Studies (cond), 5: Activities
  
  const handleNext = () => {
    if (step === 1) {
       if (sizeTop.length === 0 || sizeBottom.length === 0 || sizeShoes.length === 0) {
         Alert.alert('Faltan tallas', 'Por favor selecciona al menos una talla por categoría.');
         return;
       }
       setStep(2);
    } else if (step === 2) {
       if (hasWork) setStep(3);
       else if (hasStudies) setStep(4);
       else setStep(5);
    } else if (step === 3) {
       if (hasStudies) setStep(4);
       else setStep(5);
    } else if (step === 4) {
       setStep(5);
    } else if (step === 5) {
       handleSave();
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) {
      if (hasWork) setStep(3);
      else setStep(2);
    } else if (step === 5) {
      if (hasStudies) setStep(4);
      else if (hasWork) setStep(3);
      else setStep(2);
    }
  };

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

      // 1. Obtener el closet_id
      const { data: fetchCloset, error: fetchErr } = await supabase
        .from('closets')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
        
      if (fetchErr) throw fetchErr;
      const closetId = fetchCloset.id;

      // 2. UPDATE closets array talles
      const { error: updateErr } = await supabase
        .from('closets')
        .update({
           size_top: sizeTop, 
           size_bottom: sizeBottom,
           size_shoes: sizeShoes
        })
        .eq('id', closetId);
        
      if (updateErr) {
         console.warn("Posible error de restricción de tallaje en supabase", updateErr);
         // Alert.alert('Error actualizando tallas', updateErr.message);
      }

      // 3. UPSERT Rutinas
      if (hasWork) {
         const workPayload = { closet_id: closetId, uniform: workUniform };
         WORK_STYLES.forEach(s => { workPayload[s.id] = workStyles.includes(s.id); });
         await supabase.from('routine_work').upsert(workPayload);
      }

      if (hasStudies) {
         const studyPayload = { closet_id: closetId, uniform: studyUniform };
         STUDY_STYLES.forEach(s => { studyPayload[s.id] = studyStyles.includes(s.id); });
         await supabase.from('routine_studies').upsert(studyPayload);
      }

      const activitiesPayload = { closet_id: closetId };
      ACTIVITIES.forEach(a => { activitiesPayload[a.id] = selectedActivities.includes(a.id); });
      await supabase.from('routine_activities').upsert(activitiesPayload);

      // Finished -> Dashboard
      router.replace('/dashboard');
      
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderMultiSelect = (items, selectedList, setter) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 24 }}>
      {items.map(item => {
         const isSelected = selectedList.includes(item);
         return (
           <Pressable 
              key={item} 
              onPress={() => toggleSelection(setter, selectedList, item)}
              style={{
                 paddingHorizontal: 16, paddingVertical: 10,
                 borderRadius: 20, borderWidth: 1.5,
                 borderColor: isSelected ? Colors.orangeMain : Colors.inputBorder,
                 backgroundColor: isSelected ? Colors.orangeMain + '33' : Colors.inputBg
              }}
           >
              <Text style={{ 
                color: isSelected ? Colors.cream : Colors.textOnDark, 
                fontFamily: Fonts.lexend, 
                fontSize: 14 
              }}>{item}</Text>
           </Pressable>
         )
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
              onPress={() => toggleSelection(setter, selectedList, item.id)}
              style={{
                 flexDirection: 'row', alignItems: 'center',
                 paddingHorizontal: 16, paddingVertical: 14,
                 borderRadius: 16, borderWidth: 1.5,
                 borderColor: isSelected ? Colors.orangeMain : Colors.inputBorder,
                 backgroundColor: isSelected ? Colors.orangeMain + '15' : Colors.inputBg
              }}
           >
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  color: Colors.textOnDark, 
                  fontFamily: Fonts.lexend, 
                  fontSize: 16,
                  fontWeight: isSelected ? '600' : '400'
                }}>{item.label}</Text>
              </View>
              {isSelected && <Ionicons name="checkmark-circle" size={24} color={Colors.orangeMain} />}
              {!isSelected && <Ionicons name="ellipse-outline" size={24} color={Colors.placeholder} />}
           </Pressable>
         )
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
            marginBottom: 12
        }}
      >
        <Text style={{ 
          flex: 1, color: Colors.textOnDark, 
          fontFamily: Fonts.lexend, fontSize: 16,
          fontWeight: value ? '600' : '400'
        }}>{label}</Text>
        <Ionicons name={value ? "checkbox" : "square-outline"} size={26} color={value ? Colors.orangeMain : Colors.placeholder} />
      </Pressable>
  );


  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View>
             <Text style={{ color: Colors.textOnDark, fontFamily: Fonts.gochiHand, fontSize: 32, marginBottom: 8 }}>
                Completa tu Perfil
             </Text>
             <Text style={{ color: Colors.placeholder, fontFamily: Fonts.lexend, fontSize: 14, marginBottom: 24 }}>
                Selecciona las tallas que sueles usar. Puedes marcar varias si estás entre dos tallas de forma habitual.
             </Text>

             <View style={{ flexDirection: 'row', backgroundColor: Colors.inputBg, borderRadius: 12, padding: 4, marginBottom: 20 }}>
                {['EU', 'US', 'UK'].map(r => (
                  <Pressable 
                    key={r} onPress={() => setRegion(r)}
                    style={{ 
                      flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8,
                      backgroundColor: region === r ? Colors.darkBrown : 'transparent'
                    }}>
                    <Text style={{ 
                      color: region === r ? Colors.cream : Colors.placeholder, 
                      fontFamily: Fonts.lexend, fontWeight: region === r ? '600' : '400' 
                    }}>{r}</Text>
                  </Pressable>
                ))}
             </View>

             <Text style={{ color: Colors.textOnDark, fontFamily: Fonts.lexend, fontSize: 16, fontWeight: '600', marginTop: 8 }}>Talla Superior (Top)</Text>
             {renderMultiSelect(TOP_SIZES, sizeTop, setSizeTop)}

             <Text style={{ color: Colors.textOnDark, fontFamily: Fonts.lexend, fontSize: 16, fontWeight: '600' }}>Talla Inferior (Bottom)</Text>
             {renderMultiSelect(currentBottomSizes, sizeBottom, setSizeBottom)}

             <Text style={{ color: Colors.textOnDark, fontFamily: Fonts.lexend, fontSize: 16, fontWeight: '600' }}>Calzado</Text>
             {renderMultiSelect(currentShoeSizes, sizeShoes, setSizeShoes)}
          </View>
        );

      case 2:
        return (
          <View>
             <Text style={{ color: Colors.textOnDark, fontFamily: Fonts.gochiHand, fontSize: 32, marginBottom: 8 }}>
                Rutina Diaria
             </Text>
             <Text style={{ color: Colors.placeholder, fontFamily: Fonts.lexend, fontSize: 14, marginBottom: 24 }}>
                Dinos a qué te dedicas para adaptar los estilos diarios a tus prendas.
             </Text>

             {renderToggle('Trabajo habitual', hasWork, () => setHasWork(!hasWork))}
             {renderToggle('Estudios / Universidad', hasStudies, () => setHasStudies(!hasStudies))}
             
             <View style={{ marginTop: 24, padding: 16, backgroundColor: Colors.inputBg, borderRadius: 12 }}>
                <Text style={{ color: Colors.placeholder, fontFamily: Fonts.lexend, fontSize: 13, textAlign: 'center' }}>
                   Si no marcas ninguna, pasaremos directamente a tus actividades de tiempo libre.
                </Text>
             </View>
          </View>
        );
      
      case 3: // Work Config
        return (
          <View>
             <Text style={{ color: Colors.textOnDark, fontFamily: Fonts.gochiHand, fontSize: 32, marginBottom: 8 }}>
                Sobre tu Trabajo
             </Text>

             <View style={{ marginBottom: 24 }}>
                 {renderToggle('Utilizo Uniforme', workUniform, () => setWorkUniform(!workUniform))}
             </View>

             {!workUniform && (
               <>
                 <Text style={{ color: Colors.placeholder, fontFamily: Fonts.lexend, fontSize: 15, marginBottom: 8 }}>
                    ¿Qué estilo te gusta usar o se te requiere llevar para trabajar?
                 </Text>
                 <Text style={{ color: Colors.placeholder, fontFamily: Fonts.lexend, fontSize: 13, marginBottom: 16, opacity: 0.8 }}>
                    Selecciona varias opciones si aplicas diferentes según el día.
                 </Text>
                 {renderStyleSelect(WORK_STYLES, workStyles, setWorkStyles)}
               </>
             )}
          </View>
        );

      case 4: // Studies Config
        return (
          <View>
             <Text style={{ color: Colors.textOnDark, fontFamily: Fonts.gochiHand, fontSize: 32, marginBottom: 8 }}>
                Sobre tus Estudios
             </Text>

             <View style={{ marginBottom: 24 }}>
                 {renderToggle('Utilizo Uniforme', studyUniform, () => setStudyUniform(!studyUniform))}
             </View>

             {!studyUniform && (
               <>
                 <Text style={{ color: Colors.placeholder, fontFamily: Fonts.lexend, fontSize: 15, marginBottom: 8 }}>
                    ¿Qué estilo te gusta llevar para clase?
                 </Text>
                 {renderStyleSelect(STUDY_STYLES, studyStyles, setStudyStyles)}
               </>
             )}
          </View>
        );

      case 5: // Activities
        return (
          <View>
             <Text style={{ color: Colors.textOnDark, fontFamily: Fonts.gochiHand, fontSize: 32, marginBottom: 8 }}>
                Otras Actividades
             </Text>
             <Text style={{ color: Colors.placeholder, fontFamily: Fonts.lexend, fontSize: 14, marginBottom: 24 }}>
                ¿Qué tipo de planes o rutinas extra sueles abarcar a lo largo del mes? Esto define los estilos para tu tiempo libre.
             </Text>
             
             {renderStyleSelect(ACTIVITIES, selectedActivities, setSelectedActivities)}
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.darkBrown }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 60 }}>
        <View style={{ width: '100%', maxWidth: 450, alignSelf: 'center' }}>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
             {step > 1 && (
                <Pressable onPress={handleBack} style={{ padding: 8, marginLeft: -8, marginRight: 16 }}>
                   <Ionicons name="arrow-back" size={24} color={Colors.cream} />
                </Pressable>
             )}
             <View style={{ flex: 1, height: 6, backgroundColor: Colors.inputBg, borderRadius: 3 }}>
                <View style={{ width: `${(step / 5) * 100}%`, height: '100%', backgroundColor: Colors.orangeMain, borderRadius: 3 }} />
             </View>
          </View>

          {renderStepContent()}

          <Pressable 
            onPress={handleNext} 
            disabled={loading} 
            style={{ 
              backgroundColor: Colors.orangeMain, borderRadius: 12, paddingVertical: 16, 
              alignItems: 'center', opacity: loading ? 0.7 : 1, marginTop: 40 
            }}>
            {loading ? (
              <ActivityIndicator color={Colors.cream} size="small" />
            ) : (
              <Text style={{ color: Colors.cream, fontFamily: Fonts.fuzzyBubblesBold, fontSize: 18 }}>
                 {step === 5 ? 'Finalizar y Guardar' : 'Siguiente'}
              </Text>
            )}
          </Pressable>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
