import { GameScene } from '../gameScene';
import { AppContainer } from "../../app.container";
import { ModelViewerScreen } from './modelViewerScreen';
import { ArcFollowCamera, ArcRotateCamera, Color3, Color4, ColorGradient, FactorGradient, IDisposable, Mesh, MeshBuilder, Scalar, StandardMaterial, TmpVectors, Vector3 } from '@babylonjs/core';
import { ToRadians } from '../../utils/math';
import { AIType, Entity, ShipArmor, ShipShields, ShipSystems, world } from '../../world/world';
import { MercParticleSystem } from '../../utils/particles/mercParticleSystem';
import { random } from '../../utils/random';
import { MercParticlePointEmitter, MercParticleSphereEmitter } from '../../utils/particles/mercParticleEmitters';
import { MercParticles } from '../../utils/particles/mercParticles';
import { EnemyLight } from '../../data/ships';
import * as Guns from '../../data/guns';
import { Gun } from '../../data/guns/gun';
import { net } from '../../net';
import { gunCooldownSystem } from '../../world/systems/gunCooldownSystem';
import { shieldRechargeSystem } from '../../world/systems/shieldRechargeSystem';
import { engineRechargeSystem } from '../../world/systems/engineRechargeSystem';
import { gameInputSystem } from '../../world/systems/gameInputSystem';
import { aiSystem } from '../../world/systems/aiSystem';
import { moveCommandSystem, moveSystem, warpSystem } from '../../world/systems/moveSystem';
import { rotationalVelocitySystem } from '../../world/systems/rotationalVelocitySystem';
import { radarTargetingSystem } from '../../world/systems/radarTargetingSystem';
import { particleSystem } from '../../world/systems/particleSystem';
import { missileSteeringSystem } from '../../world/systems/missileSteeringSystem';
import { missileTargetingSystem } from '../../world/systems/missileTargetingSystem';
import { updateRenderSystem } from '../../world/systems/updateRenderSystem';
import { createShip } from '../../world/factories';

const divFps = document.getElementById("fps");
const Radius = 500;
export class ModelViewerScene implements GameScene, IDisposable {

  screen: ModelViewerScreen
  scaleBox: Mesh
  cameraEntity: Entity
  ship: Entity

  testSPS: MercParticleSystem

  constructor() {
    const appContainer = AppContainer.instance
    this.screen = new ModelViewerScreen()
    let box = MeshBuilder.CreateBox("Scale Box", { size: 100 }, AppContainer.instance.scene)
    let wrfrm = new StandardMaterial("Scale Box Wireframe")
    wrfrm.wireframe = true
    box.material = wrfrm
    this.scaleBox = box
    box.position.y = 25
    appContainer.camera.detachControl()
    appContainer.scene.removeCamera(appContainer.camera)
    appContainer.camera.dispose
    appContainer.camera = new ArcRotateCamera("ModelViewerCamera", ToRadians(45), 0, Radius, box.position, appContainer.scene)
    // appContainer.camera = new ArcFollowCamera("ModelViewerCamera", ToRadians(45), 0, Radius, box, appContainer.scene)
    appContainer.camera.attachControl()
    this.cameraEntity = world.add({
      targetName: "debug camera",
      camera: "debug"
    })

    this.setup()
  }

  dispose() {
    world.remove(this.cameraEntity)
    this.cameraEntity = undefined
    this.scaleBox.dispose()
    this.scaleBox = undefined
    this.screen.dispose()
    this.screen = undefined
  }

  setup() {

    let model = createShip(EnemyLight, 0, 0, 0);
    world.update(model, "ai", { type: "demoLoop", blackboard: model.ai.blackboard })
    this.ship = model
    
    let testSpawnEmitter = new MercParticleSphereEmitter()
    const scene = AppContainer.instance.scene
    this.testSPS = MercParticles.fireSmokeTrail("testSmoke", scene, testSpawnEmitter)
    this.testSPS.begin()

    let pointEmitter = new MercParticlePointEmitter()
    pointEmitter.position.y = 25
    let explostion = MercParticles.damageSpray("damagetest", scene, pointEmitter);

    let box = MeshBuilder.CreateBox("SPS Box", { size: 100 }, scene)
    let wrfrm = new StandardMaterial("meh")
    wrfrm.wireframe = true
    box.material = wrfrm
    let movementDir = 1
    let explodeCount = 0
    AppContainer.instance.scene.onBeforeRenderObservable.add(() => {
      testSpawnEmitter.position.x += (10 * 1/30) * movementDir
      box.position.x += (10 * 1/30) * movementDir
      if (box.position.x > 100 || box.position.x < -100) {
        movementDir = -movementDir
      }
      explodeCount += 1;
      if (explodeCount > 100) {
        explodeCount -= 100;
        explostion.begin()
      }
    })
  }

  runLoop = (delta: number) => {
    const appContainer = AppContainer.instance
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    this.screen.updateScreen(delta)

    gunCooldownSystem(delta)
    shieldRechargeSystem(delta)
    engineRechargeSystem(delta)
    gameInputSystem(delta)
    aiSystem(delta)
    moveCommandSystem(delta)
    rotationalVelocitySystem()
    moveSystem(delta)
    radarTargetingSystem(delta)
    particleSystem()
    missileSteeringSystem(delta)
    missileTargetingSystem(delta)
    aiSystem(delta)
    warpSystem()
    updateRenderSystem()

    let camera = appContainer.camera as ArcRotateCamera
    camera.target.x = this.ship.position.x
    camera.target.y = this.ship.position.y
    camera.target.z = this.ship.position.z

    scene.render()
    divFps.innerHTML = engine.getFps().toFixed() + " fps";
  };
}