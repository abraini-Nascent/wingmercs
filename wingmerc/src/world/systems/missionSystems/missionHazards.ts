import { AppContainer } from "../../../app.container"
import { Color3, IDisposable, MeshBuilder, StandardMaterial, TmpVectors, TransformNode, Vector3 } from "@babylonjs/core"
import { generateClusteredPoints, generateNoiseAsteroid } from "../../../utils/voronoiAsteroid"
import { rand } from "../../../utils/random"
import { CreateEntity, Entity, queries, world } from "../../world"
import { Vector3FromObj } from "../../../utils/math"

export class MissionHazardSystem implements IDisposable {
  constructor() {}
  dispose(): void {}
  /**
   *
   * @param dt delta time in milliseconds
   */
  update(dt: number) {
    const player = AppContainer.instance.player?.playerEntity
    let inNebula = false
    let inRadiation = false
    if (player) {
      const campaign = queries.campaign.first?.campaign
      const player = AppContainer.instance.player?.playerEntity
      const environments = campaign?.currentMission?.environment
      if (environments == undefined) {
        return
      }
      const playerPosition = Vector3FromObj(player.position, TmpVectors.Vector3[0])
      for (const environment of environments) {
        if (environment.hazards == undefined) {
          continue
        }
        const environmentPosition = Vector3FromObj(environment.location.position, TmpVectors.Vector3[1])
        const distance = environmentPosition.subtractInPlace(playerPosition).length()
        if (distance > 10000) {
          continue
        }
        if (environment.hazards[0] == "Nebula") {
          inNebula = true
        }
        if (environment.hazards[0] == "Radiation") {
          inRadiation = true
        }
      }
      if (inNebula && this.hasHazard(player, "nebula") == false) {
        this.addHazard(player, "nebula")
      } else if (!inNebula && this.hasHazard(player, "nebula")) {
        this.removeHazard(player, "nebula")
      }
      if (inRadiation && this.hasHazard(player, "radiation") == false) {
        this.addHazard(player, "radiation")
      } else if (!inRadiation && this.hasHazard(player, "radiation")) {
        this.removeHazard(player, "radiation")
      }
    }
  }
  addHazard(player: Entity, hazard: "nebula" | "radiation") {
    if (player.inHazard) {
      player.inHazard[hazard] = true
    } else {
      world.addComponent(player, "inHazard", { [hazard]: true })
    }
  }
  removeHazard(player: Entity, hazard: "nebula" | "radiation") {
    if (player.inHazard) {
      player.inHazard[hazard] = undefined
    }
  }
  hasHazard(player: Entity, hazard: "nebula" | "radiation"): boolean {
    if (player.inHazard) {
      return player.inHazard[hazard] === true
    }
    return false
  }
}

let asteroidMat: StandardMaterial
let asteroidLargeMat: StandardMaterial
let debugMat: StandardMaterial
const DEBUG = false
export function LoadAsteroidField(position: Vector3) {
  if (asteroidMat == undefined) {
    asteroidMat = new StandardMaterial("asteroid-mat")
    asteroidMat.diffuseColor = new Color3(0.3, 0.3, 0.3) // Dark gray
    asteroidMat.specularColor = new Color3(0.3, 0.3, 0.3) // Dark gray
  }
  if (asteroidLargeMat == undefined) {
    asteroidLargeMat = new StandardMaterial("asteroidLarge-mat")
    asteroidLargeMat.diffuseColor = new Color3(0.7, 0.5, 0.5) // Light gray
    asteroidLargeMat.specularColor = new Color3(0.7, 0.5, 0.5) // Light gray
  }
  if (DEBUG && debugMat == undefined) {
    debugMat = new StandardMaterial("asteroidLarge-mat")
    debugMat.diffuseColor = new Color3(0.5, 0.5, 0.5) // Light gray
    debugMat.specularColor = new Color3(0.5, 0.5, 0.5) // Light gray
    debugMat.wireframe = true
  }
  const placedAsteroids: { position: Vector3; radius: number }[] = []
  field(position, rand(30, 35), 5000, "small", placedAsteroids)
  field(position, rand(5, 7), 5000, "large", placedAsteroids)
}

function field(
  position: Vector3,
  amount: number,
  radius: number,
  size: "small" | "large",
  placedAsteroids: { position: Vector3; radius: number }[]
) {
  const asteroidPoints = generateClusteredPoints(amount, radius)
  for (const asteroidPoint of asteroidPoints) {
    let noisePoints: Vector3[]
    if (size == "small") {
      noisePoints = generateClusteredPoints(30, rand(150, 500))
    } else {
      noisePoints = generateClusteredPoints(30, rand(750, 950))
    }
    const asteroid = generateNoiseAsteroid(noisePoints)
    let largest = 0
    for (const point of noisePoints) {
      if (point.length() > largest) {
        largest = point.length()
      }
    }
    // const radius = asteroid.getBoundingInfo().boundingSphere.radius
    const radius = largest

    // Check for overlaps with previously placed asteroids
    let overlaps = false
    for (const placed of placedAsteroids) {
      const distance = Vector3.Distance(asteroidPoint, placed.position)
      if (distance < radius + placed.radius) {
        overlaps = true
        break
      }
    }

    if (overlaps) {
      // Skip this asteroid if it overlaps
      continue
    }

    if (size == "small") {
      asteroid.material = asteroidMat
    } else {
      asteroid.material = asteroidLargeMat
    }
    const node = new TransformNode("asteroid")
    asteroid.parent = node
    asteroid.isPickable = false
    node.position.copyFrom(asteroidPoint)
    placedAsteroids.push({ radius, position: asteroidPoint })

    if (DEBUG) {
      const sphere = MeshBuilder.CreateSphere("sphere", { diameter: radius * 2 })
      sphere.parent = node
      sphere.material = debugMat
    }
    const asteroidPossion = position.add(asteroidPoint)
    CreateEntity({
      node,
      position: { x: asteroidPossion.x, y: asteroidPossion.y, z: asteroidPossion.z },
      physicsRadius: radius,
      bodyType: "dynamic",
      obstacle: true,
      disposables: new Set([node]),
    })
  }
}
