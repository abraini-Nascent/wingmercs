# Squadron: Mercenaries

## Moonshot goal
Squadron Mercenaries is a thrilling spacefaring epic that blends the adrenaline-pumping space flight combat simulation of 'Wing Commander' with the intricate personnel and material management aspects of 'Mechwarrior Mercenaries.' In this immersive game, players will not only engage in intense dogfights and grand-scale space battles, but they'll also assume the role of a resourceful commander, managing a crew of diverse characters, upgrading and customizing their spacecraft, and navigating a dynamic galaxy filled with contracts, alliances, and political intrigue. With its seamless integration of strategic management and action-packed combat, this game offers a uniquely captivating experience that caters to both die-hard simulation enthusiasts and fans of deep, story-generating gameplay.

## Direct Path 
> What you need to do is make a beeline for your target. With a basic plan and understanding of where to go, you can start with strong fundamentals and then, when you have that fun core game, expand on it all you want! --GridSagaGames
[How to make a roguelike](https://www.gridsagegames.com/blog/2018/10/how-to-make-a-roguelike/)

Our first goal is to build the systems for the core gameplay loop.  Dogfights in space combat that mimic the feel of the original WingCommander series, aiming for the gameplay of the 2.5d era: WC1&2 & Privateer.

### Goal
Rebuild the WC1 arcade/simulator gameplay loop.  
- Fight waves of enemies in an empty field.
- Fight against wave-groups of the same fighter, from waves of 1 to 3 fighters of the same type.
- Reset your plane's damage after clearing a wave group
- Move on to a harder enemy type after clearing a wave group

### Features
We will build out the same space flight and combat features as classic WC

#### Damage Model
- Locational Shields: fore and aft
- Locational Hull: fore, after, port, and starboard
- Locational System: damage to guns, weapons, radar, power plants, engines, thrusters...
- Damaged systems effect the behaviour of the plane.
  - Thrusters: turn speed
  - Engines: max acceleration & cruise speed
  - Power Plant: weapon energy and shield recovery time
  - Shield Gen: max shield value
  - Radar: displaying enemy type, damage, and distance
  - Targeting: if the player can lock onto a target, increase time to get missile lock
  - Guns & Weapons: removes capability to use them
  - Fuel: afterburner fuel 
#### Flight Model
- independent pitch, roll, and yaw rates
- independent acceleration, velocity, and direction
- current speed up to max "cruise" speed of the plane always follows direction of plane
- brake to temporarily slow down to make tighter turns
- "drift" using afterburner slide. Afterburner acceleration and velocity over the speed limit of the plane does not match the direction of the plane
- "drift" by cutting off the lock between direction of the plane and "cruise" speed
#### Customization
- add battery banks for more power storage capacity
- add modifiers for engine, shields, power generator, afterburners, fuel...
- swap guns around on mounts
- swap weapons around on mounts
- stay within a weight limit for the ship and ship category
- move armor thickness around
  0.25 tonnes per cm of armor
the Ferret is a light patrol craft and weighs 10.5 tonnes, with armor of Front 6.5 cm, Rear 6.5 cm, Right 4.5 cm, Left 4.5 cm, for a total of 13cm of armor
  13cm of armor is 3.25 tonnes of armor, leaving 7 tonnes for systems and structure
the Saber is a heavy fighter and weighs 22 tonnes, with armor of Front 20.0 cm, Rear 20.0 cm, Right 18.0 cm, Left 18.0 cm, for a total of 76cm of armor.
the Rapier is a medium fighter and weighs 13.5 tonnes with 7.5, 7.5, 6.5, 6.5 for a total of 28 armor,
  76 cm is 19 tonnes of armor, leaving 3 tonnes left for systems, structure, and weapons.
  if we rebalance for 6 tonnes for bare structure, 1 tonne each for engine, powerplant, shields, 0.5 tonnes for thrusters, radar, guns. 0.25 tonnes for each weapon
  Dirk: 10t for structure and systems. 1t for 2 guns, 3.25t for armor. 14.25 tonnes. 10-15 tonnes for light fighter class
  Rapier: 10t for structure and systems, 2t for 4 guns, 2t for 8 weapons, 5.5t for armor. 19.5t, 20-30t for medium fighters
  Saber: 10t for structure and systems, 2t for 4 guns, 19t of armor, >35 tonnes for heavy fighter class


## References
- Sound effects generated from https://pro.sfxr.me/ and https://pixwlk.itch.io/bleeper
- Music generated from https://krasse.itch.io/wavebots-editor
- 3d Models of ships from Kenney https://www.kenney.nl/assets/space-kit
- Crosshairs from https://opengameart.org/content/64-crosshairs-pack-split
- Skybox generated from https://tools.wwwtyro.net/space-3d/index.html
- Monospaced retro font _KongText_ from https://www.1001fonts.com/kongtext-font.html

## License
This code and project is released under the Creative Commons Attribution-NonCommercial 4.0 International license
See [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)]

## Bugs:
- [ ] high score doesn't seem to be saved
## Backlog:
- [ ] joystick controls
- [ ] VR controls
- [ ] configurable input
- [ ] rebuild ai:
  - [ ] test path following
  - [ ] pre defined maneuvers can describe "up" of maneuver heading
## TODO:

### next demo
- [x] fullish weapons list
- [x] fullish guns list
- [x] fullish ships list (add more player ships)
- [x] drop in system types (engines, power plants, shields)
- [x] configurable ships
- [x] ship builder
  - [x] select ship
  - [x] add modifiers
  - [x] select guns
  - [x] select weapons
  - [x] add extras
  - [x] see stats
  - [x] launch ship
- [x] utility items
- [x] named guns like diablo (they are called "affixes")
- [x] tiers for guns
- [] models for weapons
- [] models for guns
- [] polish and juice
### next demo
- [] dynamic missions - instant action mode
- [] polish and juice
### next demo
- [] purchase and maintain ships
- [] purchase and maintain personal
- [] polish and juice
### next demo
- [] ai nuance
- [] polish and juice
### next demo
- [] capitol ships
- [] polish and juice
### next demo
- [] 3d cockpits
### next demo
- [] carrier ships
- [] space stations
### v1.0 full release feature complete
- [] configurable missions
- [] mission selection
### v1.1 distribute and .... profit?
- [] native code capability
- [] release on app stores
- [] release on quest
- [] release on steam
## Finished releases
### initial publish of demo
- [x] flight model
  - [x] afterburner slide
  - [x] drift
  - [x] brake
  - [x] arcade constant speed/velocity
  - [x] roll pitch yaw independence
  - [x] ramp input so movement isn't jarring
- [x] gun projectile details
  - [x] add fire position to ship data
  - [x] create fire command and fire system
  - [x] fire from position on ship
  - [x] add ship energy info to ship data
  - [x] add projectile energy info to ship data
  - [x] create ship energy system
- [x] basic ai
  - [x] ai shoots at target
  - [x] ai launches missiles
  - [x] ai chooses target
- [x] directional shield damage
  - [x] render shield
  - [x] render shield damage effects
- [x] directional hull damage
  - [x] render hull damage effects
- [x] system damage
  - [x] render system damage
  - [x] system damage affects flight model
  - [x] system damage affects power and shields
  - [x] system damage destroys guns and weapons
  - [x] system damage affects targeting and radar
- [x] missile details
- [x] missile tracking
- [x] targeting system
  - [x] lock onto target
  - [x] auto target enemy in front of player
  - [x] display player time to lock in hud
- [x] space debris particle system for movement detection
- [x] ai vs ai dogfighting demo mode
- [x] dynamically load ship stats from data files (unhardcode values)
- [x] basic hud
  - [x] radar in hud
    - [x] show locked target in radar
    - [x] color code targets in radar
    - [x] damage indicator in radar (light up quadrant hit)
    - [x] color intensity for ship distance
    - [x] color code dead targets dark-gray
- [x] gamepad controls
- [x] respawn killed ships
- [x] heal player every three dead ships
- [x] rebuild main menu
  - [x] make buttons more juicy
- [x] game over screen
  - [x] restart button
  - [x] make sure memory footprint is clear on restarts
- [x] scoring
  - [x] points for kill
  - [x] points for time alive
  - [x] time awarded for kill
  - [x] time awarded for round
  - [x] time counts down till game over
  - [x] hi-score leaderboard
  - [x] stats for nerds
- [x] more enemy types
  - [x] medium 1
  - [x] medium 2
  - [x] heavy 1
- [x] increase enemy type level every round
  - [x] add an extra enemy ship per success round of every ship type
- [x] HUD Improvements
  - [x] tint hud elements
  - [x] dynamic hud location
  - [x] weapon selection hud
  - [x] gun selection hud
  - [x] damaged systems hud
  - [x] move player ship stats to the right of the left VDU so it's always visible
    - [x] add color coding to the player ship stats bars
    - [x] quickly flash ship stat red if it's empty
- [x] massive juicing
  - [x] sounds
    - [x] player shields hit
      - [x] make this a player specific zzzt sound
    - [x] player armor hit
      - [x] make this a player specific thonk sound
    - [x] player systems hit
    - [x] enemy shields hit
    - [x] enemy armor hit
    - [x] enemy systems hit
    - [x] missile launched
    - [x] missile explosion
    - [x] missile lock tracking
    - [x] missile locked
    - [x] afterburners on
    - [x] drift on
    - [x] missile incoming
    - [x] cockpit vdu input
    - [x] target locked
    - [x] menu buttons
  - [x] music
  - [x] main menu runs demo ai vs ai scene
  - [x] damaged systems vdu animations
  - [x] replace sprite particles with 3d shapes
    - [x] shields hit
    - [ ] ~shields collapsed~
    - [x] shields pulse
    - [x] armor hit
    - [x] systems damaged
    - [x] missile explosion
    - [x] death rattle smoke trail.
    - [x] death explosion.
  - [x] fix trails and afterburner effects
  - [x] replace laser particle models
  - [x] replace missile models
  - [ ] 3d cockpit frame model
- [x] code cleanup
- [x] settings menu for volume
- [x] controller input help menu
### AI Rebuild
- [] joystick controls
- [] VR controls
- [] configurable input
- [] rebuild ai: https://www.red3d.com/cwr/steer/gdc99/#:~:text=Offset%20pursuit%20refers%20to%20steering,without%20colliding%20with%20the%20target.
  - [x] pursuit
  - [x] offset pursuit
  - [x] arrival
  - [x] flee
  - [x] collisions
    - [x] obstacle avoidance
    - [x] unaligned collision avoidance
  - [x] path following
    - [ ] test path following
  - [x] pre-defined maneuvers
  - [x] action state tree
    - [x] test action state tree
  - [x] ai personalities
    - [x] test personalities
    - [x] build more personalities
  - [x] offset / pursuit should match target "up"
  - [ ] pre defined maneuvers can describe "up" of maneuver heading
  - [x] add group ids for patrols so we can have multiple wings on the same team
  - [x] collision avoidance

oh give me a ship, with a jump drive equip'd
and with the cargo hold packed i'll go
the confed be damn, 'cause the miners demand
that the beer in my cargo hold flow

long hauling in space, in the endless expanse do I go
the confed be damn, 'cause the miners demand
that the beer in my cargo hold flow

through asteroid belts wide, and nebulas i'll glide
i'll haul every ounce that i know
with stars as my guide, and contraband inside
i'll navigate space high and low

long hauling in space, in the endless expanse do I go
the confed be damn, 'cause the miners demand
that the beer in my cargo hold flow

my cargo hold's stash, is a contraband cache
and the pirates will eat my exhaust
i'll do one more haul, just a quick 5 jump sprawl
and maybe even cover the cost

long hauling in space, in the endless expanse do I go
the confed be damn, 'cause the miners demand
that the beer in my cargo hold flow