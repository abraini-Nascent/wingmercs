import { Afterburners } from './../../data/components/afterburners';
import { DebounceTimedMulti } from './../../utils/debounce';
import { GameScene } from '../gameScene';
import { AppContainer } from "../../app.container";
import { ModelViewerScreen } from './modelViewerScreen';
import { ArcRotateCamera, Axis, Color3, DeviceSourceManager, DeviceType, IDisposable, Material, Mesh, MeshBuilder, Ray, Sound,  Space,  StandardMaterial,  Texture,  Vector3 } from '@babylonjs/core';
import { ToRadians } from '../../utils/math';
import { CreateEntity, Entity, world } from '../../world/world';
import { MercParticleSystem } from '../../utils/particles/mercParticleSystem';
import { Broadsword, Dirk, EnemyHeavy01, EnemyLight01, EnemyMedium01, EnemyMedium02, Rapier, Saber } from '../../data/ships';
import { gunCooldownSystem } from '../../world/systems/shipSystems/gunCooldownSystem';
import { shieldRechargeSystem } from '../../world/systems/shipSystems/shieldRechargeSystem';
import { powerPlantRechargeSystem } from '../../world/systems/shipSystems/engineRechargeSystem';
import { aiSystem } from '../../world/systems/ai/aiSystem';
import { moveSystem} from '../../world/systems/moveSystem';
import { rotationalVelocitySystem } from '../../world/systems/rotationalVelocitySystem';
import { radarTargetingSystem } from '../../world/systems/shipSystems/radarTargetingSystem';
import { particleSystem } from '../../world/systems/weaponsSystems/particleSystem';
import { missileSteeringSystem } from '../../world/systems/weaponsSystems/missileSteeringSystem';
import { missileTargetingSystem } from '../../world/systems/weaponsSystems/missileTargetingSystem';
import { updateRenderSystem } from '../../world/systems/renderSystems/updateRenderSystem';
import { createCustomShip } from '../../world/factories';
import { KeyboardMap } from '../../utils/keyboard';
import { damageSprayParticlePool, registerHit, shieldPulserSystem } from '../../world/damage';
import SamJs from 'sam-js';
import { translateIPA } from '../../data/IAP';
import { barks } from '../../data/barks';
import { CreatAudioSource } from '../../utils/speaking';
import { damagedSystemsSprayParticlePool } from '../../visuals/damagedSystemsSprayParticles';
import { moveCommandSystem } from '../../world/systems/controlSystems/moveCommandSystem';
import { MissileEngineSoundSystem } from '../../world/systems/soundSystems/missileEngineSoundSystem';
import { DeathRattleSystem } from '../../world/systems/deathRattleSystem';
import { UpdatePhysicsSystem } from '../../world/systems/renderSystems/updatePhysicsSystem';
import { WeaponCommandSystem } from '../../world/systems/controlSystems/weaponCommandSystem';
import { MeshedSystem } from '../../world/systems/renderSystems/meshedSystem';
import { TrailersSystem } from '../../world/systems/renderSystems/trailersSystem';
import { AfterburnerSoundSystem } from '../../world/systems/soundSystems/afterburnerSoundSystem';
import { DriftSoundSystem } from '../../world/systems/soundSystems/driftSoundSystem';
import { AfterburnerTrailsSystem } from '../../world/systems/renderSystems/afterburnerTrailsSystem';
import { SystemsDamagedSpraySystem } from '../../world/systems/renderSystems/systemsDamagedSpraySystem';
import { Epee } from '../../data/ships/epee';
import { DriftTrailSystem } from '../../world/systems/renderSystems/driftTrailSystem';
import { TextureUrls } from '../../assetLoader/textures';

const divFps = document.getElementById("fps");

const Radius = 500;
export class ModelViewerScene implements GameScene, IDisposable {

  screen: ModelViewerScreen
  scaleBox: Mesh
  cameraEntity: Entity
  ship: Entity
  ships: Entity[] = []

  debouncer = new DebounceTimedMulti()

  testSPS: MercParticleSystem

  // systems
  missileEngineSoundSystem = new MissileEngineSoundSystem()
  deathRattleSystem = new DeathRattleSystem()
  updatePhysicsSystem = new UpdatePhysicsSystem()
  weaponCommandSystem = new WeaponCommandSystem()
  meshedSystem = new MeshedSystem()
  trailersSystem = new TrailersSystem()
  afterburnerSoundsSystem = new AfterburnerSoundSystem()
  driftSoundSystem = new DriftSoundSystem()
  dirsftTrailSystem = new DriftTrailSystem()
  afterburnerTrailsSystem = new AfterburnerTrailsSystem()
  systemsDamagedSpraySystem = new SystemsDamagedSpraySystem()

  constructor() {
    divFps.style.height = "175px"
    divFps.style.textAlign = "left"
    divFps.style.width = "150px"
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
    this.cameraEntity = CreateEntity({
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
    this.dirsftTrailSystem.dispose()
    this.afterburnerTrailsSystem.dispose()
    this.systemsDamagedSpraySystem.dispose()
  }

  setup() {

    let ship = structuredClone(Broadsword)
    // let model1 = createCustomShip(Dirk, -100, 0, -1000, 2, 1);
    let model1 = createCustomShip(ship, -100, 0, -1000, 2, 1);
    world.addComponent(model1, "missionDetails", {
      patrolPoints: [Vector3.Zero()],
      mission: "Patrol"
    })
    // world.update(model, "ai", { type: "demoLeader", blackboard: model.ai.blackboard })
    
    // this.ship.ai.type = undefined

    let model2 = createCustomShip(EnemyMedium01, 100, 0, 1000, 3, 1);
    world.addComponent(model2, "missionDetails", {
      patrolPoints: [Vector3.Zero()],
      mission: "Patrol"
    })

    
    this.ship = model1

    // let model3 = createCustomShip(EnemyMedium02, 0, 0, 2000, 1, 1);
    // world.addComponent(model3, "missionDetails", {
    //   patrolPoints: [Vector3.Zero()],
    //   mission: "Patrol"
    // })
    // let model4 = createCustomShip(EnemyHeavy01, -50, 0, 0, 2, 1);
    // world.addComponent(model4, "missionDetails", {
    //   patrolPoints: [Vector3.Zero()],
    //   mission: "Patrol"
    // })
    // let model5 = createCustomShip(EnemyHeavy01, -50, 0, 0, 2, 1);
    // world.addComponent(model5, "missionDetails", {
    //   patrolPoints: [Vector3.Zero()],
    //   mission: "Patrol"
    // })
    // let model6 = createCustomShip(EnemyHeavy01, -50, 0, 0, 2, 1);
    // world.addComponent(model6, "missionDetails", {
    //   patrolPoints: [Vector3.Zero()],
    //   mission: "Patrol"
    // })
    this.ships.push(model1, model2)//, model3)//, model4, model5, model6)
    // world.addComponent(model2, "missionDetails", {
    //   patrolPoints: [Vector3.Zero()]
    // })
    // world.update(model2, "ai", { type: "demoWingman", blackboard: model.ai.blackboard })
    // model2.ai.type = undefined

    // let model3 = createCustomShip(EnemyMedium02, 50, 0, 0);
    // world.update(model3, "ai", { type: "demoLoop", blackboard: model.ai.blackboard })
    // model3.ai.type = undefined

    // let model4 = createCustomShip(EnemyHeavy01, 100, 0, 0);
    // world.update(model4, "ai", { type: "demoLoop", blackboard: model.ai.blackboard })
    // model4.ai.type = undefined

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
          registerHit(this.ship, {damage: 20, originatorId: ""}, pickedInfo.pickedPoint)
          // let box = MeshBuilder.CreateBox("test box", { size: 1 })
          // box.position.copyFrom(pickedInfo.pickedPoint)
        }
      }
    }
    // "DOWN" [40]
    if (kbd?.getInput(KeyboardMap.K) && this.debouncer.tryNow(KeyboardMap.K)) {
      let shipIndex = this.ships.indexOf(this.ship)
      let nextShip = shipIndex += 1
      if (nextShip > this.ships.length-1) {
        nextShip = 0
      }
      this.ship = this.ships[nextShip]
    }
    if (kbd?.getInput(KeyboardMap.A) && this.debouncer.tryNow(KeyboardMap.A) && world.has(this.ship)) {
      for (const ship of this.ships) {
        ship.ai.blackboard.intelligence.objective = "BreakFormation"
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
    powerPlantRechargeSystem(delta)
    aiSystem(delta)
    moveCommandSystem(delta)
    rotationalVelocitySystem()
    moveSystem(delta)
    radarTargetingSystem(delta)
    particleSystem()
    missileSteeringSystem(delta)
    missileTargetingSystem(delta)
    aiSystem(delta)
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
    divFps.innerHTML += "<br/>mission: " +this.ship.ai.blackboard.intelligence.mission
    divFps.innerHTML += "<br/>objective: " +this.ship.ai.blackboard.intelligence.objective
    divFps.innerHTML += "<br/>tactic: " +this.ship.ai.blackboard.intelligence.tactic
    divFps.innerHTML += "<br/>SoH: " +this.ship.ai.blackboard.intelligence.stateOfHealth
    divFps.innerHTML += "<br/>SoC: " +this.ship.ai.blackboard.intelligence.stateOfConfrontation
    divFps.innerHTML += "<br/>maneuver: " +this.ship.ai.blackboard.intelligence.maneuver
  };
}
