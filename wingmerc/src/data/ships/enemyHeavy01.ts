import { ShipDetails, ShipTemplate } from "./shipTemplate"

export const EnemyHeavy01: ShipTemplate = Object.seal({
  name: "Beetle",
  class: "EnemyHeavy01",
  weightClass: "Heavy",
  maxWeight: 36,
  modelDetails: {
    base: "craftSpeederD",
    physics: "craftSpeederDHull",
    shield: "craftSpeederDHull",
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
      boostSpeed: 720,
      maxSpeed: 1040,
      fuelConsumeRate: 1,
    },
  },
  shieldsSlot: {
    maxSize: "Small",
    base: {
      health: 10,
      fore: 110,
      aft: 100,
      rechargeRate: 4,
      energyDrain: 4,
    },
  },
  engineSlot: {
    maxSize: "Small",
    base: {
      health: 10,
      cruiseSpeed: 320,
      accelleration: 15,
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
      pitch: 60,
      roll: 14,
      yaw: 60,
      breakingForce: 10,
      breakingLimit: 50,
    },
  },
  structure: {
    core: {
      health: 50,
      slots: ["PowerPlant", "Shields", "Thruster"],
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
    },
    front: {
      armor: 150,
      maxArmor: 150,
      health: 150,
      slots: ["Radar"],
      utilityMounts: [
        {
          maxSize: "Small",
        },
        {
          maxSize: "Small",
        },
      ],
      gunMounts: [
        {
          base: {
            type: "neutron",
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
            x: -2.5,
            y: -0.5,
            z: -0.5,
          },
          base: {
            count: 1,
            type: "dumbfire",
          },
        },
      ],
    },
    back: {
      armor: 140,
      maxArmor: 140,
      health: 140,
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
      armor: 100,
      maxArmor: 100,
      health: 100,
      slots: [],
      utilityMounts: [
        {
          maxSize: "Small",
        },
        {
          maxSize: "Small",
        },
      ],
      gunMounts: [
        {
          base: {
            type: "laser",
          },
          maxSize: "Medium",
          position: {
            x: -2.25,
            y: -2.25,
            z: 0.5,
          },
        },
        {
          base: {
            type: "laser",
          },
          maxSize: "Medium",
          position: {
            x: -4.75,
            y: -2.75,
            z: 0.5,
          },
        },
      ],
    },
    right: {
      armor: 100,
      maxArmor: 100,
      health: 100,
      slots: [],
      utilityMounts: [
        {
          maxSize: "Small",
        },
        {
          maxSize: "Small",
        },
      ],
      gunMounts: [
        {
          base: {
            type: "laser",
          },
          maxSize: "Medium",
          position: {
            x: 2.25,
            y: -2.25,
            z: 0.5,
          },
        },
        {
          base: {
            type: "laser",
          },
          maxSize: "Medium",
          position: {
            x: 4.75,
            y: -2.75,
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

export const EnemyHeavy01Old: ShipDetails = Object.seal({
  name: "Beetle",
  class: "EnemyHeavy01",
  pilot: "Heavy01",
  modelDetails: {
    base: "craftSpeederD",
    physics: "craftSpeederDHull",
    shield: "craftSpeederDHull",
    trails: [
      {
        start: {
          x: 3.7,
          y: 0,
          z: 10,
        },
        color: { r: 0, g: 0, b: 1 },
      },
      {
        start: {
          x: -3.7,
          y: 0,
          z: 10,
        },
        color: { r: 0, g: 0, b: 1 },
      },
    ],
  },
  shields: {
    fore: 110,
    aft: 100,
    rechargeRate: 4,
    energyDrain: 4,
  },
  armor: {
    front: 150,
    back: 140,
    left: 100,
    right: 100,
  },
  health: 50,
  pitch: 60,
  roll: 14,
  yaw: 60,
  accelleration: 15,
  afterburnerAccelleration: 60,
  breakingForce: 10,
  breakingLimit: 50,
  cruiseSpeed: 320,
  maxSpeed: 1040,
  guns: [
    {
      type: "laser",
      position: {
        x: -2.5,
        y: -0.5,
        z: -0.5,
      },
    },
    {
      type: "laser",
      position: {
        x: 2.5,
        y: -0.5,
        z: -0.5,
      },
    },
    {
      type: "massdriver",
      position: {
        x: -3,
        y: -1,
        z: -0.5,
      },
    },
    {
      type: "massdriver",
      position: {
        x: 3,
        y: -1,
        z: -0.5,
      },
    },
  ],
  // todo:
  //  position on model
  weapons: [
    {
      type: "dumbfire",
      count: 1,
    },
    {
      type: "heatseeking",
      count: 3,
    },
  ],
  // TODO: this should also act like guns and weapons where we pull in a type
  engine: {
    rate: 20,
    maxCapacity: 200,
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
  fuel: {
    maxCapacity: 90,
  },
})
