import { SkyboxSystems } from "../../../world/systems/visualsSystems/skyboxSystems"
import { SpaceDebrisSystem } from "../../../world/systems/visualsSystems/spaceDebrisSystem"
import { GameScene } from "../../gameScene"
import { AppContainer } from "../../../app.container"
import { cameraSystem } from "../../../world/systems/renderSystems/cameraSystem"
import { netSyncClientSystem } from "../../../world/systems/netSystems/netClientSystem"
import { netSyncServerSystem } from "../../../world/systems/netSystems/netServerSystem"
import { updateRenderSystem } from "../../../world/systems/renderSystems/updateRenderSystem"
import { CreateEntity, Entity, NerdStats, Score, queries, world } from "../../../world/world"
import * as Ships from "../../../data/ships"
import { random } from "../../../utils/random"
import { CombinedCombatHud } from "../hud/spaceCombatHUD"
import { StatsScene } from "../../statsScene/statsLoop"
import "../../../world/systems/soundSystems/missileEngineSoundSystem"
import { createCustomShip } from "../../../world/factories"
import { PlayerAgent } from "../../../agents/playerAgent"
import { damagedSystemsSprayParticlePool } from "../../../visuals/damagedSystemsSprayParticles"
import { IDisposable, TransformNode, Vector3 } from "@babylonjs/core"
import { MusicPlayer } from "../../../utils/music/musicPlayer"
import { ShipTemplate } from "../../../data/ships/shipTemplate"
import { MissionType } from "../../../data/missions/missionData"
import { CombatSystems } from "../../../world/systems/combatSystems"
import { LoadAsteroidField } from "../../../world/systems/missionSystems/missionHazards"
import { deathExplosionParticlePool } from "../../../visuals/deathExplosionParticles"
import { shieldSprayParticlePool } from "../../../visuals/shieldSprayParticles"
import { damageSprayParticlePool } from "../../../visuals/damageSprayParticles"
import { debugLog } from "../../../utils/debuglog"

const ShipProgression: string[] = ["EnemyLight01", "EnemyMedium01", "EnemyMedium02", "EnemyHeavy01"]
const divFps = document.getElementById("fps")
const pointsPerSecond = 10
const START_TIME = 10 //90
export class TrainSimScene implements GameScene, IDisposable {
  totalKillCount: number = 0
  waveCount: number = 0
  waveKillCount: number = 0
  lastSpawnCount: number = 0
  shipTypeIndex: number = 0
  extraShipCount: number = 0
  hud: CombinedCombatHud
  gameover: boolean
  readyTimer = 0
  gameoverTimer = 0
  score: Score
  stats: NerdStats

  // systems

  spaceDebrisSystem: SpaceDebrisSystem
  skyboxSystems: SkyboxSystems
  combatSystems: CombatSystems = new CombatSystems()

  combatEntities = new Set<Entity>()
  disposibles = new Set<IDisposable>()

  constructor(private playerShip?: ShipTemplate) {
    debugLog("[SpaceCombatLoop.singleplayer] created")
    const appContainer = AppContainer.instance
    this.skyboxSystems = new SkyboxSystems(appContainer.scene)
    this.spaceDebrisSystem = new SpaceDebrisSystem(appContainer.scene)
    world.onEntityAdded.subscribe(this.onCombatEntityAdded)
    world.onEntityRemoved.subscribe(this.onCombatEntityRemoved)
    // NOTE: if this gets to taking too long we should move it out of the constructor and into a initialize generator function
    damageSprayParticlePool.value.prime(5)
    damagedSystemsSprayParticlePool.value.prime(5)
    deathExplosionParticlePool.value.prime(5)
    shieldSprayParticlePool.value.prime(5)

    this.readyTimer = 3000
    appContainer.player = new PlayerAgent(this.playerShip)
    const playerEntity = appContainer.player.playerEntity
    playerEntity.score = { livesLeft: 1, timeLeft: START_TIME, total: 1000 }
    this.score = playerEntity.score
    this.stats = playerEntity.nerdStats
    MusicPlayer.instance.playSong("action")
    MusicPlayer.instance.playStinger("encounter")

    const navNode = new TransformNode("arena nav")
    navNode.position.set(0, 0, 0)
    const navEntity = CreateEntity({
      position: { x: 0, y: 0, z: 0 },
      targetName: "Arena",
      isTargetable: "nav",
      node: navNode,
    })

    this.hud = new CombinedCombatHud()

    document.body.style.cursor = "none"
    LoadAsteroidField(Vector3.Zero())
  }

  /** call to clean up */
  dispose(): void {
    world.onEntityAdded.unsubscribe(this.onCombatEntityAdded)
    world.onEntityRemoved.unsubscribe(this.onCombatEntityRemoved)
    // queries.deathComes.onEntityAdded.unsubscribe(this.onDeath)
    if (this.hud) {
      this.hud.dispose()
      this.hud = undefined
    }

    for (const entity of this.combatEntities) {
      world.remove(entity)
    }
    this.combatEntities.clear()

    // systems
    // dispose systems last since they help with cleanup
    this.spaceDebrisSystem.dispose()
    this.combatSystems.dispose()
    this.skyboxSystems.dispose()

    // reset cursor
    document.body.style.cursor = "auto"
    // dispose disposibles
    this.disposibles.forEach((disposible) => {
      disposible.dispose()
    })
    this.disposibles.clear()
  }

  deinit() {
    debugLog("[SpaceCombatLoop] deinit")
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
      // TODO: the player died
      this.gameover = true
      this.hud.gameover = true
      this.gameoverTimer = 3000
      MusicPlayer.instance.playStinger("fail")
      return
    }
    MusicPlayer.instance.playStinger("win")
    const playerScore = AppContainer.instance.player.playerEntity.score
    playerScore.total += 1000 * this.waveCount
    playerScore.timeLeft += START_TIME
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
      const playerEntity = AppContainer.instance.player.playerEntity
      const shipTemplate = Ships[playerEntity.planeTemplate] as typeof Ships.Dirk
      playerEntity.health = {
        current: shipTemplate.structure.core.health,
        base: shipTemplate.structure.core.health,
      }
      playerEntity.systems.state = { ...playerEntity.systems.base }
      playerEntity.armor.back = shipTemplate.structure.back.armor
      playerEntity.armor.front = shipTemplate.structure.front.armor
      playerEntity.armor.left = shipTemplate.structure.left.armor
      playerEntity.armor.right = shipTemplate.structure.right.armor
      playerEntity.shields.currentAft = playerEntity.shields.maxAft
      playerEntity.shields.currentFore = playerEntity.shields.maxFore
      playerEntity.weapons.mounts.forEach((mount, index) => {
        mount.count = mount.baseCount
      })
      if (playerEntity.gunAmmo != undefined) {
        Object.keys(playerEntity.gunAmmo).forEach((ammoType) => {
          playerEntity.gunAmmo[ammoType].current = playerEntity.gunAmmo[ammoType].base
        })
      }
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
      const phi = random() * Math.PI * 2
      const costheta = 2 * random() - 1
      const theta = Math.acos(costheta)
      const x = r * Math.sin(theta) * Math.cos(phi)
      const y = r * Math.sin(theta) * Math.sin(phi)
      const z = r * Math.cos(theta)
      const playerEntityPosition = AppContainer.instance.player.playerEntity.position
      // add enemy ship
      const shipDetails = Ships[ShipProgression[this.shipTypeIndex]]
      const ship = createCustomShip(
        shipDetails,
        x + playerEntityPosition.x,
        y + playerEntityPosition.y,
        z + playerEntityPosition.z,
        2,
        1
      )
      // patrol around the players position
      world.addComponent(ship, "missionDetails", {
        missionLocations: [
          {
            id: 1,
            name: "Arena Point",
            isNavPoint: false,
            position: { x: playerEntityPosition.x, y: playerEntityPosition.y, z: playerEntityPosition.z },
          },
        ],
        destroy: AppContainer.instance.player.playerEntity.id,
        mission: MissionType.Destroy,
      })
      this.lastSpawnCount += 1
    }
  }

  runLoop = (delta: number) => {
    const appContainer = AppContainer.instance
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    this.hud.checkXr()
    if (this.gameover) {
      this.gameoverTimer -= delta
      this.hud.update(delta)
      if (this.gameoverTimer < 0) {
        MusicPlayer.instance.playStinger("fail")
        queries.deathComes.onEntityAdded.unsubscribe(this.onDeath)
        this.onDeath = undefined
        debugLog("subscribers size after unsubscribe", queries.deathComes.onEntityAdded.subscribers.size)
        // for some reason unsubscribe isn't letting go
        // queries.deathComes.onEntityAdded.clear()
        debugLog("subscribers size after clear", queries.deathComes.onEntityAdded.subscribers.size)
        appContainer.gameScene = new StatsScene(this.score, this.stats)
        this.dispose()
      }
      scene.render()
      divFps.innerHTML = engine.getFps().toFixed() + " fps"
      return
    }
    if (this.readyTimer > 0) {
      this.readyTimer = Math.max(0, this.readyTimer - delta)

      if (this.readyTimer > 0) {
        this.hud.getReady = true
        this.hud.update(delta)
        scene.render()
        divFps.innerHTML = engine.getFps().toFixed() + " fps"
        return
      } else {
        this.spawnShips()
        this.hud.getReady = false
      }
    }
    this.combatSystems.update(delta)
    if (appContainer.multiplayer) {
      if (appContainer.server) {
        netSyncServerSystem(delta)
      } else {
        netSyncClientSystem(delta)
      }
    }
    this.skyboxSystems.update(delta)
    this.spaceDebrisSystem.update(delta)
    updateRenderSystem()
    cameraSystem(appContainer.player.playerEntity, appContainer.camera)
    this.updateScore(delta)
    this.hud.update(delta)
    scene.render()
    divFps.innerHTML = engine.getFps().toFixed() + " fps"
  }

  multiplayerLoop = (dt: number) => {
    /**
     * If a player dies they should follow cam another player untill
     * If all other players die the level is over:
     * - send them back to the multiplayer screen after the end screen
     * If the other players kill another enemy the dead players respawn
     */
  }

  updateScore(dt: number) {
    const score = AppContainer.instance.player.playerEntity.score
    score.timeLeft -= dt / 1000
    score.total += (dt / 1000) * pointsPerSecond
    if (score.timeLeft <= 0) {
      this.gameover = true
      this.hud.gameover = true
      this.gameoverTimer = 3000
    }
  }
}
