# Squadron: Mercenaries

## Moonshot goal
Imagine a thrilling spacefaring epic that blends the adrenaline-pumping space flight combat simulation of 'Wing Commander' with the intricate personelle and material management aspects of 'Mechwarrior Mercenaries.' In this immersive game, players will not only engage in intense dogfights and grand-scale space battles, but they'll also assume the role of a resourceful commander, managing a crew of diverse characters, upgrading and customizing their spacecraft, and navigating a dynamic galaxy filled with contracts, alliances, and political intrigue. With its seamless integration of strategic management and action-packed combat, this game offers a uniquely captivating experience that caters to both die-hard simulation enthusiasts and fans of deep, story-driven gameplay.

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

## References
- Sound effects generated from https://pro.sfxr.me/
- 3d Models of ships from Kenney https://www.kenney.nl/assets/space-kit
- Crosshairs from https://opengameart.org/content/64-crosshairs-pack-split

## Bugs:
- [x] afterburner seems to go on forever
- [ ] static size VDUs, the are all different sizes and are not consistent so don't look good
- [x] I think the AI can only turn up and right? or down and left? they seem to be stuck making only one direction turns
- [x] targeting hud stays active after target leaves screen
- [ ] player ship continues to emit particles after death screen and on score screen
- [ ] enemies aren't shooting as much after steering fix
- [ ] scene, player, and enemies don't reset on a new game after death
## TODO:
### initial publish of demo
- [x] flight model
  - [x] afterburner slide
  - [x] drift
  - [x] brake
  - [x] arcade constant speed/velocity
  - [x] roll pitch yaw independence
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
  - [ ] ai chooses target
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
- [ ] ai vs ai dogfighting demo mode
  - https://www.red3d.com/cwr/steer/gdc99/#:~:text=Offset%20pursuit%20refers%20to%20steering,without%20colliding%20with%20the%20target.
- [x] dynamically load ship stats from data files (unhardcode values)
- [x] basic hud
  - [x] radar in hud
    - [x] show locked target in radar
    - [x] color code targets in radar
    - [x] damage indicator in radar (light up quadrant hit)
- [x] gamepad controls
- [x] respawn killed ships
- [x] heal player every three dead ships
- [ ] rebuild main menu
- [x] game over screen
  - [x] restart button
  - [ ] make sure memory footprint is clear on restarts
- [ ] scoring
  - [x] points for kill
  - [x] points for time alive
  - [x] time awarded for kill
  - [x] time awarded for round
  - [x] time counts down till game over
  - [ ] hi-score leaderboard
  - [x] stats for nerds
- [ ] more enemy types
  - [ ] medium 1
  - [ ] medium 2
  - [ ] heavy 1
- [ ] increase enemy type level every round
- [ ] HUD Improvements
  - [x] tint hud elements
  - [x] dynamic hud location
  - [x] weapon selection hud
  - [ ] gun selection hud
  - [x] damaged systems hud
  - [ ] move player ship stats to the right of the left VDU so it's always visible
    - [ ] add color coding to the player ship stats bars
    - [ ] flash ship stat as it's hit
    - [ ] quickly flash ship stat red if it's empty
- [ ] massive juicing
  - [ ] sounds
    - [x] player shields hit
    - [x] player armor hit
    - [x] player systems hit
    - [x] enemy shields hit
    - [x] enemy armor hit
    - [x] enemy systems hit
    - [x] missile launched
    - [x] missile explosion
    - [x] missile lock tracking
    - [x] missile locked
    - [x] afterburners on
    - [ ] drift on
    - [ ] missile incoming
    - [ ] cockpit vdu input
    - [ ] target locked
    - [ ] menu buttons
  - [ ] music
  - [ ] main menu runs demo ai vs ai scene
  - [ ] damaged systems vdu animations
  - [ ] replace sprite particles with 3d shapes
    - [x] shields hit
    - [ ] shields collapsed
    - [x] shields pulse
    - [x] armor hit
    - [x] systems damaged
    - [ ] missile explosion
    - [x] death rattle smoke trail.
    - [x] death explosion.
  - [x] fix trails and afterburner effects
  - [x] replace laser particle models
  - [x] replace missile models
  - [ ] 3d cockpit frame model
- [ ] code cleanup and polish

### second demo
- [] joystick controls
- [] vr controls
- [] configurable input
### third demo
- [] fullish weapons list
- [] fullish guns list
- [] drop in system types (engines, power plants, shields)
- [] configurable ships
- [] configurable enemies
- [] ship viewer
- [] polish and juice
### fourth demo
- [] dynamic missions horde mode
- [] polish and juice
### fifth demo
- [] purchase and maintain ships
- [] purchase and maintain personal
- [] polish and juice
### sixth demo
- [] ai overhaul
- [] polish and juice
### seventh demo
- [] capitol ships
- [] polish and juice
### eighth demo
- [] 3d cockpits
### ninth demo
- [] carrier ships
- [] space stations
### 10th, v1.0 full release feature complete
- [] configurable missions
- [] mission selection
### v1.1 distribute and profit
- [] native code capability
- [] release on app stores
- [] release on quest
- [] release on steam