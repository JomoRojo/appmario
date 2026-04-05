Agregar ropa

Dos opciones: hacer foto o importar desde galería (permite selección múltiple).
Permisos de cámara/galería con redirección a ajustes del SO si no están concedidos.
La imagen se sube a Supabase Storage (bucket del user).
Se envía a Claude API para análisis → devuelve JSON con categoría, descripción, estilo, colores, material, clima, ocasiones.
Se guarda el JSON en items.ai_raw_response y los campos individuales en la tabla items.
Tras añadir prendas → pantalla de confirmación con opción "Editar mis prendas" o "Volver a Inicio".

Eliminar ropa

Galería de prendas con filtros por categoría.
Al hacer clic en una prenda → opción de eliminar con confirmación modal.
Eliminación lógica: items.is_active = false (soft delete). Trigger actualiza closets.items_count y profiles.clothes_total.

Outfits últimos 15 días

Imagen del outfit del día seleccionado con flechas de navegación anterior/posterior.
Solo se muestran los últimos 15 días hábiles. Si no hay outfit para ese día → mensaje "No hay outfit".
El outfit siempre se muestra aunque haya pasado tiempo (está almacenado en la BD).

¿Necesitas ropa?

Cuadro de texto (máx. 500 caracteres) o imagen desde galería.
Se transforma en JSON y se busca mediante API de Zalando o Shein.
Resultados: foto, nombre, precio. Al hacer clic → redirige a la web del producto (se abre en la app, no en navegador externo).

Tu rutina

Muestra los datos del onboarding con posibilidad futura de modificarlos.


3. Base de datos — Esquema completo
profiles
Perfil del usuario, suscripción y contadores globales.
CampoTipoNotasiduuid PK= auth.users.idemailtext uniquephonetexttrial_started_attimestamptzdefault now()trial_ends_attimestamptzdefault now() + 15 díasbonus_daysinteger0–16; se acumula por prendas añadidasstatustexttrial_active, trial_expired, subscribed, subscription_expired, lifetimesubscription_tiertextbasic, standard, gold, premiumsubscription_idtextID externo del proveedorsubscription_providertextstripe, apple_iap, google_playcurrent_period_start/endtimestamptzcancel_at_period_endbooleancancelled_attimestamptzclothes_totalintegersuma de items_count de todos los closets activosdata_deletion_datetimestamptzdata_deletion_final_datetimestamptzdata_extension_countintegerlast_extension_paid_attimestamptzlocaletextdefault es
Triggers:

on_auth_user_created → crea fila en profiles automáticamente.
profiles_bonus_days → recalcula trial_ends_at cuando cambia bonus_days.

Bonus days por prendas:
Umbral prendasbonus_days acumulado≥ 251≥ 504≥ 1009≥ 15016

closets
Un usuario puede tener 1–4 armarios según su tier.
CampoTipoNotasiduuid PKuser_iduuid FK → profilesfirst_name, last_nametextdatos del propietario del armariocountry, region, citytextgendertextmale, female, non_binary, unspecifiedbirth_datedatenametext NOT NULLnombre del armariois_defaultbooleanun solo armario default por usuariopositioninteger1–4has_routine_workbooleanse actualiza por triggerhas_routine_studybooleanse actualiza por triggerhas_routine_freebooleanse actualiza por triggeris_activebooleansize_top, size_bottomtextXS–XXLsize_shoestextitems_countintegerprendas activas; actualizado por triggerlaundry_daytextmonday…sunday, variable
Límites de armarios por tier:
TierMáx. armariosbasic / sin tier1standard2gold3premium4
Triggers:

closets_limit_check → impide superar el límite según tier.
closets_default_check → garantiza un solo armario default.
closets_clothes_total → actualiza profiles.clothes_total cuando cambia items_count.


routine_work
Perfil de rutina laboral. Uno por closet.

has_uniform: boolean. Si true, los campos de estilo deben ser false.
Estilos: style_comfortable, style_smart, style_elegant, style_random, style_varies, style_other.
formality_score: 1–5, calculado por trigger desde style_weights.
Trigger routine_work_sync_closet actualiza closets.has_routine_work.


routine_activities
Actividades de tiempo libre. Una por closet.
Actividades disponibles: errands, kids, pet, gym, outdoor, casual_plans, nights_out, special_events, travel, shopping, cultural, volunteering, other.
Trigger routine_activities_sync_closet actualiza closets.has_routine_free.

routine_style
Preferencias de estilo personal. Una por closet.

Prioridades al vestirse (ranking 1–5, sin repetición, todos o ninguno): comfort, looks, practical, trendy, discreet.
Estilos que representan al usuario (multi-selección): very_casual, casual, smart, elegant, sporty, bohemian, classic, streetwear, rock, punk, emo, gothic, vintage, preppy, artsy, minimalist, undefined, other.
Restricciones (never_*): skirts_dresses, heels, suit, tight, baggy, prints, nothing (exclusivo con los demás), other.
ai_style_profile: texto generado por IA, actualizado por trigger al insertar nuevo análisis en closet_ai_analysis.


items
Prendas del armario.
Categorías (tipo_categoria): camiseta, camisa, pantalon, falda, vestido, chaqueta, abrigo, zapatos, botas, zapatillas, accesorio, jersey, sudadera, mono, shorts, otro.
Parte del cuerpo (body_part): upper_body, lower_body, full_body, feet, accessory, layering.
Fit (fit_type): fitted, slim, regular, oversize, crop, wide_leg, skinny, flare, straight, relaxed, tailored.
Estilo: casual, smart, formal, sporty, bohemian, classic, streetwear, rock, punk, emo, gothic, vintage, preppy, artsy, minimalist.
Clima: weather_warm, weather_cold, weather_versatile (versatile excluye warm y cold; al menos uno debe ser true).
Ocasiones (occasion_*): errands, kids, pet, gym, outdoor_sport, casual_plans, nights_out, special_events, travel, shopping, cultural, volunteering, work, study, home.
Status: available, in_laundry, being_washed, unavailable, inactive. available_from: fecha desde la que vuelve a estar disponible.
Eliminación: soft delete vía is_active = false. Trigger items_count_sync ajusta closets.items_count.
Triggers:

items_count_sync → ajusta items_count en closets al insertar o cambiar is_active.
items_bonus_check → comprueba umbrales de bonus days al insertar.
items_ai_threshold → encola análisis IA en ai_analysis_queue al cruzar umbrales (15, 30, 50, luego cada 25).


outfits
Registro de outfits usados (un outfit por día por closet).

outfit_date: date. Único por (closet_id, outfit_date).
occasions_selected: text[] con al menos 1 elemento.
items_ids: uuid[] con las prendas del outfit.
formality_score: 1–5 calculado.
weather_temp, weather_condition, weather_type.
is_favourite / favourited_at: gestionado por trigger.

Triggers:

outfits_favourited_at → gestiona favourited_at al marcar/desmarcar favorito.
outfits_items_worn → incrementa times_worn y actualiza last_worn_at en cada prenda del outfit al crear el registro.


outfit_rejections
Rechazos de outfits propuestos.

rejection_type: full_outfit | single_item.
rejection_reason: dont_like, item_in_laundry, item_not_found, wrong_occasion, not_in_mood, weather_changed, other.
fed_to_ai: boolean, se pone a true en el siguiente análisis IA del armario.

Trigger outfit_rejections_laundry: si el motivo es item_in_laundry, actualiza automáticamente items.status = 'in_laundry' y calcula available_from = próxima lavadora + 3 días de secado.

outfit_favourites
Outfits favoritos guardados manualmente por el usuario (independiente de outfits).

name: nombre dado por el usuario.
occasion: una ocasión asociada.
items_ids: uuid[].
Clima: igual que en items (al menos uno, versatile exclusivo).


ai_analysis_queue
Cola de trabajos de análisis IA procesados por Vercel.

trigger_type: threshold_15, threshold_30, threshold_50, threshold_every_25, manual.
status: pending, processing, completed, failed.


closet_ai_analysis
Resultados de los análisis IA del armario.

Máximo 5 análisis por armario (el más antiguo se elimina al insertar el 6.º).
is_current: solo uno por armario. Gestionado por trigger.
Campos de resultado: style_profile, dominant_styles, dominant_colors, dominant_items, formality_tendency, avoid_patterns, rejection_patterns, ai_raw_response.

Trigger closet_ai_analysis_on_insert:

Marca análisis anteriores del armario como is_current = false.
Marca el nuevo como is_current = true.
Elimina el más antiguo si hay más de 5.
Marca todos los outfit_rejections.fed_to_ai = true del usuario.
Actualiza routine_style.ai_style_profile con el nuevo perfil.


4. Reglas de negocio clave

Un outfit por día por closet. Constraint UNIQUE en (closet_id, outfit_date).
Soft delete en prendas. Nunca se borran físicamente; is_active = false.
weather_versatile es exclusivo de weather_warm y weather_cold.
never_nothing es exclusivo de cualquier otra restricción de estilo.
Prioridades de estilo: o todas definidas (1–5 distintos) o todas null.
style_other_notes solo si style_other = true. Mismo patrón en never_other_notes y activity_other_notes.
has_uniform = true implica que todos los campos de estilo laboral son false.
Laundry flow: rechazo por item_in_laundry → trigger calcula próxima lavadora según closets.laundry_day + 3 días de secado → actualiza items.status y available_from.
Análisis IA: se encola automáticamente al cruzar 15, 30, 50 prendas y luego cada 25. Vercel lo procesa de forma asíncrona.


5. Suscripción y trial

Trial: 15 días + hasta 16 días de bonus por añadir prendas.
Tiers: basic (1 armario), standard (2), gold (3), premium (4).
Proveedores: stripe (web), apple_iap (iOS), google_play (Android).
Estados del perfil: trial_active → trial_expired → subscribed → subscription_expired / lifetime.


6. Integraciones externas
ServicioUsoClaude API (Anthropic)Análisis de prendas al añadirlas, generación de outfits, análisis periódico del armarioSupabase StorageImágenes de prendas (front, back, versión limpia sin fondo)Zalando / Shein APIBúsqueda de ropa en "¿Necesitas ropa?"StripeSuscripciones webApple IAPSuscripciones iOSGoogle Play BillingSuscripciones AndroidVercel CronProcesamiento de ai_analysis_queue

7. RLS — Patrón general
Todas las tablas tienen RLS activado. El patrón es:

Tablas con user_id directo: auth.uid() = user_id.
Tablas sin user_id (ej. routine_work, routine_style): lookup a closets.user_id → auth.uid() = (select user_id from closets where id = closet_id).


8. Convenciones de código

Idioma del código: inglés (nombres de tablas, columnas, funciones, variables).
Idioma de la UI: español (textos visibles al usuario, mensajes de error).
Eliminación: siempre soft delete (is_active = false), nunca DELETE físico en items.
Triggers en Supabase: PL/pgSQL, security definer para los que necesitan acceso cross-table.
JSON de respuesta IA: siempre guardar el raw en ai_raw_response (jsonb) además de los campos parseados.


9. Pendiente / Por definir

Flujo completo de "¿Necesitas la maleta?" (viajes).
Pantalla "Tu suscripción" y gestión del ciclo de vida de la suscripción en la UI.
Pantalla "Tu rutina" con edición de preferencias post-onboarding.
Definición de style_weights (tabla referenciada en el trigger de formality_score pero no incluida en el esquema actual).
Lógica exacta de generación del outfit (prompt a Claude, parámetros de contexto, manejo de prendas no disponibles).