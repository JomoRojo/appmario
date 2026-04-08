App de gestión de armario personal. Un único codebase que corre en web (desplegada en Vercel, para pruebas y versión web), Android e iOS (distribuidas como apps nativas en sus respectivas tiendas). El idioma por defecto es español, con soporte para más idiomas mediante internacionalización.

FRONTEND
QuéTecnologíaFrameworkExpo SDK 52+ con Expo Router (file-based routing)LenguajeTypeScriptUI / ComponentesReact Native (View, Text, Pressable, etc.) — NO usar componentes HTML nativosEstilosNativeWind (Tailwind para React Native) o StyleSheet de React Native — seguir siempre design.mdNavegaciónExpo Router — estructura de carpetas en /appEstado globalZustandFormulariosReact Hook Form
Plataformas objetivo

Web: exportación estática o SSR con Expo Router → desplegada en Vercel
Android: build nativo via EAS Build → Google Play Store
iOS: build nativo via EAS Build → Apple App Store

Importante para componentes

Todos los componentes deben funcionar en las 3 plataformas (web, Android, iOS)
Usar Platform.OS solo cuando sea estrictamente necesario para diferenciar comportamiento nativo
Las animaciones deben usar React Native Animated o Reanimated 2 — nunca CSS puro
Los componentes de cámara y galería (expo-camera, expo-image-picker) solo funcionan en nativo — en web mostrar mensaje alternativo o deshabilitar


BACKEND / SERVIDOR
QuéTecnologíaServidorVercel (API Routes en /api/*)Lenguaje servidorNode.js / TypeScriptDeployAutomático desde GitHub → rama main despliega en producción
Arquitectura de llamadas
📱 App Expo (cliente)
    │
    │  NUNCA llama directamente a APIs externas
    │
    ▼
🖥️ Vercel API Routes (/api/*)
    │
    ├──▶ Anthropic Claude API
    ├──▶ Google Cloud Vision API
    └──▶ Supabase (como cliente servidor, con service role key si necesario)
Variables de entorno en Vercel
Las API keys sensibles se configuran en Vercel Dashboard → Settings → Environment Variables. El cliente Expo nunca tiene acceso a estas variables.
En local, se replican en el .env del proyecto (nunca se suben a GitHub).

BASE DE DATOS Y STORAGE
QuéTecnologíaBase de datosSupabase (PostgreSQL)Storage imágenesSupabase Storage — bucket wardrobe-itemsAutenticaciónSupabase Auth (email/password, con posibilidad de añadir OAuth con Google en futuro)Acceso desde clienteVia @supabase/supabase-js con anon key públicaAcceso desde servidorVia @supabase/supabase-js con service role key (solo en Vercel, nunca en cliente)
Importante

Supabase es base de datos y storage, NO es el servidor
Las llamadas a APIs externas (Anthropic, Google Cloud Vision) se hacen desde Vercel, no desde Supabase
Las Edge Functions de Supabase no se usan en este proyecto — toda la lógica de servidor está en Vercel API Routes


APIs EXTERNAS
APIPara quéDónde se llamaKey enAnthropic Claude Haiku 4.5Analizar prendas de ropa → JSON con categoría, estilo, ocasiones, etc.Vercel /api/items/analyzeVercel Env VariablesGoogle Cloud VisionDetectar objeto en imagen y generar crop hints para recortar la prendaVercel /api/items/process-imageVercel Env Variables
Modelos
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
Costes aproximados

Anthropic Haiku 4.5: $1/M tokens input, $5/M tokens output → ~$0.003 por análisis de prenda
Google Cloud Vision: primeras 1.000 imágenes/mes gratis, luego $1.50 por cada 1.000 → ~$0.0015 por prenda
Coste total por prenda subida: ~$0.005 (medio céntimo)


INTERNACIONALIZACIÓN (i18n)
QuéTecnologíaMotor de traduccionesi18next + react-i18nextProviderLanguageProvider.jsx — wrappea I18nextProvider de react-i18nextConfiguraciónsrc/i18n/i18n.jsHook en componentesuseTranslation() de react-i18next
Idiomas soportados (6 idiomas completos)

Español (es) — idioma por defecto y fallback
Inglés (en)
Francés (fr)
Alemán (de)
Italiano (it)
Portugués (pt)

Estructura de archivos de traducción
src/i18n/
  locales/
    de.json         → alemán
    en.json         → inglés
    es.json         → español (idioma base)
    fr.json         → francés
    it.json         → italiano
    pt.json         → portugués
  i18n.js           → configuración de i18next
  LanguageProvider.jsx → provider que wrappea I18nextProvider
Convención de claves
Las claves son planas con prefijo de pantalla/contexto:
json{
  "login_button": "Iniciar sesión",
  "login_email_placeholder": "Email",
  "login_error_email_invalid": "Email inválido",
  "onboarding_phone_invalid_real": "El número introducido no es válido",
  "onboarding_birth_date_format": "El formato debe ser DD/MM/AAAA"
}
Script para añadir claves nuevas
El proyecto tiene update_locales.js en la raíz. Cuando se añaden claves nuevas hay que incluirlas en los 6 idiomas dentro de ese script y ejecutarlo — propaga las claves a todos los archivos .json automáticamente.
bashnode update_locales.js
Uso en componentes
javascriptimport { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();
  return <Text>{t('login_button')}</Text>;
}
Reglas de i18n para Claude Code

Nunca escribir strings de UI directamente en los componentes — siempre usar t('clave')
Las claves siguen el patrón pantalla_descripcion en snake_case (ej: login_button, onboarding_title)
Cuando se creen claves nuevas, añadirlas en los 6 idiomas via update_locales.js
El español (es) es el fallback — si falta traducción en otro idioma, se muestra en español
Textos de error, toasts, labels, placeholders y títulos deben estar todos en i18n — nunca hardcodeados


CI/CD Y DESPLIEGUE
PlataformaCómoTriggerWeb (Vercel)Push a GitHub → Vercel detecta y despliega automáticamentePush a mainAndroideas build --platform android → eas submit a Google PlayManual o GitHub ActionsiOSeas build --platform ios → eas submit a App StoreManual o GitHub Actions
Ramas de trabajo recomendadas

main → producción (Vercel despliega automáticamente)
develop → desarrollo (Vercel genera preview URL automáticamente)
feature/* → funcionalidades nuevas


VARIABLES DE ENTORNO
En el cliente Expo (.env local, prefijo EXPO_PUBLIC_)
env# Visibles en el cliente — NO poner aquí API keys
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
En Vercel (Dashboard → Settings → Environment Variables)
env# NUNCA en el cliente — solo en Vercel
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
GOOGLE_CLOUD_VISION_API_KEY=AIzaSy...

# Supabase service role (solo si las API Routes necesitan acceso privilegiado)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
En local para desarrollo (.env.local en la raíz del proyecto, no subir a GitHub)
env# Copia exacta de las variables de Vercel para desarrollo local
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
GOOGLE_CLOUD_VISION_API_KEY=AIzaSy...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

⚠️ El archivo .env.local debe estar en .gitignore. Nunca se sube al repositorio.


ESTRUCTURA DE CARPETAS DEL PROYECTO
/
├── app/                    → Expo Router — pantallas y rutas
│   ├── (auth)/             → rutas de autenticación (login, registro, verify)
│   ├── (onboarding)/       → flujo de onboarding
│   └── (main)/             → app principal (dashboard, armario, outfits...)
├── api/                    → Vercel API Routes (servidor)
│   └── items/
│       ├── analyze.ts      → llama a Anthropic
│       └── process-image.ts → llama a Google Cloud Vision
├── src/
│   ├── components/         → componentes reutilizables
│   ├── hooks/              → custom hooks
│   ├── store/              → Zustand stores
│   ├── lib/
│   │   └── supabase.ts     → cliente de Supabase
│   └── i18n/               → internacionalización
│       ├── locales/
│       │   ├── de.json     → alemán
│       │   ├── en.json     → inglés
│       │   ├── es.json     → español (idioma base)
│       │   ├── fr.json     → francés
│       │   ├── it.json     → italiano
│       │   └── pt.json     → portugués
│       ├── i18n.js         → configuración de i18next
│       └── LanguageProvider.jsx → provider I18nextProvider
├── update_locales.js       → script para añadir claves a los 6 idiomas
├── design.md               → sistema de diseño — seguir siempre
├── stack.md                → este archivo
└── docs/                   → prompts y especificaciones de pantallas

RESUMEN RÁPIDO PARA CLAUDE CODE

Frontend: Expo + React Native + TypeScript + Expo Router
Servidor: Vercel API Routes (Node.js) — aquí van todas las llamadas a APIs externas
DB: Supabase PostgreSQL + Supabase Storage
IA prendas: Anthropic Claude Haiku 4.5 → llamado desde Vercel, nunca desde el cliente
Procesamiento imagen: Google Cloud Vision → llamado desde Vercel, nunca desde el cliente
i18n: i18next + react-i18next + LanguageProvider.jsx → 6 idiomas (es, en, fr, de, it, pt) — español por defecto — claves planas con prefijo de pantalla — añadir claves nuevas via node update_locales.js
Deploy web: GitHub → Vercel (automático)
Deploy móvil: EAS Build → Google Play + App Store
Diseño: seguir siempre design.md — nunca inventar colores, fuentes ni espaciados