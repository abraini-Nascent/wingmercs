import { ShipTemplate } from "./shipTemplate"

/// based on the Papier
export const Rapier: ShipTemplate = Object.seal({
  name: "Rapier",
  class: "Rapier",
  weightClass: "Medium",
  maxWeight: 14,
  baseWeight: 6,
  modelDetails: {
    base: "spaceCraft2",
    physics: "spaceCraft2Hull",
    shield: "spaceCraft2Hull",
    trails: [
      {
        start: {
          x: 5,
          y: 0,
          z: 5,
        },
        color: {
          r: 1,
          g: 0,
          b: 0,
        },
      },
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
      {
        start: {
          x: -5,
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
  pilot: "Medium01",
  afterburnerSlot: {
    maxSize: "Small",
    base: {
      health: 10,
      accelleration: 600,
      boostSpeed: 900,
      maxSpeed: 1300,
      fuelConsumeRate: 1,
    },
  },
  shieldsSlot: {
    maxSize: "Small",
    base: {
      health: 10,
      fore: 115,
      aft: 115,
      rechargeRate: 3,
      energyDrain: 2,
    },
  },
  engineSlot: {
    maxSize: "Small",
    base: {
      health: 10,
      cruiseSpeed: 450,
      accelleration: 300,
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
    maxSize: "Medium",
    base: {
      health: 10,
      capacity: 140,
    },
  },
  thrustersSlot: {
    base: {
      health: 0,
      pitch: 100,
      roll: 100,
      yaw: 100,
      breakingForce: 225,
      breakingLimit: 200,
    },
  },
  structure: {
    core: {
      health: 50,
      slots: ["PowerPlant", "Shields", "Thruster"],
      utilityMounts: [{
        maxSize: "Small"
      }],
      weaponMounts: [
        {
          maxCount: 2,
          maxSize: "Medium",
          position: {
            x: 0,
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
    front: {
      armor: 60,
      maxArmor: 60,
      health: 60,
      slots: ["Radar"],
      utilityMounts: [{
        maxSize: "Small"
      }],
      gunMounts: [
        {
          base: {
            type: "laser"
          },
          maxSize: "Medium",
          position: {
            x: -1.5,
            y: -2.5,
            z: 0.5,
          },
        },
        {
          base: {
            type: "laser"
          },
          maxSize: "Medium",
          position: {
            x: 1.5,
            y: -2.5,
            z: 0.5,
          },
        },
      ],
    },
    back: {
      armor: 55,
      maxArmor: 55,
      health: 55,
      slots: ["Engine", "Afterburner"],
    },
    left: {
      armor: 50,
      maxArmor: 50,
      health: 50,
      slots: [],
      utilityMounts: [{
        maxSize: "Small"
      }],
      gunMounts: [
        {
          base: {
            type: "particleCannon"
          },
          maxSize: "Medium",
          position: {
            x: -3.5,
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
            x: -2.5,
            y: -2.5,
            z: 0.5,
          },
          base: {
            count: 2,
            type: "heatseeking",
          },
        }
      ],
    },
    right: {
      armor: 50,
      maxArmor: 50,
      health: 50,
      slots: [],
      utilityMounts: [{
        maxSize: "Small"
      }],
      gunMounts: [
        {
          base: {
            type: "particleCannon"
          },
          maxSize: "Medium",
          position: {
            x: 3.5,
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
            type: "friendorfoe",
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
