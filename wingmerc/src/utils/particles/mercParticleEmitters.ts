import { Matrix, Scalar, SolidParticle, TmpVectors, Vector3 } from "@babylonjs/core";
import { random } from "../random";
import { pointInSphere, pointOnSphere } from "../math";

export interface MercParticlesEmitter {
  initialPositionFunction: (particle: SolidParticle) => SolidParticle
  initialDirectionFunction: (particle: SolidParticle) => SolidParticle
}

export class MercParticleSphereSurfaceEmitter implements MercParticlesEmitter {
  position: Vector3 = new Vector3();

  constructor(public radius: number) {

  }

  initialPositionFunction = (particle: SolidParticle): SolidParticle => {
    let offset = Matrix.Translation(particle.position.x, particle.position.y, particle.position.z)
    pointOnSphere(this.radius, offset, particle.position)
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
    return particle
  }
}

export class MercParticleSphereEmitter implements MercParticlesEmitter {
  position: Vector3 = new Vector3();

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

export class MercParticleConeEmitter implements MercParticlesEmitter {
  position: Vector3;
  direction: Vector3;
  radius: number;
  height: number;

  constructor(position: Vector3 = new Vector3(), direction: Vector3, radius: number, height: number) {
    this.position = position
    this.direction = direction
    this.radius = radius
    this.height = height
  }

  initialPositionFunction = (particle: SolidParticle): SolidParticle => {    
    // this isn't efficient, but it works for now
    particle.position.copyFrom(this.position)
    return particle
  }
  initialDirectionFunction = (particle: SolidParticle): SolidParticle => {
    // this isn't the most effcient but hey it works.
    const topPoint = this.position.addToRef(this.direction.multiplyToRef(TmpVectors.Vector3[3].setAll(this.height), TmpVectors.Vector3[2]), TmpVectors.Vector3[1])
    const conePoint = pointInSphere(this.radius, topPoint, TmpVectors.Vector3[0])
    const direction = (particle.props.direction as Vector3)
    conePoint.subtractToRef(this.position, direction)
    return particle
  }
}

export class MercParticlePointEmitter implements MercParticlesEmitter {
  position: Vector3;

  constructor(position: Vector3 = new Vector3()) {
    this.position = position;
  }

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

export class MercParticleCustomEmitter implements MercParticlesEmitter {
  initialPositionFunction: (particle: SolidParticle) => SolidParticle
  initialDirectionFunction: (particle: SolidParticle) => SolidParticle

  constructor(initialPositionFunction: ((particle: SolidParticle) => SolidParticle), initialDirectionFunction: (particle: SolidParticle) => SolidParticle) {
    this.initialPositionFunction = initialPositionFunction
    this.initialDirectionFunction = initialDirectionFunction
  }
}