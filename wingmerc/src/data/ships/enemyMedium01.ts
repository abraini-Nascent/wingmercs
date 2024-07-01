import { ShipDetails, ShipTemplate } from "./shipTemplate"

export const EnemyMedium01: ShipTemplate = Object.seal({
  name: "Wasp",
  class: "EnemyMedium01",
  weightClass: "Medium",
  maxWeight: 22,
  modelDetails: {
    base: "craftSpeederB",
    physics: "craftSpeederBHull",
    shield: "craftSpeederBHull",
    trails: [
      {
        start: {
          x: 3.7,
          y: 0,
          z: 10,
        },
        color: {
          r: 0,
          g: 0,
          b: 1,
        },
      },
      {
        start: {
          x: -3.7,
          y: 0,
          z: 10,
        },
        color: {
          r: 0,
          g: 0,
          b: 1,
        },
      },
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
      fore: 50,
      aft: 50,
      rechargeRate: 5,
      energyDrain: 5,
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
      pitch: 140,
      roll: 180,
      yaw: 10,
      breakingForce: 30,
      breakingLimit: 100,
    },
  },
  structure: {
    core: {
      health: 50,
      slots: [
        "PowerPlant",
        "Shields",
        "Thruster",
      ],
      utilityMounts: [
        {
          maxSize: "Small",
        },
        {
          maxSize: "Small",
        },
        {
          maxSize: "Small",
        },
      ],
      weaponMounts: [
        {
          maxCount: 2,
          maxSize: "Medium",
          position: {
            x: -2.5,
            y: -0.5,
            z: -0.5,
          },
          base: {
            count: 2,
            type: "heatseeking",
          },
        },
      ]
    },
    front: {
      armor: 45,
      maxArmor: 45,
      health: 45,
      slots: ["Radar"],
      utilityMounts: [
        {
          maxSize: "Small",
        },
      ],
      gunMounts: [
        {
          base: {
            type: "laser"
          },
          maxSize: "Medium",
          position: {
            x: 0,
            y: -2.5,
            z: 0.5,
          },
        },
      ],
    },
    back: {
      armor: 35,
      maxArmor: 35,
      health: 35,
      slots: ["Engine", "Afterburner"],
      utilityMounts: [
        {
          maxSize: "Small",
        },
        {
          maxSize: "Small",
        },
      ],
    },
    left: {
      armor: 30,
      maxArmor: 30,
      health: 30,
      slots: [],
      utilityMounts: [
        {
          maxSize: "Small",
        },
      ],
      gunMounts: [
        {
          base: {
            type: "massdriver"
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
      armor: 30,
      maxArmor: 30,
      health: 30,
      slots: [],
      utilityMounts: [
        {
          maxSize: "Small",
        },
      ],
      gunMounts: [
        {
          base: {
            type: "massdriver"
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
