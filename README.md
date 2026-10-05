# Midknight Rooftop Rush

A browser playtest starring Midknight, a fluffy black tuxedo cat, exploring a reactive moonlit rooftop district. Version 0.9 introduces the Living City encounters.

**[Play in your browser](https://midknightstudiolabs.github.io/midknight-rooftop-rush/)**

No installation, account or API key is needed to play. Desktop keyboard and mobile touch controls are supported. The game requires WebGL.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | Left/right arrows or A/D | Swipe left/right |
| Jump | Space, Up or W; release for a short hop | Swipe up or tap |
| Crouch / fast drop | Down or S | Swipe down |
| Moon Pounce | Jump again in the air, Shift or E | Pounce button |
| Aim at a rooftop fork | Hold Shift / E or jump; choose with left/right, release to leap | Hold Pounce, then tap a landing card |
| Pause | P or Escape | Pause button |

Collect gold, follow ramps onto raised roof sections, chain clean tricks and catch three Moon Gates to awaken a district. Moon Pounce spends a recharging moonlight charge and briefly lets you pass through obstacles.

## Run locally

With Node.js 20 or newer:

```sh
npm start
```

Open http://127.0.0.1:4173. There are no dependencies to install. For the automated gameplay and movement checks, run `npm test`.

## What this build includes

- A continuous curved skyline, banking streets and raised corner shortcuts, with shared rendering and collision coordinates at the player.
- Eight encounter types: chimney smoke, three-way pounce forks, opening shutters, pigeon-triggered falling pots, crumbling roof tiles, laundry lines, rival races and corner shortcuts.
- Cat Instinct: a three-second aiming window with slow motion, three landing choices, ballistic jumps and rewards based on the route selected.
- High roofs, a safe bridge route and narrow bonus perches; ramp launch velocity adapts to running speed.
- Telegraphs and sound cues before hazards activate. Smoke stays local to its chimney; no full-screen flashes.
- Night Cat races won by collecting gold and landing tricks; an encounter deck shuffles after every complete cycle.
- Short recovery sections between encounters, bounded prop/particle lifetimes and restart cleanup.
- Elevated rooftops, short service bridges, ventilation obstacles, water towers and raised roof routes.
- A straight rear-facing Midknight sprite with an entirely black tail and padded animation frames.
- Fixed 120 Hz movement physics: gravity, variable-height jumping, buffered inputs, coyote time and spring-based lane changes.
- Damped springs for the tail, separate ears, body compression and body twist, reacting to takeoff, turns, pounces and landing impacts.
- Local personal-best storage. No backend or analytics. Game code and artwork are local; optional typefaces load from Google Fonts with system-font fallbacks.

## Playtest notes

This is a stylized browser prototype using animated sprites in a 3D environment, not a fully rigged AAA production character. Sprite pose blending and rear-only perspective remain limitations. The body has two clearly visible hind paws; forepaws are mostly occluded from this camera angle.

Automated gameplay, spring-motion and encounter checks pass. The encounter suite covers safe routes, chimney timing, crouching under shutters, triggered pigeons, all pounce landing options, aiming timeout, route ramps at 16–40 m/s, race outcomes and bounded cleanup. Browser automation was blocked by a local permission-check failure during development, so GPU rendering and visual playtesting across devices remain unverified. Please report animation artifacts, clipping, collision problems and performance issues through this repository's Issues tab, with device/browser details and a short recording if possible.

The `.openai` hosting configuration, private source history, credentials and unrelated workspace files are intentionally absent from this public export.

## Credits

Character and branding: Midknight Studio Labs, based on the supplied mascot reference. Character artwork was generated and edited with AI; the padded atlas and real-time animation code are included here. Rendering uses Three.js r170, under the MIT license; see `THREE-LICENSE.txt`.
