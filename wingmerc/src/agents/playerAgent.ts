import { DeviceSourceManager, DeviceType, Engine, Quaternion, TransformNode, Vector3 } from "@babylonjs/core";
import { Entity, MovementCommand, world } from "../world/world";
import { DegreeToRadian } from "../utils/math";
import { net } from "../net";
import { Dirk } from "../data/ships";
export class PlayerAgent {
  playerEntity: Entity
  dsm: DeviceSourceManager
  node: TransformNode
  onNode: () => void

  constructor(engine: Engine, planeTemplate: string = "dirk") {
    
    const playerEntity = world.add({
      owner: net.id,
      local: true,
      meshName: "craftCargoA",
      trail: true,
      planeTemplate: planeTemplate,
      position: {x: 0, y: 0, z: 0},
      velocity: {x: 0, y: 0, z: 0},
      setSpeed: Dirk.cruiseSpeed / 2,
      currentSpeed: Dirk.cruiseSpeed / 2,
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
    const movementCommand: MovementCommand = {};
    /// STEER / ROLL PITCH YAW
    let up = 0, down = 0, left = 0, right = 0, rollLeft = 0, rollRight  = 0;
    // "SHIFT" [16]
    const mod = this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(16) ? true : false
    // "Z" [90]
    const drift = this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(90) ? true : false
    if (drift) {
      movementCommand.drift = 1
    }

    // "UP" [38]
    if(this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(38)) {
      up = 1
      movementCommand.pitch = 1
    }
    // "DOWN" [40]
    if(this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(40)) {
      down = 1
      movementCommand.pitch = -1
    }
    // "RIGHT" [39]
    if(this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(39)) {
      if (mod) {
        rollRight = 1
        movementCommand.roll = 1
      } else {
        right = 1
        movementCommand.yaw = 1
      }
    }
    // "LEFT" [37]
    if(this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(37)) {
      if (mod) {
        rollLeft = 1
        movementCommand.roll = -1
      } else {
        left = 1
        movementCommand.yaw = -1
      }
    }

    /// AFTERBURNER - ACCELERATE
    // "SPACE" [32]
    let afterburner = 0
    if (this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(32)) {
      afterburner = 1
      movementCommand.afterburner = 1
    }
    let breaks = 0
    // "ALT" [18]
    if (this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(18)) {
      breaks = 1
      movementCommand.brake = 1
    }
    // "9" [57]
    if (this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(57)) {
      // TODO: debounce?
      movementCommand.deltaSpeed = -25
      let newSpeed = Math.max(this.playerEntity.setSpeed - 25, 0)
      world.update(this.playerEntity, "setSpeed", newSpeed)
    }
    // "0" [48]
    if (this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(48)) {
      // TODO: debounce?
      movementCommand.deltaSpeed = +25
      let newSpeed = Math.min(this.playerEntity.setSpeed + 25, Dirk.cruiseSpeed)
      world.update(this.playerEntity, "setSpeed", newSpeed)
    }

    world.update(this.playerEntity, "movementCommand", movementCommand)
    
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