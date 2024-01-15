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
import { updateRenderSystem } from "../../world/systems/updateRenderSystem";
import { SpaceDebrisAgent } from '../../agents/spaceDebrisAgent';
import { AsteroidScene, createEnemyShip } from '../../map/asteroidScene';
import { Entity, queries } from '../../world/world';
import * as Ships from '../../data/ships';
import { random } from '../../utils/random';
import { CombatHud } from './spaceCombatHUD';

const divFps = document.getElementById("fps");
const radius = 5000;
export class SpaceCombatScene implements GameScene {

  spaceDebris: SpaceDebrisAgent
  asteroidScene: AsteroidScene
  totalKillCount: number = 0
  waveCount: number = 0
  waveKillCount: number = 0
  lastSpawnCount: number = 0
  hud: CombatHud

  constructor() {
    const appContainer = AppContainer.instance
    this.spaceDebris = new SpaceDebrisAgent(appContainer.scene)
    // NOTE: if this gets to taking too long we should move it out of the constructor and into a initialize generator function
    this.asteroidScene = new AsteroidScene(10, ArenaRadius)
    queries.deathComes.onEntityAdded.subscribe(this.onDeath)
    this.hud = new CombatHud()
    this.spawnShips()
  }

  deinit() {
    queries.deathComes.onEntityAdded.unsubscribe(this.onDeath)
  }

  onDeath = (entity: Entity) => {
    if (entity.playerId != undefined) {
      // TODO: the player died
      return
    }
    this.totalKillCount += 1
    this.waveKillCount += 1
    const endOfBlock = this.waveKillCount == 3
    // heal the player and reset weapons if they have killed three enemies
    if (this.lastSpawnCount == this.waveKillCount) {
      this.waveCount += 1
      this.waveKillCount = 0
      this.spawnShips()
    }
    if (endOfBlock) {
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
  }

  spawnShips() {
    let newShipAmount = this.lastSpawnCount + 1
    if (newShipAmount > 3) {
      newShipAmount = 1
    }
    this.lastSpawnCount = 0
    for (let i = 0; i < newShipAmount; i += 1) {
      const r = radius * random()
      const phi = random() * Math.PI * 2;
      const costheta = 2 * random() - 1;
      const theta = Math.acos(costheta);
      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(theta);
      const playerEntityPosition = AppContainer.instance.player.playerEntity.position
      // add enemy ship
      createEnemyShip(x + playerEntityPosition.x, y + playerEntityPosition.y, z + playerEntityPosition.z)
      this.lastSpawnCount += 1
    }
  }

  runLoop = (delta: number) => {
    const appContainer = AppContainer.instance
    const scene = AppContainer.instance.scene
    gunCooldownSystem(delta)
    shieldRechargeSystem(delta)
    engineRechargeSystem(delta)
    gameInputSystem(delta)
    aiSystem(delta)
    moveCommandSystem(delta)
    rotationalVelocitySystem()
    moveSystem(delta)
    particleSystem()
    missileSteeringSystem(delta)
    missileTargetingSystem(delta)
    warpSystem()
    if (appContainer.server) {
      netSyncServerSystem(delta)
    } else {
      netSyncClientSystem(delta)
    }
    updateRenderSystem()
    if (this.spaceDebris) {
      this.spaceDebris.update(delta)
    }
    cameraSystem(appContainer.player, appContainer.camera)
    this.hud.updateScreen(delta)
  
    // show debug axis
    // if (this.player?.playerEntity?.node) {
    // if (window.velocity == undefined) {
    //   let ball = MeshBuilder.CreateBox("velocity", {
    //     size: 1.0
    //   })
    //   window.velocity = ball
    // }
    //   if (window.driftVelocity == undefined) {
    //     let ball = MeshBuilder.CreateBox("driftVelocity", {
    //       size: 5.0
    //     })
    //     window.driftVelocity = ball
    //   }
    //   if (this.player.playerEntity.velocity) {
    //     let ball = window.velocity as Mesh
    //     ball.position.x = this.player.playerEntity.position.x + (this.player.playerEntity.velocity.x) 
    //     ball.position.y = this.player.playerEntity.position.y + (this.player.playerEntity.velocity.y) 
    //     ball.position.z = this.player.playerEntity.position.z + (this.player.playerEntity.velocity.z)
    //     if (this.player.playerEntity.breakingVelocity) {
    //       ball.position.x += this.player.playerEntity.breakingVelocity.x
    //       ball.position.y += this.player.playerEntity.breakingVelocity.y
    //       ball.position.z += this.player.playerEntity.breakingVelocity.z
    //     }
    //   }
    //   let ball = window.driftVelocity as Mesh
    //   if (this.player.playerEntity.driftVelocity) {
    //     ball.isVisible = true
    //     ball.position.x = this.player.playerEntity.position.x + (this.player.playerEntity.driftVelocity.x)
    //     ball.position.y = this.player.playerEntity.position.y + (this.player.playerEntity.driftVelocity.y)
    //     ball.position.z = this.player.playerEntity.position.z + (this.player.playerEntity.driftVelocity.z)
        
    //   } else {
    //     ball.isVisible = false
    //   }
    // }
  
    scene.render()
    // divFps.innerHTML = engine.getFps().toFixed() + " fps";
    if (appContainer.player?.playerEntity?.currentSpeed) {
      divFps.innerHTML = `${appContainer.player?.playerEntity?.currentSpeed.toFixed(0) ?? 0} mps`;
    }
  };
}