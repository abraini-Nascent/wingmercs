import { FreeCamera, IDisposable, TargetCamera, TmpVectors, Vector3 } from "@babylonjs/core";
import { AppContainer } from "../../app.container";
import { MainMenuScreen } from "./mainMenuScreen";
import { Entity, queries, world } from "../../world/world";
import { gunCooldownSystem } from "../../world/systems/shipSystems/gunCooldownSystem";
import { shieldRechargeSystem } from "../../world/systems/shipSystems/shieldRechargeSystem";
import { engineRechargeSystem } from "../../world/systems/shipSystems/engineRechargeSystem";
import { aiSystem } from "../../world/systems/aiSystem";
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
import { Vector3FromObj, pointInSphere } from "../../utils/math";
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

const ShipClasses = ["EnemyLight01", "EnemyMedium01", "EnemyMedium02", "EnemyHeavy01"]

export class MainMenuScene implements IDisposable {
  screen: MainMenuScreen
  cameraEntity: Entity
  screenEntities = new Set<Entity>()
  demoShips = new Set<Entity>()
  camera: TargetCamera

  shipFirst: Entity
  shipSecond: Entity

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

    this.shipFirst = this.addShip()
    this.shipSecond = this.addShip()
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
    if (this.shipFirst == entity) {
      this.shipFirst = this.shipSecond
      this.shipSecond = undefined
    } else if (this.shipSecond == entity) {
      this.shipSecond = undefined
    }
    this.shipSecond = this.addShip()
  }

  addShip(): Entity {
    const shipClass: ShipDetails = Ships[randomItem(ShipClasses)]
    const newPosition = pointInSphere(4000, undefined, TmpVectors.Vector3[0])
    let newShip = createShip(shipClass, newPosition.x, newPosition.y, newPosition.z)
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
    aiSystem(delta)
    rotationalVelocitySystem()
    moveSystem(delta)
    radarTargetingSystem(delta)
    particleSystem()
    missileSteeringSystem(delta)
    missileTargetingSystem(delta)
    aiSystem(delta)
    shieldPulserSystem.update(delta)
    updateRenderSystem()
    this.cameraSystem()

    scene.render()
    return;
  }

  cameraSystem() {
    // Calculate the center point between the two nodes
    const firstPosition = Vector3FromObj(this.shipFirst.position, TmpVectors.Vector3[0])
    const secondPosition = Vector3FromObj(this.shipSecond.position, TmpVectors.Vector3[1])
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

