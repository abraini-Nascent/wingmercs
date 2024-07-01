import { ShipDetails, ShipTemplate } from "./shipTemplate"

export const EnemyMedium02: ShipTemplate = Object.seal({
  name: "Scorpion",
  class: "EnemyMedium02",
  weightClass: "Medium",
  maxWeight: 24,
  modelDetails: {
    base: "craftSpeederC",
    physics: "craftSpeederCHull",
    shield: "craftSpeederCHull",
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
      boostSpeed: 760,
      maxSpeed: 1120,
      fuelConsumeRate: 1,
    },
  },
  shieldsSlot: {
    maxSize: "Small",
    base: {
      health: 10,
      fore: 80,
      aft: 80,
      rechargeRate: 5,
      energyDrain: 5,
    },
  },
  engineSlot: {
    maxSize: "Small",
    base: {
      health: 10,
      cruiseSpeed: 360,
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
      pitch: 100,
      roll: 70,
      yaw: 70,
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
        "Utility",
        "Utility",
        "Utility",
      ],
    },
    front: {
      armor: 90,
      maxArmor: 90,
      health: 90,
      slots: ["Radar"],
      utilityMounts: [
        {
          maxSize: "Small",
        },
      ],
      gunMounts: [
        {
          base: {
            type: "neutron"
          },
          maxSize: "Medium",
          position: {
            x: 0,
            y: -2.5,
            z: 0.5,
          },
        },
      ],
      weaponMounts: [
        {
          maxCount: 1,
          maxSize: "Medium",
          position: {
            x: 0,
            y: -0.5,
            z: -0.5,
          },
          base: {
            count: 1,
            type: "dumbfire",
          },
        },
      ]
    },
    back: {
      armor: 100,
      maxArmor: 100,
      health: 100,
      slots: ["Engine", "Afterburner",],
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
      armor: 80,
      maxArmor: 80,
      health: 80,
      slots: [],
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
            x: -2.5,
            y: -2.5,
            z: 0.5,
          },
        },
      ],
    },
    right: {
      armor: 80,
      maxArmor: 80,
      health: 80,
      slots: [],
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
            x: 2.5,
            y: -2.5,
            z: 0.5,
          },
        },
      ],
      weaponMounts: [
        {
          maxCount: 3,
          maxSize: "Medium",
          position: {
            x: 2.5,
            y: -0.5,
            z: -0.5,
          },
          base: {
            count: 3,
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
