import { Debounce, DebounceTimedMulti } from './../../utils/debounce';
import { GameScene } from '../gameScene';
import { AppContainer } from "../../app.container";
import { ModelViewerScreen } from './modelViewerScreen';
import { ArcFollowCamera, ArcRotateCamera, Color3, Color4, ColorGradient, DeviceSourceManager, DeviceType, FactorGradient, IDisposable, Mesh, MeshBuilder, Ray, RayHelper, Scalar, Sound, StandardMaterial, TmpVectors, Vector3 } from '@babylonjs/core';
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
import { damagedSystemsSprayParticlePool, updateRenderSystem } from '../../world/systems/updateRenderSystem';
import { createShip } from '../../world/factories';
import { KeyboardMap } from '../../utils/keyboard';
import { damageSprayParticlePool, registerHit, shieldPulserSystem } from '../../world/damage';
import SamJs from 'sam-js';
import { translateIPA } from '../../data/IAP';
import { barks } from '../../data/barks';
import { CreatAudioSource, RenderAudioBuffer } from '../../utils/speaking';

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
    appContainer.camera.maxZ = 50000
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
    damageSprayParticlePool.prime(50)
    damagedSystemsSprayParticlePool.prime(10)
    
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
      if (world.has(this.ship)) {
        const ray = new Ray(camera.position, new Vector3(this.ship.position.x, this.ship.position.y, this.ship.position.z).subtract(camera.position))
        const pickedInfo = appContainer.scene.pickWithRay(ray)
        // const intersects = ray.intersectsMesh(this.ship.physicsMesh)
        if (pickedInfo.hit) {
          console.log(pickedInfo.pickedPoint)
          registerHit(this.ship, {damage: 20, originatorId: "-1"}, pickedInfo.pickedPoint)
          // let box = MeshBuilder.CreateBox("test box", { size: 1 })
          // box.position.copyFrom(pickedInfo.pickedPoint)
        }
      }
    }
    // "DOWN" [40]
    if (kbd?.getInput(KeyboardMap.K)) {

    }
    if (kbd?.getInput(KeyboardMap.A) && this.debouncer.tryNow(KeyboardMap.A) && world.has(this.ship)) {
      if (this.ship.ai.type == undefined) {
        this.ship.ai.type = "demoLoop"
      } else {
        this.ship.ai.type = undefined
      }
    }
    if (kbd?.getInput(KeyboardMap.T) && this.debouncer.tryNow(KeyboardMap.T)) {
      
/**
 * DESCRIPTION          SPEED     PITCH     THROAT    MOUTH
 * Elf                   72        64        110       160
 * Little Robot          92        60        190       190
 * Stuffy Guy            82        72        110       105
 * Little Old Lady       82        32        145       145
 * Extra-Terrestrial    100        64        150       200
 * SAM                   72        64        128       128
 */
    try {
        let sam = new SamJs({
          debug: true,
          phonetic: true, 
          speed: 52,
          pitch: 64,
          throat: 128,
          mouth: 128
        })
        let woof
        let barkindex = 0
        woof = () => {
          let bark = barks.enemyDeath[barkindex]
          if (!bark) { return }
          let samSentence = translateIPA(bark.ipa, true)
          console.log(`${bark.english}: \\${samSentence}\\`)
          let result = sam.buf32(samSentence, true)
          if (result instanceof Float32Array) {
            // const audioBuffer = RenderAudioBuffer(result)
            const audioBuffer = CreatAudioSource(result)
            let sound = new Sound("test", audioBuffer, undefined, undefined)
            sound.onEndedObservable.addOnce(() => {
              console.log("sam spoke:")
              if (true) {
                barkindex += 1
                setTimeout(() => { woof() }, 1000)
              }
            })
            sound.play()
          }
        }
        woof()
      }
      catch(error) {
        console.log("sam constructor error", error)
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
    shieldPulserSystem.update(delta)
    updateRenderSystem()

    if (world.has(this.ship)) {
      let camera = appContainer.camera as ArcRotateCamera
      camera.target.x = this.ship.position.x
      camera.target.y = this.ship.position.y
      camera.target.z = this.ship.position.z
    }

    scene.render()
    divFps.innerHTML = engine.getFps().toFixed() + " fps";
  };
}
