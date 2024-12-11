import { ShipTemplate } from "./shipTemplate"

/// based on the Broadsword
export const LiteCarrier: ShipTemplate = Object.seal({
  name: "LiteCarrier",
  class: "LiteCarrier",
  weightClass: "Capital",
  baseWeight: 2000,
  maxWeight: 2000,
  modelDetails: {
    base: "liteCarrier",
    // physics: "liteCarrierHull",
    // shield: "liteCarrierHull",
    trails: []
  },
  pilot: "Heavy02",
  hanger: true,
  afterburnerSlot: {
    maxSize: "Medium",
    base: {
      health: 10,
      accelleration: 200,
      boostSpeed: 200,
      maxSpeed: 250,
      fuelConsumeRate: 0.01,
    },
  },
  shieldsSlot: {
    maxSize: "Capital",
    base: {
      health: 150,
      fore: 1000,
      aft: 1000,
      rechargeRate: 30,
      energyDrain: 0.01,
    },
  },
  engineSlot: {
    maxSize: "Medium",
    base: {
      health: 10,
      cruiseSpeed: 150,
      accelleration: 150,
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
      armor: 4000,
      maxArmor: 4000,
      health: 4000,
      slots: ["Radar"],
      utilityMounts: [],
      gunMounts: [],
      weaponMounts: [],
    },
    back: {
      armor: 4000,
      maxArmor: 4000,
      health: 4000,
      slots: ["Engine", "Afterburner"],
    },
    left: {
      armor: 3500,
      maxArmor: 3500,
      health: 3500,
      slots: [],
      utilityMounts: [],
      gunMounts: [],
      weaponMounts: [],
    },
    right: {
      armor: 3500,
      maxArmor: 3500,
      health: 3500,
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
