

## Flujo de autenticación
graph
LOGIN
  → credenciales incorrectas: mostrar toast error, permanecer en login
  → email no confirmado: reenviar OTP → /verify
  → ok + onboarding_completed=false → /onboarding
  → ok + onboarding_completed=true + clothes_total=0 → /add-items
  → ok + onboarding_completed=true + clothes_total>0 → /dashboard

REGISTRO
  → error validación: indicadores en tiempo real, botón desactivado
  → ok → /verify

VERIFY
  → código incorrecto: toast error, permanecer en verify
  → ok → /onboarding

## Flujo de onboarding
ONBOARDING (11 pasos, guardado solo al final)
  → completa paso 11 + guardado ok → /add-items
  → error guardado: toast error, permanecer en onboarding

## Flujo principal
DASHBOARD
  → ¿Nos vestimos? → genera outfit → /outfit-day
  → ¿Necesitas la maleta? → /travel (pendiente)
  → menú → /add-items | /remove-items | /outfits | /shopping | /routine | /subscription