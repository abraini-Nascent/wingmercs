import {
  Color3,
  Color4,
  IDisposable,
  Mesh,
  MeshBuilder,
  Scene,
  SolidParticle,
  SolidParticleSystem,
  StandardMaterial,
  TmpVectors,
  Vector3,
} from "@babylonjs/core"
import { AppContainer } from "../../../app.container"
import { Vector3FromObj } from "../../../utils/math"
import { queries } from "../../world"

const CAPACITY = 300
const EMIT_RATE = 10000
const SPAWN_RADIUS = 300
const DESPAWN_DISTANCE = 300
type debrisProps = {
  worldLocation: Vector3
  rotationVelocity: Vector3
}

class SolidDebrisSystem implements IDisposable {
  static flatMat = (() => {
    let mat: StandardMaterial
    return () => {
      if (mat != undefined) {
        return mat
      }
      let newMat = new StandardMaterial("space-debris-mat")
      mat = newMat
      mat.diffuseColor = Color3.Gray()
      // mat.specularColor = Color3.Gray()
      // mat.diffuseColor = Color3.Blue()
      // mat.specularColor = Color3.Blue()
      return mat
    }
  })()
  static nebulaMat = (() => {
    let mat: StandardMaterial
    return () => {
      if (mat != undefined) {
        return mat
      }
      let newMat = new StandardMaterial("nebula-debris-mat")
      mat = newMat
      mat.diffuseColor = Color3.Purple()
      mat.specularColor = Color3.Purple()
      mat.emissiveColor = Color3.White()
      return mat
    }
  })()

  static radiationMat = (() => {
    let mat: StandardMaterial
    return () => {
      if (mat != undefined) {
        return mat
      }
      let newMat = new StandardMaterial("radiation-debris-mat")
      mat = newMat
      mat.diffuseColor = Color3.Green()
      mat.specularColor = Color3.Green()
      mat.emissiveColor = Color3.White()
      return mat
    }
  })()

  solidParticleSystem: SolidParticleSystem

  constructor(
    scene: Scene,
    material: StandardMaterial,
    private centerPosition: () => Vector3,
    capacity: number = CAPACITY,
    size: number = 1,
    radius: number = SPAWN_RADIUS
  ) {
    // Create a Solid Particle System (SPS)
    const sps = new SolidParticleSystem("space_debris", scene, { isPickable: false })
    // Create a plane mesh to represent each debris particle
    const plane = MeshBuilder.CreatePlane("debris", { size, sideOrientation: Mesh.DOUBLESIDE }, scene)
    plane.material = material

    // Add planes to the SPS
    sps.addShape(plane, capacity)

    // Dispose of the base mesh as it’s no longer needed
    plane.dispose()

    this.solidParticleSystem = sps

    // Set the initial position of each particle
    sps.initParticles = () => {
      for (let p = 0; p < sps.nbParticles; p++) {
        const particle = sps.particles[p]
        const r = radius
        const phi = Math.random() * Math.PI * 2
        const costheta = 2 * Math.random() - 1
        const theta = Math.acos(costheta)
        particle.isVisible = true
        particle.color = Color4.FromColor3(material.diffuseColor, 1)
        particle.position.x = r * Math.sin(theta) * Math.cos(phi)
        particle.position.y = r * Math.sin(theta) * Math.sin(phi)
        particle.position.z = r * Math.cos(theta)
        particle.props = {}
        const props: debrisProps = particle.props
        props.worldLocation = particle.position.addInPlace(sps.mesh.position)
        particle.color = new Color4(0.7, 0.7, 0.7, 1)
      }
    }

    // Update particles in each frame
    sps.updateParticle = (particle) => {
      const centerPosition = this.centerPosition()
      const origin = queries.origin.first?.position ?? Vector3.Zero()

      if (!particle.props) {
        this.resetParticle(particle)
      }
      const props: debrisProps = particle.props
      // Apply rotation velocity

      particle.color = Color4.FromColor3(material.diffuseColor, 1)
      particle.position.x = props.worldLocation.x - origin.x
      particle.position.y = props.worldLocation.y - origin.y
      particle.position.z = props.worldLocation.z - origin.z
      particle.rotation.x += props.rotationVelocity.x
      particle.rotation.y += props.rotationVelocity.y
      particle.rotation.z += props.rotationVelocity.z
      // Check if the particle is out of range to recycle it
      if (props.worldLocation.subtract(centerPosition).length() > radius) {
        this.resetParticle(particle)
      }
      return particle
    }

    // Build the SPS mesh
    sps.buildMesh()
    sps.mesh.material = material
    sps.isAlwaysVisible = true
  }
  dispose(): void {
    this.solidParticleSystem.dispose()
    this.solidParticleSystem = undefined
    this.centerPosition = undefined
  }
  private resetParticle = (particle: SolidParticle) => {
    const centerPosition = this.centerPosition()
    // console.log("updating particle from", particle, particle.position)
    particle.position.copyFrom(centerPosition)
    const r = SPAWN_RADIUS
    const phi = Math.random() * Math.PI * 2
    const costheta = 2 * Math.random() - 1
    const theta = Math.acos(costheta)

    particle.position.x += r * Math.sin(theta) * Math.cos(phi)
    particle.position.y += r * Math.sin(theta) * Math.sin(phi)
    particle.position.z += r * Math.cos(theta)

    particle.rotation.x = Math.random() * Math.PI * 2
    particle.rotation.y = Math.random() * Math.PI * 2
    particle.rotation.z = Math.random() * Math.PI * 2

    // console.log("updating particle to", particle, particle.position)
    // particle.position.addInPlace(playerPosition);
    if (!particle.props) {
      particle.props = {}
    }
    const props: debrisProps = particle.props
    props.worldLocation = particle.position.clone()
    props.rotationVelocity = new Vector3(
      Math.random() * 0.1 - 0.05,
      Math.random() * 0.1 - 0.05,
      Math.random() * 0.1 - 0.05
    )
  }
}
export class SpaceDebrisSystem implements IDisposable {
  debris: SolidDebrisSystem
  nebula: SolidDebrisSystem
  radiation: SolidDebrisSystem
  static pause = false
  paused = false

  get centerPosition() {
    const centerEntity = AppContainer.instance.player?.playerEntity ?? AppContainer.instance.camera
    return Vector3FromObj(centerEntity.position, TmpVectors.Vector3[0])
  }

  constructor(scene: Scene) {
    this.debris = new SolidDebrisSystem(scene, SolidDebrisSystem.flatMat(), () => {
      return this.centerPosition
    })
  }
  dispose(): void {
    this.debris.dispose()
  }
  /**
   *
   * @param dt delta time in milliseconds
   */
  update(dt: number) {
    if (AppContainer.instance.camera == undefined) {
      if (this.debris.solidParticleSystem.mesh.isVisible) {
        this.debris.solidParticleSystem.mesh.setEnabled(false)
      }
      return
    }

    if (SpaceDebrisSystem.pause && this.paused == false) {
      this.paused = true
      this.debris.solidParticleSystem.mesh.setEnabled(false)
      // console.log("[Space Debris] paused");
    } else if (SpaceDebrisSystem.pause == false && this.paused) {
      this.paused = false
      this.debris.solidParticleSystem.mesh.setEnabled(true)
      // console.log("[Space Debris] unpaused");
    }

    // Update SPS particles each frame
    if (!this.paused) {
      this.debris.solidParticleSystem.setParticles()
      const player = AppContainer.instance.player?.playerEntity
      if (!player) {
        return
      }
      if (player && player.inHazard && player.inHazard.nebula && this.nebula == undefined) {
        this.nebula = new SolidDebrisSystem(
          AppContainer.instance.scene,
          SolidDebrisSystem.nebulaMat(),
          () => {
            return this.centerPosition
          },
          1000,
          5,
          500
        )
      } else if (
        (!player ||
          player.inHazard == undefined ||
          player.inHazard.nebula == undefined ||
          player.inHazard.nebula == false) &&
        this.nebula
      ) {
        this.nebula.dispose()
        this.nebula = undefined
      }
      if (player && player.inHazard && player.inHazard.radiation && this.radiation == undefined) {
        this.radiation = new SolidDebrisSystem(
          AppContainer.instance.scene,
          SolidDebrisSystem.radiationMat(),
          () => {
            return this.centerPosition
          },
          500,
          5,
          500
        )
      } else if (
        (!player ||
          player.inHazard == undefined ||
          player.inHazard.radiation == undefined ||
          player.inHazard.radiation == false) &&
        this.radiation
      ) {
        this.radiation.dispose()
        this.radiation = undefined
      }
      if (this.nebula) {
        this.nebula.solidParticleSystem.setParticles()
      }
      if (this.radiation) {
        this.radiation.solidParticleSystem.setParticles()
      }
    }
  }
}
