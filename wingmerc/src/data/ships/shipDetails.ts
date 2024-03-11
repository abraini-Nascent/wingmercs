export interface ShipDetails {
  name: string;
  class: string;
  modelDetails: {
      base: string;
      physics: string;
      shield: string;
      trails: {
          start: {
              x: number;
              y: number;
              z: number;
          };
          color?: {
              r: number;
              g: number;
              b: number;
          }
      }[];
  };
  shields: {
      fore: number;
      aft: number;
      rechargeRate: number;
      energyDrain: number;
  };
  armor: {
    front: number;
    back: number;
    left: number;
    right: number;
  };
  systems: {
    quadrant: {
        fore: {
            system: string;
            weight: number;
        }[];
        aft: {
            system: string;
            weight: number;
        }[];
    };
    base: {
        afterburners: number;
        thrusters: number;
        engines: number;
        power: number;
        battery: number;
        shield: number;
        radar: number;
        targeting: number;
        guns: number;
        weapons: number;
    };
  };
  health: number;
  pitch: number;
  roll: number;
  yaw: number;
  accelleration: number;
  afterburnerAccelleration: number;
  breakingForce: number;
  breakingLimit: number;
  cruiseSpeed: number;
  maxSpeed: number;
  guns: {
    type: string;
    position: {
        x: number;
        y: number;
        z: number;
    };
  }[];
  weapons: {
    type: string;
    count: number;
  }[];
  engine: {
    rate: number;
    maxCapacity: number;
  };
  fuel: {
    maxCapacity: number;
  }
}