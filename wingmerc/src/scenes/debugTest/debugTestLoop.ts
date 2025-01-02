import { SkyboxSystems } from "../../world/systems/visualsSystems/skyboxSystems"
import { DebounceTimedMulti } from "../../utils/debounce"
import { GameScene } from "../gameScene"
import { AppContainer } from "../../app.container"
import { DebugTestScreen } from "./debugTestScreen"
import {
  ArcRotateCamera,
  Color3,
  DeviceSourceManager,
  DeviceType,
  IDisposable,
  Mesh,
  MeshBuilder,
  Ray,
  StandardMaterial,
  TmpVectors,
  Vector3,
} from "@babylonjs/core"
import { pointInSphere, QuaternionFromObj, ToRadians, Vector3FromObj } from "../../utils/math"
import { CreateEntity, Entity, world } from "../../world/world"
import { MercParticleSystem } from "../../utils/particles/mercParticleSystem"
import {
  Broadsword,
  Dirk,
  EnemyHeavy01,
  EnemyLight01,
  EnemyMedium01,
  EnemyMedium02,
  LiteCarrier,
  Rapier,
  Saber,
} from "../../data/ships"
import { updateRenderSystem } from "../../world/systems/renderSystems/updateRenderSystem"
import { createCustomShip } from "../../world/factories"
import { KeyboardMap } from "../../utils/keyboard"
import { registerHit } from "../../world/damage"
import { SpaceDebrisSystem } from "../../world/systems/visualsSystems/spaceDebrisSystem"
import { CombatSystems } from "../../world/systems/combatSystems"
import {
  generateClusteredPoints,
  generateNoiseAsteroid,
  generateVoronoiCells,
  generateVoronoiSeeds,
} from "../../utils/voronoiAsteroid"
import { rand } from "../../utils/random"
import { LoadAsteroidField } from "../../world/systems/missionSystems/missionHazards"

const divFps = document.getElementById("fps")

const Radius = 500
export class DebugTestLoop implements GameScene, IDisposable {
  screen: DebugTestScreen
  scaleBox: Mesh
  cameraEntity: Entity
  ship: Entity
  ships: Entity[] = []

  debouncer = new DebounceTimedMulti()

  testSPS: MercParticleSystem

  // systems
  spaceDebrisSystem: SpaceDebrisSystem
  skyboxSystems: SkyboxSystems
  combatSystems: CombatSystems = new CombatSystems()

  constructor() {
    divFps.style.height = "175px"
    divFps.style.textAlign = "left"
    divFps.style.width = "150px"
    const appContainer = AppContainer.instance
    this.screen = new DebugTestScreen()

    this.cameraEntity = CreateEntity({
      targetName: "debug camera",
      camera: "debug",
    })

    appContainer.camera.dispose()
    const canvas = document.getElementById("gameCanvas") as any as HTMLCanvasElement
    let camera = new ArcRotateCamera("Camera", 0, 0, 500, new Vector3(0, 0, 0))
    // camera.setPosition(new Vector3(0, 0, -500))
    camera.attachControl(canvas, true)
    appContainer.scene.activeCamera = camera
    appContainer.camera = camera

    this.skyboxSystems = new SkyboxSystems(appContainer.scene)
    // MeshBuilder.CreateBox("box", { size: 10 })

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
    this.skyboxSystems.dispose()
    this.spaceDebrisSystem.dispose()
    this.combatSystems.dispose()
  }

  setup() {
    let ship = structuredClone(Broadsword)
    let model1 = createCustomShip(ship, 0, 0, 0, 2, 1, undefined, {
      missionDetails: {
        missionLocations: [
          {
            id: 1,
            name: "Arena Point",
            isNavPoint: false,
            position: { x: 0, y: 0, z: 0 },
          },
        ],
        mission: "Patrol",
      },
      // floatingOrigin: true,
    })
    this.ships.push(model1)
    this.ship = model1

    const cmat = new StandardMaterial("cmat")
    const cylinder = MeshBuilder.CreateCylinder("feeler", { height: 500, diameter: 200 })
    cylinder.rotateAround(Vector3.Zero(), Vector3.Left(), ToRadians(90))
    cylinder.bakeCurrentTransformIntoVertices()
    cylinder.position.z = -250
    cylinder.parent = model1.node
    cylinder.material = cmat
    cmat.wireframe = true

    function generateDistinctColor(index: number, total: number): Color3 {
      const hue = (index / total) * 360 // Evenly distribute hues
      const saturation = 0.8 // High saturation for vibrant colors
      const lightness = 0.5 // Medium lightness for balanced colors
      return Color3.FromHSV(hue, saturation, lightness)
    }

    const mat = new StandardMaterial("test-mat")
    mat.wireframe = true
    const sphere = MeshBuilder.CreateSphere("bounding", { diameter: 400 })
    sphere.material = mat
    const seeds = generateVoronoiSeeds(20, 200)
    const cells = generateVoronoiCells(seeds)
    cells.forEach((c, i) => {
      const cmat = new StandardMaterial("cell-" + i)
      cmat.emissiveColor = generateDistinctColor(i, cells.length)
      cmat.diffuseColor = cmat.emissiveColor
      cmat.specularColor = Color3.Black()
      // cmat.wireframe = true
      c.material = cmat
    })
    const first = cells.positions[0]
    seeds.forEach((p: Vector3, i) => {
      const box = MeshBuilder.CreateBox("p+" + i, { size: 0.1 })
      box.position.copyFrom(p)
    })

    LoadAsteroidField(Vector3.Zero())
    LoadAsteroidField(Vector3.Zero())
    LoadAsteroidField(Vector3.Zero())
  }

  checkInput(dt: number) {
    const appContainer = AppContainer.instance
    const dsm = new DeviceSourceManager(appContainer.engine)
    const kbd = dsm.getDeviceSource(DeviceType.Keyboard)
    const camera = appContainer.camera as ArcRotateCamera

    if (this.ship) {
      const firstPosition = Vector3FromObj(this.ship.position, TmpVectors.Vector3[0])
      const firstDirection = Vector3FromObj(this.ship.direction)
      const firstRotation = QuaternionFromObj(this.ship.rotationQuaternion, TmpVectors.Quaternion[1])
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
      Vector3.LerpToRef(camera.position, behind, 0.1, camera.position)
      // this.camera.position.copyFrom(behind)
      camera.setTarget(firstPosition)
    }
    // "UP" [38]
    if (kbd?.getInput(KeyboardMap.D) && this.debouncer.tryNow(KeyboardMap.D)) {
      if (world.has(this.ship)) {
        this.ship.node.getChildMeshes().forEach((mesh) => (mesh.isPickable = true))
        const ray = new Ray(
          camera.position,
          new Vector3(this.ship.position.x, this.ship.position.y, this.ship.position.z).subtract(camera.position)
        )
        const pickedInfo = appContainer.scene.pickWithRay(ray)
        if (pickedInfo.hit) {
          console.log(pickedInfo.pickedPoint)
          registerHit(this.ship, { id: "asd", damage: 2, originatorId: "" }, pickedInfo.pickedPoint, 20)
        }
      }
    }
    // "UP" [38]
    if (kbd?.getInput(KeyboardMap.S) && this.debouncer.tryNow(KeyboardMap.S)) {
      if (world.has(this.ship)) {
        world.addComponent(this.ship, "systemsDamaged", true)
      }
    }
  }

  runLoop = (delta: number) => {
    const appContainer = AppContainer.instance
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    this.screen.updateScreen(delta)

    this.checkInput(delta)
    this.combatSystems.update(delta)
    this.skyboxSystems.update(delta)
    updateRenderSystem()

    scene.render()
    if (this.ship) {
      if (this.ship.movementCommand) this.ship.movementCommand.afterburner = 1
      divFps.innerHTML = engine.getFps().toFixed() + " fps"
      divFps.innerHTML += "<br/>mission: " + this.ship.ai.blackboard.intelligence.mission
      divFps.innerHTML += "<br/>objective: " + this.ship.ai.blackboard.intelligence.objective
      divFps.innerHTML += "<br/>tactic: " + this.ship.ai.blackboard.intelligence.tactic
      divFps.innerHTML += "<br/>SoH: " + this.ship.ai.blackboard.intelligence.stateOfHealth
      divFps.innerHTML += "<br/>SoC: " + this.ship.ai.blackboard.intelligence.stateOfConfrontation
      divFps.innerHTML += "<br/>maneuver: " + this.ship.ai.blackboard.intelligence.maneuver
    }
  }
}
