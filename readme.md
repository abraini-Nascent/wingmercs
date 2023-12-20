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
- Fight against wave-groups of the same fighter, from waves of 1 to 4 fighters of the same type.
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
  - Guns & Weapons: removes capability to use them
#### Flight Model
- independent pitch, roll, and yaw rates
- independent acceleration, velocity, and direction
- current speed up to max "cruise" speed of the plane always follows direction of plane
- "drift" using afterburner slide. Afterburner acceleration and velocity over the speed limit of the plane does not match the direction of the plane

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
- [] basic ai
- [] directional shield damage
  - [] render shield
- [] directional hull damage
- [] - render hull damage effects
- [] system damage
  - [] render system damage
  - [] system damage affects flight model
- [] missile details
- [] missile tracking
- [] ai vs ai dogfighting
### second demo
- [] gamepad controls
- [] joystick controls
- [] vr controls
- [] basic hud
- [] ai horde wave missions
### third demo
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