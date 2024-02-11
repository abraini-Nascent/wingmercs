import { Scalar, SolidParticle, TmpVectors, Vector3 } from "@babylonjs/core";
import { random } from "../random";

export interface MercParticlesEmitter {
  position: Vector3
  initialPositionFunction: (particle: SolidParticle) => SolidParticle
  initialDirectionFunction: (particle: SolidParticle) => SolidParticle
}

export class MercParticleSphereEmitter implements MercParticlesEmitter {
  position: Vector3 = new Vector3;

  initialPositionFunction = (particle: SolidParticle): SolidParticle => {
    const phi = random() * Math.PI * 2
    const costheta = 2 * random() - 1
    const theta = Math.acos(costheta)
    const x = 2 * Math.sin(theta) * Math.cos(phi)
    const y = 2 * Math.sin(theta) * Math.sin(phi)
    const z = 2 * Math.cos(theta)

    particle.position.x = this.position.x+x
    particle.position.y = this.position.y+y
    particle.position.z = this.position.z+z
    particle.props.startPos = particle.position.clone()
    return particle
  }
  initialDirectionFunction = (particle: SolidParticle): SolidParticle => {
    let directionFromOrigin = TmpVectors.Vector3[0];
      particle.position.subtractToRef(this.position, directionFromOrigin);
      directionFromOrigin.normalize();
      (particle.props.direction as Vector3).copyFrom(directionFromOrigin);
      return particle
  }
}

export class MercParticlePointEmitter implements MercParticlesEmitter {
  position: Vector3 = new Vector3;

  initialPositionFunction = (particle: SolidParticle): SolidParticle => {
    particle.position.copyFrom(this.position)
    return particle
  }
  initialDirectionFunction = (particle: SolidParticle): SolidParticle => {
    let direction = (particle.props.direction as Vector3)
    direction.x = Scalar.RandomRange(-Math.PI, Math.PI)
    direction.y = Scalar.RandomRange(-Math.PI, Math.PI)
    direction.z = Scalar.RandomRange(-Math.PI, Math.PI)
    return particle
  }
}