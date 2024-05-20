import { ShipDetails, ShipTemplate } from "./shipTemplate";

export const EnemyMedium02: ShipTemplate = Object.seal({
  "name": "Scorpion",
  "class": "EnemyMedium02",
  "weightClass": "Medium",
  "maxWeight": 24,
  "modelDetails": {
      "base": "craftSpeederC",
      "physics": "craftSpeederCHull",
      "shield": "craftSpeederCHull",
      "trails": [
          {
              "start": {
                  "x": 3.7,
                  "y": 0,
                  "z": 10
              },
              "color": {
                  "r": 0,
                  "g": 0,
                  "b": 1
              }
          },
          {
              "start": {
                  "x": -3.7,
                  "y": 0,
                  "z": 10
              },
              "color": {
                  "r": 0,
                  "g": 0,
                  "b": 1
              }
          }
      ]
  },
  "pilot": "Light01",
  "afterburnerSlot": {
      "maxSize": "Small",
      "base": {
          "health": 10,
          "accelleration": 60,
          "boostSpeed": 760,
          "maxSpeed": 1120,
          "fuelConsumeRate": 1
      }
  },
  "shieldsSlot": {
      "maxSize": "Small",
      "base": {
          "health": 10,
          "fore": 80,
          "aft": 80,
          "rechargeRate": 5,
          "energyDrain": 5
      }
  },
  "engineSlot": {
      "maxSize": "Small",
      "base": {
          "health": 10,
          "cruiseSpeed": 360,
          "accelleration": 30
      }
  },
  "powerPlantSlot": {
      "maxSize": "Small",
      "base": {
          "health": 10,
          "rate": 20,
          "maxCapacity": 200
      }
  },
  "radarSlot": {
      "maxSize": "Small",
      "base": {
          "health": 10,
          "maxDistance": 10000,
          "friendOrFoe": true,
          "fofDetail": true,
          "locking": true
      }
  },
  "fuelTankSlot": {
      "maxSize": "Small",
      "base": {
          "health": 10,
          "capacity": 90
      }
  },
  "thrustersSlot": {
      "base": {
          "health": 0,
          "pitch": 100,
          "roll": 70,
          "yaw": 70,
          "breakingForce": 30,
          "breakingLimit": 100
      }
  },
  "structure": {
      "core": {
          "health": 50,
          "slots": ["PowerPlant", "Shields", "Thruster", "Weapon", "Generic", "Generic", "Generic"],
      },
      "front": {
          "armor": 90,
          "maxArmor": 90,
          "health": 90,
          "slots": ["Radar", "Gun", "Gun", "Weapon", "Generic"],
      },
      "back": {
          "armor": 100,
          "maxArmor": 100,
          "health": 100,
          "slots": ["Engine", "Afterburner", "Generic", "Generic",]
      },
      "left": {
          "armor": 80,
          "maxArmor": 80,
          "health": 80,
          "slots": ["Gun", "Gun", "Weapon", "Generic"]
      },
      "right": {
          "armor": 80,
          "maxArmor": 80,
          "health": 80,
          "slots": ["Gun", "Gun", "Weapon", "Generic"]
      }
  },
  "systems": {
      "quadrant": {
          "fore": [
              {
                  "system": "guns",
                  "weight": 1
              },
              {
                  "system": "radar",
                  "weight": 1
              },
              {
                  "system": "thrusters",
                  "weight": 1
              },
              {
                  "system": "targeting",
                  "weight": 1
              },
              {
                  "system": "weapons",
                  "weight": 1
              }
          ],
          "aft": [
              {
                  "system": "afterburners",
                  "weight": 1
              },
              {
                  "system": "thrusters",
                  "weight": 1
              },
              {
                  "system": "engines",
                  "weight": 1
              },
              {
                  "system": "battery",
                  "weight": 1
              },
              {
                  "system": "shield",
                  "weight": 1
              },
              {
                  "system": "power",
                  "weight": 1
              }
          ]
      },
      "base": {
          "afterburners": 25,
          "thrusters": 25,
          "engines": 25,
          "power": 25,
          "battery": 25,
          "shield": 25,
          "radar": 25,
          "targeting": 25,
          "guns": 25,
          "weapons": 50
      }
  },
  "guns": [
      "laser",
      "laser"
  ],
  "gunMounts": [
      {
          "maxCount": 1,
          "maxSize": "Medium",
          "position": {
              "x": -2.5,
              "y": -0.5,
              "z": -0.5
          }
      },
      {
          "maxCount": 1,
          "maxSize": "Medium",
          "position": {
              "x": 2.5,
              "y": -0.5,
              "z": -0.5
          }
      }
  ],
  "weapons": [
      {
          "count": 1,
          "type": "dumbfire"
      },
      {
          "count": 3,
          "type": "heatseeking"
      }
  ],
  "weaponMounts": [
      {
          "maxCount": 1,
          "maxSize": "Medium",
          "position": {
              "x": -2.5,
              "y": -0.5,
              "z": -0.5
          }
      },
      {
          "maxCount": 3,
          "maxSize": "Medium",
          "position": {
              "x": 2.5,
              "y": -0.5,
              "z": -0.5
          }
      }
  ]
})

const EnemyMedium02Old: ShipDetails = Object.seal({
  name: "Scorpion",
  class: "EnemyMedium02",
  pilot: "Medium02",
  modelDetails: {
    base: "craftSpeederC",
    physics: "craftSpeederCHull",
    shield: "craftSpeederCHull",
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
    fore: 80,
    aft: 80,
    rechargeRate: 5,
    energyDrain: 5,
  },
  armor: {
    front: 90,
    back: 100,
    left: 80,
    right: 80,
  },
  health: 50,
  pitch: 100,
  roll: 70,
  yaw: 70,
  accelleration: 30,
  afterburnerAccelleration: 60,
  breakingForce: 30,
  breakingLimit: 100,
  cruiseSpeed: 360,
  maxSpeed: 1120,
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