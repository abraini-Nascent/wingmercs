import { ShipDetails, ShipTemplate } from "./shipTemplate";

export const Dirk: ShipTemplate = Object.seal({
  "name": "Dirk",
  "class": "Dirk",
  "weightClass": "Light",
  "maxWeight": 14,
  "modelDetails": {
      "base": "craftMiner",
      "physics": "craftMinerHull",
      "shield": "craftMinerHull",
      "trails": [
          {
              "start": {
                  "x": 5,
                  "y": -5,
                  "z": -5
              },
              "color": {
                  "r": 1,
                  "g": 0,
                  "b": 0
              }
          },
          {
              "start": {
                  "x": -5,
                  "y": -5,
                  "z": -5
              },
              "color": {
                  "r": 1,
                  "g": 0,
                  "b": 0
              }
          }
      ]
  },
  "pilot": "Light01",
  "afterburnerSlot": {
      "maxSize": "Small",
      "base": {
          "health": 10,
          "accelleration": 350,
          "boostSpeed": 900,
          "maxSpeed": 1400,
          "fuelConsumeRate": 1
      }
  },
  "shieldsSlot": {
      "maxSize": "Small",
      "base": {
          "health": 10,
          "fore": 60,
          "aft": 60,
          "rechargeRate": 2,
          "energyDrain": 2
      }
  },
  "engineSlot": {
      "maxSize": "Small",
      "base": {
          "health": 10,
          "cruiseSpeed": 500,
          "accelleration": 150
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
          "pitch": 80,
          "roll": 90,
          "yaw": 80,
          "breakingForce": 225,
          "breakingLimit": 200
      }
  },
  "structure": {
      "core": {
          "health": 50,
          "slots": ["PowerPlant", "Shields", "Thruster", "Generic"]
      },
      "front": {
          "armor": 65,
          "maxArmor": 65,
          "health": 65,
          "slots": ["Radar", "Generic"]
      },
      "back": {
          "armor": 65,
          "maxArmor": 65,
          "health": 65,
          "slots": ["Engine", "Afterburner"]
      },
      "left": {
          "armor": 45,
          "maxArmor": 45,
          "health": 45,
          "slots": ["Gun", "Generic"]
      },
      "right": {
          "armor": 45,
          "maxArmor": 45,
          "health": 45,
          "slots": ["Gun", "Generic"]
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
          "afterburners": 50,
          "thrusters": 50,
          "engines": 50,
          "power": 50,
          "battery": 50,
          "shield": 50,
          "radar": 50,
          "targeting": 50,
          "guns": 50,
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
              "y": -2.5,
              "z": 0.5
          }
      },
      {
          "maxCount": 1,
          "maxSize": "Medium",
          "position": {
              "x": 2.5,
              "y": -2.5,
              "z": 0.5
          }
      }
  ],
  "weapons": [
      {
          "count": 2,
          "type": "heatseeking"
      },
      {
          "count": 2,
          "type": "dumbfire"
      }
  ],
  "weaponMounts": [
      {
          "maxCount": 2,
          "maxSize": "Medium",
          "position": {
              "x": -2.5,
              "y": -2.5,
              "z": 0.5
          }
      },
      {
          "maxCount": 2,
          "maxSize": "Medium",
          "position": {
              "x": 2.5,
              "y": -2.5,
              "z": 0.5
          }
      }
  ]
})

const DirkOld: ShipDetails = Object.seal({
  name: "Dirk",
  class: "Dirk",
  pilot: "Light01",
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
  shields: {
    fore: 60,
    aft: 60,
    rechargeRate: 2,
    energyDrain: 2,
  },
  armor: {
    front: 65,
    back: 65,
    left: 45,
    right: 45,
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
  health: 50,
  pitch: 80,
  roll: 90,
  yaw: 80,
  accelleration: 150,
  afterburnerAccelleration: 350,
  breakingForce: 225,
  breakingLimit: 200,
  cruiseSpeed: 500,
  maxSpeed: 1400,
  guns: [
    {
      type: "laser",
      position: {
        x: -2.5,
        y: -2.5,
        z: 0.5
      },
    },
    {
      type: "laser",
      position: {
        x: 2.5,
        y: -2.5,
        z: 0.5
      },
    }
  ],
  // todo:
  //  position on model
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
  // TODO: this should also act like guns and weapons where we pull in a type
  engine: {
    rate: 20,
    maxCapacity: 200
  },
  fuel: {
    maxCapacity: 90
  }
})

