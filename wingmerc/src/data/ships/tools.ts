import { GunType } from "../guns/gun";
import { EnemyMedium01 } from "./enemyMedium01";
import { EnemyMedium02 } from "./enemyMedium02";
import { GunMounts, ShipDetails, ShipTemplate, WeaponSelection } from "./shipTemplate";

export function convert(ship: ShipDetails): ShipTemplate {
  let newShip: ShipTemplate = {
    name: ship.name,
    class: ship.class,
    weightClass: "Light",
    maxWeight: 20,
    modelDetails: {
      base: ship.modelDetails.base,
      physics: ship.modelDetails.physics,
      shield: ship.modelDetails.shield,
      trails: [...ship.modelDetails.trails]
    },
    pilot: "Light01",
    afterburnerSlot: {
      maxSize: "Small",
      modifier: undefined,
      base: {
        health: 10,
        accelleration: ship.afterburnerAccelleration,
        boostSpeed: ship.maxSpeed-ship.cruiseSpeed,
        maxSpeed: ship.maxSpeed,
        fuelConsumeRate: 1
      }
    },
    shieldsSlot: {
      maxSize: "Small",
      modifier: undefined,
      base: {
        health: 10,
        fore: ship.shields.fore,
        aft: ship.shields.aft,
        rechargeRate: ship.shields.rechargeRate,
        energyDrain: ship.shields.energyDrain
      }
    },
    engineSlot: {
      maxSize: "Small",
      modifier: undefined,
      base: {
        health: 10,
        cruiseSpeed: ship.cruiseSpeed,
        accelleration: ship.accelleration
      }
    },
    powerPlantSlot: {
      maxSize: "Small",
      modifier: undefined,
      base: {
        health: 10,
        rate: ship.engine.rate,
        maxCapacity: ship.engine.maxCapacity
      }
    },
    radarSlot: {
      maxSize: "Small",
      base: {
        health: 10,
        maxDistance: 10000,
        friendOrFoe: true,
        fofDetail: true,
        locking: true,
      }
    },
    fuelTankSlot: {
      maxSize: "Small",
      base: {
        health: 10,
        capacity: ship.fuel.maxCapacity
      }
    },
    thrustersSlot: {
      base: {
        health: 0,
        pitch: ship.pitch,
        roll: ship.roll,
        yaw: ship.yaw,
        breakingForce: ship.breakingForce,
        breakingLimit: ship.breakingLimit
      }
    },
    structure: {
      core: {
        health: ship.health,
        slots: 2,
      },
      front: {
        armor: ship.armor.front,
        health: ship.armor.front,
        slots: 2
      },
      back: {
        armor: ship.armor.back,
        health: ship.armor.back,
        slots: 2
      },
      left: {
        armor: ship.armor.left,
        health: ship.armor.left,
        slots: 2
      },
      right: {
        armor: ship.armor.right,
        health: ship.armor.right,
        slots: 2
      }
    },
    systems: {
      quadrant: {
        fore: [...ship.systems.quadrant.fore],
        aft: [...ship.systems.quadrant.aft]
      },
      base: {
        ...ship.systems.base
      }
    },
    guns: 
      ship.guns.map((gun) => {
        return gun.type as GunType
      }),
    gunMounts: 
      ship.guns.map((gun) => {
        return {
          maxCount: 1,
          maxSize: "Medium",
          position: { ...gun.position }
        } as GunMounts
      }),
    weapons: ship.weapons.map((weapon) => {
      return {
        count: weapon.count,
        type: weapon.type
      } as WeaponSelection
    }),
    weaponMounts: ship.weapons.map((weapon, index) => {
      return {
        maxCount: weapon.count,
        maxSize: "Medium",
        position: {...(ship.guns[index] ?? ship.guns[0]).position}
      }
    })
  }
  return newShip
}