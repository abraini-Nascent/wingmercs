// Adapted from https://playground.babylonjs.com/#GLZ1PX#9
// Added gradients from BaseParticleSystem

import { Color3, Color4, ColorGradient, FactorGradient, GradientHelper, IValueGradient, Mesh, MeshBuilder, Nullable, Observer, Scalar, Scene, SolidParticle, SolidParticleSystem, StandardMaterial, TmpVectors, Vector3 } from "@babylonjs/core";

export class MercParticleSystem {
  
  private emitted: Set<number> = new Set()

  // the trust is strong, we _will_ be stabbed in the back
  colorGradients: Nullable<Array<ColorGradient>> = null;
  sizeGradients: Nullable<Array<FactorGradient>> = null;
  lifeTimeGradients: Nullable<Array<FactorGradient>> = null;
  rotationGradients: Nullable<Array<Vector3Gradient>> = null;
  angularSpeedGradients: Nullable<Array<Vector3Gradient>> = null;
  velocityGradients: Nullable<Array<FactorGradient>> = null;
  limitVelocityGradients: Nullable<Array<FactorGradient>> = null;
  dragGradients: Nullable<Array<FactorGradient>> = null;
  emitRateGradients: Nullable<Array<FactorGradient>> = null;

  /** A limit will be used to check the current speed of the particle over its lifetime. And if the limit is reached, then the damping factor is applied as speed * damping factor. */
  limitVelocityDamping: number = 1
  /** Access to the SPS Mesh */
  mesh: Mesh
  SPS: SolidParticleSystem

  /** Number or particles to emit per second */
  emitRate: number = 0
  /** The total number of particles to emit before stopping */
  emitCount: number = 0
  private emittedCount: number = 0
  private finishedCount: number = 0
  private currentEmitRate1: number = 0
  private currentEmitRate2: number = 0
  private currentEmitRateGradient: FactorGradient = undefined

  private emitAccumulator: number = 0
  private newParticlesRemaining: number = 0
  /** how long in seconds we should run the system for, 0 = infinite */
  targetStopDuration: number = 0
  private duration: number = 0
  updateSpeed: number = 1/60
  speed: number
  gravity: Vector3
  direction: Vector3
  stopped: boolean = true
  done: boolean = false

  initialPositionFunction: (particle: SolidParticle) => SolidParticle
  initialDirectionFunction: (particle: SolidParticle) => SolidParticle
  onDone: () => void

  private sceneObserver: Observer<Scene>

  constructor(name: string, private scene: Scene, type: number | ((system: SolidParticleSystem) => {}) = 1, size: number = 1, count: number = 1000)  {
    // Set variables
    this.speed = 1.5;
    this.gravity = new Vector3(0, -0.01, 0);
    this.direction = new Vector3(0, 1, 0);

    const SPS = new SolidParticleSystem(name, scene);
    if (typeof type == "number") {
      const shapeMesh = MeshBuilder.CreatePolyhedron("shape", {size, type});
      SPS.addShape(shapeMesh, count);
      shapeMesh.dispose();
    } else if (type != undefined) {
      type(SPS);
    }
    this.mesh = SPS.buildMesh(); // finally builds and displays the SPS mesh
    this.SPS = SPS

    // Initate by recycling through all particles
    SPS.initParticles = () => {
      for (let p = 0; p < SPS.nbParticles; p++) {
        this.recycleParticle(SPS.particles[p])
      }
    }

    SPS.updateParticle = this.updateParticle;
  }

  dispose() {
    this.sceneObserver.remove()
    this.SPS.dispose()
  }

  begin = () => {
    // reset
    this.stopped = false;
    this.done = false;
    this.newParticlesRemaining = 0;
    this.duration = 0;
    this.emitAccumulator = 0;
    this.emittedCount = 0;
    this.finishedCount = 0;
    this.emitted.clear()

    if (this.targetStopDuration && this.emitRateGradients && this.emitRateGradients.length > 0) {
      GradientHelper.GetCurrentGradient(0, this.emitRateGradients, (currentGradient, nextGradient, scale) => {
        this.currentEmitRate1 = (<FactorGradient>currentGradient).getFactor();
        this.currentEmitRate2 = (<FactorGradient>nextGradient).getFactor();
        this.currentEmitRateGradient = <FactorGradient>currentGradient;
      });
    }

    // Initiate SPS mesh
    this.SPS.initParticles();
    this.SPS.setParticles();

    if (this.sceneObserver != undefined) {
      this.sceneObserver.remove()
      this.sceneObserver = undefined
    }
    this.sceneObserver = this.scene.onAfterRenderObservable.add(() => {
      this.animate();
      this.SPS.setParticles();
    })
  }

  /** recycle particles function, sets particles to an intial state */ 
  recycleParticle = (particle: SolidParticle) => {
    this.emitted.delete(particle.id)
    if (particle.props == undefined) {
      particle.props = {};
    }
    particle.props.age = 0;
    particle.props.lifeTime = 3;
    // if (particle.props.startPos) {
      // let start: Vector3 = particle.props.startPos
      // let length = start.subtract(particle.position).length()
      // console.log("travel length:", length)
    // }

    /// Life Time
    if (this.lifeTimeGradients && this.lifeTimeGradients.length > 0) {
      let ratio
      if (this.targetStopDuration) {
        ratio = Scalar.Clamp(this.duration / this.targetStopDuration);
      } else {
        ratio = 1
      }
      GradientHelper.GetCurrentGradient(ratio, this.lifeTimeGradients, (currentGradient, nextGradient, scale) => {
          const factorGradient1 = <FactorGradient>currentGradient;
          const factorGradient2 = <FactorGradient>nextGradient;
          const lifeTime1 = factorGradient1.getFactor();
          const lifeTime2 = factorGradient2.getFactor();
          particle.props.lifeTime = Scalar.Lerp(lifeTime1, lifeTime2, scale);
      });
    } else {
      particle.props.lifeTime = 0;
    }

    /// Direction
    if (particle.props.direction == undefined) {
      particle.props.direction = Vector3.Zero().copyFrom(this.direction)
    } else {
      (particle.props.direction as Vector3).copyFrom(this.direction)
    }
    if (particle.props.scaledDirection == undefined) {
      particle.props.scaledDirection = Vector3.Zero()
    } else {
      (particle.props.scaledDirection as Vector3).setAll(0)
    }
    particle.props.currentColorGradient = undefined

    /// Color
    if (this.colorGradients != undefined && this.colorGradients.length > 0) {
      GradientHelper.GetCurrentGradient(0, this.colorGradients, (currentGradient, nextGradient) => {
        particle.props.currentColor1 = new Color4();
        particle.props.currentColor2 = new Color4();
        particle.props.currentColorGradient = currentGradient;
        (currentGradient as ColorGradient).getColorToRef(particle.props.currentColor1);
        (nextGradient as ColorGradient).getColorToRef(particle.props.currentColor2);
      })
    } else {
      particle.props.currentColorGradient = undefined
      particle.props.currentColor1 = undefined
      particle.props.currentColor2 = undefined
    }

    /// Rotation
    if (this.rotationGradients && this.rotationGradients.length > 0) {
      GradientHelper.GetCurrentGradient(0, this.rotationGradients, (currentGradient, nextGradient, scale) => {
        particle.props.currentRotationGradient = currentGradient;
        if (particle.props.currentRotation1 == undefined) { 
          particle.props.currentRotation1 = new Vector3();
        }
        if (particle.props.currentRotation2 == undefined) { 
          particle.props.currentRotation2 = new Vector3();
        }
        if (particle.props.rotation == undefined) {
          particle.props.rotation = new Vector3();
        }
        particle.props.currentRotation1 = (<Vector3Gradient>currentGradient).getVectorToRef(particle.props.currentRotation1);
        particle.props.currentRotation2 = (<Vector3Gradient>nextGradient).getVectorToRef(particle.props.currentRotation1);
        particle.props.rotation = Vector3.LerpToRef(particle.props.currentRotation1, particle.props.currentRotation2, scale, particle.props.rotation);
      });
    } else {
      particle.props.currentRotationGradient = undefined
      particle.props.currentRotation1 = undefined
      particle.props.currentRotation2 = undefined
      if (particle.props.rotation == undefined) {
        particle.props.rotation = new Vector3()
      }
    }

    /// Angular Velocity
    if (this.angularSpeedGradients && this.angularSpeedGradients.length > 0) {
      GradientHelper.GetCurrentGradient(0, this.angularSpeedGradients, (currentGradient, nextGradient, scale) => {
        particle.props.currentAngularSpeedGradient = currentGradient;
        if (particle.props.currentAngularSpeed1 == undefined) {
          particle.props.currentAngularSpeed1 = new Vector3();
        }
        if (particle.props.currentAngularSpeed2 == undefined) {
          particle.props.currentAngularSpeed2 = new Vector3();
        }
        if (particle.props.angularSpeed == undefined) {
          particle.props.angularSpeed = new Vector3();
        }
        particle.props.currentAngularSpeed1 = (<Vector3Gradient>currentGradient).getVectorToRef(particle.props.currentAngularSpeed1);
        particle.props.currentAngularSpeed2 = (<Vector3Gradient>nextGradient).getVectorToRef(particle.props.currentAngularSpeed2);
        particle.props.angularSpeed = Vector3.LerpToRef(particle.props.currentAngularSpeed1, particle.props.currentAngularSpeed2, scale, particle.props.angularSpeed);
      });
    } else {
      particle.props.currentAngularSpeedGradient = undefined;
      particle.props.currentAngularSpeed1 = undefined;
      particle.props.currentAngularSpeed2 = undefined;
      particle.props.angularSpeed = undefined;
    }
    if (particle.props.angle == undefined) {
      particle.props.angle = new Vector3();
    } else {
      (particle.props.angle as Vector3).setAll(0);
    }

    /// Velocity
    if (this.velocityGradients && this.velocityGradients.length > 0) {
      GradientHelper.GetCurrentGradient(0, this.velocityGradients, (currentGradient, nextGradient, scale) => {
        particle.props.currentVelocityGradient = currentGradient
        particle.props.currentVelocity1 = (<FactorGradient>currentGradient).getFactor();
        particle.props.currentVelocity2 = (<FactorGradient>nextGradient).getFactor();
      });
    } else {
      particle.props.currentVelocityGradient = undefined
      particle.props.currentVelocity1 = undefined
      particle.props.currentVelocity2 = undefined
    }

    /// Limit velocity
    if (this.limitVelocityGradients && this.limitVelocityGradients.length > 0) {
      GradientHelper.GetCurrentGradient(0, this.limitVelocityGradients, (currentGradient, nextGradient, scale) => {
        particle.props.currentLimitVelocityGradient = <FactorGradient>currentGradient;
        particle.props.currentLimitVelocity1 = (<FactorGradient>currentGradient).getFactor();
        particle.props.currentLimitVelocity2 = (<FactorGradient>nextGradient).getFactor();
      });
    } else {
      particle.props.currentLimitVelocityGradient = undefined
      particle.props.currentLimitVelocity1 = undefined
      particle.props.currentLimitVelocity2 = undefined
    }

    /// Drag
    if (this.dragGradients && this.dragGradients.length > 0) {
      GradientHelper.GetCurrentGradient(0, this.dragGradients, (currentGradient, nextGradient, scale) => {
        particle.props.currentDragGradient = currentGradient
        particle.props.currentDrag1 = (currentGradient as FactorGradient).getFactor();
        particle.props.currentDrag2 = (nextGradient as FactorGradient).getFactor();
      });
    } else {
      particle.props.currentDragGradient = undefined
      particle.props.currentDrag1 = undefined
      particle.props.currentDrag2 = undefined
    }
    
    /// Size
    if (this.sizeGradients && this.sizeGradients.length > 0) {
      GradientHelper.GetCurrentGradient(0, this.sizeGradients, (currentGradient, nextGradient, scale) => {
        particle.props.currentSize1 = (<FactorGradient>currentGradient).getFactor();
        particle.props.currentSize2 = (<FactorGradient>nextGradient).getFactor();
        particle.props.currentSizeGradient = <FactorGradient>currentGradient;
      });
    } else {
      particle.props.currentSizeGradient = undefined
      particle.props.currentSize1 = undefined
      particle.props.currentSize2 = undefined
    }

    particle.isVisible = false;
    particle.position.setAll(0);
    particle.rotation.setAll(0);
    particle.velocity.setAll(0);
    particle.scale.setAll(1);
    if (particle.color != undefined) {
      particle.color.set(1,1,1,1);
    } else {
      particle.color = new Color4(1, 1, 1, 1);
    }
  };

  /** determins how many particles to emit to "animate" the particle system */
  private animate = () => {
    this.duration += this.scene.getEngine().getDeltaTime() / 1000;
    if (this.targetStopDuration != 0 && this.duration >= this.targetStopDuration) {
      this.stopped = true;
    }
    if (this.stopped) {
      return;
    }
    // let scaledUpdateSpeed = this.updateSpeed * this.scene?.getAnimationRatio() || 1;
    let scaledUpdateSpeed = this.scene?.getEngine().getDeltaTime() / 1000

    // Determine the number of particles we need to make visible

    let rate = this.emitRate;

    if (this.targetStopDuration && this.emitRateGradients && this.emitRateGradients.length > 0) {
      const ratio = this.duration / this.targetStopDuration;
      GradientHelper.GetCurrentGradient(ratio, this.emitRateGradients, (currentGradient, nextGradient, scale) => {
        if (currentGradient !== this.currentEmitRateGradient) {
          this.currentEmitRate1 = this.currentEmitRate2;
          this.currentEmitRate2 = (<FactorGradient>nextGradient).getFactor();
          this.currentEmitRateGradient = <FactorGradient>currentGradient;
        }

        rate = Scalar.Lerp(this.currentEmitRate1, this.currentEmitRate2, scale);
      });
    }

    this.emitAccumulator += rate * scaledUpdateSpeed
    if (this.emitCount > 0 && this.emittedCount >= this.emitCount) {
      return;
    }
    if (Math.floor(this.emitAccumulator) > 0) {
      this.newParticlesRemaining += Math.floor(this.emitAccumulator)
      this.emitAccumulator -= Math.floor(this.emitAccumulator)
    }
    if (this.newParticlesRemaining > 0) {
      if (this.emitCount > 0) {
        if (this.newParticlesRemaining + this.emittedCount > this.emitCount) {
          this.newParticlesRemaining = this.emitCount - this.emittedCount;
        }
      }
      // console.log("adding particles", this.newParticlesRemaining)
    }
  }

  /** updates the particle along it's lifetime using the gradients.  will recycle particles when they reach their end of life and instantiate particles when they become animated */
  private updateParticle = (particle: SolidParticle): SolidParticle => {
    // if (this.stopped) { return particle; }
    if (this.emitted.has(particle.id) == false && this.newParticlesRemaining == 0) {
      return particle;
    } else if ((this.emitted.has(particle.id) == false && this.newParticlesRemaining > 0) &&
      (this.emitCount == 0 || this.emittedCount  < this.emitCount)
    ) {
      particle.isVisible = true;
      this.newParticlesRemaining -= 1;
      this.emitted.add(particle.id);
      this.emittedCount += 1;
      if (this.initialPositionFunction) {
        this.initialPositionFunction(particle);
      }
      if (this.initialDirectionFunction) {
        this.initialDirectionFunction(particle);
      }
    }
    // scale speed to seconds
    let scaledUpdateSpeed = this.scene?.getEngine().getDeltaTime() / 1000;
    const previousAge = particle.props.age;
    particle.props.age += scaledUpdateSpeed;

    // Evaluate step to death
    if (particle.props.age > particle.props.lifeTime) {
      const diff = particle.props.age - previousAge;
      const oldDiff = particle.props.lifeTime - previousAge;

      scaledUpdateSpeed = (oldDiff * scaledUpdateSpeed) / diff;
      this.recycleParticle(particle);
      this.finishedCount += 1;
      if (this.emitCount > 0 && this.finishedCount == this.emitCount) {
        this.stopped = true;
      }
      if (this.emitted.size == 0 && this.stopped) {
        if (this.onDone) {
          this.onDone()
        }
        this.done = true;
      }
      return particle;
    }

    const ratio = particle.props.age / particle.props.lifeTime;

    /// Color
    if (this.colorGradients && this.colorGradients.length > 0) {
      GradientHelper.GetCurrentGradient(ratio, this.colorGradients, (currentGradient, nextGradient, scale) => { // todo: this makes a new function every particle, isn't this heavy?
        if (currentGradient !== particle.props.currentColorGradient) {
          particle.props.currentColor1.copyFrom(particle.props.currentColor2);
          (<ColorGradient>nextGradient).getColorToRef(particle.props.currentColor2);
          particle.props.currentColorGradient = <ColorGradient>currentGradient;
        }
        Color4.LerpToRef(particle.props.currentColor1, particle.props.currentColor2, scale, particle.color);
      });
    }

    /// Angular speed
    if (this.angularSpeedGradients && this.angularSpeedGradients.length > 0) {
    GradientHelper.GetCurrentGradient(ratio, this.angularSpeedGradients, (currentGradient, nextGradient, scale) => {
        if (currentGradient !== particle.props.currentAngularSpeedGradient) {
          particle.props.currentAngularSpeed1 = particle.props.currentAngularSpeed2;
          particle.props.currentAngularSpeed2 = (<Vector3Gradient>nextGradient).getVectorToRef(particle.props.currentAngularSpeed2);
          particle.props.currentAngularSpeedGradient = <Vector3Gradient>currentGradient;
        }
        particle.props.angularSpeed = Vector3.LerpToRef(particle.props.currentAngularSpeed1, particle.props.currentAngularSpeed2, scale, particle.props.angularSpeed);
      });
    }
    (particle.props.rotation as Vector3).addInPlace((particle.props.angularSpeed as Vector3).scaleInPlace(scaledUpdateSpeed));

    /// Direction
    let directionScale = scaledUpdateSpeed;

    /// Velocity
    if (this.velocityGradients && this.velocityGradients.length > 0) {
      GradientHelper.GetCurrentGradient(ratio, this.velocityGradients, (currentGradient, nextGradient, scale) => {
        if (currentGradient !== particle.props.currentVelocityGradient) {
          particle.props.currentVelocity1 = particle.props.currentVelocity2;
          particle.props.currentVelocity2 = (<FactorGradient>nextGradient).getFactor();
          particle.props.currentVelocityGradient = <FactorGradient>currentGradient;
        }
        directionScale *= Scalar.Lerp(particle.props.currentVelocity1, particle.props.currentVelocity2, scale);
      });
    }

    particle.props.direction.scaleToRef(directionScale, particle.props.scaledDirection);

    /// Limit velocity
    if (this.limitVelocityGradients && this.limitVelocityGradients.length > 0) {
      GradientHelper.GetCurrentGradient(ratio, this.limitVelocityGradients, (currentGradient, nextGradient, scale) => {
        if (currentGradient !== particle.props.currentLimitVelocityGradient) {
          particle.props.currentLimitVelocity1 = particle.props.currentLimitVelocity2;
          particle.props.currentLimitVelocity2 = (<FactorGradient>nextGradient).getFactor();
          particle.props.currentLimitVelocityGradient = <FactorGradient>currentGradient;
        }

        const limitVelocity = Scalar.Lerp(particle.props.currentLimitVelocity1, particle.props.currentLimitVelocity2, scale);
        const currentVelocity = particle.props.direction.length();

        if (currentVelocity > limitVelocity) {
          particle.props.direction.scaleInPlace(this.limitVelocityDamping);
        }
      });
    }

    /// Drag
    if (this.dragGradients && this.dragGradients.length > 0) {
      GradientHelper.GetCurrentGradient(ratio, this.dragGradients, (currentGradient, nextGradient, scale) => {
        if (currentGradient !== particle.props.currentDragGradient) {
          particle.props.currentDrag1 = particle.props.currentDrag2;
          particle.props.currentDrag2 = (<FactorGradient>nextGradient).getFactor();
          particle.props.currentDragGradient = <FactorGradient>currentGradient;
        }

        const drag = Scalar.Lerp(particle.props.currentDrag1, particle.props.currentDrag2, scale);
        particle.props.scaledDirection.scaleInPlace(1.0 - drag);
      });
    }

    // if (this.isLocal && particle._localPosition) {
    //     particle._localPosition!.addInPlace(this._scaledDirection);
    //     Vector3.TransformCoordinatesToRef(particle._localPosition!, this._emitterWorldMatrix, particle.position);
    // } else {
    //     particle.position.addInPlace(this._scaledDirection);
    // }

    // Gravity
    // this.gravity.scaleToRef(scaledUpdateSpeed, this._scaledGravity);

    // this.gravity.scaleToRef(scaledUpdateSpeed, TmpVectors.Vector3[0]);
    // particle.props.scaledDirection.addInPlace(TmpVectors.Vector3[0]);

    // Size // TODO size is setting the scale of the particle, currently it is uniformly set
    if (this.sizeGradients && this.sizeGradients.length > 0) {
      GradientHelper.GetCurrentGradient(ratio, this.sizeGradients, (currentGradient, nextGradient, scale) => {
        if (currentGradient !== particle.props.currentSizeGradient) {
          particle.props.currentSize1 = particle.props.currentSize2;
          particle.props.currentSize2 = (<FactorGradient>nextGradient).getFactor();
          particle.props.currentSizeGradient = <FactorGradient>currentGradient;
        }
        particle.scaling.setAll(Scalar.Lerp(particle.props.currentSize1, particle.props.currentSize2, scale));
      });
    }

    particle.position.addInPlace(particle.props.scaledDirection)
    particle.rotation.copyFrom(particle.props.rotation)

    return particle;
  }
}

  //Update function
  // private smallUpdateParticle = (particle: SolidParticle): SolidParticle => {
  //   if (particle.position.y < 0) {
  //       this.recycleParticle(particle);
  //   }
  //   particle.velocity.y += this.gravity.y;             // apply gravity to y
  //   particle.position.addInPlace(particle.velocity); // update particle new position

  //   const direction = Math.sign(particle.idx % 2 - 0.5); //rotation direction +/- 1 depends on particle index in particles array           // rotation sign and new value
  //   particle.rotation.z += 0.1 * direction;
  //   particle.rotation.x += 0.05 * direction;
  //   particle.rotation.y += 0.008 * direction;
  //   return particle;
  // }

/** Class used to store factor gradient */
export class Vector3Gradient implements IValueGradient {
  /**
   * Gets or sets the gradient value (between 0 and 1)
   */
  gradient: number;
  /**
   * Gets or sets first associated vector
   */
  vector1: Vector3;
  /**
   * Gets or sets second associated vector
   */
  vector2?: Vector3 | undefined;
  /**
   * Creates a new factor gradient
   * @param gradient gets or sets the gradient value (between 0 and 1)
   * @param vector1 gets or sets first associated factor
   * @param vector2 gets or sets second associated factor
   */
  constructor(
  /**
   * Gets or sets the gradient value (between 0 and 1)
   */
  gradient: number, 
  /**
   * Gets or sets first associated vector
   */
  vector1: Vector3, 
  /**
   * Gets or sets second associated vector
   */
  vector2?: Vector3 | undefined) {
    this.gradient = gradient;
    this.vector1 = vector1;
    this.vector2 = vector2;
  }
  /**
   * Will get a number picked randomly between vector1 and vector2.
   * If vector2 is undefined then vector1 will be used
   * @returns the picked number
   */
  getVectorToRef(ref: Vector3): Vector3 {
    if (this.vector2 == undefined) {
      return ref.copyFrom(this.vector1)
    } else {
      return Vector3.LerpToRef(this.vector1, this.vector2, Scalar.RandomRange(0,1), ref)
    }
  }
}

export const PolyhedronType = Object.freeze({
  Tetrahedron:  0,
  Octahedron:  1,
  Dodecahedron:  2,
  Icosahedron:  3,
  Rhombicuboctahedron:  4,
  TriangularPrism:  5,
  PentagonalPrism:  6 ,
  HexagonalPrism:  7,
  SquarePyramid:  8,
  PentagonalPyramid:  9,
  TriangularDipyramid:  10,
  PentagonalDipyramid:  11,
  ElongatedSquareDipyramid:  12,
  ElongatedPentagonalDipyramid:  13,
  ElongatedPentagonalCupola:  14,
})