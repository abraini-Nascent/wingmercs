import { ShipDetails } from "./shipDetails";

export const EnemyHeavy01: ShipDetails = Object.seal({
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
          z: 10
        },
        color: { r: 0, g: 0, b: 1 }
      },{
        start: {
          x: -3.7,
          y: 0,
          z: 10
        },
        color: { r: 0, g: 0, b: 1 }
      },
    ]
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
        z: -0.5
      },
    },
    {
      type: "laser",
      position: {
        x: 2.5,
        y: -0.5,
        z: -0.5
      },
    },
    {
      type: "massdriver",
      position: {
        x: -3,
        y: -1,
        z: -0.5
      },
    },
    {
      type: "massdriver",
      position: {
        x: 3,
        y: -1,
        z: -0.5
      },
    }
  ],
  // todo:
  //  position on model
  weapons: [
    {
      type: "dumbfire",
      count: 1
    },
    {
      type: "heatseeking",
      count: 3
    }
  ],
  // TODO: this should also act like guns and weapons where we pull in a type
  engine: {
    rate: 20,
    maxCapacity: 200
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
    }
  },
  fuel: {
    maxCapacity: 90
  }
})