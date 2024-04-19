import { FreeCamera, IDisposable, TargetCamera, TmpVectors, Vector3 } from "@babylonjs/core";
import { AppContainer } from "../../app.container";
import { MainMenuScreen } from "./mainMenuScreen";
import { Entity, queries, world } from "../../world/world";
import { gunCooldownSystem } from "../../world/systems/shipSystems/gunCooldownSystem";
import { shieldRechargeSystem } from "../../world/systems/shipSystems/shieldRechargeSystem";
import { engineRechargeSystem } from "../../world/systems/shipSystems/engineRechargeSystem";
import { aiSystem } from "../../world/systems/ai/aiSystem";
import {  moveSystem, } from "../../world/systems/moveSystem";
import { rotationalVelocitySystem } from "../../world/systems/rotationalVelocitySystem";
import { radarTargetingSystem } from "../../world/systems/shipSystems/radarTargetingSystem";
import { particleSystem } from "../../world/systems/weaponsSystems/particleSystem";
import { missileSteeringSystem } from "../../world/systems/weaponsSystems/missileSteeringSystem";
import { missileTargetingSystem } from "../../world/systems/weaponsSystems/missileTargetingSystem";
import { shieldPulserSystem } from "../../world/damage";
import { updateRenderSystem } from "../../world/systems/renderSystems/updateRenderSystem";
import { createShip } from "../../world/factories";
import { ShipDetails } from "../../data/ships/shipDetails";
import * as Ships from "../../data/ships";
import { randomItem } from "../../utils/random";
import { QuaternionFromObj, Vector3FromObj, pointInSphere } from "../../utils/math";
import { MissileEngineSoundSystem } from "../../world/systems/soundSystems/missileEngineSoundSystem";
import { DeathRattleSystem } from "../../world/systems/deathRattleSystem";
import { UpdatePhysicsSystem } from "../../world/systems/renderSystems/updatePhysicsSystem";
import { WeaponCommandSystem } from "../../world/systems/controlSystems/weaponCommandSystem";
import { MeshedSystem } from "../../world/systems/renderSystems/meshedSystem";
import { TrailersSystem } from "../../world/systems/renderSystems/trailersSystem";
import { AfterburnerSoundSystem } from "../../world/systems/soundSystems/afterburnerSoundSystem";
import { DriftSoundSystem } from "../../world/systems/soundSystems/driftSoundSystem";
import { AfterburnerTrailsSystem } from "../../world/systems/renderSystems/afterburnerTrailsSystem";
import { SystemsDamagedSpraySystem } from "../../world/systems/renderSystems/systemsDamagedSpraySystem";
import { MusicPlayer } from "../../utils/music/musicPlayer";
import { fuelConsumptionSystem } from "../../world/systems/shipSystems/fuelConsumptionSystem";
import { moveCommandSystem } from "../../world/systems/controlSystems/moveCommandSystem";

const ShipClasses = ["EnemyLight01", "EnemyMedium01", "EnemyMedium02", "EnemyHeavy01"]

export class MainMenuScene implements IDisposable {
  screen: MainMenuScreen
  cameraEntity: Entity
  screenEntities = new Set<Entity>()
  demoShips = new Set<Entity>()
  camera: TargetCamera

  teamA = new Set<Entity>()
  teamB = new Set<Entity>()
  teamC = new Set<Entity>()

  // systems
  missileEngineSoundSystem = new MissileEngineSoundSystem()
  deathRattleSystem = new DeathRattleSystem()
  updatePhysicsSystem = new UpdatePhysicsSystem()
  weaponCommandSystem = new WeaponCommandSystem()
  meshedSystem = new MeshedSystem()
  trailersSystem = new TrailersSystem()
  afterburnerSoundsSystem = new AfterburnerSoundSystem()
  driftSoundSystem = new DriftSoundSystem()
  afterburnerTrailsSystem = new AfterburnerTrailsSystem()
  systemsDamagedSpraySystem = new SystemsDamagedSpraySystem()

  constructor() {
    this.screen = new MainMenuScreen()
    const appContainer = AppContainer.instance
    appContainer.camera.detachControl()
    appContainer.scene.removeCamera(appContainer.camera)
    appContainer.camera.dispose()
    appContainer.camera = new TargetCamera("MainMenuCamera", Vector3.Zero(), appContainer.scene)
    this.camera = appContainer.camera as FreeCamera

    appContainer.camera.attachControl()
    appContainer.camera.maxZ = 50000
    this.cameraEntity = world.add({
      targetName: "debug camera",
      camera: "debug"
    })

    world.onEntityAdded.subscribe(this.onScreenEntityAdded)
    world.onEntityRemoved.subscribe(this.onScreenEntityRemoved)

    queries.deathComes.onEntityAdded.subscribe(this.onDeath)

    const teams = [this.teamA,this.teamB,this.teamB]
    teams.forEach((team, teamId) => {
      for (let i = 0; i < 3; i += 1) {
        team.add(this.addShip(teamId + 1))
      }
    })
    MusicPlayer.instance.playSong("happy")
  }

  dispose(): void {
    world.onEntityAdded.unsubscribe(this.onScreenEntityAdded)
    world.onEntityRemoved.unsubscribe(this.onScreenEntityRemoved)
    queries.deathComes.onEntityAdded.unsubscribe(this.onDeath)
    world.remove(this.cameraEntity)

    // systems
    this.missileEngineSoundSystem.dispose()
    this.deathRattleSystem.dispose()
    this.updatePhysicsSystem.dispose()
    this.weaponCommandSystem.dispose()
    this.meshedSystem.dispose()
    this.trailersSystem.dispose()
    this.afterburnerSoundsSystem.dispose()
    this.driftSoundSystem.dispose()
    this.afterburnerTrailsSystem.dispose()
    this.systemsDamagedSpraySystem.dispose()

    this.cameraEntity = undefined
    this.screen.dispose()
    this.screen = undefined
    for (const entity of this.screenEntities) {
      console.log("[MainMenu] removing entity", entity)
      world.remove(entity)
    }
    this.screenEntities.clear()
    this.demoShips.clear()
    this.camera = undefined
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
    const shipClass: ShipDetails = Ships[randomItem(ShipClasses)]
    const newPosition = pointInSphere(4000, undefined, TmpVectors.Vector3[0])
    let newShip = createShip(shipClass, newPosition.x, newPosition.y, newPosition.z, team, 1)
    world.addComponent(newShip, "missionDetails", {
      patrolPoints: [new Vector3(0,0,0)],
      mission: "Patrol"
    })
    this.demoShips.add(newShip)
    return newShip
  }

  runLoop = (delta: number) => {
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    // don't start the game while menu is open
    this.screen.updateScreen(delta);

    // systems for demo ships
    gunCooldownSystem(delta)
    shieldRechargeSystem(delta)
    engineRechargeSystem(delta)
    fuelConsumptionSystem(delta)
    aiSystem(delta)
    moveCommandSystem(delta)
    rotationalVelocitySystem()
    moveSystem(delta)
    radarTargetingSystem(delta)
    particleSystem()
    missileSteeringSystem(delta)
    missileTargetingSystem(delta)
    shieldPulserSystem.update(delta)
    updateRenderSystem()
    this.cameraSystem()

    scene.render()
    return;
  }

  cameraSystem() {
    // Calculate the center point between the two nodes
    // follow cam
    const first = Array.from(this.teamA.keys())[0]  // this is heavy handed...
    const second = Array.from(this.teamB.keys())[0]
    const firstPosition = Vector3FromObj(first.position, TmpVectors.Vector3[0])
    const firstRotation = QuaternionFromObj(first.rotationQuaternion, TmpVectors.Quaternion[1])
    const firstDirection = Vector3FromObj(first.direction)
    const secondPosition = Vector3FromObj(second.position, TmpVectors.Vector3[1])
    // console.log(firstPosition, secondPosition)
    const center = Vector3.Center(firstPosition, secondPosition);

    // Calculate the distance between the two nodes
    const distance = Vector3.Distance(firstPosition, secondPosition);

    // Calculate the angle of the camera's field of view
    const fov = this.camera.fov;

    // Calculate the required distance for the camera
    const requiredDistance = distance / (2 * Math.tan(fov / 2));

    // Set camera position to look at the center of the two nodes with the required distance
    let newPosition = this.camera.position.subtract(center).normalize().scale(requiredDistance);
    newPosition.set(Math.abs(newPosition.x), Math.abs(newPosition.y), Math.abs(newPosition.z))
    newPosition = center.subtract(newPosition)


    const behind = firstDirection.multiplyByFloats(-1, -1, -1).multiplyByFloats(150 * 5,150 * 5,150 * 5).addInPlace(firstPosition)
    const upOffset = Vector3.Up()
    upOffset.rotateByQuaternionToRef(firstRotation, upOffset)
    upOffset.multiplyInPlace(TmpVectors.Vector3[5].set(150 * 5, 150 * 5, 150 * 5))
    behind.addInPlace(upOffset)
    this.camera.position.copyFrom(behind)
    this.camera.setTarget(firstPosition)
    return
    // let newPosition = TmpVectors.Vector3[2]
    // newPosition.copyFrom(this.camera.position)
    // newPosition.y = center.y + requiredDistance
    Vector3.LerpToRef(this.camera.position, newPosition, 0.1, this.camera.position)
    // console.log("[MainMenu] camera position", newPosition);
    // this.camera.position = newPosition;

    // Rotate the camera to look at the center
    this.camera.setTarget(center)
  }
}

