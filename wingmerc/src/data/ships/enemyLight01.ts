import { ShipTemplate } from "./shipTemplate"

export const EnemyLight01: ShipTemplate = Object.seal({
  name: "Fire Ant",
  class: "EnemyLight01",
  weightClass: "Light",
  baseWeight: 6,
  maxWeight: 12,
  modelDetails: {
    base: "spaceCraft5",
    physics: "spaceCraft5Hull",
    shield: "spaceCraft5Hull",
    // base: "craftSpeederA",
    // physics: "craftSpeederAHull",
    // shield: "craftSpeederAHull",
    trails: [
      {
        start: {
          x: 0,
          y: 0,
          z: 8,
        },
        color: {
          r: 0,
          g: 0,
          b: 1,
        },
      },
      // {
      //   start: {
      //     x: -3.7,
      //     y: 0,
      //     z: 10,
      //   },
      //   color: {
      //     r: 0,
      //     g: 0,
      //     b: 1,
      //   },
      // },
    ],
  },
  pilot: "Light01",
  afterburnerSlot: {
    maxSize: "Small",
    base: {
      health: 10,
      accelleration: 60,
      boostSpeed: 800,
      maxSpeed: 1200,
      fuelConsumeRate: 1,
    },
  },
  shieldsSlot: {
    maxSize: "Small",
    base: {
      health: 10,
      fore: 35,
      aft: 35,
      rechargeRate: 30,
      energyDrain: 3,
    },
  },
  engineSlot: {
    maxSize: "Small",
    base: {
      health: 10,
      cruiseSpeed: 400,
      accelleration: 30,
    },
  },
  powerPlantSlot: {
    maxSize: "Small",
    base: {
      health: 10,
      rate: 20,
      maxCapacity: 200,
    },
  },
  radarSlot: {
    maxSize: "Small",
    base: {
      health: 10,
      maxDistance: 10000,
      friendOrFoe: true,
      fofDetail: true,
      locking: true,
    },
  },
  fuelTankSlot: {
    maxSize: "Small",
    base: {
      health: 10,
      capacity: 90,
    },
  },
  thrustersSlot: {
    base: {
      health: 0,
      pitch: 120,
      roll: 120,
      yaw: 140,
      breakingForce: 30,
      breakingLimit: 100,
    },
  },
  structure: {
    core: {
      health: 25,
      slots: ["PowerPlant", "Shields", "Thruster"],
      utilityMounts: [
        {
          mountType: "UtilityMount",
          maxSize: "Small",
        },
      ],
    },
    front: {
      armor: 30,
      maxArmor: 30,
      health: 30,
      slots: ["Radar"],
      utilityMounts: [
        {
          mountType: "UtilityMount",
          maxSize: "Small",
        },
      ],
      weaponMounts: [
        {
          maxCount: 1,
          maxSize: "Medium",
          mountType: "WeaponMount",
          position: {
            x: -2.5,
            y: -0.5,
            z: -0.5,
          },
          base: {
            count: 1,
            type: "enemyDumbfire",
          },
        },
      ],
    },
    back: {
      armor: 20,
      maxArmor: 20,
      health: 20,
      slots: ["Engine", "Afterburner"],
    },
    left: {
      armor: 15,
      maxArmor: 15,
      health: 15,
      slots: [],
      utilityMounts: [
        {
          mountType: "UtilityMount",
          maxSize: "Small",
        },
      ],
      gunMounts: [
        {
          mountType: "GunMount",
          base: {
            type: "laser",
          },
          maxSize: "Medium",
          position: {
            x: -2.5,
            y: -2.5,
            z: 0.5,
          },
        },
      ],
    },
    right: {
      armor: 15,
      maxArmor: 15,
      health: 15,
      slots: [],
      utilityMounts: [
        {
          mountType: "UtilityMount",
          maxSize: "Small",
        },
      ],
      gunMounts: [
        {
          mountType: "GunMount",
          base: {
            type: "laser",
          },
          maxSize: "Medium",
          position: {
            x: 2.5,
            y: -2.5,
            z: 0.5,
          },
        },
      ],
    },
  },
  systems: {
    quadrant: {
      fore: [
        {
          system: "guns",
          weight: 1,
        },
        {
          system: "radar",
          weight: 1,
        },
        {
          system: "thrusters",
          weight: 1,
        },
        {
          system: "targeting",
          weight: 1,
        },
        {
          system: "weapons",
          weight: 1,
        },
      ],
      aft: [
        {
          system: "afterburners",
          weight: 1,
        },
        {
          system: "thrusters",
          weight: 1,
        },
        {
          system: "engines",
          weight: 1,
        },
        {
          system: "battery",
          weight: 1,
        },
        {
          system: "shield",
          weight: 1,
        },
        {
          system: "power",
          weight: 1,
        },
      ],
    },
    base: {
      afterburners: 25,
      thrusters: 25,
      engines: 25,
      power: 25,
      battery: 25,
      shield: 25,
      radar: 25,
      targeting: 25,
      guns: 25,
      weapons: 50,
    },
  },
})
