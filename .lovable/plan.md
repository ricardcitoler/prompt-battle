
# Plan: The Disruptive Show — Batalla de Prompts

App de votación tipo "VS" con registro ligero, votación por rondas, panel admin y dashboard en tiempo real. Backend con Lovable Cloud.

## Decisiones confirmadas
- Contraseña admin compartida: `LearningHeroesToTheMoon-1` (guardada como secret `ADMIN_PASSWORD`).
- Solo una batalla activa a la vez.
- Logos subidos: `logo.svg` (LEARNING HEROES, cian) para el dashboard, `dr-logo.png` (THE DISRUPTIVE SHOW) para la zona de votación.

## Flujo de usuario
1. **/** Registro (nombre + email). Botón "Acceder como admin" arriba a la izquierda. Guarda `userId` y `userEmail` en localStorage.
2. Tras registro: busca la batalla activa y redirige a `/{slug}` (ej. `jordi-segues-vs-cesar-de-pablos`). Si no hay activa → mensaje "No hay batalla activa por ahora".
3. **/{slug}** Pantalla VS: fotos + nombres + descripciones + botón "Votar".
4. Al votar: Round N con foto e input 1–10 para cada participante, botones "Regresar" y "Enviar voto". Avanza ronda a ronda hasta completar.
5. Al terminar: pantalla "Ya votaste en las N rondas".
6. **/dashboard/{slug}** Resultados en tiempo real (Supabase Realtime sobre `votes`).
7. **/admin** Login por contraseña → panel CRUD de batallas.

## Modelo de datos
```text
users         id, name, email (unique), created_at
battles       id, slug (unique), title, num_rounds, is_active, created_at
participants  id, battle_id, name, description, image_url, position (1|2)
votes         id, battle_id, user_id, round_number, participant_id, score (1-10)
              unique(user_id, battle_id, round_number, participant_id)
```
- Solo una `battles.is_active = true` (enforced en server fn admin: desactivar el resto al activar una).
- RLS: lectura pública en `battles` y `participants`. `votes` insert público con validación server-side. Escrituras admin solo vía server fn con `ADMIN_PASSWORD`.
- Storage bucket público `participant-images`.

## Rutas
```text
src/routes/
  index.tsx              Registro + botón admin
  $slug.tsx              Pantalla VS + flujo de rondas + pantalla final
  dashboard.$slug.tsx    Dashboard tiempo real
  admin.tsx              Login admin (contraseña)
  admin.panel.tsx        Lista de batallas + crear/activar/borrar
  admin.battle.$id.tsx   Edición: título, nº rondas, 2 participantes (imagen subida)
```
Sesión admin = token en localStorage validado vía server fn en cada acción mutante.

## Server functions
- `registerUser({name,email})` upsert por email → `{userId}`
- `getActiveBattle()` batalla activa con participantes (o null)
- `getBattleBySlug(slug)` batalla + participantes
- `getUserVotes({battleId,userId})` rondas ya votadas
- `submitRoundVote({battleId,userId,roundNumber,scores:[{participantId,score}]})` zod 1–10, evita duplicados
- `getDashboard(slug)` agregados: por ronda promedios y ganador, promedio total y ganador final, total de votos, lista detallada
- Admin (con `password`): `adminLogin`, `listBattles`, `createBattle`, `updateBattle`, `activateBattle`, `deleteBattle`, `uploadParticipantImage`

## Realtime
Dashboard: `supabase.channel().on('postgres_changes', { table: 'votes', filter: battle_id=eq.X })` invalida la query de `getDashboard`.

## Diseño
- Zona votación (`/`, `/{slug}`): fondo púrpura degradado (#5B21B6 → #4C1D95), bloques verde lima (#84F542) decorativos, header con `dr-logo.png` centrado, tipografía bold sans, botones blancos pill con texto oscuro. Acento verde lima para títulos de round.
- Dashboard: fondo casi negro (#0F0F10), tarjetas grises oscuras, acentos dorado (#E9B949) para títulos/promedios/ganadores, `logo.svg` cian arriba izquierda.
- Tokens en `src/styles.css` con dos paletas (show + dashboard) y modo oscuro por defecto en dashboard.

## Detalles
- Slug autogenerado al guardar batalla: `slugify(p1.name)-vs-slugify(p2.name)`.
- Validación zod en todas las server fn; mensajes de error claros en UI con toast.
- Subida de imágenes admin → Supabase Storage (server fn con service role) → URL pública guardada en `participants.image_url`.
- Si el usuario ya votó todas las rondas y entra de nuevo a `/{slug}`: ir directo a la pantalla final.

## Pasos de implementación
1. Activar Lovable Cloud, crear tablas + RLS + bucket, añadir secret `ADMIN_PASSWORD`.
2. Tokens de diseño + subir logos como assets.
3. Server functions (registro, batalla, voto, dashboard, admin).
4. Rutas: index (registro + admin button), `$slug` (VS + rondas + final), `dashboard.$slug`, `admin`, `admin.panel`, `admin.battle.$id`.
5. Realtime en dashboard.
6. Seed opcional de una batalla de ejemplo desde el panel admin.
