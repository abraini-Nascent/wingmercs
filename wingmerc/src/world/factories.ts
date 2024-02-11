import { ShipDetails } from "../data/ships/shipDetails"
import * as Guns from "../data/guns"
import { Gun } from "../data/guns/gun"
import { ShipArmor, ShipShields, ShipSystems, world } from "./world"
import { net } from "../net"

export function createShip(ship: ShipDetails, x: number, y: number, z: number) {
  const guns = ship.guns.reduce((guns, gun, index) => {
    const gunClass = Guns[gun.type] as Gun
    guns[index] = {
      class: gun.type,
      possition: { ...gun.position },
      delta: 0,
      currentHealth: gunClass.health
    }
    return guns
  }, {})
  const weapons = ship.weapons.reduce((weapons, weapon) => {
    weapons.mounts.push({
      type: weapon.type,
      count: weapon.count
    })
    return weapons
  }, { selected: 0, mounts: [], delta: 0 })
  const shipEngine = {
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
    ai: { type: "basicCombat", blackboard: {} },
    meshName: ship.modelDetails.base,
    shieldMeshName: ship.modelDetails.shield,
    physicsMeshName: ship.modelDetails.physics,
    targetName: ship.name,
    bodyType: "animated",
    trail: true,
    trailOptions: ship.modelDetails.trails.map((trail) => { return { start: { ...trail.start }, color: { ...trail.color }}}),
    planeTemplate: "ship",
    position: {x, y, z},
    velocity: {x: 0, y: 0, z: 0},
    setSpeed: 0, //ship.cruiseSpeed / 2,
    currentSpeed: 0, //ship.cruiseSpeed / 2,
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