import { Debounce, DebounceTimedMulti } from './../../utils/debounce';
import { GameScene } from '../gameScene';
import { AppContainer } from "../../app.container";
import { ModelViewerScreen } from './modelViewerScreen';
import { ArcFollowCamera, ArcRotateCamera, Color3, Color4, ColorGradient, DeviceSourceManager, DeviceType, FactorGradient, IDisposable, Mesh, MeshBuilder, Ray, RayHelper, Scalar, StandardMaterial, TmpVectors, Vector3 } from '@babylonjs/core';
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
import { KeyboardMap } from '../../utils/keyboard';
import { registerHit } from '../../world/damage';

const divFps = document.getElementById("fps");
const Radius = 500;
export class ModelViewerScene implements GameScene, IDisposable {

  screen: ModelViewerScreen
  scaleBox: Mesh
  cameraEntity: Entity
  ship: Entity

  debouncer = new DebounceTimedMulti()

  testSPS: MercParticleSystem

  constructor() {
    const appContainer = AppContainer.instance
    this.screen = new ModelViewerScreen()
    // let box = MeshBuilder.CreateBox("Scale Box", { size: 100 }, AppContainer.instance.scene)
    // let wrfrm = new StandardMaterial("Scale Box Wireframe")
    // wrfrm.wireframe = true
    // box.material = wrfrm
    // this.scaleBox = box
    // box.position.y = 25
    // box.isPickable = false
    appContainer.camera.detachControl()
    appContainer.scene.removeCamera(appContainer.camera)
    appContainer.camera.dispose
    appContainer.camera = new ArcRotateCamera("ModelViewerCamera", ToRadians(45), 0, Radius, Vector3.Zero(), appContainer.scene)
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
    // this.scaleBox.dispose()
    // this.scaleBox = undefined
    this.screen.dispose()
    this.screen = undefined
  }

  setup() {

    let model = createShip(EnemyLight, 0, 0, 0);
    world.update(model, "ai", { type: "demoLoop", blackboard: model.ai.blackboard })
    this.ship = model
    this.ship.ai.type = undefined
    
    // let testSpawnEmitter = new MercParticleSphereEmitter()
    // const scene = AppContainer.instance.scene
    // this.testSPS = MercParticles.fireSmokeTrail("testSmoke", scene, testSpawnEmitter)
    // this.testSPS.begin()

    // let pointEmitter = new MercParticlePointEmitter()
    // pointEmitter.position.y = 25
    // let explostion = MercParticles.damagedSystemsSpray("damagetest", scene, pointEmitter);

    // let box = MeshBuilder.CreateBox("SPS Box", { size: 100 }, scene)
    // let wrfrm = new StandardMaterial("meh")
    // wrfrm.wireframe = true
    // box.material = wrfrm
    // let movementDir = 1
    // let explodeCount = 0
    // AppContainer.instance.scene.onBeforeRenderObservable.add(() => {
    //   testSpawnEmitter.position.x += (10 * 1/30) * movementDir
    //   box.position.x += (10 * 1/30) * movementDir
    //   if (box.position.x > 100 || box.position.x < -100) {
    //     movementDir = -movementDir
    //   }
    //   explodeCount += 1;
    //   if (explodeCount > 100) {
    //     explodeCount -= 100;
    //     explostion.begin()
    //   }
    // })
  }

  checkInput(dt: number) {

    const appContainer = AppContainer.instance
    const dsm = new DeviceSourceManager(appContainer.engine)
    const kbd = dsm.getDeviceSource(DeviceType.Keyboard)
    const camera = appContainer.camera as ArcRotateCamera
    // "UP" [38]
    if (kbd?.getInput(KeyboardMap.D) && this.debouncer.tryNow(KeyboardMap.D)) {
      const ray = new Ray(camera.position, new Vector3(this.ship.position.x, this.ship.position.y, this.ship.position.z).subtract(camera.position))
      const pickedInfo = appContainer.scene.pickWithRay(ray)
      // const intersects = ray.intersectsMesh(this.ship.physicsMesh)
      if (pickedInfo.hit) {
        console.log(pickedInfo.pickedPoint)
        registerHit(this.ship, {damage: 1, originatorId: "-1"}, pickedInfo.pickedPoint)
        // let box = MeshBuilder.CreateBox("test box", { size: 1 })
        // box.position.copyFrom(pickedInfo.pickedPoint)
      }
    }
    // "DOWN" [40]
    if (kbd?.getInput(KeyboardMap.K)) {

    }
    if (kbd?.getInput(KeyboardMap.A) && this.debouncer.tryNow(KeyboardMap.A)) {
      if (this.ship.ai.type == undefined) {
        this.ship.ai.type = "demoLoop"
      } else {
        this.ship.ai.type = undefined
      }
    }
  }

  runLoop = (delta: number) => {
    const appContainer = AppContainer.instance
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    this.screen.updateScreen(delta)

    this.checkInput(delta)
    gunCooldownSystem(delta)
    shieldRechargeSystem(delta)
    engineRechargeSystem(delta)
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
