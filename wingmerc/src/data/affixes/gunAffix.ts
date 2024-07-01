import { ComponentModifier } from "../ships/shipTemplate";

export interface GunAffix {
  /** name of the affix */
  name: string,
  /** type used for template lookup */
  type: string,
  /** range before dissipating */
  range?: ComponentModifier,
  /** damage done on contact */
  damage?: ComponentModifier,
  /** energy consumer per shot */
  energy?: ComponentModifier,
  /** delay in milliseconds */
  delay?: ComponentModifier,
  /** travel speed in mps */
  speed?: ComponentModifier,
  /** how much damage it can take before being destroyed */
  health?: ComponentModifier,
}