import { GunMounts, ShipTemplate, WeaponMounts } from "./shipTemplate"

// based on the Epee
export const Epee: ShipTemplate = Object.seal({
  name: "Epee",
  class: "Epee",
  weightClass: "Light",
  maxWeight: 15,
  baseWeight: 7,
  // ai
  pilot: "Light01",
  // 3d model
  modelDetails: {
    base: "craftSpeederA",
    physics: "craftSpeederAHull",
    shield: "craftSpeederAHull",
    // base: "spaceCraft5",
    // cockpit: "cockpit",
    // physics: "spaceCraft5Hull",
    // shield: "spaceCraft5Hull",
    trails: [
      {
        start: {
          x: 0,
          y: 0,
          z: 0,
        },
        color: { r: 1, g: 0, b: 0 },
      },
    ],
  },

  // configuration
  afterburnerSlot: {
    maxSize: "Small",
    base: {
      size: "Small",
      health: 15,
      maxSpeed: 1360,
      boostSpeed: 880,
      accelleration: 300,
      fuelConsumeRate: 1,
    },
  },
  engineSlot: {
    maxSize: "Small",
    base: {
      accelleration: 250,
      cruiseSpeed: 480,
      health: 15,
    },
  },
  fuelTankSlot: {
    maxSize: "Small",
    base: {
      health: 10,
      capacity: 150,
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
      health: 15,
      friendOrFoe: true,
      itts: true,
      locking: true,
      maxDistance: 15000,
    },
  },
  shieldsSlot: {
    maxSize: "Small",
    base: {
      fore: 60,
      aft: 60,
      energyDrain: 5,
      rechargeRate: 50,
      health: 20,
    },
  },
  thrustersSlot: {
    base: {
      health: 10,
      pitch: 100,
      roll: 100,
      yaw: 100,
      breakingForce: 225,
      breakingLimit: 200,
    },
  },
  structure: {
    core: {
      health: 10,
      slots: ["PowerPlant", "Shields", "Thruster"],
      utilityMounts: [
        {
          mountType: "UtilityMount",
          maxSize: "Small",
        },
      ],
    },
    front: {
      armor: 35,
      maxArmor: 35,
      health: 35,
      slots: [],
      utilityMounts: [
        {
          mountType: "UtilityMount",
          maxSize: "Small",
        },
      ],
    },
    back: {
      armor: 35,
      maxArmor: 35,
      health: 35,
      slots: ["Engine", "Afterburner"],
    },
    left: {
      armor: 30,
      maxArmor: 30,
      health: 30,
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
            type: "particleCannon",
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
          mountType: "WeaponMount",
          position: {
            x: -2.5,
            y: -2.5,
            z: 0.5,
          },
          base: {
            count: 2,
            type: "heatseeking",
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
          mountType: "UtilityMount",
          maxSize: "Small",
        },
      ],
      gunMounts: [
        {
          mountType: "GunMount",
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
      ],
      weaponMounts: [
        {
          maxCount: 2,
          maxSize: "Medium",
          mountType: "WeaponMount",
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
