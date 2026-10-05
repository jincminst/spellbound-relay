# Spellbound // Arena

A first-person Three.js spell-combat game with a cooperative campaign, PvP rooms, configurable AI simulations, procedural arenas, destructible environments, and a stage-specific CC0 soundtrack.

## Source layout

The browser entry point in `src/main.js` owns the live scene and coordinates gameplay systems. Supporting code is separated by responsibility:

- `src/audio/` — synthesized sound effects and streamed music lifecycle
- `src/config/` — immutable maps, campaign, combat, difficulty, and soundtrack data
- `src/core/` — deterministic and secure world-seed utilities
- `src/maps/` — normal, PvP, simulation, and Endless arena generation
- `src/network/` — room-code, relay-address, and LAN invite-link utilities
- `src/rendering/` — Three.js resource disposal and rendering utilities

`server.js` is the room-aware WebSocket relay, while `vite.config.js` owns browser serving, LAN discovery, and the same-origin relay proxy. New systems should be added to their own module instead of expanding the entry point.

## Run it

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Vite serves the game on port `5173`; the room-aware WebSocket relay uses port `8080`. Other devices on the local network must use the host computer's LAN address instead of `localhost`.

## Controls

| Input | Action |
| --- | --- |
| `W A S D` | Move |
| `Shift + W A S D` | Sprint |
| `Ctrl` | Crouch |
| Space | Jump |
| Mouse | Look and steer Missile Barrage |
| Mouse wheel / `1`–`6` | Select an ability |
| `Q` / `F` / `C` / `E` / `R` / `X` | Select Quake, Fog, Lightning Cell, Fireball, Sword, or Missiles |
| Left click | Cast the selected ability |
| `T` | Interact with a nearby campaign objective, or pick up a small broken chunk |
| Hold/release left click with debris | Charge and throw the chunk |
| Right click | Toggle the shield in campaign or joined simulations |
| `M` | Mute or unmute music and effects |

PvP disables shields. Spectators cannot cast, shield, or hold weapons. The five-second simulation countdown still allows the observing or participating player to move.

## Combat rules

- Fireball deals direct damage, ignites flammable terrain and objects, and has a `0.8 s` base cooldown.
- Missile Barrage launches six steerable missiles. Each missile deals `12` direct damage and creates blast damage, knockback, rubble, dust, and fire.
- Lightning Cell requires a visible target under the crosshair. A successful hit deals initial and tick damage and anchors the target for `2.8 s`; walls and a timely dodge stop it.
- Fog Area creates a dense visibility volume that shortens AI sight.
- Earthquake Smash deals radial damage and strong radial knockback.
- Sword deals `8` base damage with a `0.45 s` swing interval. Its close-range quarter-ellipse swing can damage enemies, crystals, and small broken boundary chunks, but it does not mark or deform terrain.
- Projectiles travel without gravity. Thrown debris uses gravity and gains speed, damage, and knockback while the throw is charged.
- Player health begins regenerating six seconds after the last health hit at two health per second. A successful player shield block restores two health; AI shield blocks restore six.
- A lowered, unbroken shield regenerates at `12` capacity per second. A broken shield takes `7.5 s` to reform. The tower upgrade raises maximum shield capacity from `100` to `150`.

The first tower transition upgrades the player immediately: Fireball and Fog cooldowns shorten, Missile Barrage launches nine missiles, Lightning Cell tick damage increases, Quake becomes stronger, Sword gains range and damage, shield capacity increases, and sprint becomes unlimited throughout the tower.

## Allegiance language

Colors have one consistent meaning in character materials, spell effects, fog, shields, radar markers, and target readouts:

- Green: the local player and connected player allies
- Blue: helper-bot NPC allies
- Red: ordinary opponents
- Purple: the Warden, drones, crystals, and Warden hazards

The HUD uses **Health** consistently. Looking at an ally displays that ally's health and shield; connected-player shield values are synchronized through the room relay. The aggregate allied-health bar includes the local player unless the user is only spectating. The Warden uses a persistent boss bar instead of a crosshair health card.

## Campaign

The campaign uses the original direct combat route:

1. Frostbound — defeat 3 easy enemies
2. Verdant Ruins — defeat 8 normal enemies
3. Obsidian Rift — defeat 15 hard enemies
4. The Tower Approach — breach five entrances in sequence; five optional defense nodes can be sabotaged to destroy a missile drone and reduce later reinforcement counts
5. Tidal Reliquary — breach four defended portal circuits; every redirection spatially inverts the player’s position and summons a new portal-echo squad before the next circuit unlocks
6. Inversion Forge — clear the forge guard, extract three unstable cores under a 24-second rupture timer, and survive the chamber overload and echo attack caused by each seated core
7. Crown Engine — survive a 180-second chamber cycle with three rotating damage beams, two timed nightmare waves, drones, and the existing tower hazards
8. Grand Warden Arena — final boss

Defeating every enemy in each of the first three realms opens the portal to the next map. There are no undercrypt objectives, side quests, realm minibosses, relic hunts, or timed defense phases in those maps.

The Warden Tower keeps its dedicated combat floors, drones, hazards, paired color portals, and exits. In the final arena, guards, three teleporting crystals, and drones must all be destroyed to expose the 5,000-health campaign Warden for twenty seconds. When the window closes, the arena trial reforms and must be cleared again. Defeating the Warden completes the campaign. Simulation Wardens remain at 900 health.

Campaign transitions reset player health, sprint, shield, cooldowns, imprisonment, knockback, and pending attacks. Surviving helper bots keep their health and permanently remain dead if defeated. Exact combat checkpoints preserve the player, surviving actors, destroyed objectives, hazards, cooldowns, and position on the same computer.

## AI and simulation

Enemy difficulty changes sensing, field of view, prediction, accuracy, movement, reaction speed, and casting rhythm. AI respects walls and forward vision rather than using omnidirectional awareness. Combatants coordinate their spacing, retreat and deploy Fog at low health, react to incoming volleys, use shields, avoid holes, and continue attacking while repositioning.

The homepage Simulation mode supports `1–20` blue helper bots, `0–20` red opponents, and `0–3` purple Wardens on any PvP arena. The user may join as a green player or spectate. Simulations run until one side is eliminated, then offer a walkable review mode that preserves the battlefield and defeated bodies.

## Multiplayer

Multiplayer is deliberately account-free: there are no logins, profiles, passwords, or identity service. A fresh room code is the only join credential; callsigns and accessibility preferences remain local to the browser.

The client reports join, synchronization, connected, latency, suspension, and recovery states separately. Dropped room connections retry with capped exponential backoff and rejoin the active stage automatically when the relay returns.

`ENTER THE RIFT` creates a new room code for either cooperative campaign or PvP. PvP supports Frostbound, Verdant Ruins, Obsidian Rift, and the Grand Warden Arena. `JOIN A RIFT` resolves the room's mode, arena, and campaign stage from the code.

The first player in a shared stage is the world authority for bots, crystals, drones, hazards, and boss phases. Authority transfers when that player leaves. Player position, facing, crouch, movement, health, defeat state, and shield state are synchronized with interpolation.

This is a host-authoritative prototype. A public competitive deployment should move hit validation, cooldown enforcement, and world simulation to an authoritative server behind TLS.

Enemy squads use visible roles—Vanguard, Artillery, Jailer, Veil, and Guardian—with different spacing and spell priorities. Their geometry and radar marks differ, so role and allegiance do not depend on color perception.

Every arena has a named environmental rule. Endless grants a permanent run upgrade after every third cleared wave, while enemy roles and hazards unlock progressively. Destruction is localized: attacks punch navigable openings, unsupported sections collapse, settled debris becomes cover, and structural collapse can damage nearby combatants.

Accessibility options are available from the home screen and are stored only on the current device. They include red–green-safe, tritan-safe, and high-separation palettes, reduced motion/flashing, high-contrast HUD text, and a larger HUD.

## Rendering and performance

The game uses physically based materials, biome textures, ACES tone mapping, atmospheric sky shaders, fog, emissive spell effects, articulated 3D character rigs, instanced environment props, capped transient effects, throttled radar and networking, rate-limited shadows, and adaptive render resolution. Hidden tabs suspend rendering, simulation, audio, and networking until they become active again.

Fireballs and missiles fracture constructed walls, trees, rocks, and arena obstacles into physical chunks without boundary health bars. Unsupported fragments fall; small pieces can be picked up and thrown. Missile and Quake impacts deform destructible ground, while an unbreakable bedrock layer limits maximum depth. Sword impacts do not create ground dents or ice cracks.

Sound effects are synthesized locally with Web Audio. Music streams from a curated set of CC0/public-domain tracks, each campaign stage has its own theme, simulations inherit their arena theme, and PvP rotates through a randomized battle playlist. The source and license record is in `public/music/CC0-SOURCES.md`; attribution is not required.
