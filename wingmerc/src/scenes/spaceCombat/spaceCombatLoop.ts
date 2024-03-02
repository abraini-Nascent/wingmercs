import { GameScene } from './../gameScene';
import { AppContainer } from "../../app.container";
import { aiSystem } from "../../world/systems/aiSystem";
import { cameraSystem } from "../../world/systems/cameraSystem";
import { engineRechargeSystem } from "../../world/systems/engineRechargeSystem";
import { gameInputSystem } from "../../world/systems/gameInputSystem";
import { gunCooldownSystem } from "../../world/systems/gunCooldownSystem";
import { missileSteeringSystem } from "../../world/systems/missileSteeringSystem";
import { missileTargetingSystem } from "../../world/systems/missileTargetingSystem";
import { ArenaRadius, moveCommandSystem, moveSystem, warpSystem } from "../../world/systems/moveSystem";
import { netSyncClientSystem } from "../../world/systems/netClientSystem";
import { netSyncServerSystem } from "../../world/systems/netServerSystem";
import { particleSystem } from "../../world/systems/particleSystem";
import { rotationalVelocitySystem } from "../../world/systems/rotationalVelocitySystem";
import { shieldRechargeSystem } from "../../world/systems/shieldRechargeSystem";
import { damagedSystemsSprayParticlePool, updateRenderSystem } from "../../world/systems/updateRenderSystem";
import { SpaceDebrisAgent } from '../../agents/spaceDebrisAgent';
import { Entity, NerdStats, Score, queries, world } from '../../world/world';
import * as Ships from '../../data/ships';
import { random } from '../../utils/random';
import { CombatHud } from './spaceCombatHUD';
import { radarTargetingSystem } from '../../world/systems/radarTargetingSystem';
import { StatsScene } from '../statsScene/statsLoop';
import { damageSprayParticlePool, shieldPulserSystem } from '../../world/damage';
import '../../world/systems/missileEngineSoundSystem';
import { CombatControllerInput } from '../../world/systems/input/combatInput/combatControllerInput';
import { combatKeyboardInput } from '../../world/systems/input/combatInput/combatKeyboardInput';
import { createShip } from '../../world/factories';
import { PlayerAgent } from '../../agents/playerAgent';

const ShipProgression: string[] = ["EnemyLight01", "EnemyMedium01", "EnemyMedium02", "EnemyHeavy01"]
const divFps = document.getElementById("fps");
const pointsPerSecond = 10;
export class SpaceCombatScene implements GameScene {

  controllerInput: CombatControllerInput
  spaceDebris: SpaceDebrisAgent
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
  score: Score
  stats: NerdStats

  combatEntities = new Set<Entity>()

  constructor() {
    console.log("[SpaceCombatLoop] created")
    const appContainer = AppContainer.instance
    this.spaceDebris = new SpaceDebrisAgent(appContainer.scene)
    world.onEntityAdded.subscribe(this.onCombatEntityAdded)
    world.onEntityRemoved.subscribe(this.onCombatEntityRemoved)
    // NOTE: if this gets to taking too long we should move it out of the constructor and into a initialize generator function
    damageSprayParticlePool.prime(50)
    damagedSystemsSprayParticlePool.prime(20)
    queries.deathComes.onEntityAdded.subscribe(this.onDeath)
    this.hud = new CombatHud()
    this.readyTimer = 3000
    appContainer.player = new PlayerAgent()
    const playerEntity = appContainer.player.playerEntity;
    playerEntity.score = { livesLeft: 1, timeLeft: 3 * 60, total: 1000 }
    this.score = playerEntity.score
    this.stats = playerEntity.nerdStats
    this.controllerInput = new CombatControllerInput()
  }

  /** call to clean up */
  dispose() {
    world.onEntityAdded.unsubscribe(this.onCombatEntityAdded)
    world.onEntityRemoved.unsubscribe(this.onCombatEntityRemoved)
    queries.deathComes.onEntityAdded.unsubscribe(this.onDeath)
    this.hud.dispose()
    // todo space debri
    this.spaceDebris.dispose()
    for (const entity of this.combatEntities) {
      world.remove(entity)
    }
    this.combatEntities.clear()
  }

  deinit() {
    console.log("[SpaceCombatLoop] deinit")
  }

  onCombatEntityAdded = (entity: Entity) => {
    this.combatEntities.add(entity)
  }

  onCombatEntityRemoved = (entity: Entity) => {
    this.combatEntities.delete(entity)
  }

  onDeath = (entity: Entity) => {
    if (entity == AppContainer.instance.player.playerEntity) {
      // TODO: the player died
      this.gameover = true
      this.hud.gameover = true
      this.gameoverTimer = 3000
      return
    }
    const playerScore = AppContainer.instance.player.playerEntity.score
    playerScore.total += 1000 * this.waveCount
    playerScore.timeLeft += 40
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
      playerScore.timeLeft += 20
      playerScore.total += 10000 * this.waveCount // end of wave bonus
      const playerEntity = AppContainer.instance.player.playerEntity
      const shipTemplate = Ships[playerEntity.planeTemplate] as typeof Ships.Dirk
      playerEntity.health = shipTemplate.health
      playerEntity.systems.state = { ...playerEntity.systems.base }
      playerEntity.armor = { ...playerEntity.armor }
      playerEntity.shields.currentAft = playerEntity.shields.maxAft
      playerEntity.shields.currentFore = playerEntity.shields.maxFore
      playerEntity.weapons.mounts.forEach((mount, index) => {
        mount.count = shipTemplate.weapons[index].count
      })
      // TODO: play a healing sound or triumph music note or something
    }
    if (shouldSpawnShips) {
      this.spawnShips()
    }
  }

  spawnShips() {
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
      const ship = Ships[ShipProgression[this.shipTypeIndex]]
      createShip(ship, x + playerEntityPosition.x, y + playerEntityPosition.y, z + playerEntityPosition.z)
      this.lastSpawnCount += 1
    }
  }

  runLoop = (delta: number) => {
    const appContainer = AppContainer.instance
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    if (this.gameover) {
      this.gameoverTimer -= delta
      this.hud.updateScreen(delta)
      if (this.gameoverTimer < 0) {
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
    engineRechargeSystem(delta)
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
    warpSystem()
    if (appContainer.server) {
      netSyncServerSystem(delta)
    } else {
      netSyncClientSystem(delta)
    }
    shieldPulserSystem.update(delta)
    updateRenderSystem()
    if (this.spaceDebris) {
      this.spaceDebris.update(delta)
    }
    cameraSystem(appContainer.player, appContainer.camera)
    this.updateScore(delta)
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
}