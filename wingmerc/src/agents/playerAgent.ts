import { Entity, FuelTank, NerdStats, Score, ShipArmor, ShipGuns, ShipShields, ShipSystems, world } from "../world/world";
import { net } from "../net";
import { Dirk } from "../data/ships";
import * as Guns from "../data/guns";
import { Gun } from "../data/guns/gun";

export class PlayerAgent {
  playerEntity: Entity

  constructor( planeTemplate: string = "Dirk") {

    const gunMounts = Dirk.guns.reduce((guns, gun, index) => {
      const gunClass = Guns[gun.type] as Gun
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
      groups: [
        Object.keys(gunMounts).map(key => parseInt(key)),
        [0],
        [1]
      ], // the player should be able to assign their own groups in the future, or we create groups based on same weapon type
    }
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
    const fuel: FuelTank = {
      maxCapacity: Dirk.fuel.maxCapacity,
      currentCapacity: Dirk.fuel.maxCapacity,
    }
    const stats: NerdStats = {
      afterburnerFuelSpent: 0, 
      armorDamageGiven: 0, 
      armorDamageTaken: 0,
      missilesDodged: 0,
      missilesEaten: 0,
      missilesLaunched: 0,
      missilesHit: 0,
      roundsMissed: 0,
      roundsHit: 0,
      shieldDamageTaken: 0,
      shieldDamageGiven: 0,
      driftTime: 0,
      totalKills: 0
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
      teamId: 1,
      groupId: 1,
      targetName: "player",
      meshName: Dirk.modelDetails.base,
      visible: false,
      physicsMeshName: Dirk.modelDetails.physics,
      trail: true,
      trailOptions: Dirk.modelDetails.trails.map((trail) => { return { start: { ...trail.start }, color: { ...trail.color }}}),
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
      health: {
        current: 100,
        base: 100,
      },
      totalScore: 0,
      score: { livesLeft: 0, timeLeft: 0, total: 0 } as Score,
      guns,
      weapons,
      engine: shipEngine,
      shields: shipShields,
      armor: shipArmor,
      nerdStats: stats,
      systems: shipSystems,
      fuel: fuel,
      targeting: {
        missileLocked: false,
        targetingDirection: { x: 0, y: 0, z: -1 },
        target: -1,
        locked: false,
        targetingTime: 0,
        gunInterceptPosition: undefined
      },
      vduState: {
        left: "weapons",
        right: "target"
      } ,
      isTargetable: "player",
      bodyType: "animated",
      playerId: net.id
    })
    this.playerEntity = playerEntity
  }
}