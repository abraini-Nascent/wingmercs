import {
  DeviceSourceManager,
  DeviceType,
  Engine,
  IDisposable,
  ParticleSystem,
  Quaternion,
  Scene,
  Texture,
  TransformNode,
  Vector3,
} from "@babylonjs/core"
import { VoronoiNebula, VoronoiSphereNebula } from "../../../utils/VoronoiNebula"
import { AppContainer } from "../../../app.container"
import * as SimplexNoise from "simplex-noise"

const CAPACITY = 300
const EMIT_RATE = 10000
const SPAWN_RADIUS = 200
const DESPAWN_DISTANCE = 300
export class SkyboxNebulaSystem implements IDisposable {
  nebula: VoronoiNebula
  sphere: VoronoiSphereNebula
  static pause = false
  paused = false

  constructor(scene: Scene) {
    const density = generateDensityMap(1, 1)
    // const fractalDensity = generateFractalDensityMap(10000, 10000)
    const fractalDensity = generateFractalDensityMap(100, 100)
    const turbulenceDensityMap = generateCustomTurbulenceDensityMap(1, 1)
    const worleyDensity = generateWorleyDensityMap(1, 1, 0.75)

    // this.nebula = new VoronoiNebula(scene, 1000, density, fractalDensity)
    this.sphere = new VoronoiSphereNebula(scene, 100, fractalDensity)
  }
  dispose(): void {
    this.sphere.dispose()
  }
  /**
   *
   * @param dt delta time in milliseconds
   */
  update(dt: number) {
    // this.nebula.update(dt)
    this.sphere.update(dt)
  }
}

export function generateDensityMap(width: number, height: number): (x: number, y: number) => number {
  const noise2D = SimplexNoise.createNoise2D()
  const centerX = width / 2
  const centerY = height / 2

  return (x: number, y: number): number => {
    // Convert coordinates to range [0, 1]
    const nx = x * width - centerX
    const ny = y * height - centerY

    // Calculate radial distance from the center
    const distance = Math.sqrt(nx * nx + ny * ny) / (Math.max(width, height) / 2)

    // Use Perlin noise to add irregularities
    const noiseValue = noise2D(x * 10, y * 10) // Scale can be adjusted for detail level

    // Create the radial gradient for the nebula arms
    const angle = Math.atan2(ny, nx)
    const armDensity = Math.cos(angle * 2) * 0.5 + 0.5 // Adjust multiplier for number of arms

    // Combine radial gradient, noise, and arm density
    const density = Math.max(0, 1 - distance) * noiseValue // * armDensity;

    return density
  }
}

export function generateFractalDensityMap(width: number, height: number): (x: number, y: number) => number {
  const noise2D = SimplexNoise.createNoise2D()
  const centerX = width / 2
  const centerY = height / 2

  function fBM(nx: number, ny: number): number {
    let value = 0.0
    let amplitude = 0.8
    let frequency = 5
    const octaves = 8 // Number of noise layers

    for (let i = 0; i < octaves; i++) {
      value += amplitude * noise2D(nx * frequency, ny * frequency)
      frequency *= 2.0
      amplitude *= 0.5
    }

    return value
  }

  return (x: number, y: number): number => {
    const nx = (x * width - centerX) / width
    const ny = (y * height - centerY) / height

    const distance = Math.sqrt(nx * nx + ny * ny)

    // Use fBM to create swirling patterns
    const fbmValue = fBM(nx, ny)

    // Combine with a radial gradient to create nebula tendrils
    const density = Math.max(0, 1 - distance) * (fbmValue * 0.5 + 0.5)

    return density
  }
}

export function generateWorleyDensityMap(
  width: number,
  height: number,
  featureSize: number
): (x: number, y: number) => number {
  const points = []

  // Generate random points in space as noise 'cells'
  for (let i = 0; i < featureSize; i++) {
    points.push({ x: Math.random() * width, y: Math.random() * height })
  }

  function worley(nx: number, ny: number): number {
    let minDist = Infinity

    points.forEach((point) => {
      const dx = point.x - nx
      const dy = point.y - ny
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < minDist) {
        minDist = dist
      }
    })

    return minDist
  }

  return (x: number, y: number): number => {
    const nx = x * width
    const ny = y * height

    // Worley noise calculation for tendrils
    const noiseValue = worley(nx, ny)

    // Apply an inverse to create tendrils
    const density = 1.0 - Math.min(noiseValue / featureSize, 1.0)

    return density
  }
}

export function generateCustomTurbulenceDensityMap(width: number, height: number): (x: number, y: number) => number {
  const noise2D = SimplexNoise.createNoise2D()
  const centerX = width / 2
  const centerY = height / 2

  return (x: number, y: number): number => {
    const nx = (x * width - centerX) / width
    const ny = (y * height - centerY) / height

    // Apply a transformation to create turbulent flow patterns
    const turbulence = Math.sin(noise2D(nx * 4, ny * 4) * 10) * 0.5 + 0.5

    const distance = Math.sqrt(nx * nx + ny * ny)

    // Combine the turbulent noise with a radial falloff
    const density = Math.max(0, 1 - distance) * turbulence

    return density
  }
}
