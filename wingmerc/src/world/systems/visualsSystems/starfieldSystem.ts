import {
  Color3,
  Color4,
  IDisposable,
  Mesh,
  MeshBuilder,
  Quaternion,
  Scalar,
  Scene,
  SolidParticleSystem,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core"
import { MercParticlesEmitter } from "../../../utils/particles/mercParticleEmitters"
import { randFloat } from "../../../utils/random"

const WHITE_CAPACITY = 300
const BLUE_CAPACITY = 150
const YELLOW_CAPACITY = 50
const RED_CAPACITY = 10
const SPAWN_RADIUS = 9000

export class StarfieldSystem implements IDisposable {
  solidParticleSystem: SolidParticleSystem
  emitter: MercParticlesEmitter
  static pause = false
  paused = false

  constructor(scene: Scene) {
    // Create a Solid Particle System (SPS)
    const sps = new SolidParticleSystem("space_debris", scene, { isPickable: false })
    // Create a plane mesh to represent each debris particle
    const whiteplane = MeshBuilder.CreatePlane("debris", { size: 20, sideOrientation: Mesh.DOUBLESIDE }, scene)
    // Create an unlit material for the debris particles
    const unlitMaterial = new StandardMaterial("unlitMaterial", scene)
    unlitMaterial.emissiveColor = Color3.White() // Makes the particles appear fully lit
    unlitMaterial.disableLighting = true // Disables lighting effects

    // Add planes to the SPS
    sps.addShape(whiteplane, WHITE_CAPACITY)
    sps.addShape(whiteplane, BLUE_CAPACITY)
    sps.addShape(whiteplane, YELLOW_CAPACITY)
    sps.addShape(whiteplane, RED_CAPACITY)

    whiteplane.dispose()
    this.solidParticleSystem = sps

    // Set the initial position of each particle
    sps.initParticles = () => {
      const white = Color4.FromColor3(Color3.White())
      const blue = Color4.FromColor3(Color3.Blue())
      const yellow = Color4.FromColor3(Color3.Yellow())
      const red = Color4.FromColor3(Color3.Red())
      for (let p = 0; p < sps.nbParticles; p++) {
        const particle = sps.particles[p]

        const r = SPAWN_RADIUS
        const phi = Math.random() * Math.PI * 2
        const costheta = 2 * Math.random() - 1
        const theta = Math.acos(costheta)
        particle.isVisible = true
        particle.position = Vector3.Zero()
        particle.position.x = r * Math.sin(theta) * Math.cos(phi)
        particle.position.y = r * Math.sin(theta) * Math.sin(phi)
        particle.position.z = r * Math.cos(theta)

        // Calculate direction to the origin
        const directionToOrigin = Vector3.Zero().subtract(particle.position).normalize()

        // Determine an arbitrary "right" vector
        let arbitraryRight = Vector3.Cross(directionToOrigin, Vector3.Up()).normalize()

        // If "up" and "directionToOrigin" are collinear, pick another arbitrary up vector
        if (arbitraryRight.length() === 0) {
          arbitraryRight = Vector3.Cross(directionToOrigin, Vector3.Forward()).normalize()
        }

        // Calculate the correct "up" vector
        const correctUp = Vector3.Cross(arbitraryRight, directionToOrigin).normalize()

        // Calculate the rotation to face the origin using the correct "up" vector
        const lookAtQuaternion = Quaternion.FromLookDirectionLH(directionToOrigin, correctUp)

        // Generate a random rotation around the directionToOrigin axis
        const randomAngle = Scalar.RandomRange(0, Math.PI * 2) // Random angle between 0 and 360 degrees
        const randomRotation = Quaternion.RotationAxis(directionToOrigin, randomAngle)

        // Combine the two rotations: first face the origin, then apply the random twist
        particle.rotationQuaternion = randomRotation.multiply(lookAtQuaternion)

        particle.props = {}
        switch (particle.shapeId) {
          case 0: {
            particle.color = white
            particle.scaling.setAll(randFloat(0.9, 1.1))
            break
          }
          case 1: {
            particle.color = blue
            particle.scaling.setAll(randFloat(1, 1.5))
            break
          }
          case 2: {
            particle.color = yellow
            particle.scaling.setAll(randFloat(0.9, 1.1))
            break
          }
          case 3: {
            particle.color = red
            particle.scaling.setAll(randFloat(1.5, 2.5))
            break
          }
        }
      }
    }

    // Update particles in each frame
    sps.updateParticle = (particle) => {
      return particle
    }

    // Build the SPS mesh
    sps.initParticles()
    sps.buildMesh()
    sps.isAlwaysVisible = true
    sps.mesh.infiniteDistance = true
    sps.mesh.material = unlitMaterial
    sps.setParticles()
  }
  dispose(): void {
    this.solidParticleSystem.dispose()
    this.solidParticleSystem = undefined
  }
  /**
   *
   * @param dt delta time in milliseconds
   */
  update(dt: number) {}
}
