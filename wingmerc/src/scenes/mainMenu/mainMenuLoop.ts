import { SpaceDebrisSystem } from "./../../world/systems/visualsSystems/spaceDebrisSystem"
import { DriftTrailSystem } from "./../../world/systems/renderSystems/driftTrailSystem"
import { FreeCamera, IDisposable, TargetCamera, TmpVectors, Vector3 } from "@babylonjs/core"
import { AppContainer } from "../../app.container"
import { MainMenuScreen } from "./mainMenuScreen"
import { CreateEntity, Entity, queries, world } from "../../world/world"
import { gunCooldownSystem } from "../../world/systems/shipSystems/gunCooldownSystem"
import { shieldRechargeSystem } from "../../world/systems/shipSystems/shieldRechargeSystem"
import { powerPlantRechargeSystem } from "../../world/systems/shipSystems/engineRechargeSystem"
import { aiSystem } from "../../world/systems/ai/aiSystem"
import { moveSystem } from "../../world/systems/moveSystem"
import { rotationalVelocitySystem } from "../../world/systems/rotationalVelocitySystem"
import { radarTargetingSystem } from "../../world/systems/shipSystems/radarTargetingSystem"
import { particleSystem } from "../../world/systems/weaponsSystems/particleSystem"
import { missileSteeringSystem } from "../../world/systems/weaponsSystems/missileSteeringSystem"
import { missileTargetingSystem } from "../../world/systems/weaponsSystems/missileTargetingSystem"
import { shieldPulserSystem } from "../../world/damage"
import { updateRenderSystem } from "../../world/systems/renderSystems/updateRenderSystem"
import { createCustomShip } from "../../world/factories"
import { ShipTemplate } from "../../data/ships/shipTemplate"
import { Ships } from "../../data/ships"
import { randomItem } from "../../utils/random"
import { QuaternionFromObj, Vector3FromObj, pointInSphere } from "../../utils/math"
import { MissileEngineSoundSystem } from "../../world/systems/soundSystems/missileEngineSoundSystem"
import { DeathRattleSystem } from "../../world/systems/deathRattleSystem"
import { UpdatePhysicsSystem } from "../../world/systems/renderSystems/updatePhysicsSystem"
import { MeshedSystem } from "../../world/systems/renderSystems/meshedSystem"
import { TrailersSystem } from "../../world/systems/renderSystems/trailersSystem"
import { AfterburnerSoundSystem } from "../../world/systems/soundSystems/afterburnerSoundSystem"
import { DriftSoundSystem } from "../../world/systems/soundSystems/driftSoundSystem"
import { AfterburnerTrailsSystem } from "../../world/systems/renderSystems/afterburnerTrailsSystem"
import { SystemsDamagedSpraySystem } from "../../world/systems/renderSystems/systemsDamagedSpraySystem"
import { MusicPlayer } from "../../utils/music/musicPlayer"
import { fuelConsumptionSystem } from "../../world/systems/shipSystems/fuelConsumptionSystem"
import { moveCommandSystem } from "../../world/systems/controlSystems/moveCommandSystem"
import { SkyboxNebulaSystem } from "../../world/systems/visualsSystems/skyboxNebulaSystem"
import { SkyboxSystems } from "../../world/systems/visualsSystems/skyboxSystems"
import { VRSystem } from "../../world/systems/renderSystems/vrSystem"
import { MotionHands } from "../../world/systems/input/vr/motionHands"
import { weaponCommandSystem } from "../../world/systems/controlSystems/weaponCommandSystem"
import { debugLog } from "../../utils/debuglog"

const ShipClasses = ["EnemyLight01", "EnemyMedium01", "EnemyMedium02", "EnemyHeavy01"]
const divFps = document.getElementById("fps")

export class MainMenuScene implements IDisposable {
  screen: MainMenuScreen
  cameraEntity: Entity
  screenEntities = new Set<Entity>()
  demoShips = new Set<Entity>()
  camera: TargetCamera

  keepSkybox: boolean = false

  teamA = new Set<Entity>()
  teamB = new Set<Entity>()
  teamC = new Set<Entity>()

  // systems
  skyboxSystems: SkyboxSystems
  spaceDebrisSystem: SpaceDebrisSystem
  missileEngineSoundSystem = new MissileEngineSoundSystem()
  deathRattleSystem = new DeathRattleSystem()
  updatePhysicsSystem = new UpdatePhysicsSystem()
  meshedSystem = new MeshedSystem()
  trailersSystem = new TrailersSystem()
  afterburnerSoundsSystem = new AfterburnerSoundSystem()
  driftSoundSystem = new DriftSoundSystem()
  driftTrailSystem = new DriftTrailSystem()
  afterburnerTrailsSystem = new AfterburnerTrailsSystem()
  systemsDamagedSpraySystem = new SystemsDamagedSpraySystem()

  handsSystem = new MotionHands()

  constructor() {
    this.screen = new MainMenuScreen()

    for (const camera of queries.cameras) {
      world.remove(camera)
    }
    const appContainer = AppContainer.instance
    appContainer.camera.detachControl()
    appContainer.scene.removeCamera(appContainer.camera)
    appContainer.camera.dispose()
    appContainer.camera = new TargetCamera("MainMenuCamera", Vector3.Zero(), appContainer.scene)
    this.camera = appContainer.camera as FreeCamera
    appContainer.camera.attachControl()
    appContainer.camera.maxZ = 50000
    appContainer.camera.minZ = 0.1
    this.cameraEntity = CreateEntity({
      targetName: "debug camera",
      camera: "debug",
    })
    setTimeout(() => {
      appContainer.scene.activeCamera = this.camera
    }, 1)
    world.onEntityAdded.subscribe(this.onScreenEntityAdded)
    world.onEntityRemoved.subscribe(this.onScreenEntityRemoved)

    queries.deathComes.onEntityRemoved.subscribe(this.onDeath)

    if (true) {
      const teams = [this.teamA, this.teamB, this.teamB]
      teams.forEach((team, teamId) => {
        for (let i = 0; i < 3; i += 1) {
          team.add(this.addShip(teamId + 1))
        }
      })
    } else {
      this.teamA.add(this.addShip(1))
    }
    MusicPlayer.instance.playSong("theme")
    this.skyboxSystems = new SkyboxSystems(appContainer.scene)
    this.spaceDebrisSystem = new SpaceDebrisSystem(appContainer.scene)
  }

  dispose(): void {
    world.onEntityAdded.unsubscribe(this.onScreenEntityAdded)
    world.onEntityRemoved.unsubscribe(this.onScreenEntityRemoved)
    queries.deathComes.onEntityAdded.unsubscribe(this.onDeath)
    world.remove(this.cameraEntity)

    this.cameraEntity = undefined
    this.screen.dispose()
    this.screen = undefined
    this.teamA.clear()
    this.teamB.clear()
    this.teamC.clear()
    for (const entity of this.screenEntities) {
      debugLog("[MainMenu] removing entity", entity)
      world.remove(entity)
    }
    this.screenEntities.clear()
    this.demoShips.clear()
    this.camera = undefined

    // systems
    if (!this.keepSkybox) {
      this.skyboxSystems.dispose()
    }
    this.spaceDebrisSystem.dispose()
    // dispose systems last since they help with cleanup
    this.missileEngineSoundSystem.dispose()
    this.deathRattleSystem.dispose()
    this.updatePhysicsSystem.dispose()
    this.meshedSystem.dispose()
    this.trailersSystem.dispose()
    this.afterburnerSoundsSystem.dispose()
    this.driftSoundSystem.dispose()
    this.driftTrailSystem.dispose()
    this.afterburnerTrailsSystem.dispose()
    this.systemsDamagedSpraySystem.dispose()

    this.handsSystem.dispose()
  }

  onScreenEntityAdded = (entity: Entity) => {
    this.screenEntities.add(entity)
  }

  onScreenEntityRemoved = (entity: Entity) => {
    this.screenEntities.delete(entity)
  }

  onDeath = (entity: Entity) => {
    this.demoShips.delete(entity)
    if (this.teamA.has(entity)) {
      this.teamA.delete(entity)
      this.teamA.add(this.addShip(1))
    } else if (this.teamB.has(entity)) {
      this.teamB.delete(entity)
      this.teamB.add(this.addShip(2))
    } else if (this.teamC.has(entity)) {
      this.teamC.delete(entity)
      this.teamC.add(this.addShip(3))
    }
  }

  addShip(team: number): Entity {
    const shipClass: ShipTemplate = Ships[randomItem(ShipClasses)]
    const newPosition = pointInSphere(4000, undefined, TmpVectors.Vector3[0])
    let newShip = createCustomShip(shipClass, newPosition.x, newPosition.y, newPosition.z, team, 1)
    world.addComponent(newShip, "missionDetails", {
      missionLocations: [
        {
          id: 1,
          name: "Arena Point",
          isNavPoint: false,
          position: { x: 0, y: 0, z: 0 },
        },
      ],
      mission: "Patrol",
    })
    this.demoShips.add(newShip)
    return newShip
  }

  runLoop = (delta: number) => {
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    // don't start the game while menu is open
    this.screen.updateScreen(delta)

    this.skyboxSystems.update(delta)
    this.spaceDebrisSystem.update(delta)
    // systems for demo ships
    gunCooldownSystem(delta)
    shieldRechargeSystem(delta)
    powerPlantRechargeSystem(delta)
    fuelConsumptionSystem(delta)
    aiSystem(delta)
    moveCommandSystem(delta)
    weaponCommandSystem()
    rotationalVelocitySystem()
    moveSystem(delta)
    radarTargetingSystem(delta)
    particleSystem()
    missileSteeringSystem(delta)
    missileTargetingSystem(delta)
    shieldPulserSystem.update(delta)

    this.handsSystem.update(delta)

    updateRenderSystem()
    this.cameraSystem(delta)

    this.screen.update()
    scene.render()
    divFps.innerHTML = engine.getFps().toFixed() + " fps"
    return
  }

  cameraAgg = Number.MAX_SAFE_INTEGER
  cameraShip: Entity
  cameraSystem(delta: number) {
    // Calculate the center point between the two nodes
    if (VRSystem.inXR) {
      VRSystem.xrCameraParent.position.setAll(0)
      return
    }
    this.cameraAgg += delta
    if (this.cameraAgg / 1000 / 15 > 1 || world.has(this.cameraShip) == false) {
      this.cameraAgg = 0
      this.cameraShip = randomItem(Array.from(this.teamA.keys())) // this is heavy handed...
    }
    // follow cam
    const first = this.cameraShip
    const firstPosition = Vector3FromObj(first.position, TmpVectors.Vector3[0])
    const firstRotation = QuaternionFromObj(first.rotationQuaternion, TmpVectors.Quaternion[1])
    const firstDirection = Vector3FromObj(first.direction)

    const backDistanceOffset = 50
    const upDistanceOffset = 50
    const behind = firstDirection
      .multiplyByFloats(-1, -1, -1)
      .multiplyByFloats(backDistanceOffset, backDistanceOffset, backDistanceOffset)
      .addInPlace(firstPosition)
    const upOffset = Vector3.Up()
    upOffset.rotateByQuaternionToRef(firstRotation, upOffset)
    upOffset.multiplyInPlace(TmpVectors.Vector3[5].set(upDistanceOffset, upDistanceOffset, upDistanceOffset))
    behind.addInPlace(upOffset)
    if (isNaN(behind.x)) {
      debugger
    }
    Vector3.LerpToRef(this.camera.position, behind, 0.1, this.camera.position)
    this.camera.setTarget(firstPosition)
    return
  }
}
