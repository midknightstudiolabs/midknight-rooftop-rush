# Midknight Rooftop Rush

A browser playtest starring Midknight, a fluffy black tuxedo cat, exploring a reactive moonlit rooftop district. Version 0.14 separates forward travel from slow motion: Speedster now genuinely accelerates Midknight while the city’s animated hazards slow down.

**[Play in your browser](https://midknightstudiolabs.github.io/midknight-rooftop-rush/)**

No installation, account or API key is needed to play. Desktop keyboard and mobile touch controls are supported. The game requires WebGL.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | Left/right arrows or A/D | Swipe left/right or Left/Right buttons |
| Jump | Space, Up or W; release for a short hop | Swipe up or tap |
| Crouch / fast drop | Down or S | Swipe down |
| Moon Pounce | Jump again in the air, Shift or E | Pounce button |
| Nitro | Hold N; release to coast | Hold the Nitro button |
| Choose a high route | Steer onto a gold ramp | Swipe into the ramp lane |
| Pause | P or Escape | Pause button |

Collect gold, follow ramps onto raised roof sections, chain clean tricks and catch three Moon Gates to awaken a district. Moon Pounce spends a recharging moonlight charge and briefly protects against smoke. Solid objects always stop the run.

## Run locally

With Node.js 20 or newer:

```sh
npm start
```

Open http://127.0.0.1:4173. There are no dependencies to install. For the automated gameplay and movement checks, run `npm test`.

## What this build includes

- A stationary skyline and camera, with local curved roof geometry instead of world bending, camera bob, jump tracking or Rush zoom. The viewport is fitted once on resize to keep all lanes visible on phones.
- Baseline pace starts at 12 m/s and gradually caps at 16 m/s. Broad bends move the roof centerline at most 1.1 m; camera rotation and FOV never follow them. Geometry, steering, pickups and gap support share the same route coordinates. Distant buildings are stationary, dimmer and drawn in batches; repeated floor stripes and passing lamps are removed.
- Hard collisions stop the world immediately, squash Midknight into a flat liquid-cat pose, then show the restart screen. Rush, shields and pounces cannot pass through solid obstacles.
- Manual Nitro reaches 1.75× normal travel speed (21–28 m/s) with gradual acceleration and deceleration. Fuel starts at 60%, refills from gold and tricks, and drains at 28% per real second on roofs and in the air. Airborne speed stays steady for predictable landings. The camera and FOV remain fixed.
- Speedster eases environmental animation to 18% time with up to 2.3× stride playback, on top of the existing speed-based cadence (about 3× the ordinary stride at full boost). Moving hazards, smoke, particles and rivals slow down; player travel and vertical physics use real time to preserve landing distances. Steering responds 35% faster and fuel drains in real time. Release eases the world back to normal; pause, crashes and restart clear the effect. Longer gold ribbons accompany the cat without flashes, zoom or screen effects.
- Eight encounter types: chimney smoke, three-way pounce forks, opening shutters, pigeon-triggered falling pots, crumbling roof tiles, laundry lines, rival races and raised shortcuts.
- Route choices happen through steering and jumping, without a landing dialog or automatic slowdown.
- Split skybridges, missing roof sections, offset connections and narrow center bridges create physical route choices. Full-width junctions let players change paths between splits. Walking into a gap causes a fall; a clear lit roof remains reachable.
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

Automated gameplay, spring-motion, encounter and terrain checks pass. Tests cover continuous route traversal, roof gaps and jumps, manual Nitro input and depletion, safe release on pause, fork ramps across the current 12–28 m/s speed range, hard-impact stops and fixed camera framing. Browser automation was blocked by a local permission-check failure during development, so GPU rendering and visual playtesting across devices remain unverified. Please report animation artifacts, clipping, collision problems and performance issues through this repository's Issues tab, with device/browser details and a short recording if possible.

The `.openai` hosting configuration, private source history, credentials and unrelated workspace files are intentionally absent from this public export.

## Credits

Character and branding: Midknight Studio Labs, based on the supplied mascot reference. Character artwork was generated and edited with AI; the padded atlas and real-time animation code are included here. Rendering uses Three.js r170, under the MIT license; see `THREE-LICENSE.txt`.
