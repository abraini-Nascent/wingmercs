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
- Music generated from https://suno.com
- 3d Models of ships from Kenney https://www.kenney.nl/assets/space-kit
- Crosshairs from https://opengameart.org/content/64-crosshairs-pack-split
- Monospaced retro font _KongText_ from https://www.1001fonts.com/kongtext-font.html
- Flight stick from (https://skfb.ly/6zPJs) by VivernaNeva is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

## License
This code and project is released under the Creative Commons Attribution-NonCommercial 4.0 International license
See [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)]

## Bugs:
- [ ] high score doesn't seem to be saved
- [x] if leader is killed before break formation, the chain of leaders is broken and results in undefined property access
- [x] sounds seem to be tied to the game position and not the engine position, making them silent when moving away from origin
- [ ] ui elements are still visible in autopilot camera
  - need a demo mode that disables all gui elements
- [x] engine trails line meshes don't work with floating origin
  - switch to triangle particles ejected from engine, use global particle system with a manual emitter
- [x] enemies don't seem to be firing missiles
## Backlog:
- [ ] joystick controls
- [x] VR controls
- [ ] configurable input
  - [ ] message about gamepads being preferred
- [x] background polish
  - [x] generate the nebula
  - [x] place stars similar to points of interest
  - [x] generate points of interest
  - [x] use blue noise to space out points of interest and stars
  - [x] remove pixel art and double-down on vector/polygon art
- [ ] rebuild ai:
  - [ ] test path following
  - [ ] pre defined maneuvers can describe "up" of maneuver heading
  - [ ] add more wingmen formations (use Homeworld 1 for inspiration)
- [ ] chaff
- [ ] fof targeting friend if radio damaged
- [ ] heat tracking new target if stronger signal in range
- [ ] ship turrets
## Performance:
General BabylonJs notes.
Cloned meshes reuse geometry and materials
Disposing meshes doesn't dispose materials

  - [x] world.update takes ~0.15ms when there are many entities. ship ai and movement command are the largest abusers of update. update should only be used when reindexing. none of our queries have a predicate. a simpler "add component if needed" might be better
  - [x] draw call is too long on vr headsets.
    - [x] 1000 unique meshes for the nebula cell is too much, maybe this could be moved into a shader
      -  dropped to 100 cells, back to ~60 fps but could be better
  - [x] computing the voice acting causes a frame skip
    - move to a background thread?
  - [x] sounds aren't cached, each sound effect causes a network call
    - download and store in the asset manager?
  - [ ] server net frame encode takes 0.398 ms, decode 0.033 ms
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
- [x] polish and juice
  - [x] individual voices for pilots
  - [x] dynamic backgrounds?
    - [x] points of interest
  - [x] hide trails when drifting
  - [x] color code slot types in ship customization
  - [x] better chiptune music
- [x] bugs
  - [x] eject warning not working
  - [x] incoming missile warning not working
  - [x] selection ships still visible after launch
    - [x] customization ship not appearing
  - [x] no way back from ship selection and ship customization

### multiplayer detour
- [x] fix net and sync systems
- [x] support multiple clients (3+ players)
- [x] recreate multiplayer menu
  - [x] allow custom room names
  - [x] allow custom player names
  - [x] sync start game
- [x] friendly players on same team
  - [x] friendly players BLUE target box
  - [x] friendly players no missile lock
  - [x] friendly players name in target box
- [x] kill ship to revive downed friendly player

### next demo
- [x] dynamic missions - instant action mode
  - [x] mission types
    - [x] patrol
    - [x] search and destroy
    - [x] escort
    - [x] base defense
    - [x] base assault
  - [ ] autopilot
    - [x] navigation points
    - [x] automatically track next nav point
    - [x] progress time during autopilot
    - [x] add friendlies to formation
    - [x] point and exit towards navigation point
    - [x] autopilot cinematic
      - [ ] pause world during cinematic
    - [x] autopilot indicator in hud
    - [x] VR activate autopilot
    - [x] show right model when in autopilot
  - [x] escort ship
    - [x] move between nav points
    - [x] stop at final nav point
    - [x] progress mission on completion
  - [~] npc actions
    - [ ] heal ship
    - [ ] destroy ship
    - [ ] recover ship/item
    - [ ] capture enemy ship
    - [ ] scan area
  - [ ] enemy patrols
    - [x] destroy target
      - [ ] target enemy cap fighters first
  - [x] hazards
    - [x] asteroids
    - [~] ~mines~
    - [x] nebula
    - [x] radiation
  - [~] item retrieval
  - [x] area investigation
  - [~] launch from command ship
  - [x] land on command ship
- [x] communications
  - [x] command wingmen
    - [x] join formation
    - [x] break and attack
    - [x] attack my target
    - [/] protect me
    - [/] protect my target
  - [x] taunt enemies
  - [x] request landing clearance
- [x] polish and juice
  - [x] rebuild hud indicators
    - [x] target / lock box
    - [x] missile lock indicator
    - [x] ITTS indicator
    - [x] Crosshair
    - [x] ui for who is talking
### Campaign features
- [] purchase and maintain ships
- [] purchase and maintain personnel
- [] polish and juice
### AI Enhancement features
- [] ai nuance
  - [] personalities
  - [] stats that affect combat
- [] polish and juice
### VR features
- [] 3d cockpits
  - [x] ~render cockpit in fp~
  - [~] render joystick and throttle
    - [~] ghost stick in zero position
    - [~] solid stick in current position
  - [x] cockpit pilot freelook
  - [x] cockpit hud
    - [x] vdu screens 
    - [x] power meter
    - [x] shields + armor
    - [x] speed
    - [x] VR interactable
### Carrier / Bases features
- [x] carrier ships
  - [ ] carrier ship collision
  - [x] carrier ship landing
  - [x] cargo ships for escort
  - [ ] carrier ships turrets
  - [ ] carrier ships main guns
- [ ] capital ships
  - [ ] capital ship collisions
  - [ ] capital ships health
  - [ ] capital ships turrets
- [] space stations
### v1.0 full release feature complete
- [x] configurable missions
- [x] mission selection
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
  - [x] 3d cockpit frame model
- [x] code cleanup
- [x] settings menu for volume
- [x] controller input help menu
### AI Rebuild
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