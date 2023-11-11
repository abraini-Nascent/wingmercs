import { DeviceSourceManager, DeviceType, Engine, Quaternion, TransformNode, Vector3 } from "@babylonjs/core";
import { Entity, world } from "../world/world";
import { DegreeToRadian } from "../utils/math";
import { net } from "../net";

export class PlayerAgent {
  playerEntity: Entity
  dsm: DeviceSourceManager
  node: TransformNode
  onNode: () => void
  
  pitchSpeed = 80; // Degrees per second
  yawSpeed   = 80; // Degrees per second
  rollSpeed  = 90; // Degrees per second

  constructor(engine: Engine) {
    
    const playerEntity = world.add({
      owner: net.id,
      local: true,
      meshName: "craftCargoA",
      trail: true,
      position: {x: 0, y: 0, z: 0},
      velocity: {x: 0, y: 0, z: 0},
      direction: {x: 0, y: 0, z: -1},
      acceleration: {x: 0, y: 0, z: 0},
      rotationalVelocity: {roll: 0, pitch: 0, yaw: 0},
      rotationQuaternion: {w: 1, x: 0, y:0, z:0},
      rotation: {x: 0, y: 0, z: -1},
      health: 100,
      totalScore: 0,
      gun: {
        delay: 333, // delay in ms
        delta: 0,
      },
      playerId: net.id
    })
    this.playerEntity = playerEntity
    this.dsm = new DeviceSourceManager(engine)
  }
  /**
   * 
   * @param dt delta time in milliseconds
   */
  checkInput(dt: number) {
    // mushy
    if (this.playerEntity.node != undefined && this.node != this.playerEntity.node) {
      this.node = this.playerEntity.node as TransformNode
      if (this.onNode) {
        this.onNode()
      }
    }
    /// STEER / ROLL PITCH YAW
    let up = 0, down = 0, left = 0, right = 0, rollLeft = 0, rollRight  = 0;
    const mod = this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(16) ? true : false
    // UP 38
    if(this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(38)) {
      up = 1
    }
    // DOWN 40
    if(this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(40)) {
      down = 1
    }
    // RIGHT 39
    if(this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(39)) {
      if (mod) {
        rollRight = 1
      } else {
        right = 1
      }
    }
    // LEFT 37
    if(this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(37)) {
      if (mod) {
        rollLeft = 1
      } else {
        left = 1
      }
    }
    if ((this.playerEntity as any).applyYawPitchRoll == undefined) {
      
    }
    // reset rotational velocity
    this.playerEntity.rotationalVelocity.pitch = 0
    this.playerEntity.rotationalVelocity.yaw = 0
    this.playerEntity.rotationalVelocity.roll = 0
    if (up || down || left || right || rollLeft || rollRight) {
      // Positive for down, negative for up
      const deltaPitch = (((this.pitchSpeed * (down - up))) / 1000) * dt;
      // Positive for right, negative for left
      const deltaYaw = (((this.yawSpeed * (right - left))) / 1000) * dt;
      // Positive for roll left, negative for roll right
      const deltaRoll = (((this.rollSpeed * (rollLeft - rollRight))) / 1000) * dt;
      // call modify method
      this.playerEntity.rotationalVelocity.pitch = deltaPitch
      this.playerEntity.rotationalVelocity.yaw = deltaYaw
      this.playerEntity.rotationalVelocity.roll = deltaRoll
    }

    /// AFTERBURNER - ACCELERATE
    // "SPACE" [32]
    let afterburner = 0
    if (this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(32)) {
      afterburner = 1
    }
    let breaks = 0
    // "ALT" [18]
    if (this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(18)) {
      breaks = 1
    }
    if (afterburner) {
      const forward = new Vector3(0, 0, -1)
      let burn = afterburner * 1 * (dt / 1000)
      forward.multiplyInPlace(new Vector3(burn, burn, burn))
      forward.applyRotationQuaternionInPlace(QuaternionFromObj(this.playerEntity.rotationQuaternion))
      const acceleration  = new Vector3(this.playerEntity.acceleration.x, this.playerEntity.acceleration.y, this.playerEntity.acceleration.z)
      acceleration.addInPlace(forward)
      this.playerEntity.acceleration.x = acceleration.x
      this.playerEntity.acceleration.y = acceleration.y
      this.playerEntity.acceleration.z = acceleration.z
    } else {
      const acceleration  = new Vector3(this.playerEntity.acceleration.x, this.playerEntity.acceleration.y, this.playerEntity.acceleration.z)
      Vector3.LerpToRef(acceleration, Vector3.Zero(), 0.33, acceleration)
      this.playerEntity.acceleration.x = acceleration.x
      this.playerEntity.acceleration.y = acceleration.y
      this.playerEntity.acceleration.z = acceleration.z

      // dampners
      if (breaks) {
        const velocity  = new Vector3(this.playerEntity.velocity.x, this.playerEntity.velocity.y, this.playerEntity.velocity.z)
        Vector3.LerpToRef(velocity, Vector3.Zero(), 1 * (dt / 1000), velocity)
        this.playerEntity.velocity.x = velocity.x
        this.playerEntity.velocity.y = velocity.y
        this.playerEntity.velocity.z = velocity.z
      }
    }

    

    /// FIRE PROJECTILES
    // "ENTER" 13
    // "CONTROL" 17
  let fire = 0
  if ( this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(13)) {
    fire  = 1
  }
  if (this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(17)) {
   fire = 1
  }
  if (fire) {
      // TODO spawn an asteroid for now
      // TODO create a cooldown
      if (this.playerEntity.gun?.delta > 0) {
        return
      }
      this.playerEntity.gun.delta = this.playerEntity.gun.delay
      // velocity
      const forward = new Vector3(0, 0, -1)
      let burn = 2500
      forward.multiplyInPlace(new Vector3(burn, burn, burn))
      forward.applyRotationQuaternionInPlace(QuaternionFromObj(this.playerEntity.rotationQuaternion))
      forward.addInPlace(new Vector3(this.playerEntity.velocity.x,this.playerEntity.velocity.y, this.playerEntity.velocity.z))
      world.add({
        meshName: "meteor",
        meshColor: {r: 100/255, g: 10/255, b: 10/255, a: 1},
        originatorId: this.playerEntity.playerId,
        position: {
          x: this.playerEntity.position.x,
          y: this.playerEntity.position.y,
          z: this.playerEntity.position.z,
        },
        direction: {
          x: this.playerEntity.direction.x,
          y: this.playerEntity.direction.y,
          z: this.playerEntity.direction.z,
        },
        velocity: {
          x: forward.x,
          y: forward.y,
          z: forward.z
        },
        acceleration: { x: 0, y: 0, z: 0 },
        range: {
          max: 300,
          total: 0,
          lastPosition: {
            x: this.playerEntity.position.x,
            y: this.playerEntity.position.y,
            z: this.playerEntity.position.z,
          }
        },
        damage: 1,
        trail: true,
        trailOptions: {
          color: {r: 100/255, g: 10/255, b: 10/255, a: 1},
          width: 0.2,
          length: 2,
        },
        bodyType: "animated"
      });
    }
  }
}

function QuaternionFromObj(obj: {x: number, y: number, z: number, w: number}): Quaternion {
  return new Quaternion(obj.x, obj.y, obj.z, obj.w);
}