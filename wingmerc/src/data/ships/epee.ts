import {  GunMounts, ShipTemplate, WeaponMounts } from "./shipTemplate";

export const Epee: ShipTemplate = Object.seal({
  name: "Epee",
  class: "Epee",
  weightClass: "Light",
  maxWeight: 15,
  // ai
  pilot: "Light01",
  // 3d model
  modelDetails: {
    base: "craftMiner",
    physics: "craftMinerHull",
    shield: "craftMinerHull",
    trails: [
      {
        start: {
          x: 5,
          y: -5,
          z: -5
        },
        color: { r: 1, g: 0, b: 0 }
      }, {
        start: {
          x: -5,
          y: -5,
          z: -5
        },
        color: { r: 1, g: 0, b: 0 }
      },
    ]
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
      fuelConsumeRate: 1
    }
  },
  engineSlot: {
    maxSize: "Small",
    base: {
      accelleration: 100,
      cruiseSpeed: 480,
      health: 15,
    }
  },
  fuelTankSlot: {
    maxSize: "Small",
    base: {
      health: 10,
      capacity: 150
    }
  },
  powerPlantSlot: {
    maxSize: "Small",
    base: {
      health: 10,
      rate: 20,
      maxCapacity: 200,
    }
  },
  radarSlot: {
    maxSize: "Small",
    base: {
      health: 15,
      friendOrFoe: true,
      itts: true,
      locking: true,
      maxDistance: 15000,
    }
  },
  shieldsSlot: {
    maxSize: "Small",
    base: {
      fore: 60,
      aft: 60,
      energyDrain: 5,
      rechargeRate: 5,
      health: 20
    }
  },
  thrustersSlot: {
    base: {
      health: 10,
      pitch: 100,
      roll: 100,
      yaw: 100,
      breakingForce: 225,
      breakingLimit: 200,
    }
  },
  structure: {
    core: { health: 10, slots: 2},
    front: { armor: 35, maxArmor: 35, health: 35, slots: 2 },
    back: { armor: 35, maxArmor: 35, health: 35, slots: 2 },
    left: { armor: 30, maxArmor: 30, health: 30, slots: 2 },
    right: { armor: 30, maxArmor: 30, health: 30, slots: 2 },
  },
  systems: {
    quadrant: {
      fore: [
        {
          system: "guns",
          weight: 1
        },
        {
          system: "radar",
          weight: 1
        },
        {
          system: "thrusters",
          weight: 1
        },
        {
          system: "targeting",
          weight: 1
        },
        {
          system: "weapons",
          weight: 1
        },

      ],
      aft: [
        {
          system: "afterburners",
          weight: 1
        },
        {
          system: "thrusters",
          weight: 1
        },
        {
          system: "engines",
          weight: 1
        },
        {
          system: "battery",
          weight: 1
        },
        {
          system: "shield",
          weight: 1
        },
        {
          system: "power",
          weight: 1
        },
      ]
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
    }
  },
  guns: [
    "laser", "laser"
  ],
  gunMounts: [
    {
      maxCount: 1,
      maxSize: "Small",
      position: {
        x: -2.5,
        y: -2.5,
        z: 0.5
      }
    },
    {
      maxCount: 1,
      maxSize: "Small",
      position: {
        x: 2.5,
        y: -2.5,
        z: 0.5
      }
    }
  ] as GunMounts[],
  weapons: [
    {
      type: "heatseeking",
      count: 2
    },
    {
      type: "dumbfire",
      count: 2
    }
  ],
  weaponMounts: [
    {
      maxSize: "Medium",
      maxCount: 2,
      position: {
        x: 2.5,
        y: -2.5,
        z: 0.5
      }
    },
    {
      maxSize: "Medium",
      maxCount: 2,
      position: {
        x: -2.5,
        y: -2.5,
        z: 0.5
      }
    }
  ] as WeaponMounts[],
})