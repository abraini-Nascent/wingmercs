import { Color3, Color4, ColorGradient, FactorGradient, Scalar, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { MercParticleSystem, PolyhedronType, Vector3Gradient } from "./mercParticleSystem";
import { MercParticlesEmitter } from "./mercParticleEmitters";

/**
 * Prebuilt particle system animations
 */
export class MercParticles {
  private static _flatMaterial: StandardMaterial
  private static get flatMat() {
    if (this._flatMaterial != undefined) {
      return this._flatMaterial;
    }
    this._flatMaterial = new StandardMaterial("MercParticlesFlatMaterial");
    this._flatMaterial.specularColor = new Color3(.20,.20,.90);
    return this._flatMaterial;
  }
  private static _wireframeMaterial: StandardMaterial
  private static get wireframeMat() {
    if (this._wireframeMaterial != undefined) {
      return this._wireframeMaterial;
    }
    this._wireframeMaterial = new StandardMaterial("MercParticlesFlatMaterial");
    this._wireframeMaterial.specularColor = new Color3(0,0,0);
    this._wireframeMaterial.wireframe = true;
    return this._wireframeMaterial;
  }
  private constructor() { }

  static damagedSystemsSpray(name: string, scene: Scene, emitter: MercParticlesEmitter, autoStart: boolean = true, disposeOnDone: boolean = true): MercParticleSystem {
    let mps = new MercParticleSystem("damage Spray " + name, scene, PolyhedronType.Octahedron, 2.5, 100)
    mps.SPS.isAlwaysVisible = true;
    mps.SPS.mesh.material = this.flatMat
    mps.targetStopDuration = 0.33
    mps.emitRate = 60
    mps.lifeTimeGradients = [
      new FactorGradient(1, 1.33, 1.66)
    ]
    mps.colorGradients = [
      new ColorGradient(0.00, new Color4(0, 0, 70, 1), new Color4(0, 0, 80, 1)),
      new ColorGradient(0.10, new Color4(222/255, 235/255, 52/255, 1), new Color4(222/255, 235/255, 52/255, 1)),
      new ColorGradient(0.25, new Color4(222/255, 235/255, 52/255, 1), new Color4(222/255, 235/255, 52/255, 1)),
      new ColorGradient(0.25, new Color4(.70, .2, .0), new Color4(.80, .2, .0)),
      new ColorGradient(0.75, new Color4(.70, .2, .0), new Color4(.80, .2, .0)),
      new ColorGradient(1.00, new Color4(.78, .78, .78, 0), new Color4(.79, .79, .79, 0))
    ]
    mps.sizeGradients = [
      new FactorGradient(0, 0.22, 0.26),
      new FactorGradient(0.5, 0.72, 0.76),
      new FactorGradient(0.9, .09, 1.1),
      new FactorGradient(1, 1.2, 1.5)
    ]
    // mps.velocityGradients = [
    //   new FactorGradient(0.0, 10),
    //   new FactorGradient(0.5, 7),
    //   new FactorGradient(1.0, 0)
    // ]
    mps.rotationGradients = [
      new Vector3Gradient(1, new Vector3(-Math.PI, -Math.PI, -Math.PI), new Vector3(Math.PI, Math.PI, Math.PI))
    ]
    mps.angularSpeedGradients = [
      new Vector3Gradient(1.0, new Vector3(Scalar.RandomRange(-Math.PI, Math.PI), Scalar.RandomRange(-Math.PI, Math.PI), Scalar.RandomRange(-Math.PI, Math.PI))),
      new Vector3Gradient(0.7, new Vector3(0, 0, 0))
    ]
    mps.initialPositionFunction = emitter.initialPositionFunction;
    mps.initialDirectionFunction = emitter.initialDirectionFunction;
    if (disposeOnDone) {
      mps.onDone = () => {
        mps.dispose()
        mps.onDone = undefined
        mps = undefined
      }
    }
    if (autoStart) {
      mps.begin()
    }
    return mps
  }

  static shieldSpray(name: string, scene: Scene, emitter: MercParticlesEmitter, autoStart: boolean = true, disposeOnDone: boolean = true): MercParticleSystem {
    let mps = new MercParticleSystem("damage Spray " + name, scene, PolyhedronType.Tetrahedron, 2.5, 12)
    mps.SPS.isAlwaysVisible = true
    mps.SPS.mesh.material = this.wireframeMat
    mps.targetStopDuration = 0.33
    mps.emitRate = 33
    mps.emitCount = 12
    mps.lifeTimeGradients = [
      new FactorGradient(1, 0.11, 0.33)
    ]
    mps.colorGradients = [
      new ColorGradient(0.00, new Color4(0, 0, .9, 1), new Color4(0, 0, .99, 1)),
      new ColorGradient(0.75, new Color4(.0, .0, .9), new Color4(.0, .0, .99, 1)),
      new ColorGradient(1.00, new Color4(.95, .95, .95, 0), new Color4(.99, .99, .99, 0))
    ]
    mps.sizeGradients = [
      new FactorGradient(0, 0.22, 0.26),
      new FactorGradient(0.5, 0.72, 0.76),
      new FactorGradient(0.9, .09, 1.1),
      new FactorGradient(1, 1.2, 1.5)
    ]
    mps.velocityGradients = [
      new FactorGradient(0.0, 10),
      new FactorGradient(0.5, 7),
      new FactorGradient(1.0, 0)
    ]
    mps.rotationGradients = [
      new Vector3Gradient(1, new Vector3(-Math.PI, -Math.PI, -Math.PI), new Vector3(Math.PI, Math.PI, Math.PI))
    ]
    mps.angularSpeedGradients = [
      new Vector3Gradient(1.0, new Vector3(Scalar.RandomRange(-Math.PI, Math.PI), Scalar.RandomRange(-Math.PI, Math.PI), Scalar.RandomRange(-Math.PI, Math.PI))),
      new Vector3Gradient(0.7, new Vector3(0, 0, 0))
    ]
    mps.initialPositionFunction = emitter.initialPositionFunction;
    mps.initialDirectionFunction = emitter.initialDirectionFunction;
    if (disposeOnDone) {
      mps.onDone = () => {
        mps.dispose()
        mps.onDone = undefined
        mps = undefined
      }
    }
    if (autoStart) {
      mps.begin()
    }
    return mps
  }

  static damageSpray(name: string, scene: Scene, emitter: MercParticlesEmitter, autoStart: boolean = true, disposeOnDone: boolean = true): MercParticleSystem {
    let mps = new MercParticleSystem("damage Spray " + name, scene, PolyhedronType.Octahedron, 2.5, 100)
    mps.SPS.isAlwaysVisible = true;
    mps.SPS.mesh.material = this.flatMat
    mps.targetStopDuration = 0.10
    mps.emitRate = 33
    mps.emitCount = 100
    mps.lifeTimeGradients = [
      new FactorGradient(1, 0.11, 0.33)
    ]
    mps.colorGradients = [
      new ColorGradient(0.00, new Color4(0, 0, 70, 1), new Color4(0, 0, 80, 1)),
      new ColorGradient(0.10, new Color4(222/255, 235/255, 52/255, 1), new Color4(222/255, 235/255, 52/255, 1)),
      new ColorGradient(0.25, new Color4(222/255, 235/255, 52/255, 1), new Color4(222/255, 235/255, 52/255, 1)),
      new ColorGradient(0.25, new Color4(.70, .2, .0), new Color4(.80, .2, .0)),
      new ColorGradient(0.75, new Color4(.70, .2, .0), new Color4(.80, .2, .0)),
      new ColorGradient(1.00, new Color4(.95, .2, .2, 0), new Color4(.99, .2, .2, 0))
    ]
    mps.sizeGradients = [
      new FactorGradient(0, 0.22, 0.26),
      new FactorGradient(0.5, 0.72, 0.76),
      new FactorGradient(0.9, .09, 1.1),
      new FactorGradient(1, 1.2, 1.5)
    ]
    mps.velocityGradients = [
      new FactorGradient(0.0, 10),
      new FactorGradient(0.5, 7),
      new FactorGradient(1.0, 0)
    ]
    mps.rotationGradients = [
      new Vector3Gradient(1, new Vector3(-Math.PI, -Math.PI, -Math.PI), new Vector3(Math.PI, Math.PI, Math.PI))
    ]
    mps.angularSpeedGradients = [
      new Vector3Gradient(1.0, new Vector3(Scalar.RandomRange(-Math.PI, Math.PI), Scalar.RandomRange(-Math.PI, Math.PI), Scalar.RandomRange(-Math.PI, Math.PI))),
      new Vector3Gradient(0.7, new Vector3(0, 0, 0))
    ]
    mps.initialPositionFunction = emitter.initialPositionFunction;
    mps.initialDirectionFunction = emitter.initialDirectionFunction;
    if (disposeOnDone) {
      mps.onDone = () => {
        mps.dispose()
        mps.onDone = undefined
        mps = undefined
      }
    }
    if (autoStart) {
      mps.begin()
    }
    return mps
  }

  static fireSmokeTrail(name: string, scene: Scene, emitter: MercParticlesEmitter, autoStart: boolean = true): MercParticleSystem {
    let testSpawnEmitter = new Vector3(0,0,0)
    let mps = new MercParticleSystem(name, scene)
    mps.SPS.isAlwaysVisible = true;
    let flatMat = new StandardMaterial("testSPS");
    flatMat.specularColor = new Color3(0,0,0);
    mps.SPS.mesh.material = flatMat
    mps.emitRate = 60
    // mps.emitCount = 30
    mps.lifeTimeGradients = [
      new FactorGradient(1, 3)
    ]
    mps.colorGradients = [
      new ColorGradient(0, new Color4(0, 0, 1, 1)),
      new ColorGradient(0.1, new Color4(0.75, 0.5, 0.1, 1)),
      new ColorGradient(0.5, new Color4(0.75, 0.5, 0.1, 1)),
      new ColorGradient(0.75, new Color4(1, 0, 0, 1)),
      new ColorGradient(1, new Color4(1, 1, 1, 0.0))
    ]
    mps.velocityGradients = [
      // new FactorGradient(0, 10),
      // new FactorGradient(0.5, 5),
      new FactorGradient(1, 1)
    ]
    mps.sizeGradients = [
      new FactorGradient(0, 1),
      new FactorGradient(0.1, 1.5),
      new FactorGradient(0.75, 3),
      new FactorGradient(1, 5)
    ]
    mps.rotationGradients = [
      new Vector3Gradient(1, new Vector3(-Math.PI, -Math.PI, -Math.PI), new Vector3(Math.PI, Math.PI, Math.PI))
    ]
    mps.angularSpeedGradients = [
      new Vector3Gradient(1, new Vector3(Scalar.RandomRange(-Math.PI, Math.PI), Scalar.RandomRange(-Math.PI, Math.PI), Scalar.RandomRange(-Math.PI, Math.PI)))
    ]
    mps.initialPositionFunction = emitter.initialPositionFunction;
    mps.initialDirectionFunction = emitter.initialDirectionFunction;
    if (autoStart) {
      mps.begin()
    }
    return mps
  }

  static deathExplosion(name: string, scene: Scene, emitter: MercParticlesEmitter, autoStart: boolean = true, disposeOnDone: boolean = true): MercParticleSystem {
    let mps = new MercParticleSystem(name, scene)
    mps.SPS.isAlwaysVisible = true;
    let flatMat = new StandardMaterial("testSPS");
    flatMat.specularColor = new Color3(0,0,0);
    mps.SPS.mesh.material = flatMat
    mps.emitRate = 3000
    mps.emitCount = 300
    mps.lifeTimeGradients = [
      new FactorGradient(1, 1, 3)
    ]
    mps.colorGradients = [
      new ColorGradient(0, new Color4(0, 0, 1, 1)),
      new ColorGradient(0.1, new Color4(0.75, 0.5, 0.1, 1)),
      new ColorGradient(0.5, new Color4(0.75, 0.5, 0.1, 1)),
      new ColorGradient(0.75, new Color4(1, 0, 0, 1)),
      new ColorGradient(1, new Color4(.2, 0, 0, 0.0))
    ]
    mps.velocityGradients = [
      // new FactorGradient(0, 10),
      // new FactorGradient(0.5, 5),
      new FactorGradient(1, 5, 50)
    ]
    mps.sizeGradients = [
      new FactorGradient(0, 1, 3),
      new FactorGradient(0.1, 1.5, 3),
      new FactorGradient(0.75, 3),
      new FactorGradient(1, 3)
    ]
    mps.rotationGradients = [
      new Vector3Gradient(1, new Vector3(-Math.PI, -Math.PI, -Math.PI), new Vector3(Math.PI, Math.PI, Math.PI))
    ]
    mps.angularSpeedGradients = [
      new Vector3Gradient(1, new Vector3(Scalar.RandomRange(-Math.PI, Math.PI), Scalar.RandomRange(-Math.PI, Math.PI), Scalar.RandomRange(-Math.PI, Math.PI)))
    ]
    mps.initialPositionFunction = emitter.initialPositionFunction;
    mps.initialDirectionFunction = emitter.initialDirectionFunction;
    if (disposeOnDone) {
      mps.onDone = () => {
        mps.dispose()
        mps.onDone = undefined
        mps = undefined
      }
    }
    if (autoStart) {
      mps.begin()
    }
    return mps
  }

  static missileExplosion(name: string, scene: Scene, emitter: MercParticlesEmitter, autoStart: boolean = true, disposeOnDone: boolean = true): MercParticleSystem {
    let mps = new MercParticleSystem(name, scene)
    mps.SPS.isAlwaysVisible = true;
    let flatMat = new StandardMaterial("testSPS");
    flatMat.specularColor = new Color3(0,0,0);
    mps.SPS.mesh.material = flatMat
    mps.emitRate = 3000
    mps.emitCount = 300
    mps.lifeTimeGradients = [
      new FactorGradient(1, 1, 3)
    ]
    mps.colorGradients = [
      new ColorGradient(0, new Color4(0.75, 0.75, 0, 1)),
      new ColorGradient(0.1, new Color4(0.80, 0.80, 0, 1)),
      new ColorGradient(0.5, new Color4(0.80, 0.80, 0.80, 1)),
      new ColorGradient(0.75, new Color4(1, 1, 1, 1)),
      new ColorGradient(1, new Color4(0.2, 0.2, 0.2, 0.0))
    ]
    mps.velocityGradients = [
      // new FactorGradient(0, 10),
      // new FactorGradient(0.5, 5),
      new FactorGradient(1, 5, 50)
    ]
    mps.sizeGradients = [
      new FactorGradient(0, 1, 3),
      new FactorGradient(0.1, 1.5, 3),
      new FactorGradient(0.75, 3),
      new FactorGradient(1, 3)
    ]
    mps.rotationGradients = [
      new Vector3Gradient(1, new Vector3(-Math.PI, -Math.PI, -Math.PI), new Vector3(Math.PI, Math.PI, Math.PI))
    ]
    mps.angularSpeedGradients = [
      new Vector3Gradient(1, new Vector3(Scalar.RandomRange(-Math.PI, Math.PI), Scalar.RandomRange(-Math.PI, Math.PI), Scalar.RandomRange(-Math.PI, Math.PI)))
    ]
    mps.initialPositionFunction = emitter.initialPositionFunction;
    mps.initialDirectionFunction = emitter.initialDirectionFunction;
    if (disposeOnDone) {
      mps.onDone = () => {
        mps.dispose()
        mps.onDone = undefined
        mps = undefined
      }
    }
    if (autoStart) {
      mps.begin()
    }
    return mps
  }
}