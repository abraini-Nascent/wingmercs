import { ComponentModifier } from './../data/ships/shipDetails';
import { ShipDetails, ShipDetailsCustomizable } from "../data/ships/shipDetails"
import * as GunData from "../data/guns"
import { Gun, Guns } from "../data/guns/gun"
import { Entity, ShipArmor, ShipEngine, ShipGuns, ShipPowerPlant, ShipShields, ShipSystems, world } from "./world"
import { net } from "../net"

export function createShip(ship: ShipDetails, x: number, y: number, z: number, teamId?: number, groupId?): Entity {
  console.log(`[CreateShip] creating new ship ${ship.name}`)
  const gunData = GunData as Guns
  const gunMounts = ship.guns.reduce((guns, gun, index) => {
    const gunClass = gunData[gun.type] as Gun
    guns[index] = {
      class: gun.type,
      possition: { ...gun.position },
      delta: 0,
      currentHealth: gunClass.health
    }
    return guns
  }, {})
  const guns: ShipGuns = {
    mounts: gunMounts,
    selected: 0,
    groups: [Object.keys(gunMounts).map(key => parseInt(key))]
  }
  const weapons = ship.weapons.reduce((weapons, weapon) => {
    weapons.mounts.push({
      type: weapon.type,
      count: weapon.count
    })
    return weapons
  }, { selected: 0, mounts: [], delta: 0 })
  const shipPowerPlant = {
    currentCapacity: ship.engine.maxCapacity,
    maxCapacity: ship.engine.maxCapacity,
    rate: ship.engine.rate,
  }
  const shipShields: ShipShields = {
    maxFore: ship.shields.fore,
    currentFore: ship.shields.fore,
    maxAft: ship.shields.aft,
    currentAft: ship.shields.aft,
    energyDrain: ship.shields.energyDrain,
    rechargeRate: ship.shields.rechargeRate,
  }
  const shipArmor: ShipArmor = {
    back: ship.armor.back,
    front: ship.armor.front,
    left: ship.armor.left,
    right: ship.armor.right,
  }
  const shipEngine: ShipEngine = {
    accelleration: ship.accelleration,
    afterburnerAccelleration: ship.afterburnerAccelleration,
    cruiseSpeed: ship.cruiseSpeed,
    maxSpeed: ship.maxSpeed,
    fuelConsumeRate: 1
  }
  const shipSystems: ShipSystems = {
    quadrant: {
      fore: JSON.parse(JSON.stringify(ship.systems.quadrant.fore)) as {
        system: "guns"|"radar"|"thrusters"|"targeting"|"weapons"|"engines"|"battery"|"shield"|"power",
        weight: number
      }[], // :\
      aft: JSON.parse(JSON.stringify(ship.systems.quadrant.fore)) as {
        system: "guns"|"radar"|"thrusters"|"targeting"|"weapons"|"engines"|"battery"|"shield"|"power",
        weight: number
      }[] // why you gotta be to awkward there bud :\
    },
    state: {
      afterburners: ship.systems.base.thrusters,
      thrusters: ship.systems.base.thrusters,
      engines: ship.systems.base.engines,
      power: ship.systems.base.power,
      battery: ship.systems.base.battery,
      shield: ship.systems.base.shield,
      radar: ship.systems.base.radar,
      targeting: ship.systems.base.targeting,
      guns: ship.systems.base.guns,
      weapons: ship.systems.base.weapons,
    },
    base: {
      afterburners: ship.systems.base.thrusters,
      thrusters: ship.systems.base.thrusters,
      engines: ship.systems.base.engines,
      power: ship.systems.base.power,
      battery: ship.systems.base.battery,
      shield: ship.systems.base.shield,
      radar: ship.systems.base.radar,
      targeting: ship.systems.base.targeting,
      guns: ship.systems.base.guns,
      weapons: ship.systems.base.weapons,
    }
  }
  const enemyEntity = world.add({
    owner: net.id,
    local: true,
    teamId: teamId,
    groupId: groupId,
    ai: { type: "shipIntelegence", blackboard: {}, pilot: ship.pilot },
    meshName: ship.modelDetails.base,
    shieldMeshName: ship.modelDetails.shield,
    physicsMeshName: ship.modelDetails.physics,
    targetName: ship.name,
    bodyType: "animated",
    trail: true,
    trailOptions: ship.modelDetails.trails.map((trail) => { return { start: { ...trail.start }, color: { ...trail.color }}}),
    planeTemplate: ship.class,
    position: {x, y, z},
    velocity: {x: 0, y: 0, z: 0},
    setSpeed: Math.floor(ship.cruiseSpeed * 0.75),
    currentSpeed: Math.floor(ship.cruiseSpeed * 0.75),
    direction: {x: 0, y: 0, z: -1},
    acceleration: {x: 0, y: 0, z: 0},
    rotationalVelocity: {roll: 0, pitch: 0, yaw: 0},
    rotationQuaternion: {w: 1, x: 0, y:0, z:0},
    rotation: {x: 0, y: 0, z: -1},
    health: {
      current: ship.health,
      base: ship.health,
    },
    totalScore: 0,
    guns,
    weapons,
    powerPlant: shipPowerPlant,
    shields: shipShields,
    armor: shipArmor,
    systems: shipSystems,
    engine: shipEngine,
    targeting: {
      missileLocked: false,
      targetingDirection: { x: 0, y: 0, z: -1 },
      gunInterceptPosition: undefined,
      target: -1,
      locked: false,
      targetingTime: 0,
    },
    isTargetable: "enemy",
    // scale: { x: 2, y: 2, z: 2 }
  })
  return enemyEntity
}

function applyModifier(value: number, modifier: ComponentModifier): number {
  if (modifier == undefined) {
    return value
  }
  if (modifier.percent) {
    return value + (value * modifier.value)
  }
  return value + modifier.value
}

export function createCustomShip(ship: ShipDetailsCustomizable, x: number, y: number, z: number, teamId?: number, groupId?): Entity {
  console.log(`[CreateShip] creating new custom ship ${ship.name}`)
  const gunData = GunData as Guns
  const gunMounts: ShipGuns = ship.guns.reduce((guns, gun, index) => {
    const gunClass = gunData[gun] as Gun
    guns[index] = {
      class: gun,
      possition: { ...ship.gunMounts[index].position },
      delta: 0,
      currentHealth: gunClass.health
    }
    return guns
  }, {} as ShipGuns)
  const guns: ShipGuns = {
    mounts: gunMounts,
    selected: 0,
    groups: [Object.keys(gunMounts).map(key => parseInt(key))]
  }
  const weapons = ship.weapons.reduce((weapons, weapon) => {
    weapons.mounts.push({
      type: weapon.type,
      count: weapon.count
    })
    return weapons
  }, { selected: 0, mounts: [], delta: 0 })
  const shipPowerPlant: ShipPowerPlant = {
    currentCapacity: ship.powerPlantSlot.base.maxCapacity,
    maxCapacity: ship.powerPlantSlot.base.maxCapacity,
    rate: ship.powerPlantSlot.base.rate,
  }
  if (ship.powerPlantSlot.modifier) {
    shipPowerPlant.maxCapacity = applyModifier(shipPowerPlant.maxCapacity, ship.powerPlantSlot.modifier.maxCapacity)
    shipPowerPlant.currentCapacity = shipPowerPlant.maxCapacity
    shipPowerPlant.rate = applyModifier(shipPowerPlant.rate, ship.powerPlantSlot.modifier.rate)
  }
  const shipShields: ShipShields = {
    maxFore: ship.shieldsSlot.base.fore,
    currentFore: ship.shieldsSlot.base.fore,
    maxAft: ship.shieldsSlot.base.aft,
    currentAft: ship.shieldsSlot.base.aft,
    energyDrain: ship.shieldsSlot.base.energyDrain,
    rechargeRate: ship.shieldsSlot.base.rechargeRate,
  }
  if (ship.shieldsSlot.modifier) {
    shipShields.maxFore = applyModifier(shipShields.maxFore, ship.shieldsSlot.modifier.fore)
    shipShields.currentFore = shipShields.maxFore
    shipShields.maxAft = applyModifier(shipShields.maxAft, ship.shieldsSlot.modifier.aft)
    shipShields.maxAft = shipShields.currentAft
    shipShields.energyDrain = applyModifier(shipShields.energyDrain, ship.shieldsSlot.modifier.energyDrain)
    shipShields.rechargeRate = applyModifier(shipShields.rechargeRate, ship.shieldsSlot.modifier.rechargeRate)
  }
  const shipArmor: ShipArmor = {
    back: ship.armor.back,
    front: ship.armor.front,
    left: ship.armor.left,
    right: ship.armor.right,
  }
  const shipEngine = {
    cruiseSpeed: ship.engineSlot.base.cruiseSpeed,
    accelleration: ship.engineSlot.base.accelleration,
    maxSpeed: ship.afterburnerSlot.base.maxSpeed,
    afterburnerAccelleration: ship.afterburnerSlot.base.accelleration,
    fuelConsumeRate: ship.afterburnerSlot.base.fuelConsumeRate
  }
  if (ship.engineSlot.modifier) {
    shipEngine.cruiseSpeed = applyModifier(shipEngine.cruiseSpeed, ship.engineSlot.modifier.cruiseSpeed)
    shipEngine.accelleration = applyModifier(shipEngine.accelleration, ship.engineSlot.modifier.accelleration)
    shipEngine.maxSpeed = applyModifier(shipEngine.maxSpeed, ship.afterburnerSlot.modifier.maxSpeed)
    shipEngine.afterburnerAccelleration = applyModifier(shipEngine.afterburnerAccelleration, ship.afterburnerSlot.modifier.accelleration)
    shipEngine.fuelConsumeRate = applyModifier(shipEngine.fuelConsumeRate, ship.afterburnerSlot.modifier.fuelConsumeRate)
  }
  const shipSystems: ShipSystems = {
    quadrant: {
      fore: JSON.parse(JSON.stringify(ship.systems.quadrant.fore)) as {
        system: "guns"|"radar"|"thrusters"|"targeting"|"weapons"|"engines"|"battery"|"shield"|"power",
        weight: number
      }[], // :\
      aft: JSON.parse(JSON.stringify(ship.systems.quadrant.fore)) as {
        system: "guns"|"radar"|"thrusters"|"targeting"|"weapons"|"engines"|"battery"|"shield"|"power",
        weight: number
      }[] // why you gotta be to awkward there bud :\
    },
    state: {
      afterburners: ship.systems.base.thrusters,
      thrusters: ship.systems.base.thrusters,
      engines: ship.systems.base.engines,
      power: ship.systems.base.power,
      battery: ship.systems.base.battery,
      shield: ship.systems.base.shield,
      radar: ship.systems.base.radar,
      targeting: ship.systems.base.targeting,
      guns: ship.systems.base.guns,
      weapons: ship.systems.base.weapons,
    },
    base: {
      afterburners: ship.systems.base.thrusters,
      thrusters: ship.systems.base.thrusters,
      engines: ship.systems.base.engines,
      power: ship.systems.base.power,
      battery: ship.systems.base.battery,
      shield: ship.systems.base.shield,
      radar: ship.systems.base.radar,
      targeting: ship.systems.base.targeting,
      guns: ship.systems.base.guns,
      weapons: ship.systems.base.weapons,
    }
  }
  const enemyEntity = world.add({
    owner: net.id,
    local: true,
    teamId: teamId,
    groupId: groupId,
    ai: { type: "shipIntelegence", blackboard: {}, pilot: ship.pilot },
    meshName: ship.modelDetails.base,
    shieldMeshName: ship.modelDetails.shield,
    physicsMeshName: ship.modelDetails.physics,
    targetName: ship.name,
    bodyType: "animated",
    trail: true,
    trailOptions: ship.modelDetails.trails.map((trail) => { return { start: { ...trail.start }, color: { ...trail.color }}}),
    planeTemplate: ship.class,
    position: {x, y, z},
    velocity: {x: 0, y: 0, z: 0},
    setSpeed: Math.floor(shipEngine.cruiseSpeed * 0.75),
    currentSpeed: Math.floor(shipEngine.cruiseSpeed * 0.75),
    direction: {x: 0, y: 0, z: -1},
    acceleration: {x: 0, y: 0, z: 0},
    rotationalVelocity: {roll: 0, pitch: 0, yaw: 0},
    rotationQuaternion: {w: 1, x: 0, y:0, z:0},
    rotation: {x: 0, y: 0, z: -1},
    health: {
      current: ship.health,
      base: ship.health,
    },
    totalScore: 0,
    guns,
    weapons,
    engine: shipEngine,
    powerPlant: shipPowerPlant,
    shields: shipShields,
    armor: shipArmor,
    systems: shipSystems,
    targeting: {
      missileLocked: false,
      targetingDirection: { x: 0, y: 0, z: -1 },
      gunInterceptPosition: undefined,
      target: -1,
      locked: false,
      targetingTime: 0,
    },
    isTargetable: "enemy",
    // scale: { x: 2, y: 2, z: 2 }
  })
  return enemyEntity
}