import { MissionSalvageSystem } from "./../../../world/systems/missionSystems/missionSalvage"
import { SkyboxSystems } from "../../../world/systems/visualsSystems/skyboxSystems"
import { SpaceDebrisSystem } from "../../../world/systems/visualsSystems/spaceDebrisSystem"
import { MissionTracker } from "../../../world/systems/missionSystems/missionTracker"
import { GameScene } from "../../gameScene"
import { AppContainer } from "../../../app.container"
import { cameraSystem } from "../../../world/systems/renderSystems/cameraSystem"
import { netSyncClientSystem } from "../../../world/systems/netSystems/netClientSystem"
import { netSyncServerSystem } from "../../../world/systems/netSystems/netServerSystem"
import { updateRenderSystem } from "../../../world/systems/renderSystems/updateRenderSystem"
import { Entity, NerdStats, Score, queries, world } from "../../../world/world"
import { CombatHud } from "../hud/spaceCombatHUD"
import "../../../world/systems/soundSystems/missileEngineSoundSystem"
import { damagedSystemsSprayParticlePool } from "../../../visuals/damagedSystemsSprayParticles"
import { IDisposable } from "@babylonjs/core"
import { MusicPlayer } from "../../../utils/music/musicPlayer"
import { ShipTemplate } from "../../../data/ships/shipTemplate"
import { examplePatrolMission } from "../../../data/missions/missionData"
import { CombatSystems } from "../../../world/systems/combatSystems"
import { StatsScreen } from "../../statsScene/statsScreen"
import { MissionOverScreen } from "../../missionOverScene/missionOverScreen"
import { MainMenuScene } from "../../mainMenu/mainMenuLoop"
import { shieldSprayParticlePool } from "../../../visuals/shieldSprayParticles"
import { damageSprayParticlePool } from "../../../visuals/damageSprayParticles"

const divFps = document.getElementById("fps")
export class InstantActionScene implements GameScene, IDisposable {
  // screens
  hud: CombatHud
  statsScreen: StatsScreen
  missionOverScreen: MissionOverScreen
  // screen props
  gameover: boolean
  landed: boolean
  readyTimer = 0
  gameoverTimer = 1333
  score: Score
  stats: NerdStats

  // systems

  spaceDebrisSystem: SpaceDebrisSystem
  skyboxSystems: SkyboxSystems
  combatSystems: CombatSystems = new CombatSystems()

  missionTracker = new MissionTracker()
  MissionSalvageSystem = new MissionSalvageSystem()

  combatEntities = new Set<Entity>()
  disposibles = new Set<IDisposable>()

  constructor(private playerShip?: ShipTemplate, campaignEntity?: Entity) {
    console.log("[InstantAction.singleplayer] created")
    const appContainer = AppContainer.instance
    this.skyboxSystems = new SkyboxSystems(appContainer.scene)
    this.spaceDebrisSystem = new SpaceDebrisSystem(appContainer.scene)
    world.onEntityAdded.subscribe(this.onCombatEntityAdded)
    world.onEntityRemoved.subscribe(this.onCombatEntityRemoved)
    // NOTE: if this gets to taking too long we should move it out of the constructor and into a initialize generator function
    damageSprayParticlePool.value.prime(5)
    damagedSystemsSprayParticlePool.value.prime(5)
    shieldSprayParticlePool.value.prime(5)

    this.hud = new CombatHud()
    this.readyTimer = 3000

    MusicPlayer.instance.playSong("action")
    MusicPlayer.instance.playStinger("encounter")

    this.missionTracker.setMission(campaignEntity?.campaign?.currentMission ?? examplePatrolMission, this.playerShip)
    const playerEntity = appContainer.player.playerEntity
    this.stats = playerEntity.nerdStats

    document.body.style.cursor = "none"

    this.runLoop = this.gameOnLoop
  }

  /** call to clean up */
  dispose(): void {
    world.onEntityAdded.unsubscribe(this.onCombatEntityAdded)
    world.onEntityRemoved.unsubscribe(this.onCombatEntityRemoved)
    // queries.deathComes.onEntityAdded.unsubscribe(this.onDeath)
    this.hud.dispose()
    this.skyboxSystems.dispose()
    for (const entity of this.combatEntities) {
      world.remove(entity)
    }
    this.combatEntities.clear()

    // systems
    // dispose systems last since they help with cleanup
    this.spaceDebrisSystem.dispose()
    this.missionTracker.dispose()
    this.MissionSalvageSystem.dispose()

    // reset cursor
    document.body.style.cursor = "auto"
    // dispose disposibles
    this.disposibles.forEach((disposible) => {
      disposible.dispose()
    })
    this.disposibles.clear()
  }

  deinit() {
    console.log("[InstantAction] deinit")
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
    this.stats.totalKills += 1
  }

  runLoop = (delta: number) => {}

  gameOnLoop = (delta: number) => {
    const appContainer = AppContainer.instance
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    const player = appContainer.player.playerEntity
    if (!this.gameover && player.landing && Object.values(player.landing).some((landing) => landing.landed)) {
      this.gameover = true
      this.hud.landed = true
      this.hud.gameover = true
      this.landed = true
    }

    if (this.gameover) {
      this.gameoverTimer -= delta
      this.hud.updateScreen(delta)
      if (this.gameoverTimer < 0) {
        MusicPlayer.instance.playStinger(this.landed ? "win" : "fail")
        queries.deathComes.onEntityAdded.unsubscribe(this.onDeath)
        this.onDeath = undefined
        document.body.style.cursor = "auto"
        this.statsScreen = new StatsScreen(player.score, player.nerdStats)
        this.runLoop = this.gameOverLoop
      }
      scene.render()
      divFps.innerHTML = engine.getFps().toFixed() + " fps"
      return
    }
    if (this.readyTimer > 0) {
      this.readyTimer = Math.max(0, this.readyTimer - delta)

      if (this.readyTimer > 0) {
        this.hud.getReady = true
        this.hud.updateScreen(delta)
        scene.render()
        divFps.innerHTML = engine.getFps().toFixed() + " fps"
        return
      } else {
        this.hud.getReady = false
      }
    }
    this.combatSystems.update(delta)
    this.missionTracker.update(delta)
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
    this.hud.updateScreen(delta)
    scene.render()
    divFps.innerHTML = engine.getFps().toFixed() + " fps"
  }

  gameOverLoop = (delta: number) => {
    if (this.statsScreen && this.statsScreen.onDone == null) {
      this.statsScreen.onDone = () => {
        this.statsScreen.dispose()
        this.statsScreen = undefined
        this.missionOverScreen = new MissionOverScreen()
      }
    }
    const appContainer = AppContainer.instance
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    this.skyboxSystems.update(delta)
    this.spaceDebrisSystem.update(delta)
    updateRenderSystem()
    cameraSystem(appContainer.player.playerEntity, appContainer.camera)
    if (this.statsScreen) {
      this.statsScreen.updateScreen(delta)
    } else if (this.missionOverScreen) {
      // this.missionOverScreen.updateScreen(delta)
      AppContainer.instance.gameScene.dispose()
      AppContainer.instance.gameScene = new MainMenuScene()
    }
    scene.render()
  }
}
