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
import { AsteroidScene } from '../../map/asteroidScene';

const divFps = document.getElementById("fps");

export class SpaceCombatScene implements GameScene {

  spaceDebris: SpaceDebrisAgent
  asteroidScene: AsteroidScene

  constructor() {
    const appContainer = AppContainer.instance
    this.spaceDebris = new SpaceDebrisAgent(appContainer.scene)
    // NOTE: if this gets to taking too long we should move it out of the constructor and into a initialize generator function
    this.asteroidScene = new AsteroidScene(10, ArenaRadius)
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