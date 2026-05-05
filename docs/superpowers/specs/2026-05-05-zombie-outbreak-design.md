# Zombie Outbreak MVP Design

## Purpose

Build a web-based isometric zombie outbreak simulation set in one small neighborhood. The first playable version prioritizes emergent simulation over polished art: people, dogs, and zombies perceive each other, react to sounds, form groups, spread panic, attack, feed, die, and reanimate under simple readable rules.

The MVP should feel like a small zombie movie playing out in a toy-sized town. The user can watch the outbreak unfold, adjust simulation parameters, possess any entity, and inspect what happened at the end.

## Design Approach

Use a sim-first MVP with graybox visuals. Every core system is included at shallow depth, with richer variants deferred to the backlog. This keeps the fun interactions intact while avoiding deep sub-systems before the loop is playable.

Alternatives considered:

- Vertical-slice polish: better looking early, but delays the emergent behavior.
- Tooling-first: useful for map generation and sprite pipelines later, but too slow for proving the game.

## Scope

The MVP is a handcrafted 30x30 isometric neighborhood with exterior-only houses, streets, trees, grass, cars, fenced yards, and a few house variants. Buildings do not have interiors yet. The map wraps at the edges with a hard teleport: north to south, south to north, east to west, and west to east.

The game starts from a preset-first modal with advanced tuning controls. The simulation ends when all zombies are killed, or when no living uninfected humans or dogs remain.

## World And Movement

The world uses a hybrid movement model:

- Simulation state is tile-based.
- Characters animate smoothly between tile centers.
- Roads, grass, fences, yards, cars, trees, and houses affect movement and visibility.
- Roads are faster, grass is normal, and fences restrict movement except through gates or valid openings.
- Houses, fences, cars, and trees block or partially block line of sight.
- Any agent that fails to path for a short period uses a stuck fallback: repath to a nearby reachable tile, shuffle, or choose a new nearby goal.

For the MVP, edge wrapping is a hard teleport. Seamless wrap rendering is a later TODO.

## Camera And Controls

The camera supports free panning through mouse-edge scrolling. A follow-selected mode can keep the camera centered on the selected or possessed entity.

Clicking a human, dog, or zombie directly possesses it. Possessed entities stop autonomous AI and respond to WASD movement until deselected or another entity is selected.

Simulation time controls include pause, 1x, 2x, 4x, and optionally 8x if performance allows. This lets the user speed through quiet periods or local-minimum states.

## Start Modal

The start modal offers named scenario presets first, then advanced sliders.

Presets:

- Dawn of the Dead: lower starting zombie count and quieter initial conditions.
- Don't Mess with Texas: higher armed-human percentage and stronger resistance.
- The Tenderloin: chaotic collapse setup with more zombies, more panic, and harsher tuning.

Advanced controls:

- Human count
- Dog count
- Zombie count
- Zombie movement speed
- Armed human percentage
- Turning delay
- HP and bite damage
- Infection decline rate
- Hearing multiplier
- Gun accuracy
- Noise volume multiplier
- Meat depletion rate

## Entities

MVP entities:

- Male adult human
- Female adult human
- Dog
- Human zombie
- Dog zombie
- Downed body/corpse
- Skeleton

Graybox sprites and placeholder tiles come first. GPT-image-2 sprite sheets are deferred until the simulation feels good.

Names:

- Humans and dogs use curated name lists.
- Human survivor groups use templated funny names, such as "The <Adjective> <Noun>", "<Street Name> Watch", or "The Last <Plural Noun>".
- Dogs inherit the affiliation name of their owner.
- Zombies are named "Undead <former name>" and have the affiliation "The Horde".

## Perception

Perception has two main channels: hearing and sight.

Hearing:

- Hearing is circular.
- Sound events radiate outward by type and volume.
- Dogs have larger hearing radii than humans.
- Dog zombies retain a diminished version of dog hearing.
- Human zombies have diminished human hearing.

Sight:

- Sight is a directional vision cone.
- Humans have narrower vision cones.
- Dogs have wider vision cones due to eye placement.
- Dog zombies retain a diminished dog-like vision cone.
- Human zombies have diminished human-like vision.
- Vision checks account for range, facing, and line-of-sight blockers.

Agents keep short-term stimulus memory. Last seen or heard threats decay over time, allowing investigation, fleeing, or pursuit to continue briefly after a stimulus disappears.

## Noise Events

Noise events are typed, positioned, and have a radius determined by volume. Different species and states react differently to the same sound.

Noise examples:

- Gunshot: loud, long radius, escalates zombie attention.
- Scream: loud, panic-driven, attracts zombies and alerts humans.
- Bark: loud, alerts humans and attracts zombies.
- Panicked speech: variable radius.
- Calm speech: small radius.
- Zombie growl: smaller radius.
- Feeding: smaller to medium radius, but repeated while feeding.
- Struggle sounds: small to medium radius.

Gunfire explicitly creates escalation: shooting may solve the immediate problem while drawing more zombies toward the area.

## Behavior States

Entities use light behavior states rather than deep personality systems.

Common states:

- Calm
- Alerted
- Investigating sound
- Fleeing
- Attacking
- Infected
- Downed
- Turning
- Feeding
- Stuck/repathing

Panic is a state modifier for humans. Panic can be triggered by seeing zombies, corpses, skeletons, feeding, nearby gunfire, dog attacks, or other panicked humans. Panic increases running behavior, scream chance, poor aim, and group splitting.

## Humans

Humans can be unarmed or armed with guns. Armed humans who see zombies can shoot, with moderate lethality, misses, and noise. Gun accuracy is tunable.

Humans who have seen a zombie can warn other humans. The conversation transfers danger awareness and can generate noise:

- Calm humans talk quietly.
- Panicked humans may shout.

Human groups:

- Humans use loose flocking to stay near allies.
- Groups share simple goals: move away from known danger, move toward allies, and drift toward armed humans.
- Armed humans become group leaders.
- If groups merge, an armed leader from the larger group wins leadership.
- If only one merging group has an armed human, that armed human leads.
- Groups are shown with a single-pixel outline around members, using different colors from a readable palette.

Selected humans show their name and survivor group in a title/status block.

## Dogs

Dogs are assigned to a human at start or attach to the first suitable human they encounter. Dogs follow their owner, bark at threats, flee or chase based on state, and can be infected or turned.

If the owner dies, a dog may:

- Stay near the body.
- Attach to the next living human it sees.
- Be killed by a horde.
- Be turned if the former owner reanimates nearby.

Dogs have HP, infection state, turning timer, and meat meter. Dogs inherit their owner's affiliation name.

Dogs have wider vision cones and larger hearing radii than humans. Dog zombies retain diminished versions of those sensory advantages.

## Zombies And Hordes

Zombies do not use explicit groups, leaders, or squads. Hordes emerge from shared attraction to stimuli.

Zombie behavior:

- Chase visible living targets.
- Investigate heard sounds.
- Feed on downed bodies.
- Growl and create smaller sound events.
- Shuffle randomly if no stimulus is visible or audible.

Zombie clustering emerges because gunshots, screams, barking, feeding, and growling pull multiple zombies toward the same place. Feeding zombies can attract more zombies, which can create horde-like behavior without a formal leadership system.

All zombies use the affiliation label "The Horde".

## HP, Infection, Feeding, And Reanimation

Humans and dogs have HP. Zombie bites deal damage and guarantee infection. A bitten victim can escape and continue moving, but infection drains them over time. Repeated bites can kill them before infection does.

Downed infected bodies have:

- A turning timer.
- A meat meter.

If the turning timer finishes before the meat meter reaches zero, the body reanimates as a zombie. If feeding depletes the meat meter first, the body becomes a skeleton and never reanimates.

Zombies feed for a behavioral delay. Any zombie that sees a downed body can join feeding. Feeding distracts zombies from pursuit but emits noise, which can attract more zombies.

## UI And Overlays

Default UI:

- Start modal with presets and advanced controls.
- Title/status block showing selected character name and affiliation.
- Time controls for pause and speed.
- Selected-character vision cone and hearing radius.
- Selected-character group/leader/follow relationship where applicable.

Debug UI:

- Toggle all vision cones and hearing circles.
- Toggle all group outlines, leaders, dog attachments, and alert states.
- Show entity state labels or inspect panel when useful for tuning.

## End Modal

The game ends when all zombies are killed, or when no living uninfected humans or dogs remain. A survivor loss can happen through reanimation, death, or skeletonization.

The end modal shows:

- Winner/outcome
- Elapsed time
- Survivors
- Zombies killed
- Humans turned
- Dogs turned
- Skeletons created
- First infected
- Loudest event
- Biggest horde
- Best shot
- Longest survivor
- Notable dog moment if inferable
- Simple bar chart or histogram of zombie population over time

## Visual Direction

The final art direction is retro 16-bit isometric, with a 90s arcade pixel-art influence similar to Metal Slug: expressive silhouettes, chunky outlines, detailed animation poses, readable motion, and grimy-but-fun horror energy.

For MVP implementation, use graybox placeholders first. GPT-image-2 sprite sheets and environmental assets come later once the simulation is playable.

## GPT-Image-2 Asset TODO

Later generate:

- Male human sprite sheet
- Female human sprite sheet
- Dog sprite sheet
- Human zombie variants
- Dog zombie variants
- Corpse states
- Skeleton
- Grass, streets, sidewalks, fences, yards
- Cars, trees, houses, gates, and props

Use palette swaps to create variety in humans and zombies. Keep animation sheets consistent in camera angle, scale, frame count, anchor point, and lighting.

## Future Backlog

- Carcassonne-style procedural macro-tile map generation with typed matching edges.
- Seamless wrap rendering with duplicated edge bands.
- Individual traits: bravery, panic, accuracy, hearing, speed, dog temperament.
- Partially eaten zombie sprites and movement penalties.
- Full house interiors.
- Barricading and sheltering.
- Ammo and reloads.
- Morale and courage systems.
- Bites vs. scratches.
- Fire, alarms, car horns, and other noise generators.
- Richer corpse discovery reactions.
- Day/night and visibility changes.
- Safe zones or extraction objectives.
- More group politics and survivor behaviors.
- Richer charts and timelines.
- Better audio layering, falloff, and occlusion.
- More species, age, and body variants.

## Testing Strategy

Start with deterministic simulation tests where possible:

- Tile wrapping moves entities to the opposite edge.
- Hearing detects circular sound radius correctly.
- Vision detects cone targets and respects blockers.
- Zombie bite applies damage and infection.
- Infection decline eventually downs a victim.
- Turning timer creates a zombie if meat remains.
- Feeding depletes meat and creates skeletons if meat reaches zero first.
- Noise events attract zombies within range.
- Humans warn nearby humans and form groups.
- Armed leadership resolves correctly when groups merge.
- Dogs follow owners and handle owner death.
- End-state detection fires for zombie victory and survivor victory.

Manual/browser verification should cover:

- Start modal presets and sliders.
- Camera edge-scroll and follow-selected mode.
- Direct possession with WASD.
- Overlay readability.
- Time controls.
- End modal facts and zombie population histogram.

## Open Decisions

No blocking design decisions remain before implementation planning. Values such as exact tile size, frame rate, HP numbers, sound radii, and preset counts should be selected during implementation and tuned through testing.
