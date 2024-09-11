import { ShipTemplate } from "./shipTemplate"

/// based on the Andre's Razor
export const Razor: ShipTemplate = Object.seal({
  name: "Razor",
  class: "Razor",
  weightClass: "Heavy",
  maxWeight: 35,
  baseWeight: 17,
  modelDetails: {
    base: "uni_3rd",
    cockpit: "uni_cockpit",
    firstPerson: "uni_1st",
    physics: "spaceCraft3Hull",
    shield: "spaceCraft3Hull",
    trails: [
      {
        start: {
          x: 0,
          y: 0,
          z: 5,
        },
        color: {
          r: 1,
          g: 0,
          b: 0,
        },
      },
    ],
  },
  pilot: "Heavy01",
  afterburnerSlot: {
    maxSize: "Medium",
    base: {
      health: 10,
      accelleration: 300,
      boostSpeed: 900,
      maxSpeed: 1200,
      fuelConsumeRate: 1,
    },
  },
  shieldsSlot: {
    maxSize: "Medium",
    base: {
      health: 10,
      fore: 80,
      aft: 80,
      rechargeRate: 40,
      energyDrain: 2,
    },
  },
  engineSlot: {
    maxSize: "Medium",
    base: {
      health: 10,
      cruiseSpeed: 400,
      accelleration: 250,
    },
  },
  powerPlantSlot: {
    maxSize: "Medium",
    base: {
      health: 10,
      rate: 20,
      maxCapacity: 250,
    },
  },
  radarSlot: {
    maxSize: "Medium",
    base: {
      health: 10,
      maxDistance: 10000,
      friendOrFoe: true,
      fofDetail: true,
      locking: true,
    },
  },
  fuelTankSlot: {
    maxSize: "Medium",
    base: {
      health: 10,
      capacity: 200,
    },
  },
  thrustersSlot: {
    base: {
      health: 0,
      pitch: 80,
      roll: 80,
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
          maxSize: "Small",
        },
      ],
      weaponMounts: [
        {
          maxCount: 4,
          maxSize: "Medium",
          position: {
            x: 0,
            y: -2.5,
            z: 0.5,
          },
          base: {
            count: 4,
            type: "imagerecognition",
          },
        },
      ],
    },
    front: {
      armor: 200,
      maxArmor: 200,
      health: 200,
      slots: ["Radar"],
      utilityMounts: [
        {
          maxSize: "Small",
        },
      ],
    },
    back: {
      armor: 200,
      maxArmor: 200,
      health: 200,
      slots: ["Engine", "Afterburner"],
    },
    left: {
      armor: 180,
      maxArmor: 180,
      health: 180,
      slots: [],
      utilityMounts: [
        {
          maxSize: "Small",
        },
      ],
      gunMounts: [
        {
          base: {
            type: "particleCannon",
          },
          maxSize: "Medium",
          position: {
            x: -2.5,
            y: -2.5,
            z: 0.5,
          },
        },
        {
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
          maxCount: 2,
          maxSize: "Medium",
          position: {
            x: -4.5,
            y: -2.5,
            z: 0.5,
          },
          base: {
            count: 2,
            type: "friendorfoe",
          },
        },
      ],
    },
    right: {
      armor: 180,
      maxArmor: 180,
      health: 180,
      slots: [],
      utilityMounts: [
        {
          maxSize: "Small",
        },
      ],
      gunMounts: [
        {
          base: {
            type: "particleCannon",
          },
          maxSize: "Medium",
          position: {
            x: 2.5,
            y: -2.5,
            z: 0.5,
          },
        },
        {
          base: {
            type: "massdriver",
          },
          maxSize: "Medium",
          position: {
            x: 4.5,
            y: -2.5,
            z: 0.5,
          },
        },
      ],
      weaponMounts: [
        {
          maxCount: 2,
          maxSize: "Medium",
          position: {
            x: 2.5,
            y: -2.5,
            z: 0.5,
          },
          base: {
            count: 2,
            type: "dumbfire",
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
