import { SkyboxSystems } from '../../../world/systems/visualsSystems/skyboxSystems';
import { SpaceDebrisSystem } from '../../../world/systems/visualsSystems/spaceDebrisSystem';
import { MissionTracker } from '../../../world/systems/missionSystems/missionTracker';
import { GameScene } from '../../gameScene';
import { AppContainer } from "../../../app.container";
import { cameraSystem } from "../../../world/systems/renderSystems/cameraSystem";
import { netSyncClientSystem } from "../../../world/systems/netSystems/netClientSystem";
import { netSyncServerSystem } from "../../../world/systems/netSystems/netServerSystem";
import { updateRenderSystem } from "../../../world/systems/renderSystems/updateRenderSystem";
import { Entity, NerdStats, Score, queries, world } from '../../../world/world';
import { CombatHud } from '../hud/spaceCombatHUD';
import { StatsScene } from '../../statsScene/statsLoop';
import { damageSprayParticlePool } from '../../../world/damage';
import '../../../world/systems/soundSystems/missileEngineSoundSystem';
import { PlayerAgent } from '../../../agents/playerAgent';
import { damagedSystemsSprayParticlePool } from '../../../visuals/damagedSystemsSprayParticles';
import { IDisposable } from '@babylonjs/core';
import { MusicPlayer } from '../../../utils/music/musicPlayer';
import { ShipTemplate } from '../../../data/ships/shipTemplate';
import { exampleMultiStepMission } from '../../../data/missions/missionData';
import { CombatSystems } from '../../../world/systems/combatSystems';

const divFps = document.getElementById("fps");
export class InstantActionScene implements GameScene, IDisposable {

  hud: CombatHud
  gameover: boolean
  readyTimer = 0
  gameoverTimer = 0
  score: Score
  stats: NerdStats

  // systems

  spaceDebrisSystem: SpaceDebrisSystem
  skyboxSystems: SkyboxSystems
  combatSystems: CombatSystems = new CombatSystems()

  missionTracker = new MissionTracker()

  combatEntities = new Set<Entity>()
  disposibles = new Set<IDisposable>()

  constructor(private playerShip?: ShipTemplate) {
    console.log("[InstantAction.singleplayer] created")
    const appContainer = AppContainer.instance
    this.skyboxSystems = new SkyboxSystems(appContainer.scene)
    this.spaceDebrisSystem = new SpaceDebrisSystem(appContainer.scene)
    world.onEntityAdded.subscribe(this.onCombatEntityAdded)
    world.onEntityRemoved.subscribe(this.onCombatEntityRemoved)
    // NOTE: if this gets to taking too long we should move it out of the constructor and into a initialize generator function
    damageSprayParticlePool.prime(50)
    damagedSystemsSprayParticlePool.prime(20)
    
    this.hud = new CombatHud()
    this.readyTimer = 3000
    
    MusicPlayer.instance.playSong("action")
    MusicPlayer.instance.playStinger("encounter")

    // appContainer.player = new PlayerAgent(this.playerShip)
    // const playerEntity = appContainer.player.playerEntity;
    // playerEntity.score = { livesLeft: 1, timeLeft: 900, total: 1000 }
    
    this.missionTracker.setMission(exampleMultiStepMission, this.playerShip)
    const playerEntity = appContainer.player.playerEntity;
    this.stats = playerEntity.nerdStats

    document.body.style.cursor = "none";
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

    // reset cursor
    document.body.style.cursor = "auto";
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

  runLoop = (delta: number) => {
    const appContainer = AppContainer.instance
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    if (this.gameover) {
      this.gameoverTimer -= delta
      this.hud.updateScreen(delta)
      if (this.gameoverTimer < 0) {
        MusicPlayer.instance.playStinger("fail")
        queries.deathComes.onEntityAdded.unsubscribe(this.onDeath)
        this.onDeath = undefined
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
    divFps.innerHTML = engine.getFps().toFixed() + " fps";
  };
}