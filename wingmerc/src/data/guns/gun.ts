export type Gun = {
  /** id */
  class: string,
  /** display name */
  name: string,
  /** range before dissipating */
  range: number,
  /** damage done on contact */
  damage: number,
  /** energy consumer per shot */
  energy: number,
  /** delay in milliseconds */
  delay: number,
  /** travel speed in mps */
  speed: number,
}