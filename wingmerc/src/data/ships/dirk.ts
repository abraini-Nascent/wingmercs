import { ShipTemplate } from "./shipTemplate"

/// based on the Ferret
export const Dirk: ShipTemplate = Object.seal({
  name: "Dirk",
  class: "Dirk",
  weightClass: "Light",
  maxWeight: 14,
  baseWeight: 7,
  modelDetails: {
    scale: 100,
    base: "spaceCraft1",
    physics: "spaceCraft1Hull",
    shield: "spaceCraft1Hull",
    cockpitOffset: {
      x: 0,
      y: -1,
      z: 5,
    },
    // base: "dirk_3rd",
    // cockpit: "cockpit",
    // firstPerson: "dirk_1st",
    // physics: "craftMinerHull",
    // shield: "craftMinerHull",
    trails: [
      {
        start: {
          x: 0,
          y: -1,
          z: 15,
        },
        width: 5,
        color: {
          r: 1,
          g: 1,
          b: 0,
        },
      },
    ],
  },
  pilot: "Light01",
  afterburnerSlot: {
    maxSize: "Small",
    base: {
      health: 10,
      accelleration: 350,
      boostSpeed: 900,
      maxSpeed: 1400,
      fuelConsumeRate: 1,
    },
  },
  shieldsSlot: {
    maxSize: "Small",
    base: {
      health: 10,
      fore: 60,
      aft: 60,
      rechargeRate: 20,
      energyDrain: 2,
    },
  },
  engineSlot: {
    maxSize: "Small",
    base: {
      health: 10,
      cruiseSpeed: 500,
      accelleration: 150,
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
      pitch: 80,
      roll: 90,
      yaw: 80,
      breakingForce: 225,
      breakingLimit: 200,
    },
  },
  structure: {
    core: {
      health: 50,
      slots: ["PowerPlant", "Shields", "Thruster"],
      utilityMounts: [
        {
          mountType: "UtilityMount",
          maxSize: "Small",
        },
      ],
    },
    front: {
      armor: 65,
      maxArmor: 65,
      health: 65,
      slots: ["Radar"],
      utilityMounts: [
        {
          mountType: "UtilityMount",
          maxSize: "Small",
        },
      ],
    },
    back: {
      armor: 65,
      maxArmor: 65,
      health: 65,
      slots: ["Engine", "Afterburner"],
    },
    left: {
      armor: 45,
      maxArmor: 45,
      health: 45,
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
            type: "massdriver",
          },
          maxSize: "Medium",
          position: {
            x: -2.5,
            y: -2.5,
            z: 0.5,
          },
        },
      ],
      weaponMounts: [
        {
          maxCount: 1,
          maxSize: "Medium",
          mountType: "WeaponMount",
          position: {
            x: -2.5,
            y: -2.5,
            z: 0.5,
          },
          base: {
            count: 1,
            type: "heatseeking",
          },
        },
      ],
    },
    right: {
      armor: 45,
      maxArmor: 45,
      health: 45,
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
            type: "massdriver",
          },
          maxSize: "Medium",
          position: {
            x: 2.5,
            y: -2.5,
            z: 0.5,
          },
        },
      ],
      weaponMounts: [
        {
          maxCount: 1,
          maxSize: "Medium",
          mountType: "WeaponMount",
          position: {
            x: 2.5,
            y: -2.5,
            z: 0.5,
          },
          base: {
            count: 1,
            type: "heatseeking",
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
      afterburners: 50,
      thrusters: 50,
      engines: 50,
      power: 50,
      battery: 50,
      shield: 50,
      radar: 50,
      targeting: 50,
      guns: 50,
      weapons: 50,
    },
  },
})
