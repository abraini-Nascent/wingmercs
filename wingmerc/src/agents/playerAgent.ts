import { DeviceSourceManager, DeviceType, Engine, Quaternion, TransformNode, Vector3 } from "@babylonjs/core";
import { Entity, FireCommand, MovementCommand, ShipArmor, ShipShields, ShipSystems, world } from "../world/world";
import { net } from "../net";
import { Dirk } from "../data/ships";
import * as Guns from "../data/guns";
import { Inspector } from "@babylonjs/inspector";
import { AppContainer } from "../app.container";
import { Gun } from "../data/guns/gun";
export class PlayerAgent {
  playerEntity: Entity
  dsm: DeviceSourceManager
  node: TransformNode
  onNode: () => void

  constructor(engine: Engine, planeTemplate: string = "Dirk") {

    const guns = Dirk.guns.reduce((guns, gun, index) => {
      const gunClass = Guns[gun.type] as Gun
      guns[index] = {
        class: gun.type,
        possition: { ...gun.position },
        delta: 0,
        currentHealth: gunClass.health
      }
      return guns
    }, {})
    const weapons = Dirk.weapons.reduce((weapons, weapon) => {
      weapons.mounts.push({
        type: weapon.type,
        count: weapon.count
      })
      return weapons
    }, { selected: 0, mounts: [], delta: 0 })
    const shipEngine = {
      currentCapacity: Dirk.engine.maxCapacity,
      maxCapacity: Dirk.engine.maxCapacity,
      rate: Dirk.engine.rate,
    }
    const shipShields: ShipShields = {
      maxFore: Dirk.shields.fore,
      currentFore: Dirk.shields.fore,
      maxAft: Dirk.shields.aft,
      currentAft: Dirk.shields.aft,
      energyDrain: Dirk.shields.energyDrain,
      rechargeRate: Dirk.shields.rechargeRate,
    }
    const shipArmor: ShipArmor = {
      back: Dirk.armor.back,
      front: Dirk.armor.front,
      left: Dirk.armor.left,
      right: Dirk.armor.right,
    }
    const shipSystems: ShipSystems = {
      quadrant: {
        fore: JSON.parse(JSON.stringify(Dirk.systems.quadrant.fore)) as {
          system: "guns"|"radar"|"thrusters"|"targeting"|"weapons"|"engines"|"battery"|"shield"|"power",
          weight: number
        }[], // :\
        aft: JSON.parse(JSON.stringify(Dirk.systems.quadrant.fore)) as {
          system: "guns"|"radar"|"thrusters"|"targeting"|"weapons"|"engines"|"battery"|"shield"|"power",
          weight: number
        }[] // why you gotta be to awkward there bud :\
      },
      state: {
        afterburners: Dirk.systems.base.afterburners,
        thrusters: Dirk.systems.base.thrusters,
        engines: Dirk.systems.base.engines,
        power: Dirk.systems.base.power,
        battery: Dirk.systems.base.battery,
        shield: Dirk.systems.base.shield,
        radar: Dirk.systems.base.radar,
        targeting: Dirk.systems.base.targeting,
        guns: Dirk.systems.base.guns,
        weapons: Dirk.systems.base.weapons,
      },
      base: {
        afterburners: Dirk.systems.base.afterburners,
        thrusters: Dirk.systems.base.thrusters,
        engines: Dirk.systems.base.engines,
        power: Dirk.systems.base.power,
        battery: Dirk.systems.base.battery,
        shield: Dirk.systems.base.shield,
        radar: Dirk.systems.base.radar,
        targeting: Dirk.systems.base.targeting,
        guns: Dirk.systems.base.guns,
        weapons: Dirk.systems.base.weapons,
      }
    }
    const playerEntity = world.add({
      owner: net.id,
      local: true,
      meshName: "craftSpeederA",
      // hullName: Dirk.hullModel,
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
      weapons,
      engine: shipEngine,
      shields: shipShields,
      armor: shipArmor,
      systems: shipSystems,
      targeting: {
        missileLocked: false,
        targetingDirection: { x: 0, y: 0, z: -1 },
        target: -1,
        locked: false,
        targetingTime: 0,
        gunInterceptPosition: undefined
      },
      isTargetable: "player",
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
    // "TAB" [9]
    let afterburner = 0
    if (this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(9)) {
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
    // "CONTROL" 17
    // "SPACE" [32]
    let fire = 0
    let weapon = 0
    let lock = false
    let target = 0
    if ( this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(32)) {
      fire  = 1
    }
    if (this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(17)) {
      fire = 1
    }
    /// FIRE WEAPONS
    // "ENTER" 13
    if (this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(13)) {
      weapon = 1
    }
    /// LOCK TARGET
    // "L" [76]
    if (this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(76)) {
      lock = true
    }
    if (fire || weapon || lock || target) {
      const fireCommand: FireCommand = { gun: fire, weapon, lock }
      world.addComponent(this.playerEntity, "fireCommand", fireCommand) 
    }

    // "TILDE", // [176]
    // ... YOUR SCENE CREATION
    if (this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(192)) {
      Inspector.Show(AppContainer.instance.scene, {})
    }
  }
}