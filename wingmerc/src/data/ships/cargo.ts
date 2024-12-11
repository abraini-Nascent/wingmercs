import { ShipTemplate } from "./shipTemplate"

/// based on the Broadsword
export const Cargo: ShipTemplate = Object.seal({
  name: "Cargo",
  class: "Cargo",
  weightClass: "Capital",
  baseWeight: 2000,
  maxWeight: 2000,
  modelDetails: {
    base: "craftCargoA",
    physics: "craftCargoAHull",
    shield: "craftCargoAHull",
    trails: [],
  },
  pilot: "Heavy02",
  afterburnerSlot: {
    maxSize: "Medium",
    base: {
      health: 10,
      accelleration: 200,
      boostSpeed: 200,
      maxSpeed: 400,
      fuelConsumeRate: 0.01,
    },
  },
  shieldsSlot: {
    maxSize: "Capital",
    base: {
      health: 150,
      fore: 20,
      aft: 20,
      rechargeRate: 2,
      energyDrain: 0.01,
    },
  },
  engineSlot: {
    maxSize: "Medium",
    base: {
      health: 10,
      cruiseSpeed: 350,
      accelleration: 350,
    },
  },
  powerPlantSlot: {
    maxSize: "Medium",
    base: {
      health: 10,
      rate: 45,
      maxCapacity: 2000,
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
      capacity: 2000,
    },
  },
  thrustersSlot: {
    base: {
      health: 0,
      pitch: 10,
      roll: 10,
      yaw: 10,
      breakingForce: 25,
      breakingLimit: 20,
    },
  },
  structure: {
    core: {
      health: 50,
      slots: ["PowerPlant", "Shields", "Thruster"],
      utilityMounts: [],
      weaponMounts: [],
    },
    front: {
      armor: 1000,
      maxArmor: 1000,
      health: 1000,
      slots: ["Radar"],
      utilityMounts: [],
      gunMounts: [],
      weaponMounts: [],
    },
    back: {
      armor: 1000,
      maxArmor: 1000,
      health: 1000,
      slots: ["Engine", "Afterburner"],
    },
    left: {
      armor: 1000,
      maxArmor: 1000,
      health: 1000,
      slots: [],
      utilityMounts: [],
      gunMounts: [],
      weaponMounts: [],
    },
    right: {
      armor: 1000,
      maxArmor: 1000,
      health: 1000,
      slots: [],
      utilityMounts: [],
      gunMounts: [],
      weaponMounts: [],
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
