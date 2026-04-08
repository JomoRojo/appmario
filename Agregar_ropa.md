CONTEXTO GENERAL
Estás desarrollando una pantalla de una app móvil (React Native / Expo) llamada "Agregar ropa a tu armario". Esta pantalla es accesible desde dos entradas:

Al finalizar el onboarding del usuario.
Desde el menú hamburguesa → opción "Agrega ropa a tu armario".

El stack técnico es:

Frontend: React Native con Expo
Servidor/Backend: Vercel (API Routes — aquí viven todas las llamadas a APIs externas)
Base de datos: Supabase (PostgreSQL + Storage)
IA análisis de prendas: Anthropic Claude Haiku 4.5 (via API REST, llamada desde Vercel)
Detección/procesamiento de imagen: Google Cloud Vision API (via API REST, llamada desde Vercel)
Variables de entorno: las keys sensibles van en Vercel Environment Variables (nunca en el cliente). Las variables públicas de Supabase usan el prefijo EXPO_PUBLIC_ en el .env local de Expo.


DISEÑO VISUAL
Sigue estrictamente el sistema de diseño definido en design.md del proyecto. Principios clave:

Tipografía, colores, espaciados, bordes y sombras deben ser coherentes con el resto de la app.
La pantalla debe sentirse limpia, moderna y app-nativa — no web.
Usa los componentes reutilizables ya existentes en el proyecto (botones, toasts, modales, tarjetas).
Los estados de carga deben mostrarse con los skeleton loaders o spinners ya definidos en design.md.
Todos los textos deben soportar i18n (la app está en español por defecto).


ESTRUCTURA DE LA PANTALLA PRINCIPAL
La pantalla tiene dos bloques táctiles de igual tamaño, centrados verticalmente:
┌─────────────────────────────────┐
│                                 │
│   📷  Hacer una foto            │
│                                 │
├─────────────────────────────────┤
│                                 │
│   🖼️  Importar imagen           │
│       de galería                │
│                                 │
└─────────────────────────────────┘
Ambos bloques son cards tocables con icono + texto. Al presionar cada uno se inicia el flujo correspondiente.

FLUJO A: CÁMARA
A1. Gestión de permisos de cámara
Antes de abrir la cámara, verificar si la app tiene permiso de cámara:

Si tiene permiso: abrir cámara directamente.
Si no tiene permiso: mostrar un modal explicativo con:

Título: "Necesitamos acceder a tu cámara"
Descripción: "Para fotografiar tus prendas necesitamos permiso de cámara."
Botón primario: "Ir a configuración" → abre Linking.openSettings() de Expo
Botón secundario: "Ahora no"



Usa expo-camera → Camera.requestCameraPermissionsAsync().
A2. Interfaz de cámara
Usa el componente de cámara de Expo. La UI sobre la cámara debe incluir:

Botón de captura centrado abajo
Botón de cerrar (X) arriba izquierda
Botón de voltear cámara (frontal/trasera) arriba derecha

A3. Confirmación de foto tomada
Tras capturar la foto, pausar y mostrar la previsualización con:

✓ Check (botón verde): "Usar esta foto"
✗ Cruz (botón rojo): "Repetir" → vuelve a la cámara en vivo

A4. Selección parte de la prenda (frontal/trasera)
Cuando el usuario acepta la foto, antes de procesarla, mostrar un modal/bottom sheet:

"¿Esta foto es de la parte delantera o trasera de la prenda?"

[Delantera] [Trasera]


Esto determina si image_url_front o image_url_back en la tabla items.
A5. Pregunta foto trasera (solo tras foto delantera)
Si el usuario acaba de subir la parte delantera, mostrar un bottom sheet:

"¿La parte trasera de la prenda tiene algo distinto (estampado, bordado, diseño)?"

[Sí, quiero añadir foto trasera] → abre la cámara de nuevo, mismo ciclo A2→A3→A4 (pero ya sabe que es trasera)
[No, solo tiene la parte delantera] → continúa al procesamiento


A6. Validación: ¿Es una prenda de ropa?
Antes de almacenar nada, la imagen se manda a Anthropic (ver Sección API). Si la IA detecta que no es una prenda de ropa, mostrar un toast/modal de error:

"Esto parece ser [ELEMENTO DETECTADO], no una prenda de ropa. Por favor, fotografía una prenda para poder añadirla a tu armario."

Y cancelar todo el proceso para esa imagen.
A7. Procesamiento paralelo
Si la imagen es válida, lanzar en paralelo:

Google Cloud Vision: detectar objeto y obtener crop hints → recortar imagen y generar versión limpia (image_url_clean)
Anthropic Haiku 4.5: analizar prenda → obtener JSON con campos de items

Ambas llamadas se hacen desde las API Routes de Vercel, nunca desde el cliente.
Mostrar un estado de carga con mensaje: "Analizando tu prenda..."
A8. Almacenamiento en Supabase
Una vez completado el procesamiento:

Subir imagen original (image_path_front / image_path_back) al bucket de Supabase Storage.
Subir imagen con fondo eliminado (image_url_clean) al bucket.
Crear o actualizar el registro en public.items con todos los campos del JSON de Anthropic + las URLs de imagen + closet_id del armario activo del usuario + user_id.
Si hay foto delantera Y trasera, es el mismo registro (id compartido): primero se inserta con image_url_front, luego se hace UPDATE para añadir image_url_back.

A9. Confirmación al usuario
Mostrar toast de éxito:

"✓ Prenda añadida a tu armario"

Y ofrecer dos acciones:

"Añadir otra prenda" → reinicia el flujo desde A1
"Ver mi armario" → navega a la pantalla del armario


FLUJO B: GALERÍA
B1. Gestión de permisos de galería
Antes de abrir la galería, verificar permiso de media library:

Si tiene permiso: abrir selector.
Si no: modal idéntico al de cámara pero para galería. Usa expo-media-library → MediaLibrary.requestPermissionsAsync().

B2. Selector de imágenes
Usa expo-image-picker → ImagePicker.launchImageLibraryAsync() con:

allowsMultipleSelection: true
selectionLimit: 10
mediaTypes: ImagePicker.MediaTypeOptions.Images

B3. Toast de revisión pre-subida
Antes de procesar nada, mostrar una vista de revisión (bottom sheet o pantalla modal) con:

Grid de miniaturas de las imágenes seleccionadas
Encima de cada imagen: un selector/checkbox para agrupar fotos que pertenezcan a la misma prenda

UI del agrupador:

Por defecto, cada imagen = prenda independiente
El usuario puede tocar varias imágenes y pulsar "Agrupar como una prenda" → se marcan con el mismo color/número de grupo
Una vez revisado, botón "Confirmar y analizar"

Lógica de grupos:

Las imágenes del mismo grupo → mismo item en la BD (una es image_url_front, la otra image_url_back)
Las imágenes sin grupo → cada una es un item independiente

B4. Procesamiento
Por cada prenda (o grupo de prenda):

Validar con Anthropic Haiku 4.5 que es prenda de ropa (si no → mostrar error individual con el nombre detectado, saltar esa imagen, continuar con las demás)
Enviar a Google Cloud Vision para procesar imagen limpia
Enviar a Anthropic Haiku 4.5 para análisis JSON completo
Guardar en Supabase Storage + insertar en public.items

Todas las llamadas a APIs externas pasan por las API Routes de Vercel.
Procesar de una en una (no en paralelo masivo) para no saturar la API. Mostrar barra de progreso: "Analizando prenda 3 de 7..."
B5. Resultado
Al terminar:

Resumen: "X prendas añadidas correctamente" + posibles errores individuales listados
Mismas acciones que A9


APIs A CREAR
API 1: /api/items/analyze (Vercel API Route)

Esta función corre en Vercel, no en el cliente. El cliente de Expo solo llama a esta ruta con la imagen en base64.

Input:
json{
  "imageBase64": "...",
  "mimeType": "image/jpeg"
}
Proceso:

Llamar a Anthropic Claude Haiku 4.5 con el prompt de análisis (ver abajo)
Parsear respuesta JSON
Devolver campos + flag is_clothing: boolean + detected_element: string (si no es ropa)

Prompt para Anthropic:
Analiza esta imagen y responde ÚNICAMENTE en formato JSON, sin texto adicional, sin explicaciones, sin markdown.

Primero determina si la imagen contiene una prenda de ropa. Si NO es una prenda de ropa, responde:
{"is_clothing": false, "detected_element": "[descripción breve de lo que es]"}

Si SÍ es una prenda de ropa, responde con este JSON exacto:
{
  "is_clothing": true,
  "tipo_categoria": "<camiseta|camisa|pantalon|falda|vestido|chaqueta|abrigo|zapatos|botas|zapatillas|accesorio|jersey|sudadera|mono|shorts|otro>",
  "tipo_descripcion": "<descripción corta en español>",
  "body_part": "<upper_body|lower_body|full_body|feet|accessory|layering>",
  "fit_type": "<fitted|slim|regular|oversize|crop|wide_leg|skinny|flare|straight|relaxed|tailored>",
  "estilo": "<casual|smart|formal|sporty|bohemian|classic|streetwear|rock|punk|emo|gothic|vintage|preppy|artsy|minimalist>",
  "color_primary": "<color en español>",
  "color_secondary": "<color en español o null>",
  "has_pattern": <true|false>,
  "pattern_type": "<stripes|floral|geometric|animal_print|graphic|logo|abstract|plaid|tie_dye o null>",
  "pattern_colors": ["<color>"] ,
  "material": "<cotton|linen|wool|synthetic|denim|leather|silk|knit|fleece|mixed o null>",
  "descripcion": "<descripción detallada en español, máx 200 caracteres>",
  "weather_warm": <true|false>,
  "weather_cold": <true|false>,
  "weather_versatile": <true|false>,
  "occasion_errands": <true|false>,
  "occasion_kids": <true|false>,
  "occasion_pet": <true|false>,
  "occasion_gym": <true|false>,
  "occasion_outdoor_sport": <true|false>,
  "occasion_casual_plans": <true|false>,
  "occasion_nights_out": <true|false>,
  "occasion_special_events": <true|false>,
  "occasion_travel": <true|false>,
  "occasion_shopping": <true|false>,
  "occasion_cultural": <true|false>,
  "occasion_volunteering": <true|false>,
  "occasion_work": <true|false>,
  "occasion_study": <true|false>,
  "occasion_home": <true|false>
}

Reglas:
- weather_versatile excluye weather_warm y weather_cold (si es versatile, los otros son false)
- Al menos uno de weather_warm, weather_cold, weather_versatile debe ser true
- pattern_type y pattern_colors solo si has_pattern es true, si no son null y []
Variables de entorno (configuradas en Vercel Environment Variables):
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-haiku-4-5-20251001

API 2: /api/items/process-image (Vercel API Route)

Esta función corre en Vercel. Recibe la imagen, llama a Google Cloud Vision para detectar la prenda y devuelve la imagen procesada lista para almacenar.

Input:
json{
  "imageBase64": "...",
  "mimeType": "image/jpeg"
}
Proceso:

Llamar a Google Cloud Vision API con OBJECT_LOCALIZATION y CROP_HINTS
Obtener las coordenadas del objeto principal (la prenda)
Recortar la imagen según esas coordenadas
Devolver la imagen recortada en base64 como imageCleanBase64

Nota: Google Cloud Vision detecta y localiza el objeto pero no elimina el fondo con transparencia — devuelve la imagen recortada centrada en la prenda. Para la fase de pruebas esto es suficiente. Si en producción se necesita fondo transparente real, se puede añadir una librería de segmentación en el propio servidor de Vercel.
Variables de entorno (configuradas en Vercel Environment Variables):
GOOGLE_CLOUD_VISION_API_KEY=AIzaSy...
Coste: Primeras 1.000 imágenes/mes gratis. De 1.001 a 5.000.000 → $1.50 por cada 1.000 imágenes (~$0.0015 por prenda).

SUPABASE STORAGE: Bucket wardrobe-items
Crear el bucket en Supabase con esta configuración:
sql-- En el dashboard de Supabase → Storage → New bucket
-- O via SQL:

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wardrobe-items',
  'wardrobe-items',
  false,                          -- privado, acceso solo via RLS
  10485760,                       -- 10 MB máximo por archivo
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- RLS: el usuario solo puede leer/escribir sus propios archivos
-- La estructura de paths será: {user_id}/{item_id}/front.jpg
--                               {user_id}/{item_id}/back.jpg
--                               {user_id}/{item_id}/clean.jpg

CREATE POLICY "Users can upload own item images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wardrobe-items' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read own item images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'wardrobe-items' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own item images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'wardrobe-items' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
Estructura de paths en el bucket:
wardrobe-items/
  {user_id}/
    {item_id}/
      front.jpg       → image_path_front
      back.jpg        → image_path_back (si existe)
      clean.jpg       → image_url_clean
Las URLs públicas/firmadas se obtienen con supabase.storage.from('wardrobe-items').getPublicUrl(path) o createSignedUrl si el bucket es privado.

LÓGICA DE INSERCIÓN EN public.items
Campos que rellena la app (no la IA):
javascript{
  id: uuid(),              // generado en cliente o dejar que lo genere Supabase
  closet_id: activeClosetId,
  user_id: currentUserId,
  image_url_front: supabasePublicUrl,
  image_path_front: storagePath,
  image_url_back: null,    // se rellena si hay foto trasera
  image_path_back: null,
  image_url_clean: supabasePublicUrlClean,
  status: 'available',
  times_worn: 0,
  is_active: true,
  ai_raw_response: rawJsonFromAnthropic
}
Campos que rellena Anthropic (del JSON analizado):
Todos los campos de tipo categoría, estilo, clima, ocasión, etc.
Flujo de inserción para prenda con foto delantera + trasera:

Generar item_id en cliente.
Procesar foto delantera → subir a storage → llamar APIs.
INSERT en public.items con datos de foto delantera + análisis IA.
Procesar foto trasera → subir a storage.
UPDATE public.items SET image_url_back = ..., image_path_back = ... WHERE id = item_id.
No crear dos filas. Es un único item.


MANEJO DE ERRORES
SituaciónUINo hay permiso cámara/galeríaModal explicativo + botón a SettingsImagen no es prenda de ropaToast/modal con elemento detectado, skip y continúaError de red en APIsToast: "Error analizando la prenda. Inténtalo de nuevo." + botón reintentarError subida a SupabaseToast de error + no se crea el itemGoogle Cloud Vision falla en procesar imagenUsar imagen original sin recortar como image_url_clean, no bloquear el flujoTimeout de AnthropicReintentar 1 vez. Si falla → guardar el item con los campos IA vacíos + flag para re-analizar

ESTADOS DE CARGA

Al abrir galería/cámara: ninguno (nativo del SO)
Tras aceptar foto: skeleton/spinner con texto "Analizando tu prenda..."
Procesando galería: barra de progreso numérica "Analizando prenda 2 de 5..."
Subiendo a Supabase: spinner pequeño, no bloquear UI


ARCHIVO .env — VARIABLES NECESARIAS
env# Supabase (públicas — se pueden exponer en el cliente de Expo)
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# APIs sensibles — SOLO en Vercel Environment Variables, nunca en el cliente
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CLOUD_VISION_API_KEY=AIzaSy...

# Modelos
ANTHROPIC_MODEL=claude-haiku-4-5-20251001

⚠️ Arquitectura de seguridad — MUY IMPORTANTE:

ANTHROPIC_API_KEY y GOOGLE_CLOUD_VISION_API_KEY van configuradas en el panel de Vercel → Settings → Environment Variables. En local, también en el .env del proyecto Vercel/API (no del proyecto Expo).
El cliente Expo nunca llama directamente a Anthropic ni a Google Cloud Vision.
El cliente Expo llama a /api/items/analyze y /api/items/process-image que son las API Routes de Vercel, y estas sí tienen acceso a las keys mediante process.env.ANTHROPIC_API_KEY y process.env.GOOGLE_CLOUD_VISION_API_KEY.
Supabase es la base de datos, no el servidor — no gestiona estas llamadas a APIs externas.



NOTAS ADICIONALES PARA EL DESARROLLADOR

closet_id activo: La app debe saber qué armario está activo antes de entrar a esta pantalla. Se asume que hay un estado global (Zustand / Context) con activeClosetId. Si no hay armario activo, redirigir a crear uno.
items_count en closets: El trigger handle_items_count en Supabase se encarga de incrementar automáticamente items_count en el armario y clothes_total en el perfil cuando se inserta un item activo. No hacerlo desde el cliente.
Bonus days: El trigger handle_bonus_check también se ejecuta automáticamente al insertar un item. No hay que hacer nada extra en el cliente.
Límite de prendas: Actualmente no hay límite máximo de prendas por armario en el schema (solo hay límite de armarios por tier). No bloquear la subida.
Foto trasera es opcional: El flujo no debe bloquearse si el usuario rechaza añadir foto trasera. Es solo informacional para mejorar el análisis de la IA.
Concurrencia en galería: Procesar las imágenes de galería de forma secuencial (una a una), no en paralelo, para evitar rate limiting de las APIs de IA.
Caché de análisis: Si una imagen ya fue analizada previamente (mismo hash), no volver a llamar a la IA — opcional, implementar si el tiempo lo permite.
Accesibilidad: Todos los botones deben tener accessibilityLabel. Las imágenes de prenda deben tener accessibilityHint con la descripción de la prenda una vez analizada.