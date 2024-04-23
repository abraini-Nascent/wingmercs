import { ShipDetails } from "./shipDetails";

export const EnemyMedium01: ShipDetails = Object.seal({
  name: "Wasp",
  class: "EnemyMedium01",
  pilot: "Medium01",
  modelDetails: {
    base: "craftSpeederB",
    physics: "craftSpeederBHull",
    shield: "craftSpeederBHull",
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
    fore: 50,
    aft: 50,
    rechargeRate: 5,
    energyDrain: 5,
  },
  armor: {
    front: 45,
    back: 35,
    left: 30,
    right: 30,
  },
  health: 50,
  pitch: 140,
  roll: 10,
  yaw: 10,
  accelleration: 30,
  afterburnerAccelleration: 60,
  breakingForce: 30,
  breakingLimit: 100,
  cruiseSpeed: 400,
  maxSpeed: 1200,
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
    }
  ],
  // todo:
  //  position on model
  weapons: [
    {
      type: "heatseeking",
      count: 2
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