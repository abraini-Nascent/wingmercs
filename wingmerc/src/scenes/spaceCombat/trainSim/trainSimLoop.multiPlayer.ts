import { DriftSoundSystem } from '../../../world/systems/soundSystems/driftSoundSystem';
import { GameScene } from '../../gameScene';
import { AppContainer } from "../../../app.container";
import { aiSystem } from "../../../world/systems/ai/aiSystem";
import { cameraSystem } from "../../../world/systems/renderSystems/cameraSystem";
import { powerPlantRechargeSystem } from "../../../world/systems/shipSystems/engineRechargeSystem";
import { gunCooldownSystem } from "../../../world/systems/shipSystems/gunCooldownSystem";
import { missileSteeringSystem } from "../../../world/systems/weaponsSystems/missileSteeringSystem";
import { missileTargetingSystem } from "../../../world/systems/weaponsSystems/missileTargetingSystem";
import { moveSystem } from "../../../world/systems/moveSystem";
import { netSyncClientSystem } from "../../../world/systems/netSystems/netClientSystem";
import { netSyncServerSystem } from "../../../world/systems/netSystems/netServerSystem";
import { particleSystem } from "../../../world/systems/weaponsSystems/particleSystem";
import { rotationalVelocitySystem } from "../../../world/systems/rotationalVelocitySystem";
import { shieldRechargeSystem } from "../../../world/systems/shipSystems/shieldRechargeSystem";
import { updateRenderSystem } from "../../../world/systems/renderSystems/updateRenderSystem";
import { Entity, NerdStats, Score, queries, world } from '../../../world/world';
import * as Ships from '../../../data/ships';
import { rand, random } from '../../../utils/random';
import { CombatHud } from '../hud/spaceCombatHUD';
import { radarTargetingSystem } from '../../../world/systems/shipSystems/radarTargetingSystem';
import { StatsScene } from '../../statsScene/statsLoop';
import { damageSprayParticlePool, shieldPulserSystem } from '../../../world/damage';
import '../../../world/systems/soundSystems/missileEngineSoundSystem';
import { CombatControllerInput } from '../../../world/systems/input/combatInput/combatControllerInput';
import { combatKeyboardInput } from '../../../world/systems/input/combatInput/combatKeyboardInput';
import { createCustomShip } from '../../../world/factories';
import { PlayerAgent } from '../../../agents/playerAgent';
import { fuelConsumptionSystem } from '../../../world/systems/shipSystems/fuelConsumptionSystem';
import { MissileEngineSoundSystem } from '../../../world/systems/soundSystems/missileEngineSoundSystem';
import { moveCommandSystem } from '../../../world/systems/controlSystems/moveCommandSystem';
import { DeathRattleSystem } from '../../../world/systems/deathRattleSystem';
import { UpdatePhysicsSystem } from '../../../world/systems/renderSystems/updatePhysicsSystem';
import { WeaponCommandSystem } from '../../../world/systems/controlSystems/weaponCommandSystem';
import { MeshedSystem } from '../../../world/systems/renderSystems/meshedSystem';
import { TrailersSystem } from '../../../world/systems/renderSystems/trailersSystem';
import { AfterburnerSoundSystem } from '../../../world/systems/soundSystems/afterburnerSoundSystem';
import { AfterburnerTrailsSystem } from '../../../world/systems/renderSystems/afterburnerTrailsSystem';
import { SystemsDamagedSpraySystem } from '../../../world/systems/renderSystems/systemsDamagedSpraySystem';
import { damagedSystemsSprayParticlePool } from '../../../visuals/damagedSystemsSprayParticles';
import { IDisposable, TmpVectors, Vector3 } from '@babylonjs/core';
import { MusicPlayer } from '../../../utils/music/musicPlayer';
import { HitTrackerSystem } from '../../../world/systems/weaponsSystems/hitTrackerSystem';
import { ShipTemplate } from '../../../data/ships/shipTemplate';
import { DriftTrailSystem } from '../../../world/systems/renderSystems/driftTrailSystem';
import { TargetBoxesSystem } from '../../../world/systems/renderSystems/targetBoxesSystem';
import { MissionType } from '../../../data/missions/missionData';
import { SpaceDebrisSystem } from '../../../world/systems/visualsSystems/spaceDebrisSystem';

/**
 * If a player dies they should follow cam another player untill
 * If all other players die the level is over:
 * - send them back to the multiplayer screen after the end screen
 * If the other players kill another enemy the dead players respawn
*/

const ShipProgression: string[] = ["EnemyLight01", "EnemyMedium01", "EnemyMedium02", "EnemyHeavy01"]
const divFps = document.getElementById("fps");
const pointsPerSecond = 10;
const START_TIME = 10
export class TrainSimSceneMultiplayer implements GameScene, IDisposable {

  controllerInput: CombatControllerInput
  spaceDebris: SpaceDebrisSystem
  totalKillCount: number = 0
  waveCount: number = 0
  waveKillCount: number = 0
  lastSpawnCount: number = 0
  shipTypeIndex: number = 0
  extraShipCount: number = 0
  hud: CombatHud
  gameover: boolean
  readyTimer = 0
  gameoverTimer = 0
  spectator: boolean = false
  spectatingPlayer: Entity = undefined
  reviveKillsRemaining: number = 0
  score: Score
  stats: NerdStats

  // systems
  missileEngineSoundSystem = new MissileEngineSoundSystem()
  deathRattleSystem = new DeathRattleSystem()
  updatePhysicsSystem = new UpdatePhysicsSystem()
  weaponCommandSystem = new WeaponCommandSystem()
  meshedSystem = new MeshedSystem()
  trailersSystem = new TrailersSystem()
  afterburnerSoundsSystem = new AfterburnerSoundSystem()
  driftSoundSystem = new DriftSoundSystem()
  driftTrailSystem = new DriftTrailSystem()
  afterburnerTrailsSystem = new AfterburnerTrailsSystem()
  systemsDamagedSpraySystem = new SystemsDamagedSpraySystem()
  hitTrackerSystem = new HitTrackerSystem()
  targetBoxesSystem = new TargetBoxesSystem()

  combatEntities = new Set<Entity>()
  disposibles = new Set<IDisposable>()

  constructor(private playerShip?: ShipTemplate) {
    console.log("[SpaceCombatLoop.multiplayer] created")
    const appContainer = AppContainer.instance
    this.spaceDebris = new SpaceDebrisSystem(appContainer.scene)
    world.onEntityAdded.subscribe(this.onCombatEntityAdded)
    world.onEntityRemoved.subscribe(this.onCombatEntityRemoved)
    // NOTE: if this gets to taking too long we should move it out of the constructor and into a initialize generator function
    damageSprayParticlePool.prime(50)
    damagedSystemsSprayParticlePool.prime(20)
    // queries.deathComes.onEntityAdded.subscribe(this.onDeath)

    this.hud = new CombatHud()
    this.readyTimer = 3000
    appContainer.player = new PlayerAgent(this.playerShip)
    const playerEntity = appContainer.player.playerEntity;
    playerEntity.score = { livesLeft: 1, timeLeft: START_TIME, total: 1000 }
    this.score = playerEntity.score
    this.stats = playerEntity.nerdStats
    this.controllerInput = new CombatControllerInput()
    MusicPlayer.instance.playSong("action")
    MusicPlayer.instance.playStinger("encounter")

    document.body.style.cursor = "none";
  }

  /** call to clean up */
  dispose(): void {
    world.onEntityAdded.unsubscribe(this.onCombatEntityAdded)
    world.onEntityRemoved.unsubscribe(this.onCombatEntityRemoved)
    // queries.deathComes.onEntityAdded.unsubscribe(this.onDeath)
    this.hud.dispose()
    // todo space debri
    this.spaceDebris.dispose()
    for (const entity of this.combatEntities) {
      world.remove(entity)
    }
    this.combatEntities.clear()

    // systems
    // dispose systems last since they help with cleanup
    this.missileEngineSoundSystem.dispose()
    this.deathRattleSystem.dispose()
    this.updatePhysicsSystem.dispose()
    this.weaponCommandSystem.dispose()
    this.meshedSystem.dispose()
    this.trailersSystem.dispose()
    this.afterburnerSoundsSystem.dispose()
    this.driftSoundSystem.dispose()
    this.driftTrailSystem.dispose()
    this.afterburnerTrailsSystem.dispose()
    this.systemsDamagedSpraySystem.dispose()
    this.hitTrackerSystem.dispose()
    this.targetBoxesSystem.dispose()

    // reset cursor
    document.body.style.cursor = "auto";
    // dispose disposibles
    this.disposibles.forEach((disposible) => {
      disposible.dispose()
    })
    this.disposibles.clear()
  }

  deinit() {
    console.log("[SpaceCombatLoop] deinit")
  }

  onCombatEntityAdded = (entity: Entity) => {
    this.combatEntities.add(entity)
  }

  onCombatEntityRemoved = (entity: Entity) => {
    if (entity.isTargetable && (entity.isTargetable == "enemy" || entity.isTargetable == "player")) {
      this.onDeath(entity)
    }
    this.combatEntities.delete(entity)
  }

  onDeath = (entity: Entity) => {
    if (entity == AppContainer.instance.player.playerEntity) {
      const anotherPlayerIsAlive = queries.players.entities.some((player) => {
        return player.health.current > 0
      })
      if (anotherPlayerIsAlive) {
        this.spectator = true
        this.reviveKillsRemaining = 1
        this.hud.spectator = true
        return
      }
      this.gameover = true
      this.hud.gameover = true
      this.gameoverTimer = 3000
      MusicPlayer.instance.playStinger("fail")
      return
    }
    if (entity.playerId != undefined) {
      // a player teammate died
      return
    }
    MusicPlayer.instance.playStinger("win")
    const playerScore = AppContainer.instance.player.playerEntity.score
    playerScore.total += 1000 * this.waveCount
    playerScore.timeLeft += 30
    this.stats.totalKills += 1
    this.totalKillCount += 1
    this.waveKillCount += 1
    const endOfBlock = this.waveKillCount == 3
    let shouldSpawnShips = false
    // heal the player and reset weapons if they have killed three enemies
    if (this.lastSpawnCount == this.waveKillCount) {
      this.waveCount += 1
      this.waveKillCount = 0
      shouldSpawnShips = true
    }
    if (endOfBlock) {
      this.shipTypeIndex += 1
      if (this.shipTypeIndex >= ShipProgression.length) {
        this.shipTypeIndex = 0
      }
      // this.extraShipCount += 1
      playerScore.total += 10000 * this.waveCount // end of wave bonus
      AppContainer.instance.player.restorePlayerShip()
      // TODO: play a healing sound or triumph music note or something
    }
    if (this.reviveKillsRemaining > 0) {
      this.reviveKillsRemaining = 0
      this.spectator = false
      this.hud.spectator = false
      AppContainer.instance.player.revivePlayer()
    }
    this.spawnShips()
  }

  spawnShips() {
    if (AppContainer.instance.multiplayer == true && AppContainer.instance.server == false) {
      return
    }
    const radius = 6000
    const minRadius = 2000
    let newShipAmount = this.lastSpawnCount + 1
    if (newShipAmount > 3) {
      newShipAmount = 1
    }
    newShipAmount += this.extraShipCount
    this.lastSpawnCount = 0
    for (let i = 0; i < newShipAmount; i += 1) {
      const r = Math.min(minRadius, radius * random())
      const phi = random() * Math.PI * 2;
      const costheta = 2 * random() - 1;
      const theta = Math.acos(costheta);
      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(theta);
      const playerEntityPosition = AppContainer.instance.player.playerEntity.position
      // add enemy ship
      const shipDetails = Ships[ShipProgression[this.shipTypeIndex]]
      const ship = createCustomShip(shipDetails, x + playerEntityPosition.x, y + playerEntityPosition.y, z + playerEntityPosition.z, 2, 1)
      // patrol around the players position
      world.addComponent(ship, "missionDetails", {
        missionLocations: [
          {
            name: "Arena Point",
            isNavPoint: false,
            position: { x: playerEntityPosition.x, y: playerEntityPosition.y, z: playerEntityPosition.z }
          }
        ],
        destroy: AppContainer.instance.player.playerEntity.id,
        mission: MissionType.Destroy
      })
      this.lastSpawnCount += 1
    }
  }

  runLoop = (delta: number) => {
    const appContainer = AppContainer.instance
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    if (this.spectator) {
      
    }
    if (this.gameover) {
      this.gameoverTimer -= delta
      this.hud.updateScreen(delta)
      if (this.gameoverTimer < 0) {
        MusicPlayer.instance.playStinger("fail")
        queries.deathComes.onEntityAdded.unsubscribe(this.onDeath)
        this.onDeath = undefined
        console.log("subscribers size after unsubscribe", queries.deathComes.onEntityAdded.subscribers.size)
        // for some reason unsubscribe isn't letting go
        // queries.deathComes.onEntityAdded.clear()
        console.log("subscribers size after clear", queries.deathComes.onEntityAdded.subscribers.size)
        appContainer.gameScene = new StatsScene(this.score, this.stats)
        this.dispose()
      }
      scene.render()
      divFps.innerHTML = engine.getFps().toFixed() + " fps";
      return
    }
    if (this.readyTimer > 0) {
      this.readyTimer = Math.max(0, this.readyTimer - delta)

      if (this.readyTimer > 0) {
        this.hud.getReady = true
        this.hud.updateScreen(delta)
        scene.render()
        divFps.innerHTML = engine.getFps().toFixed() + " fps";
        return
      } else {
        this.spawnShips()
        this.hud.getReady = false
      }
    }
    gunCooldownSystem(delta)
    shieldRechargeSystem(delta)
    powerPlantRechargeSystem(delta)
    fuelConsumptionSystem(delta)
    combatKeyboardInput(delta)
    this.controllerInput.checkInput(delta)
    aiSystem(delta)
    moveCommandSystem(delta)
    rotationalVelocitySystem()
    moveSystem(delta)
    radarTargetingSystem(delta)
    particleSystem()
    missileSteeringSystem(delta)
    missileTargetingSystem(delta)
    this.hitTrackerSystem.update(delta)
    if (appContainer.multiplayer) {
      if (appContainer.server) {
        netSyncServerSystem(delta)
      } else {
        netSyncClientSystem(delta)
      }
    }
    shieldPulserSystem.update(delta)
    updateRenderSystem()
    this.updateScore(delta)
    if (this.spaceDebris) {
      this.spaceDebris.update(delta)
    }
    if (this.spectator) {
      this.spectatorCameraSystem()
    } else {
      cameraSystem(appContainer.player.playerEntity, appContainer.camera)
    }
    this.hud.updateScreen(delta)
  
    scene.render()
    divFps.innerHTML = engine.getFps().toFixed() + " fps";
  };

  updateScore(dt: number) {
    const score = AppContainer.instance.player.playerEntity.score
    score.timeLeft -= dt / 1000
    score.total += (dt/1000) * pointsPerSecond
    if (score.timeLeft <= 0) {
      this.gameover = true
      this.hud.gameover = true
      this.gameoverTimer = 3000
    }
  }

  spectatorCameraSystem() {
    // Calculate the center point between the two nodes
    // follow cam
    if (this.spectatingPlayer == undefined || this.spectatingPlayer.health.current == 0) {
      this.spectatingPlayer = queries.players.entities.find(entity => entity.health.current > 0)
    }
    if (this.spectatingPlayer == undefined) {
      return
    }
    cameraSystem(this.spectatingPlayer, AppContainer.instance.camera)
    return
  }
}