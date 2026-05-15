# Beat Blader Clone - Project Context

## Qué es esto
MVP de un juego rhythm-action en 3D para iPhone (empaquetado con Capacitor).
El jugador corre por un túnel 3D, corta cubos azules al ritmo de la música,
esquiva obstáculos rojos. Score + combo + barra de progreso.

## Stack
- Vite (bundler)
- Three.js (rendering 3D)
- Tone.js (audio + timing preciso)
- Capacitor (empaquetado iOS)
- Vanilla JavaScript (sin React, sin TypeScript)

## Estructura de archivos
```
src/
  main.js        → entry point, init de todo, render loop
  game.js        → estados (menu/loading/playing/gameover/gamewin/paused) + screens
  tunnel.js      → túnel 3D infinito (pool de segmentos reciclados)
  player.js      → personaje + controles teclado/touch
  obstacles.js   → spawner pool de cubos azules y púas rojas
  beatmap.js     → loader + parser del JSON, look-ahead para spawnear notas
  audio.js       → reproducción con Tone.js + fallback metrónomo 120 BPM
  collisions.js  → detección hit/miss, score, combo, vidas
  ui.js          → HUD HTML overlay (score, combo, barra, vidas, FPS)
  effects.js     → partículas, screen shake, flash
  haptics.js     → wrapper Capacitor Haptics + fallback navigator.vibrate
  events.js      → tiny event bus (on/emit)
  state.js       → estado mutable compartido del juego
  constants.js   → TUNNEL_SPEED, lanes, colores, etc.
  style.css      → estilos del HUD y pantallas

public/
  songs/         → archivos .mp3 (vacío por ahora — fallback metrónomo)
  beatmaps/      → song1.json con timestamps

capacitor.config.json → config para empaquetado iOS
```

## Convenciones
- Código en inglés, comentarios en español rioplatense (con voseo)
- Funciones cortas, una responsabilidad por archivo
- Console.log generoso mientras desarrollamos
- Después de cada cambio importante, decime QUÉ debería ver al recargar el browser
- Si algo no funciona, NO inventes solución mágica: agregá logs y pedíme que pruebe paso a paso

## Estado del proyecto
- [x] Prompt 0 — Setup Vite + deps + estructura
- [x] Prompt 1 — Túnel 3D infinito
- [x] Prompt 2 — Personaje + controles teclado/touch
- [x] Prompt 3 — Spawner de obstáculos (pool)
- [x] Prompt 4 — Audio con Tone.js + fallback metrónomo
- [x] Prompt 5 — Beatmap JSON con look-ahead
- [x] Prompt 6 — Colisiones + score + combo + vidas
- [x] Prompt 7 — UI overlay (HUD)
- [x] Prompt 8 — Estados del juego (menu / gameover / gamewin / pause)
- [x] Prompt 9 — Polish (partículas, shake, haptics, pausa, retry con R)
- [x] Prompt 10 — Capacitor config (lista para `npx cap add ios` en Mac)
- [ ] Prompt 11 — Build en Xcode (lo corrés vos en tu Mac)

## Cómo correr en desarrollo
```bash
npm install        # primera vez
npm run dev        # abrí http://localhost:5173
npm run build      # output a dist/
npm run preview    # serve el build de producción
```

## Build iOS (en Mac con Xcode)
```bash
npm run build
npx cap add ios       # primera vez, crea ios/App
npx cap sync ios
npx cap open ios      # abre Xcode
```
En Xcode: Signing & Capabilities → tu Apple ID → Bundle ID único → ▶.

## Música
Por ahora no hay `public/songs/song1.mp3`, así que el juego usa un metrónomo
a 120 BPM con Tone.js como fallback. El beatmap está sincronizado a ese BPM.
Cuando tengas el .mp3 generado con Suno, poneélo ahí y regenerás el beatmap.

## NO hacer todavía
- No agregar menús complicados
- No agregar skins ni personalización
- No agregar múltiples canciones (una sola por ahora)
- No optimizar para mobile todavía (primero que funcione)
- No agregar sound effects (solo música)
