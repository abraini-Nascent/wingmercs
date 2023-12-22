import { DeviceSourceManager, DeviceType, Engine, Quaternion, TransformNode, Vector3 } from "@babylonjs/core";
import { Entity, FireCommand, MovementCommand, world } from "../world/world";
import { DegreeToRadian } from "../utils/math";
import { net } from "../net";
import { Dirk } from "../data/ships";
import * as Guns from "../data/guns";
export class PlayerAgent {
  playerEntity: Entity
  dsm: DeviceSourceManager
  node: TransformNode
  onNode: () => void

  constructor(engine: Engine, planeTemplate: string = "dirk") {
    
    const guns = Dirk.guns.reduce((guns, gun, index) => {
      guns[index] = {
        class: gun.type,
        possition: { ...gun.position },
        delta: 0
      }
      return guns
    }, {})
    const shipEngine = {
      currentCapacity: Dirk.engine.maxCapacity,
      maxCapacity: Dirk.engine.maxCapacity,
      rate: Dirk.engine.rate,
    }
    const playerEntity = world.add({
      owner: net.id,
      local: true,
      meshName: "craftSpeederA",
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
      guns,
      engine: shipEngine,
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
      const fireCommand: FireCommand = { gun: 1, weapon: 0 }
      world.addComponent(this.playerEntity, "fireCommand", fireCommand) 
    }
  }
}