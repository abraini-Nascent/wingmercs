import { PilotAIType } from "../pilotAI/pilotAI";
import { GunType } from '../guns/gun';
import { WeaponType } from '../weapons/weapon';

export const ShipWeightClass = {
  Light: "Light",
  Medium: "Medium",
  Heavy: "Heavy",
  Capital: "Capital",
} as const
export type ShipWeightClass = typeof ShipWeightClass[keyof typeof ShipWeightClass];
export const ShipComponentSize = {
  Small: "Small",
  Medium: "Medium",
  Large: "Large",
  Capital: "Capital",
} as const
export type ShipComponentSize = typeof ShipComponentSize[keyof typeof ShipComponentSize];
export interface ComponentModifier {
  value: number;
  percent?: boolean;
}
export interface ModifierDetails {
  id: string
  type: StructureSlotType
  name: string
}
export interface UtilityModifierDetails extends ModifierDetails {
  weight: number
  ammo?: string
  ammoCount?: number
  health?: ComponentModifier;
  fuel?: ComponentModifier;
  energy?: ComponentModifier;
  shields?: ComponentModifier;
}
export interface ShieldGeneratorBaseDetails {
  health: number;
  fore: number;
  aft: number;
  rechargeRate: number;
  energyDrain: number;
}
export interface ShieldGeneratorModifierDetails extends ModifierDetails {
  name: string;
  size: ShipComponentSize;
  weight: number;
  cost: number;
  health?: ComponentModifier;
  fore?: ComponentModifier;
  aft?: ComponentModifier;
  rechargeRate?: ComponentModifier;
  energyDrain?: ComponentModifier;
}

export interface AfterburnerBaseDetails {
  health: number
  /** how fast the ship accellerates when burning */
  accelleration: number;
  /** the speed the afterburners add on the top end to the engine cruise speed */
  boostSpeed: number;
  /** the max speed the afterburner can output */
  maxSpeed: number;
  /** the rate at which the afterburner consumes fuel.  1 unit is 1 fuel per second */
  fuelConsumeRate: number;
}
export interface AfterburnerModifierDetails extends ModifierDetails {
  name: string;
  size: ShipComponentSize;
  weight: number;
  cost: number;
  health?: ComponentModifier;
  accelleration?: ComponentModifier;
  boostSpeed?: ComponentModifier;
  maxSpeed?: ComponentModifier;
  fuelConsumeRate?: ComponentModifier;
}

export interface EngineBaseDetails {
  health: number;
  /** the max cruise speed */
  cruiseSpeed: number;
  /** the max accelleration */
  accelleration: number;
}
export interface EngineModifierDetails extends ModifierDetails {
  name: string;
  size: ShipComponentSize;
  cost: number;
  weight: number;
  health?: ComponentModifier;
  cruiseSpeed?: ComponentModifier;
  accelleration?: ComponentModifier;
}

export interface PowerPlantModifierDetails extends ModifierDetails {
  name: string;
  size: ShipComponentSize;
  weight: number;
  cost: number;
  health: ComponentModifier;
  /** how much energy per second the power plant generates */
  rate: ComponentModifier;
  /** the max capacity the power plant can hold */
  maxCapacity: ComponentModifier;
}
export interface PowerPlantBaseDetails {
  health: number;
  /** how much energy per second the power plant generates */
  rate: number;
  /** the max capacity the power plant can hold */
  maxCapacity: number;
}

export interface FuelTankModifierDetails extends ModifierDetails {
  name: string;
  size: ShipComponentSize;
  weight: number;
  cost: number;
  health: ComponentModifier;
  /** how much fuel the tank can hold */
  capacity: ComponentModifier;
}
export interface FuelTankBaseDetails {
  health: number;
  /** how much fuel the tank can hold */
  capacity: number;
}

export interface ThrustersModifierDetails extends ModifierDetails {
  name: string;
  size: ShipComponentSize;
  cost: number;
  weight: number;
  health: ComponentModifier;
  pitch: ComponentModifier;
  roll: ComponentModifier;
  yaw: ComponentModifier;
  breakingForce: ComponentModifier;
  breakingLimit: ComponentModifier;
}
export interface ThrustersBaseDetails {
  health: number;
  pitch: number;
  roll: number;
  yaw: number;
  breakingForce: number;
  breakingLimit: number;
}

export interface RadarDetails {
  health: number;
  /** how much fuel the tank can hold */
  maxDistance: number;
  friendOrFoe?: true;
  fofDetail?: true;
  itts?: true;
  locking?: true;
}

export type WeaponSelection = {
  type: WeaponType;
  count: number;
}
export interface WeaponMounts {
  maxSize: ShipComponentSize
  maxCount: number
  base: WeaponSelection
  position: {
    x: number;
    y: number;
    z: number;
  }
}

export type GunTier = 0 | 1 | 2 | 3 | 4 | 5
export type GunSelection = {
  type: GunType
  tier?: GunTier
  affix?: string
}
export interface GunMounts {
  maxSize: ShipComponentSize
  base?: GunSelection
  position: {
    x: number;
    y: number;
    z: number;
  }
}

export interface UtilityMounts {
  maxSize: ShipComponentSize
  utility?: UtilityModifierDetails
}

export const StructureSlotType = {
  Thruster: "Thruster",
  Afterburner: "Afterburner",
  Shields: "Shields",
  Engine: "Engine",
  PowerPlant: "PowerPlant",
  Radar: "Radar",
  Gun: "Gun",
  Weapon: "Weapon",
  Utility: "Utility",
  FuelTank: "FuelTank",
} as const
export type StructureSlotType = typeof StructureSlotType[keyof typeof StructureSlotType];

export const StructureSections = {
  front: "front",
  back: "back",
  left: "left",
  right: "right",
  core: "core",
} as const
export type StructureSections = typeof StructureSections[keyof typeof StructureSections];

export type ShipStructureSection = {
  armor?: number;
  maxArmor?: number;
  health: number;
  slots: StructureSlotType[];
  utilityMounts?: UtilityMounts[]; 
  gunMounts?: GunMounts[];
  weaponMounts?: WeaponMounts[];
}

/**
 * Ship details:
 * We want ships to feel unique but also be customizable with components.
 * WingCommander ships were unique because their values and aesthetics where custom and hard coded.  
 * Privateer had a smaller selection of player ships,
 * but allowed the player to customize their ships with gun and weapon selections and upgrades.  The upgrades were linear and consistent 
 * for every ship, the ships could allow high end upgrades.  This did not provide a lot of customization.
 * MechWarrior 2 + Mercs allowed for modification of weapons and armor, and newer mechwarrior games have a larger number of categories of items
 * with multiple levels of improved statistics for the components.
 * 
 * We don't want the ships to feel samey when they have the same components. 
 * The ship should have base stats and handling that make them unique, and the components should act as upgrades or side-grade modifiers.
 * For an example of afterburner variants:
 * - consumes more fuel but has a higher top end
 * - has a higher top end but slower accelleration
 * - has a lower top end but a much faster accelleration
 * - has a lower top end and uses less fuel
 * they should provide or cater to different play styles, higher levels should shrink the negative trait
 * for example a level 4 "consumes more fuel but has a higher top end" afterburner should consume less fuel than a level 1, but still consume more that a stock afterburner
 */
export interface ShipTemplate {
  name: string;
  class: string;
  weightClass: ShipWeightClass;
  maxWeight: number;
  baseWeight: number;
  modelDetails: {
      base: string;
      physics: string;
      shield: string;
      cockpit?: string;
      firstPerson?: string;
      trails: {
          start: {
              x: number;
              y: number;
              z: number;
          };
          width?: number;
          length?: number;
          color?: {
              r: number;
              g: number;
              b: number;
          }
      }[];
  };
  pilot: PilotAIType;
  hanger?: boolean;
  afterburnerSlot: {
    maxSize: ShipComponentSize;
    modifier?: AfterburnerModifierDetails;
    base: AfterburnerBaseDetails;
  }
  shieldsSlot: {
    maxSize: ShipComponentSize;
    modifier?: ShieldGeneratorModifierDetails;
    base: ShieldGeneratorBaseDetails;
  };
  engineSlot: {
    maxSize: ShipComponentSize;
    modifier?: EngineModifierDetails;
    base: EngineBaseDetails;
  };
  powerPlantSlot: {
    maxSize: ShipComponentSize;
    modifier?: PowerPlantModifierDetails;
    base: PowerPlantBaseDetails;
  };
  radarSlot: {
    maxSize: ShipComponentSize;
    base: RadarDetails;
  };
  fuelTankSlot: {
    maxSize: ShipComponentSize;
    modifier?: FuelTankModifierDetails;
    base: FuelTankBaseDetails;
  };
  thrustersSlot: {
    modifier?: ThrustersModifierDetails;
    base: ThrustersBaseDetails;
  };
  structure: {
    core: ShipStructureSection
    front: ShipStructureSection
    back: ShipStructureSection
    left: ShipStructureSection
    right: ShipStructureSection
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
}