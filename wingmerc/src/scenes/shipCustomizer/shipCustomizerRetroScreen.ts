import * as GunAffixs from "./../../data/affixes/gunAffixes"
import {
  ComponentModifier,
  GunMounts,
  ModifierDetails,
  UtilityMounts,
  WeaponMounts,
} from "./../../data/ships/shipTemplate"
import { AppContainer } from "./../../app.container"
import { GunSelection, ShipStructureSection, ShipTemplate } from "../../data/ships/shipTemplate"
import { Observer } from "@babylonjs/core"
import { MercScreen } from "../screen"
import * as GUI from "@babylonjs/gui"
import { FluentTextBlockExtra, TextBlockExtra } from "../../utils/TextBlockExtra"
import {
  FluentBehaviourState,
  FluentContainer,
  FluentControl,
  FluentRectangle,
  FluentScrollViewer,
  FluentSimpleButton,
  FluentTextBlock,
  Ref,
} from "../../utils/fluentGui"
import { Weapons } from "../../data/weapons"
import * as Guns from "../../data/guns"
import { RetroGui } from "../../utils/retroGui"
import {
  allAmmos,
  allGunSelections,
  applyModifier,
  gunSelectionName,
  itemSelectionNameParts,
} from "../../world/factories"
import { Weapon } from "../../data/weapons/weapon"
import { Afterburners } from "../../data/components/afterburners"
import { Engines } from "../../data/components/engines"
import { Shields } from "../../data/components/shields"
import { PowerPlants } from "../../data/components/powerPlants"
import { Thrusters } from "../../data/components/thrusters"
import { FuelTanks } from "../../data/components/fueltanks"
import { Utilities } from "../../data/components/utility"
import { Gun } from "../../data/guns/gun"
import { CRTScreenGfx } from "../CRTScreenGfx"
import { weightForShip } from "../../world/helpers"
import { MainMenuScene } from "../mainMenu/mainMenuLoop"

type InventorySection = "Guns" | "Weapons" | "Comps"
type ComponentType = "Afterburner" | "Engine" | "Radar" | "Shields" | "Thrusters" | "PowerPlant" | "Utility"
const Sections = ["Front", "Core", "Left", "Right", "Back"]
const ComponentColours = {
  Thruster: { r: 1.0, g: 0.0, b: 0.0 }, // Bright red
  Afterburner: { r: 1.0, g: 0.5, b: 0.0 }, // Orange
  Shields: { r: 0.0, g: 0.5, b: 1.0 }, // Sky blue
  Engine: { r: 0.0, g: 0.8, b: 0.4 }, // Grey
  FuelTank: { r: 0.0, g: 0.8, b: 0.4 }, // Grey
  PowerPlant: { r: 1.0, g: 1.0, b: 0.0 }, // Yellow
  Radar: { r: 0.0, g: 1.0, b: 0.0 }, // Green
  Gun: { r: 0.5, g: 0.0, b: 0.5 }, // Purple
  Weapon: { r: 0.0, g: 0.0, b: 1.0 }, // Blue
  Utility: { r: 0.75, g: 0.75, b: 0.75 }, // Light grey
}
const CompColors = {
  Thruster: "#FF0000", // Bright red
  Afterburner: "#FF8000", // Orange
  Shields: "#007FFF", // Sky blue
  Engine: "#00CC66", // Grey
  FuelTank: "#00CC66", // Grey
  PowerPlant: "#FFFF00", // Yellow
  Radar: "#00FF00", // Green
  Gun: "#800080", // Purple
  Weapon: "#0000FF", // Blue
  Utility: "#BFBFBF", // Light grey
}
const BackgroundColour = { r: 0.75, g: 0.75, b: 0.75 }
const rgbToHex = (colour: { r: number; g: number; b: number }, alpha: number = 1): string => {
  const { r, g, b } = colour
  const toHex = (value: number) => {
    const hex = Math.round(value * 255).toString(16)
    return hex.length === 1 ? "0" + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(alpha)}`
}

export namespace ShipCustomizerViewModel {
  export type Slot = {
    id: string
    section: string
    index?: number
    slot: string
    name: string
    base: any
    modifier: any
  }
  export type Part = {
    id: string
    item: any
    name: string
    tier?: string
  }
}
export class ShipCustomizerViewModel {
  currentSectionState = new FluentBehaviourState<InventorySection>("Guns")
  inventoryState: FluentBehaviourState<
    {
      id: string
      item: Gun
      name: string
      tier?: string
    }[]
  >
  shipState: FluentBehaviourState<{
    [section: string]: ShipCustomizerViewModel.Slot[]
  }>
  itemStatsState = new FluentBehaviourState(null)
  armorState: FluentBehaviourState<{ [section: string]: { armor: number; maxArmor: number } }>
  weightState: FluentBehaviourState<number>
  constructor(public ship: ShipTemplate) {
    this.inventoryState = new FluentBehaviourState(this.inventory()["Guns"])
    this.shipState = new FluentBehaviourState(this.sections())
    this.armorState = new FluentBehaviourState(this.armor())
    this.weightState = new FluentBehaviourState(weightForShip(this.ship))
  }
  addArmor(amount: number, section: string) {
    let sectionDetails: ShipStructureSection = this.ship.structure[section]
    sectionDetails.armor += amount
    if (sectionDetails.armor < 0) {
      sectionDetails.armor = 0
    }
    if (sectionDetails.armor > sectionDetails.maxArmor) {
      sectionDetails.armor = sectionDetails.maxArmor
    }
    this.shipState.setValue(this.sections())
    this.weightState.setValue(weightForShip(this.ship))
    this.armorState.setValue(this.armor())
  }
  removePart(part: ShipCustomizerViewModel.Part, slot: ShipCustomizerViewModel.Slot) {
    // TODO: put the part back into the inventory
    switch (slot.slot) {
      case "Utility":
        break
      case "Afterburner":
        this.ship.afterburnerSlot.modifier = undefined
        break
      case "Engine":
        this.ship.engineSlot.modifier = undefined
        break
      case "FuelTank":
        this.ship.fuelTankSlot.modifier = undefined
        break
      case "PowerPlant":
        this.ship.powerPlantSlot.modifier = undefined
        break
      case "Radar":
        break
      case "Shields":
        this.ship.shieldsSlot.modifier = undefined
        break
      case "Thruster":
        this.ship.thrustersSlot.modifier = undefined
        break
    }
    this.shipState.setValue(this.sections())
    this.weightState.setValue(weightForShip(this.ship))
  }
  addPart(part: ShipCustomizerViewModel.Part, slot: ShipCustomizerViewModel.Slot) {
    console.log("adding part", part, " to slot", slot)
    this.removePart(part, slot)
    const slotId = slot.slot
    switch (slotId) {
      case "Utility":
        this.ship.structure[slot.section].utilityMounts[slot.index].utility = part
        break
      case "Weapon": {
        const sectionSlot = this.ship.structure[slot.section].weaponMounts[slot.index]
        if (sectionSlot.base == undefined) {
          sectionSlot.base = {
            count: 1,
            type: part.item.class,
          }
        } else {
          sectionSlot.base.type = part.item.class
        }
        break
      }
      case "Gun": {
        const sectionSlot = this.ship.structure[slot.section].gunMounts[slot.index]
        if (sectionSlot.base == undefined) {
          sectionSlot.base = {
            count: 1,
            type: part.item.class,
            tier: part.tierIdx,
            affix: part.affix,
          }
        } else {
          sectionSlot.base.type = part.item.class
          sectionSlot.base.tier = part.tierIdx
          sectionSlot.base.affix = part.affix
        }
        break
      }
      case "Afterburner":
        this.ship.afterburnerSlot.modifier = part.item
        break
      case "Engine":
        this.ship.engineSlot.modifier = part.item
        break
      case "FuelTank":
        this.ship.fuelTankSlot.modifier = part.item
        break
      case "PowerPlant":
        this.ship.powerPlantSlot.modifier = part.item
        break
      case "Radar":
        break
      case "Shields":
        this.ship.shieldsSlot.modifier = part.item
        break
      case "Thruster":
        this.ship.thrustersSlot.modifier = part.item
        break
    }
    this.shipState.setValue(this.sections())
    let newPart
    Object.entries(this.shipState.getValue()).forEach((section: [string, ShipCustomizerViewModel.Slot[]]) => {
      const [sectionName, slots] = section
      const match = slots.find((sectionSlot) => sectionSlot.id == slot.id)
      if (match) {
        newPart = match
      }
    })
    if (newPart) {
      this.itemStatsState.setValue(newPart)
    }
    this.weightState.setValue(weightForShip(this.ship))
  }
  setSection(section: string) {
    this.currentSectionState.setValue(section)
    this.inventoryState.setValue(this.inventory()[section])
  }
  sections(): {
    [section: string]: ShipCustomizerViewModel.Slot[]
  } {
    let id = 5000
    return Object.entries(this.ship.structure).reduce((sections, sectionEntry) => {
      const [sectionName, section] = sectionEntry
      const gunSlots = (section.gunMounts ?? []).map((mount, index) => {
        const gun = Guns[mount.base?.type ?? ""]
        return {
          id: id++,
          slot: "Gun",
          name: gun?.name ?? "EMPTY",
          base: mount.base,
          section: sectionName,
          index,
        }
      })
      const missileSlots = (section.weaponMounts ?? []).map((mount, index) => {
        const weapon = Weapons[mount.base?.type ?? ""]
        return {
          id: id++,
          slot: "Weapon",
          name: weapon?.name,
          base: mount.base,
          section: sectionName,
          index,
        }
      })
      const utilitySlots = (section.utilityMounts ?? []).map((utility, index) => {
        return {
          id: id++,
          slot: "Utility",
          name: utility.utility?.name ?? "EMPTY",
          base: utility.utility,
          section: sectionName,
          index,
        }
      })
      const partSlots = section.slots.reduce((parts, slot, index) => {
        switch (slot) {
          case "Afterburner": {
            parts.push({
              id: id++,
              slot,
              name: this.ship.afterburnerSlot.modifier?.name ?? "Standard",
              base: this.ship.afterburnerSlot.base,
              modifier: this.ship.afterburnerSlot.modifier,
              section: sectionName,
              index,
            })
            break
          }
          case "Engine": {
            parts.push({
              id: id++,
              slot,
              name: this.ship.engineSlot.modifier?.name ?? "Standard",
              base: this.ship.engineSlot.base,
              modifier: this.ship.engineSlot.modifier,
              section: sectionName,
            })
            break
          }
          case "FuelTank": {
            parts.push({
              id: id++,
              slot,
              name: this.ship.fuelTankSlot.modifier?.name ?? "Standard",
              base: this.ship.fuelTankSlot.base,
              modifier: this.ship.fuelTankSlot.modifier,
              section: sectionName,
            })
            break
          }
          case "PowerPlant": {
            parts.push({
              id: id++,
              slot,
              name: this.ship.powerPlantSlot.modifier?.name ?? "Standard",
              base: this.ship.powerPlantSlot.base,
              modifier: this.ship.powerPlantSlot.modifier,
              section: sectionName,
            })
            break
          }
          case "Radar": {
            parts.push({
              id: id++,
              slot,
              name: "Standard",
              base: this.ship.radarSlot.base,
              modifier: this.ship.radarSlot,
              section: sectionName,
            })
            break
          }
          case "Shields": {
            parts.push({
              id: id++,
              slot,
              name: this.ship.shieldsSlot.modifier?.name ?? "Standard",
              base: this.ship.shieldsSlot.base,
              modifier: this.ship.shieldsSlot.modifier,
              section: sectionName,
            })
            break
          }
          case "Thruster": {
            parts.push({
              id: id++,
              slot,
              name: this.ship.thrustersSlot.modifier?.name ?? "Standard",
              base: this.ship.thrustersSlot.base,
              modifier: this.ship.thrustersSlot.modifier,
              section: sectionName,
            })
            break
          }
        }
        return parts
      }, [] as any[])
      const parts = [...gunSlots, ...missileSlots, ...utilitySlots, ...partSlots]
      sections[sectionName] = parts
      return sections
    }, {} as any)
  }
  armor(): {
    [section: string]: { armor: number; maxArmor: number }
  } {
    return Object.entries(this.ship.structure).reduce((sections, sectionEntry) => {
      const [sectionName, section] = sectionEntry
      sections[sectionName] = {
        armor: section.armor ?? 0,
        maxArmor: section.maxArmor ?? 0,
      }
      return sections
    }, {})
  }

  partDetails(
    value:
      | UtilityMounts
      | GunMounts
      | WeaponMounts
      | { slot: "Gun" | "Weapon"; item: Gun; tierIdx: number }
      | { modifier: ModifierDetails }
  ): [string, string][] {
    let part
    let tier
    let affix
    let mount = value as UtilityMounts | GunMounts | WeaponMounts
    let anyValue = value as any
    /// slots on ship
    if (anyValue.slot == "Gun") {
      part = Guns[anyValue.base.type]
      tier = part.tiers[anyValue.base.tier ?? 1]
      part = { ...part, ...tier }
      affix = anyValue.base.affix
    } else if (anyValue.slot == "Weapon") {
      part = Weapons[anyValue.base.type]
    } else if (anyValue.slot == "Utility") {
      part = anyValue.base?.item
    }
    /// mounts in inventory
    else if (mount.mountType == "GunMount") {
      part = Guns[mount.base.type]
      tier = Guns[mount.base.type].tiers[mount.base.tier ?? 0]
    } else if (mount.mountType == "UtilityMount") {
      part = mount.utility
    } else if (mount.mountType == "WeaponMount") {
      part = Weapons[mount.base.type]
    } else {
      if (anyValue.tierIdx != undefined) {
        part = anyValue.item
        tier = part.tiers[anyValue.tierIdx]
        part = { ...part, ...tier }
        affix = anyValue.affix
      } else {
        part = anyValue.item ?? anyValue.modifier
      }
    }
    console.log("part", part)
    const modifierString = (mod: ComponentModifier | number, unit?: string): string => {
      if (typeof mod == "number") {
        return `${mod}`
      }
      let value = `${mod.value}`
      if (mod.percent) {
        value = `${mod.value * 100}%`
      }
      return unit ? `${value} ${unit}` : `${value}`
    }
    const details: [string, string][] = []
    // if (part?.class) details.push(["Class", `${part.class}`])
    if (affix) details.push(["Class", `${value.tier ?? affix.name}`])
    if (part?.cost) details.push(["Cost", `${part.cost}c`])
    if (part?.weight) details.push(["Weight", `${part.weight}t`])
    if (part?.health) details.push(["Health", modifierString(part.health)])
    /// modifiers
    if (part?.fuelConsumeRate) details.push(["Fuel Rate", modifierString(part.fuelConsumeRate)])
    if (part?.energyDrain) details.push(["Energy Drain", modifierString(part.energyDrain)])
    if (part?.powerMaxCapacity) details.push(["Energy Max", modifierString(part.powerMaxCapacity)])
    if (part?.extraEnergy) details.push(["Energy+", modifierString(part.extraEnergy)])
    if (part?.powerRechargeRate) details.push(["Energy Recharge Rate", modifierString(part.powerRechargeRate)])
    if (part?.shieldRechargeRate) details.push(["Shield Recharge Rate", modifierString(part.shieldRechargeRate)])
    if (part?.engineAccelleration) details.push(["Accell.", modifierString(part.engineAccelleration)])
    if (part?.afterburnerAccelleration) details.push(["Aft. Accell.", modifierString(part.afterburnerAccelleration)])
    if (part?.cruiseSpeed) details.push(["Cruise Speed.", modifierString(part.cruiseSpeed)])
    if (part?.maxSpeed) details.push(["Max Speed", modifierString(part.maxSpeed)])
    if (part?.fore) details.push(["Fore Shields", modifierString(part.fore)])
    if (part?.aft) details.push(["Aft Shields", modifierString(part.aft)])
    if (part?.extraShields) details.push(["Shields+", modifierString(part.extraShields)])
    if (part?.roll) details.push(["Roll", modifierString(part.roll)])
    if (part?.yaw) details.push(["Yaw", modifierString(part.yaw)])
    if (part?.pitch) details.push(["Pitch", modifierString(part.pitch)])
    if (part?.breakingForce) details.push(["Breaking Force", modifierString(part.breakingForce)])
    if (part?.breakingLimit) details.push(["Breaking Limit", modifierString(part.breakingLimit)])
    if (part?.fuelCapacity) details.push(["Max Fuel", modifierString(part.fuelCapacity)])
    if (part?.extraFuel) details.push(["Fuel+", modifierString(part.extraFuel)])
    if (part?.ammoCount) details.push(["Rounds", `${part.ammoCount}`])
    /// guns
    if (part?.ammo) details.push(["Ammo", `${part.ammo}`])
    if (part?.ammoPerBin) details.push(["Ammo/Bin", `${part.ammoPerBin}`])
    if (part?.tier) details.push(["Tier", `${part.tier}`])
    /// weapons
    if (part?.timeToLock) details.push(["Lock", `${(part.timeToLock / 1000).toFixed(1)}s`])

    if (affix?.damage) {
      details.push([
        "DMG",
        `${part.damage}*${modifierString(affix.damage)}=${applyModifier(part.damage, affix.damage)}`,
      ])
    } else {
      if (part?.damage) details.push(["DMG", `${part.damage}`])
    }
    if (affix?.delay) {
      details.push(["Delay", `${part.delay}*${modifierString(affix.delay)}=${applyModifier(part.delay, affix.delay)}`])
    } else {
      if (part?.delay) details.push(["Delay", `${part.delay}`])
    }
    if (affix?.energy) {
      details.push([
        "Energy",
        `${part.energy}*${modifierString(affix.energy)}=${applyModifier(part.energy, affix.energy)}`,
      ])
    } else {
      if (part?.energy) details.push(["Energy", `${part.energy}`])
    }
    if (affix?.range) {
      details.push(["Range", `${part.range}*${modifierString(affix.range)}=${applyModifier(part.range, affix.range)}`])
    } else {
      if (part?.range) details.push(["Range", `${part.range}`])
    }
    if (affix?.speed) {
      details.push(["Speed", `${part.speed}*${modifierString(affix.speed)}=${applyModifier(part.speed, affix.speed)}`])
    } else {
      if (part?.speed) details.push(["Speed", `${part.speed}`])
    }
    // console.log(details)
    return details
  }

  inventory() {
    let uid = 100
    return {
      Guns: allGunSelections().map((gs) => {
        const [id, name, tier] = itemSelectionNameParts(gs)
        const gun = Guns[gs.type] as Gun
        const affix = gs.affix != undefined ? GunAffixs[gs.affix] : undefined
        return {
          id: uid++ + "." + id,
          item: gun,
          affix,
          name,
          tier,
          tierIdx: gs.tier,
        }
      }),
      Weapons: Object.entries(Weapons).map((wp) => {
        const [id, name, tier] = itemSelectionNameParts(wp[1])
        return {
          id: uid++ + "." + id,
          item: wp[1],
          name,
          tier,
        }
      }),
      Comps: this.components().flatMap((cat) => {
        return cat.parts.map((partEntity) => {
          const [_, part] = partEntity
          return {
            id: uid++ + "." + cat + "." + part.id,
            item: part,
            name: part.name,
          }
        })
      }),
    }
  }

  components() {
    return [
      {
        id: "Afterburner" as ComponentType,
        title: `-= Afterburners =-`,
        parts: Object.entries(Afterburners),
        slot: "afterburnerSlot",
      },
      {
        id: "Engine" as ComponentType,
        title: `-= Engines =-`,
        parts: Object.entries(Engines),
        slot: "engineSlot",
      },
      {
        id: "Shields" as ComponentType,
        title: `-= Shields =-`,
        parts: Object.entries(Shields),
        slot: "shieldsSlot",
      },
      {
        id: "PowerPlant" as ComponentType,
        title: `-= Power Plant =-`,
        parts: Object.entries(PowerPlants),
        slot: "powerPlantSlot",
      },
      {
        id: "Thruster" as ComponentType,
        title: `-= Thrusters =-`,
        parts: Object.entries(Thrusters),
        slot: "thrustersSlot",
      },
      {
        id: "FuelTank" as ComponentType,
        title: `-= Fuel Tanks =-`,
        parts: Object.entries(FuelTanks),
        slot: "fuelTankSlot",
      },
      {
        id: "Utility" as ComponentType,
        title: `-= Utilities =-`,
        parts: Object.entries(Utilities),
        slot: "",
      },
      {
        id: "Utility" as ComponentType,
        title: `-= Ammo =-`,
        parts: Object.entries(allAmmos()),
        slot: "",
      },
    ]
  }
}

export class ShipCustomizerRetroScreen extends MercScreen {
  ship: ShipTemplate
  vm: ShipCustomizerViewModel
  crt: CRTScreenGfx
  observers = new Set<Observer<any>>()

  onSelected: (ship: ShipTemplate) => void
  onBack: () => void

  constructor(ship: ShipTemplate) {
    super("ShipCustomizer")
    this.ship = ship
    this.vm = new ShipCustomizerViewModel(this.ship)

    // this.gui.dispose()
    // this.crt = new CRTScreenGfx()
    // this.gui = this.crt.gui
    this.setupMain()
  }
  dispose(): void {
    for (let item of this.observers) {
      let observer = item as Observer<unknown>
      observer.remove()
    }
    this.observers.clear()
    this.screen.dispose()
    if (this.crt) {
      this.crt.dispose()
    }
    super.dispose()
  }

  cellHeight: number
  cellWidth: number
  fontSize: number
  fontWidth: number
  widthRatio: number

  private styleText = (tb: GUI.TextBlock, color: string) => {
    tb.fontFamily = "KongfaceRegular"
    tb.fontSize = `${this.fontSize}px`
    tb.color = color
    const tbe = TextBlockExtra.isExtra(tb)
    if (tbe) {
      tbe.letterWidthInPixels = this.cellWidth
    }
    tb.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    tb.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    tb.textVerticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER
    tb.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
  }

  private styleLabel = (tb: GUI.TextBlock) => {
    this.styleText(tb, RetroGui.colors.foreground)
  }
  private styleValue = (tb: GUI.TextBlock) => {
    this.styleText(tb, RetroGui.colors.regular)
  }
  private styleBox = (r: GUI.Rectangle) => {
    r.color = RetroGui.colors.foreground
    r.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    r.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    r.isHitTestVisible = false
  }
  private Label = (row: number, col: number, label: string) => {
    const text = `${label}`
    return new FluentTextBlockExtra(label, text)
      .modifyControl(this.styleLabel)
      .retroGridMoveTo(row, col, text.length, 1)
  }
  private Value = (row: number, col: number, label: string) => {
    const text = `${label}`
    return new FluentTextBlockExtra(label, text)
      .modifyControl(this.styleValue)
      .retroGridMoveTo(row, col, text.length, 1)
  }
  private wordWrap(text: string, width: number): string[] {
    const words = text.split(/\s+/) // Split the text into words based on whitespace
    const lines: string[] = []
    let currentLine = ""

    for (const word of words) {
      if ((currentLine + word).length > width) {
        if (currentLine) {
          lines.push(currentLine.trim()) // Add the current line to the array
        }
        currentLine = word // Start a new line with the current word
      } else {
        currentLine += (currentLine ? " " : "") + word // Append the word to the current line
      }
    }

    if (currentLine) {
      lines.push(currentLine.trim()) // Push the last line
    }

    return lines
  }
  private Inverted = (
    color: string,
    row: number,
    col: number,
    label: string,
    width?: number,
    multiLine?: (height: number) => void
  ) => {
    const text = `  ${label}`
    const tb = new Ref<GUI.TextBlock>()
    let rows = [text]
    if (width && multiLine) {
      rows = this.wordWrap(text, width)
      multiLine(rows.length)
    }
    return new FluentContainer(
      "inverted " + label,
      (() => {
        const controls = []
        const rows = this.wordWrap(text, width)
        rows.forEach((row, idx) => {
          controls.push(
            new FluentTextBlockExtra(label, row)
              .modifyControl((tbe: TextBlockExtra) => {
                this.styleText(tbe, RetroGui.colors.background)
              })
              .retroGridMoveTo(idx, 0, width, 1)
          )
        })
        return controls
      })()
    ).modifyControl((c) => {
      c.background = color //RetroGui.colors.foreground
      RetroGui.Grid.moveControl(c, row, col, width ? width : text.length, rows.length)
    })
  }
  private LabelValue = (row: number, col: number, label: string, value: string) => {
    const text = `${label}: ${value}`
    return new FluentTextBlockExtra(label, text).modifyControl((tbe: TextBlockExtra) => {
      this.styleText(tbe, RetroGui.colors.foreground)
      RetroGui.Grid.moveControl(tbe, row, col, text.length, 1)
      tbe.setAttribute(text.indexOf(value), value.length, RetroGui.colors.regular)
    })
  }
  private Button = (text: string, action: () => void) => {
    return new FluentSimpleButton(`${text} button`, `${text}`)
      .textBlock((tb) => {
        tb.modifyControl(this.styleLabel)
      })
      .onPointerClick(() => {
        action()
      })
      .modifyControl((b: any) => {
        RetroGui.Components.configureButton(b)
      })
  }
  private ButtonNaked = (text: string, action: () => void) => {
    return new FluentSimpleButton(`${text} button`, `${text}`)
      .textBlock((tb) => {
        tb.modifyControl(this.styleLabel)
      })
      .onPointerClick(() => {
        action()
      })
      .modifyControl((b: any) => {
        RetroGui.Components.configureNakedButton(b)
      })
  }

  fc = 1
  sc = 26
  statsStartRow = 7
  statsHeight = 5
  windowStartRow = 6
  windowHeight = 19

  setupMain(): void {
    RetroGui.Grid.reset()
    RetroGui.Grid.initialize(25, 53, 1920, 1080)
    this.gui.idealWidth = 1920

    this.widthRatio = this.gui.idealWidth / AppContainer.instance.engine.getRenderWidth()
    this.observers.add(
      AppContainer.instance.engine.onResizeObservable.add(() => {
        this.widthRatio = this.gui.idealWidth / AppContainer.instance.engine.getRenderWidth()
      })
    )
    this.cellHeight = RetroGui.Grid.getGridCellHeight()
    this.cellWidth = RetroGui.Grid.getGridCellWidth()
    this.fontSize = Math.floor(this.cellHeight / 5) * 5
    this.fontWidth = RetroGui.Grid.getTextWidth("A", `${this.fontSize}px monospace`)
    this.screen.dispose()
    this.screen = new FluentContainer(
      "screen",
      // this.Borders(),
      this.Header(),
      this.ShipStats(),
      this.ItemStats(),
      this.ShipSlots(),
      this.Inventory()
    )
      .background(RetroGui.colors.background)
      .build()
    this.screen.isPointerBlocker = true
    this.screen.isHitTestVisible = false
    this.gui.addControl(this.screen)
  }

  private Header = () => {
    return [
      new FluentTextBlockExtra("title", "-= SHIP MANAGEMENT =-")
        .color(RetroGui.colors.foreground)
        .modifyControl((tb) => {
          this.styleText(tb, RetroGui.colors.foreground)
          RetroGui.Grid.moveControl(tb, 0, 0, 34, 1)
        }),
      new FluentSimpleButton("done button", "BACK")
        .textBlock((tb) => {
          tb.modifyControl(this.styleLabel)
        })
        .onPointerClick(() => {
          this.dispose()
          if (this.onBack) {
            this.onBack()
          } else {
            AppContainer.instance.gameScene = new MainMenuScene()
          }
        })
        .modifyControl((b: any) => {
          RetroGui.Grid.moveControl(b, 0, 30, 8, 1)
          RetroGui.Components.configureButton(b)
        }),
      new FluentSimpleButton("continue button", "CONTINUE")
        .textBlock((tb) => {
          tb.modifyControl(this.styleLabel)
        })
        .onPointerClick(() => {
          if (this.onSelected) {
            this.onSelected(this.vm.ship)
          }
        })
        .modifyControl((b: any) => {
          RetroGui.Grid.moveControl(b, 0, 39, 15, 1)
          RetroGui.Components.configureButton(b)
        }),
      new FluentRectangle("screen").thickness(this.cellWidth / 8).modifyControl((r) => {
        this.styleBox(r)
        RetroGui.Grid.moveControlMidCell(r, 1, 0, 0, 24)
      }),
    ]
  }

  private ShipStats = () => {
    const fc = this.fc
    const sc = this.sc
    const Value = this.Value
    const Label = this.Label
    const LabelValue = this.LabelValue
    const Inverted = this.Inverted

    return [
      LabelValue(2, fc, "Ship", this.ship.name),
      LabelValue(2, sc, "Class", this.ship.weightClass),
      LabelValue(3, fc, "Cruise Speed", `${this.ship.engineSlot.base.cruiseSpeed.toFixed(0)} MPS`),
      LabelValue(3, sc, "Max Speed", `${this.ship.afterburnerSlot.base.maxSpeed.toFixed(0)} MPS`),
      LabelValue(4, fc, "Weight", `${this.vm.weightState.getValue()}/${this.ship.maxWeight} t.`).bindState(
        this.vm.weightState,
        (l, weight) => {
          const text = `Weight: ${weight}/${this.ship.maxWeight} t.`
          const value = `${weight}/${this.ship.maxWeight}`
          l.setText(text).modifyControl((tbe: TextBlockExtra) => {
            tbe.clearAttributes()
            tbe.setAttribute(text.indexOf(value), value.length, RetroGui.colors.regular)
          })
        }
      ),
      Label(4, sc, "Pitch/Yaw/Roll:"),
      Value(
        4,
        sc + "Pitch/Yaw/Roll".length + 2,
        `${this.ship.thrustersSlot.base.pitch}/${this.ship.thrustersSlot.base.yaw}/${this.ship.thrustersSlot.base.roll}`
      ),
      // LabelValue(4, fc + 14, "Pitch", `${this.ship.thrustersSlot.base.pitch}`),
      // LabelValue(4, sc, "Yaw", `${this.ship.thrustersSlot.base.yaw}`),
      // LabelValue(4, sc + 9, "Roll", `${this.ship.thrustersSlot.base.roll}`),
      LabelValue(5, fc, "Shields Fore", `${this.ship.shieldsSlot.base.fore}`),
      LabelValue(5, sc, "Shields Aft", `${this.ship.shieldsSlot.base.aft}`),
      new FluentRectangle("ship stats border").thickness(this.cellWidth / 8).modifyControl((r) => {
        this.styleBox(r)
        RetroGui.Grid.moveControlMidCell(r, 1, 0, 0, 6)
      }),
    ]
  }
  private ItemStats = () => {
    const Label = this.Label
    const LabelValue = this.LabelValue
    const labelText = (name?: string | undefined) => `+PART STATS: ${name ?? ""}+`
    const statsContainer = new Ref<GUI.Container>()
    let toolTip = new Ref<GUI.Container>()

    const TitleLabel = () => {
      return Label(0, 1, `part name`)
        .width(30 * this.cellWidth)
        .bindState(this.vm.itemStatsState, (tb, value: any | undefined) => {
          tb.setText(labelText(value?.name))
          let width = 50
          if (value?.slot && value?.name.length > 20) {
            width = 28
          }
          tb.modifyControl((tbe: TextBlockExtra) => {
            if (value?.name) {
              tbe.clearAttributes()
              tbe.widthInPixels = width * this.cellWidth
              tbe.setAttribute(tbe.text.indexOf(value.name), value.name.length, RetroGui.colors.regular)
            }
          })
        })
        .onPointerEnter(() => {
          statsContainer.get().addControl(
            this.Inverted(RetroGui.colors.regular, 1, 13, `${this.vm.itemStatsState.getValue()?.name ?? ""}`)
              .storeIn(toolTip)
              .build()
          )
        })
        .onPointerOut(() => {
          let toolTipContainer = toolTip.get()
          if (toolTipContainer) {
            toolTipContainer.dispose()
            toolTip = new Ref<GUI.Container>()
          }
        })
    }
    const SlotLabel = () => {
      return Label(0, 30, `Slot`)
        .width(25 * this.cellWidth)
        .bindState(this.vm.itemStatsState, (tb, value: any | undefined) => {
          if (value?.slot) {
            tb.show()
              .setText(`Assign: ${value?.slot}`)
              .modifyControl((tbe: TextBlockExtra) => {
                RetroGui.Grid.moveControl(tbe, 0, Math.min(30, value.name.length + 16))
                tbe.clearAttributes()
                tbe.setAttribute(
                  tbe.text.indexOf(value.slot),
                  value.slot.length,
                  CompColors[value.slot] ?? RetroGui.colors.regular
                )
              })
          } else {
            tb.hide()
          }
        })
    }
    const Close = () => {
      return new FluentSimpleButton("close button", "X")
        .textBlock((tb) => {
          tb.modifyControl(this.styleLabel)
        })
        .onPointerClick(() => {
          this.vm.itemStatsState.setValue(null)
        })
        .modifyControl((b: any) => {
          RetroGui.Grid.moveControl(b, 0, 49, 3, 1)
          RetroGui.Components.configureButton(b)
        })
        .zIndex(5)
      // return Label(0, 49, `[X]`)
      //   .width(3 * this.cellWidth)
      //   .onPointerClick(() => {
      //     this.vm.itemStatsState.setValue(null)
      //   })
    }
    return new FluentContainer(
      "Item Stats Container",
      TitleLabel(),
      SlotLabel(),
      Close(),
      new FluentContainer("Item Stats")
        .bindState(this.vm.itemStatsState, (c, value: any | undefined) => {
          c.clear()
          if (value == null) {
            return
          }
          let row = 1
          let col = 1
          c.addControl(
            this.vm.partDetails(value).map(([partLabel, partValue]) => {
              let nextCol = col + partLabel.length + partValue.length
              if (nextCol >= 50) {
                col = 1
                row += 1
              }
              const component = LabelValue(row, col, partLabel, `${partValue}`)
              col = col + partLabel.length + partValue.length + 5
              return component
            })
          )
          this.statsHeight = row + 2
        })
        .hitTestVisible(false)
    )
      .storeIn(statsContainer)
      .retroGridMoveTo(this.statsStartRow, 0, 53, this.statsHeight)
      .bindState(this.vm.itemStatsState, (c, value: any | undefined) => {
        if (value === null) {
          c.hide()
          this.windowStartRow = 6
          this.windowHeight = 19
        } else {
          c.show()
          this.windowStartRow = 6 + this.statsHeight
          this.windowHeight = 19 - this.statsHeight
        }
      })
      .hitTestVisible(false)
      .hide()
  }

  hitTest(root: GUI.Container, x: number, y: number): GUI.Control[] {
    const hits: GUI.Control[] = []
    const queue: GUI.Control[] = [root]
    while (queue.length > 0) {
      const control = queue.shift()
      const isVisible = control.isVisible
      const isHit = control.contains(x, y)
      const isPickable = control.isHitTestVisible
      if (isVisible && isHit) {
        if (isPickable) {
          hits.push(control)
        }
        if (control instanceof GUI.Container) {
          queue.push(...control.children)
        }
      }
    }
    return hits
  }

  private partProxy(name: string, slot: string): GUI.Container {
    return this.Inverted(CompColors[slot] ?? RetroGui.colors.regular, 0, 0, name, 20, () => {}).build()
  }

  private ShipSlots = () => {
    const fc = this.fc
    const sc = this.sc
    const Value = this.Value
    const Label = this.Label
    const LabelValue = this.LabelValue
    const Inverted = this.Inverted

    const scrollviewRef = new Ref<GUI.ScrollViewer>()

    return new FluentContainer(
      "Ship Slots Window",
      new FluentRectangle("Ship Slots Border")
        .thickness(this.cellWidth / 8)
        .modifyControl(this.styleBox)
        .bindState(this.vm.itemStatsState, (r) => {
          r.retroGridBorder(0, 0, 22, this.windowHeight)
        }),
      Label(1, fc, "+Ship Sections+".toUpperCase()),
      new FluentScrollViewer(
        "sections",
        new FluentContainer("section container").bindState(this.vm.shipState, (container, ship) => {
          container
            .clear()
            .addControl(
              (() => {
                let row = 0
                return Object.entries(ship).flatMap((sectionEntry) => {
                  const [sectionName, partList] = sectionEntry
                  const heading = Label(row++, fc, `${sectionName.toUpperCase()}:`)
                  let armor: FluentControl<any, any>[] = [] as any
                  if (sectionName != "core") {
                    armor.push(
                      Label(row, fc, `Armor`),
                      this.ButtonNaked(`⬆`, () => {
                        this.vm.addArmor(1, sectionName)
                      }).retroGridMoveTo(row, fc + 6, 1, 1),
                      this.ButtonNaked(`⬇`, () => {
                        this.vm.addArmor(-1, sectionName)
                      }).retroGridMoveTo(row, fc + 7, 1, 1),
                      Value(row++, fc + 9, `||`).bindState(this.vm.armorState, (armorLabel, armorSections) => {
                        armorLabel
                          .setText(
                            `${armorSections[sectionName].armor.toFixed(0)} / ${armorSections[
                              sectionName
                            ].maxArmor.toFixed(0)}`
                          )
                          .width(18 * this.cellWidth)
                      })
                    )
                  }
                  const parts = partList.flatMap((part) => {
                    let slotType = part.slot
                    if (slotType == "Gun Mount") slotType = "Gun"
                    if (slotType == "Weapon Mount") slotType = "Weapon"
                    let selected = false
                    return [
                      Value(row++, fc + 1, `${part.slot}:`),
                      Value(row, 0, "⮕").bindState(this.vm.itemStatsState, (c, newPart) => {
                        if (newPart !== null && part.id == newPart.id) {
                          c.color(CompColors[slotType] ?? RetroGui.colors.foreground).show()
                        } else {
                          c.color(RetroGui.colors.foreground).hide()
                        }
                      }),
                      Inverted(
                        CompColors[slotType] ?? RetroGui.colors.foreground,
                        row++,
                        fc,
                        part.name,
                        17,
                        (height) => (row += height - 1)
                      )
                        .modifyControl((container) => {
                          container.metadata = {
                            slot: part,
                            id: part.id,
                          }
                        })
                        .onPointerClick((c, e, s) => {
                          let currentPart = this.vm.itemStatsState.getValue()
                          let nextPart = currentPart == null || currentPart.id != part.id ? part : null
                          this.vm.itemStatsState.setValue(nextPart)
                        })
                        .onPointerDown((c, e, s) => {
                          c.modifyControl((container) => {
                            setTimeout(() => {
                              let surrogate: GUI.Container = this.partProxy(part.name, part.slot)
                              surrogate.topInPixels = e.y * this.widthRatio - surrogate.heightInPixels / 2
                              surrogate.leftInPixels = e.x * this.widthRatio - surrogate.widthInPixels / 2
                              surrogate.isHitTestVisible = false
                              this.screen.addControl(surrogate)
                              // you can then multiply the position returned by babylon by the ratios below to get the real position,
                              const follow = this.screen.onPointerMoveObservable.add((e, s) => {
                                surrogate.top = e.y * this.widthRatio - surrogate.heightInPixels / 2
                                surrogate.left = e.x * this.widthRatio - surrogate.widthInPixels / 2
                              })
                              this.screen.onPointerUpObservable.addOnce((e, s) => {
                                follow.remove()
                                surrogate.dispose()
                                const hits = this.hitTest(this.screen, e.x, e.y)
                                if (hits.some((hit) => hit.name.includes("Inventory"))) {
                                  this.vm.removePart(part.base, part)
                                }
                              })
                            }, 1)
                          })
                        }),
                    ]
                  })
                  return [heading, armor, ...parts].flat().filter((l) => l !== undefined) as FluentControl<any, any>[]
                })
              })()
            )
            .growHeight(this.widthRatio)
        })
      )
        .storeIn(scrollviewRef)
        .modifyControl((sp) => (sp.thickness = 0))
        .retroGridMoveTo(2, 1, 20, this.windowHeight - 3)
        .setBarBackground(RetroGui.colors.shadow)
        .setBarColor(RetroGui.colors.foreground)
        .setBarSize(RetroGui.Grid.getGridCellWidth())
        .setWheelPrecision(0.01)
    ).bindState(this.vm.itemStatsState, (sv) => {
      sv.retroGridMoveTo(this.windowStartRow, 0, 22, this.windowHeight)
      RetroGui.Grid.moveControl(scrollviewRef.get(), 2, 1, 20, this.windowHeight - 3)
    })
  }

  // private Borders = () => {
  //   return [
  //     new FluentTextBlockExtra("TopBorder")
  //       .modifyControl(this.styleLabel)
  //       .setText("╔" + "═".repeat(51) + "╗")
  //       .retroGridMoveTo(1, 0, 53, 1),
  //     new FluentTextBlockExtra("BottomBorder")
  //       .modifyControl(this.styleLabel)
  //       .setText("╚" + "═".repeat(51) + "╝")
  //       .retroGridMoveTo(24, 0, 53, 1),
  //     new FluentTextBlockExtra("LeftBorder")
  //       .modifyControl(this.styleLabel)
  //       .setText("║\r\n".repeat(22))
  //       .retroGridMoveTo(2, 0, 1, 22),
  //     new FluentTextBlockExtra("LeftBorder")
  //       .modifyControl(this.styleLabel)
  //       .setText("║\r\n".repeat(22))
  //       .retroGridMoveTo(2, 52, 1, 22),
  //   ]
  // }
  private Inventory = () => {
    const fc = this.fc
    const sc = this.sc
    const Value = this.Value
    const Label = this.Label
    const LabelValue = this.LabelValue
    const Inverted = this.Inverted

    const scrollviewRef = new Ref<GUI.ScrollViewer>()

    const border = new FluentRectangle("Inv Win Border")
      .thickness(this.cellWidth / 8)
      .modifyControl(this.styleBox)
      .bindState(this.vm.itemStatsState, (sv) => {
        sv.retroGridBorder(this.windowStartRow, 21, 32, this.windowHeight)
      })
      .hitTestVisible(false)
      .zIndex(0)
    return [
      border,
      new FluentContainer(
        "Inventory Window",
        [
          // new FluentRectangle("Inv Win Border")
          //   .thickness(this.cellWidth / 8)
          //   .modifyControl(this.styleBox)
          //   .retroGridBorder(0, -1, 32, this.windowHeight),
          Label(1, 0, "+Inventory+".toUpperCase()),
          /// segmented control
          (() => {
            let sectionOffset = 0
            return Object.entries(this.vm.inventory()).flatMap((sectionEntry) => {
              const [sectionName, partList] = sectionEntry
              const headingButton = new FluentSimpleButton(`${sectionName} button`, `${sectionName}`)
                .textBlock((tb) => {
                  tb.modifyControl(this.styleLabel)
                })
                .onPointerClick(() => {
                  this.vm.setSection(sectionName)
                })
                .modifyControl((b: any) => {
                  RetroGui.Grid.moveControl(b, 2, sectionOffset, sectionName.length + 5, 1)
                  RetroGui.Components.configureButton(b)
                })
              sectionOffset += sectionName.length + 5
              return [headingButton]
            })
          })(),
          /// inventory
          new FluentScrollViewer(
            "inventory",
            new FluentContainer("inventory container").bindState(this.vm.inventoryState, (container, inventory) => {
              const parts = inventory as any as {
                id: string
                item: GunSelection | Weapon
                name: string
                tier?: string
              }[]
              console.dir(parts, { depth: 100 })
              let row = 1
              let rows = parts.flatMap((p) => {
                // const partName = itemSelectionNameParts(p.item as any)
                const currentItem = this.vm.itemStatsState.getValue() as any
                const selected = currentItem?.id == p.id
                const onClick = () => {
                  const itemStats = this.vm.itemStatsState.getValue()
                  if (itemStats?.id == p.id) {
                    this.vm.itemStatsState.setValue(null)
                  } else {
                    if (itemStats?.slot != undefined && itemStats.slot == p.item.type) {
                      this.vm.addPart(p, itemStats)
                    } else {
                      this.vm.itemStatsState.setValue(p)
                    }
                  }
                }
                const itemRow = [
                  Label(row++, 0, ` ${p.name}`)
                    .onPointerClick(onClick)
                    .bindState(this.vm.itemStatsState, (label, value: any) => {
                      if (value?.id == p.id) {
                        label.setText(`>${p.name}`)
                      } else {
                        if (this.vm.itemStatsState.getValue()?.id == p.id) {
                          label.setText(` ${p.name}`)
                        }
                      }
                    })
                    .color(CompColors[p.item.type] ?? RetroGui.colors.foreground)
                    .onPointerDown((c, e, s) => {
                      c.modifyControl((container) => {
                        setTimeout(() => {
                          let surrogate: GUI.Container = this.partProxy(p.name, p.item.type)
                          surrogate.topInPixels = e.y * this.widthRatio - surrogate.heightInPixels / 2
                          surrogate.leftInPixels = e.x * this.widthRatio - surrogate.widthInPixels / 2
                          surrogate.isHitTestVisible = false
                          this.screen.addControl(surrogate)
                          // you can then multiply the position returned by babylon by the ratios below to get the real position,
                          const follow = this.screen.onPointerMoveObservable.add((e, s) => {
                            surrogate.top = e.y * this.widthRatio - surrogate.heightInPixels / 2
                            surrogate.left = e.x * this.widthRatio - surrogate.widthInPixels / 2
                          })
                          this.screen.onPointerUpObservable.addOnce((e, s) => {
                            follow.remove()
                            surrogate.dispose()
                            const hits = this.hitTest(this.screen, e.x, e.y)
                            // console.log(hits)
                            const slot: GUI.Container = hits.find((hit) => hit.metadata?.slot != undefined) as any
                            if (slot && slot.metadata.slot.slot == p.item.type) {
                              this.vm.addPart(p, slot.metadata.slot)
                            }
                          })
                        }, 1)
                      })
                    }),
                ]
                if (p.tier) {
                  itemRow.push(Value(row++, 1, " └" + p.tier).onPointerClick(onClick))
                }
                return itemRow
              })
              container
                .clear()
                .addControl(rows)
                .height(`${row * this.cellHeight}px`)
            })
          )
            .storeIn(scrollviewRef)
            .retroGridMoveTo(3, 0, 30, this.windowHeight - 4)
            .modifyControl((sp) => (sp.thickness = 0))
            .setBarBackground(RetroGui.colors.shadow)
            .setBarColor(RetroGui.colors.foreground)
            .setBarSize(RetroGui.Grid.getGridCellWidth())
            .setWheelPrecision(0.01),
        ].flat()
      )
        .bindState(this.vm.itemStatsState, (sv) => {
          sv.retroGridMoveTo(this.windowStartRow, 22, 30, this.windowHeight)
          RetroGui.Grid.moveControl(scrollviewRef.get(), 3, 0, 30, this.windowHeight - 4)
        })
        .onPointerUp((c, e, s) => {
          console.log("on up in inventory")
        }),
    ]
  }

  update(dt: number) {
    if (this.crt) {
      this.crt.update(dt)
    }
  }
}

/**
we need a mockup for a text mode ui that is 25 rows by 53 cols for a ship management screen.
the ui can have scroll areas, tabbed areas, screen swap menu items, and other classic ux tools to fit a large complex set of info in a small area.
the ships have a stats that include: "name, class, weight, cruise speed, max speed, pitch, yaw, roll, shields fore, shields aft".
the player has an inventory of parts they can add to the ship, the categories of parts are: "guns, missiles, afterburner, engine, shields, power plant, thruster, fuel tank, utility, ammo".
when a player selects a part we should display the parts stats that include: "name, class, cost" and can include extra stats such as: "top speed", "recharge rate", "energy drain", and many more stats.
the players ship has  a list of sections: "Front, Core, Left, Right, Back". Each section has a variable list of "Slots" that match the part categories.  When a part is in a slot the part name should fill the slot. the player should be able to drag items from the inventory into the ship slot to equip it. the players should be able to drap the item off the ship to de-equip it. click on a part on the ship should show its stats.
there should be a place for going "back" to the previous screen and "continue" to the next screen
 */

/*
-= SHIP MANAGEMENT =-                         [Back] [Continue]
+---------------------------------------------------------+
| Ship: [Raptor Mk II]   Class: [Fighter]  Weight: [30T]  |
| Cruise Speed: [350]   Max Speed: [650]                 |
| Pitch: [45]   Yaw: [40]   Roll: [50]                   |
| Shields Fore: [100]   Shields Aft: [75]                |
+--------------------+------------------------------------+
| Ship Sections      | Inventory                        |
| Front:             | [Guns] [Missiles] [Afterburner]   |
|   Slot 1: EMPTY    | [Engine] [Shields] [Power Plant]  |
|   Slot 2: EMPTY    | [Thruster] [Fuel Tank] [Utility]  |
| Core:              | [Ammo]                           |
|   Slot 1: Reactor  |                                  |
| Left:              |                                  |
|   Slot 1: EMPTY    |                                  |
| Right:             |                                  |
|   Slot 1: EMPTY    |                                  |
| Back:              |                                  |
|   Slot 1: EMPTY    |                                  |
+--------------------+------------------------------------+
*/

/*
-= SHIP MANAGEMENT =-                         [Back] [Continue]
+---------------------------------------------------------+
| Ship: [Raptor Mk II]   Class: [Fighter]  Weight: [30T]  |
| Cruise Speed: [350]   Max Speed: [650]                 |
| Pitch: [45]   Yaw: [40]   Roll: [50]                   |
| Shields Fore: [100]   Shields Aft: [75]                |
+--------------------+------------------------------------+
| Ship Sections      | Inventory -> [Guns]              |
| Front:             |  1. Laser Cannon Mk I            |
|   Slot 1: EMPTY    |  2. Plasma Gun Mk II             |
|   Slot 2: EMPTY    |  3. Autocannon                   |
| Core:              |  4. Railgun                      |
|   Slot 1: Reactor  |  5. Blaster Mk III               |
| Left:              |                                  |
|   Slot 1: EMPTY    |  [Scroll: Up/Down]               |
| Right:             |                                  |
|   Slot 1: EMPTY    |                                  |
| Back:              |                                  |
|   Slot 1: EMPTY    |                                  |
+--------------------+------------------------------------+
*/

/*
-= SHIP MANAGEMENT =-                         [Back] [Continue]
+---------------------------------------------------------+
| Ship: [Raptor Mk II]   Class: [Fighter]  Weight: [30T]  |
| Cruise Speed: [350]   Max Speed: [650]                 |
| Pitch: [45]   Yaw: [40]   Roll: [50]                   |
| Shields Fore: [100]   Shields Aft: [75]                |
+--------------------+------------------------------------+
| Part Stats: Laser Cannon Mk I                         |
| Class: [GUN]     Cost: [5,000 CR]                     |
| Top Speed: [N/A]   Recharge Rate: [2/s]               |
| Energy Drain: [10/s]                                  |
| Damage: [25]    Range: [500]                          |
+--------------------+------------------------------------+
| Ship Sections      | Inventory -> [Guns]              |
| Front:             |                                  |
|   Slot 1: EMPTY    |                                  |
|   Slot 2: EMPTY    |                                  |
| Core:              |                                  |
|   Slot 1: Reactor  |                                  |
| Left:              |                                  |
|   Slot 1: EMPTY    |                                  |
| Right:             |                                  |
|   Slot 1: EMPTY    |                                  |
| Back:              |                                  |
|   Slot 1: EMPTY    |                                  |
+--------------------+------------------------------------+
*/
