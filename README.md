# Midknight Rooftop Rush

A browser playtest starring Midknight, a fluffy black tuxedo cat, running across a moonlit rooftop district.

**[Play in your browser](https://carlosgotiong.github.io/midknight-rooftop-rush/)**

No installation, account or API key is needed to play. Desktop keyboard and mobile touch controls are supported. The game requires WebGL.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | Left/right arrows or A/D | Swipe left/right |
| Jump | Space, Up or W; release for a short hop | Swipe up or tap |
| Crouch / fast drop | Down or S | Swipe down |
| Moon Pounce | Jump again in the air, Shift or E | Pounce button |
| Pause | P or Escape | Pause button |

Collect gold, follow ramps onto raised roof sections, chain clean tricks and catch three Moon Gates to awaken a district. Moon Pounce spends a recharging moonlight charge and briefly lets you pass through obstacles.

## Run locally

With Node.js 20 or newer:

```sh
npm start
```

Open http://127.0.0.1:4173. There are no dependencies to install. For the automated gameplay and movement checks, run `npm test`.

## What this build includes

- Elevated rooftops, short service bridges, ventilation obstacles, water towers and raised roof routes.
- A straight rear-facing Midknight sprite with an entirely black tail and padded animation frames.
- Fixed 120 Hz movement physics: gravity, variable-height jumping, buffered inputs, coyote time and spring-based lane changes.
- Damped springs for the tail, separate ears, body compression and body twist, reacting to takeoff, turns, pounces and landing impacts.
- Local personal-best storage. No backend, analytics or external runtime requests.

## Playtest notes

This is a stylized browser prototype using animated sprites in a 3D environment, not a fully rigged AAA production character. Sprite pose blending and rear-only perspective remain limitations. The body has two clearly visible hind paws; forepaws are mostly occluded from this camera angle.

Automated gameplay and spring-motion checks pass. Browser automation was blocked by a local permission-check failure during development, so full visual playtesting across devices is still needed. Please report animation artifacts, clipping, collision problems and performance issues through this repository's Issues tab, with device/browser details and a short recording if possible.

The `.openai` hosting configuration, private source history, credentials and unrelated workspace files are intentionally absent from this public export.

## Credits

Character and branding: Midknight Studio Labs, based on the supplied mascot reference. Character artwork was generated and edited with AI; the padded atlas and real-time animation code are included here. Rendering uses Three.js r170, under the MIT license; see `THREE-LICENSE.txt`.
