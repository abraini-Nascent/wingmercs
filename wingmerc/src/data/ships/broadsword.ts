import { ShipTemplate } from "./shipTemplate"

/// based on the Broadsword
export const Broadsword: ShipTemplate = Object.seal({
  name: "Broadsword",
  class: "Broadsword",
  weightClass: "Heavy",
  baseWeight: 18,
  maxWeight: 35,
  modelDetails: {
    base: "craftSpeederD",
    physics: "craftSpeederDHull",
    shield: "craftSpeederDHull",
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
  pilot: "Heavy02",
  afterburnerSlot: {
    maxSize: "Medium",
    base: {
      health: 10,
      accelleration: 400,
      boostSpeed: 200,
      maxSpeed: 800,
      fuelConsumeRate: 1,
    },
  },
  shieldsSlot: {
    maxSize: "Medium",
    base: {
      health: 10,
      fore: 180,
      aft: 180,
      rechargeRate: 30,
      energyDrain: 2,
    },
  },
  engineSlot: {
    maxSize: "Medium",
    base: {
      health: 10,
      cruiseSpeed: 350,
      accelleration: 150,
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
      pitch: 50,
      roll: 50,
      yaw: 50,
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
      weaponMounts: [
        {
          mountType: "WeaponMount",
          maxCount: 4,
          maxSize: "Medium",
          position: {
            x: 0,
            y: -2.5,
            z: 0.5,
          },
          base: {
            count: 4,
            type: "dumbfire",
          },
        },
      ],
    },
    front: {
      armor: 400,
      maxArmor: 400,
      health: 400,
      slots: ["Radar"],
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
            x: 0,
            y: -2.5,
            z: 0.5,
          },
        },
      ],
      weaponMounts: [
        {
          mountType: "WeaponMount",
          maxCount: 1,
          maxSize: "Medium",
          position: {
            x: -2.5,
            y: -2.5,
            z: 0.5,
          },
          base: {
            count: 1,
            type: "friendorfoe",
          },
        },
      ],
    },
    back: {
      armor: 400,
      maxArmor: 400,
      health: 400,
      slots: ["Engine", "Afterburner"],
    },
    left: {
      armor: 350,
      maxArmor: 350,
      health: 350,
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
          mountType: "WeaponMount",
          maxCount: 1,
          maxSize: "Medium",
          position: {
            x: -2.5,
            y: -2.5,
            z: 0.5,
          },
          base: {
            count: 1,
            type: "friendorfoe",
          },
        },
      ],
    },
    right: {
      armor: 500,
      maxArmor: 500,
      health: 500,
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
          mountType: "WeaponMount",
          maxCount: 1,
          maxSize: "Medium",
          position: {
            x: -2.5,
            y: -2.5,
            z: 0.5,
          },
          base: {
            count: 1,
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
