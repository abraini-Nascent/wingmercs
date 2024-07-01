import { GunAffix } from './gunAffix';

export const Pirate: GunAffix = {
  name: "Pirate",
  type: "Pirate",
  speed: { value: 0.1, percent: true },
  health: { value: -0.1, percent: true }
}

export const MillitarySurplus: GunAffix = {
  name: "Millitary Surplus",
  type: "MillitarySurplus",
  speed: { value: -0.1, percent: true },
  health: { value: 0.1, percent: true }
}

export const Mercenary: GunAffix = {
  name: "Mercenary",
  type: "Mercenary",
  damage: { value: 0.1, percent: true },
  energy: { value: 0.1, percent: true }
}

export const Militia: GunAffix = {
  name: "Militia",
  type: "Militia",
  range: { value: 0.25, percent: true },
  speed: { value: -0.1, percent: true }
}

export const BountyHunter: GunAffix = {
  name: "Bounty Hunter",
  type: "BountyHunter",
  delay: { value: -0.25, percent: true },
  damage: { value: -0.1, percent: true }
}

export const Outlaw: GunAffix = {
  name: "Outlaw",
  type: "Outlaw",
  speed: { value: 0.25, percent: true },
  health: { value: -0.1, percent: true }
}

export const Veteran: GunAffix = {
  name: "Veteran",
  type: "Veteran",
  range: { value: 0.25, percent: true },
  energy: { value: 0.1, percent: true }
}

export const Smuggler: GunAffix = {
  name: "Smuggler",
  type: "Smuggler",
  energy: { value: -0.25, percent: true },
  health: { value: -0.25, percent: true }
}

export const Ace: GunAffix = {
  name: "Ace",
  type: "Ace",
  delay: { value: -0.25, percent: true },
  speed: { value: -0.25, percent: true }
}

export const Warlord: GunAffix = {
  name: "Warlord",
  type: "Warlord",
  damage: { value: 0.25, percent: true },
  range: { value: -0.5, percent: true }
}

export const Raider: GunAffix = {
  name: "Raider",
  type: "Raider",
  speed: { value: 0.25, percent: true },
  delay: { value: 0.25, percent: true }
}

export const Enforcer: GunAffix = {
  name: "Enforcer",
  type: "Enforcer",
  health: { value: 0.25, percent: true },
  energy: { value: 0.1, percent: true }
}

export const Rogue: GunAffix = {
  name: "Rogue",
  type: "Rogue",
  speed: { value: 0.25, percent: true },
  range: { value: 0.25, percent: true }
}

export const Scavenger: GunAffix = {
  name: "Scavenger",
  type: "Scavenger",
  energy: { value: -0.10, percent: true },
  damage: { value: -0.10, percent: true }
}

export const Commander: GunAffix = {
  name: "Commander",
  type: "Commander",
  energy: { value: -0.5, percent: true },
  damage: { value: 0.5, percent: true },
  speed: { value: 0.5, percent: true }, 
  range: { value: 0.5, percent: true },
}