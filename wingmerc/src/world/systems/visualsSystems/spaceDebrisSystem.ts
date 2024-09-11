import { Color3, Color4, IDisposable, Mesh, MeshBuilder, Scene, SolidParticle, SolidParticleSystem, StandardMaterial, TmpVectors, Vector3 } from "@babylonjs/core";
import { MercParticlesEmitter } from "../../../utils/particles/mercParticleEmitters";
import { MercParticleSystem } from "../../../utils/particles/mercParticleSystem";
import { AppContainer } from "../../../app.container";
import { Vector3FromObj } from "../../../utils/math";
import { queries } from "../../world";

const CAPACITY = 300
const EMIT_RATE = 10000
const SPAWN_RADIUS = 300
const DESPAWN_DISTANCE = 300
type debrisProps = {
  worldLocation: Vector3
  rotationVelocity: Vector3
}
export class SpaceDebrisSystem implements IDisposable {
  particleSystem: MercParticleSystem
  solidParticleSystem: SolidParticleSystem;
  emitter: MercParticlesEmitter
  static pause = false
  paused = false

  get centerPosition() {
    const centerEntity = AppContainer.instance.player?.playerEntity ?? AppContainer.instance.camera
    return Vector3FromObj(centerEntity.position, TmpVectors.Vector3[0]);
  }

  constructor(scene: Scene) {
    // Create a Solid Particle System (SPS)
    const sps = new SolidParticleSystem("space_debris", scene, { isPickable: false });
    // Create a plane mesh to represent each debris particle
    const plane = MeshBuilder.CreatePlane("debris", { size: 1, sideOrientation: Mesh.DOUBLESIDE }, scene);
    plane.billboardMode = Mesh.BILLBOARDMODE_ALL
    const mat = SpaceDebrisSystem.flatMat()
    plane.material = mat

    // Add planes to the SPS
    sps.addShape(plane, CAPACITY);

    // Dispose of the base mesh as it’s no longer needed
    plane.dispose();

    this.solidParticleSystem = sps;

    // Set the initial position of each particle
    sps.initParticles = () => {
      for (let p = 0; p < sps.nbParticles; p++) {
        const particle = sps.particles[p];
        const r = SPAWN_RADIUS;
        const phi = Math.random() * Math.PI * 2;
        const costheta = 2 * Math.random() - 1;
        const theta = Math.acos(costheta);
        particle.isVisible = true
        particle.position.x = r * Math.sin(theta) * Math.cos(phi);
        particle.position.y = r * Math.sin(theta) * Math.sin(phi);
        particle.position.z = r * Math.cos(theta);
        particle.props = {}
        const props: debrisProps = particle.props
        props.worldLocation = particle.position.addInPlace(sps.mesh.position)
        particle.color = new Color4(0.7, 0.7, 0.7, 1)
      }
    };

    
    // Update particles in each frame
    sps.updateParticle = (particle) => {
      const centerPosition = this.centerPosition
      const origin = queries.origin.first?.position ?? Vector3.Zero()

      if (!particle.props) {
        this.resetParticle(particle)
      }
      const props: debrisProps = particle.props
      // Apply rotation velocity

      particle.position.x = props.worldLocation.x - origin.x
      particle.position.y = props.worldLocation.y - origin.y
      particle.position.z = props.worldLocation.z - origin.z
      particle.rotation.x += props.rotationVelocity.x;
      particle.rotation.y += props.rotationVelocity.y;
      particle.rotation.z += props.rotationVelocity.z;
      // Check if the particle is out of range to recycle it
      if (props.worldLocation.subtract(centerPosition).length() > DESPAWN_DISTANCE) {
        this.resetParticle(particle)
      }
      return particle
    };

    // Build the SPS mesh
    sps.buildMesh();
    sps.isAlwaysVisible = true;
  }
  dispose(): void {
    this.solidParticleSystem.dispose();
    this.solidParticleSystem = undefined;
  }
  private resetParticle = (particle: SolidParticle) => {
    const centerPosition = this.centerPosition
    // console.log("updating particle from", particle, particle.position)
    particle.position.copyFrom(centerPosition)
    const r = SPAWN_RADIUS;
    const phi = Math.random() * Math.PI * 2;
    const costheta = 2 * Math.random() - 1;
    const theta = Math.acos(costheta);

    particle.position.x += r * Math.sin(theta) * Math.cos(phi);
    particle.position.y += r * Math.sin(theta) * Math.sin(phi);
    particle.position.z += r * Math.cos(theta);

    particle.rotation.x = Math.random() * Math.PI * 2;
    particle.rotation.y = Math.random() * Math.PI * 2;
    particle.rotation.z = Math.random() * Math.PI * 2;

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
  /**
   * 
   * @param dt delta time in milliseconds
   */
  update(dt: number) {
    if (AppContainer.instance.camera == undefined) {
      if (this.solidParticleSystem.mesh.isVisible) {
        this.solidParticleSystem.mesh.setEnabled(false);
      }
      return;
    }

    if (SpaceDebrisSystem.pause && this.paused == false) {
      this.paused = true;
      this.solidParticleSystem.mesh.setEnabled(false);
      // console.log("[Space Debris] paused");
    } else if (SpaceDebrisSystem.pause == false && this.paused) {
      this.paused = false;
      this.solidParticleSystem.mesh.setEnabled(true);
      // console.log("[Space Debris] unpaused");
    }

    // Update SPS particles each frame
    if (!this.paused) {
      this.solidParticleSystem.setParticles();
    }
  }
  static flatMat = (() => {
    let mat: StandardMaterial
    return () => {
      if (mat != undefined) {
        return mat
      }
      let newMat = new StandardMaterial("standardMat")
      mat = newMat
      mat.diffuseColor = Color3.Gray()
      mat.specularColor = Color3.Gray()
      return mat
    }
  })()
}