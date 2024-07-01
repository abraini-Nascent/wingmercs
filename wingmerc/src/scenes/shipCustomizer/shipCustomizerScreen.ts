import { Utilities } from './../../data/components/utility';
import { Shields } from './../../data/components/shields';
import { Engines } from './../../data/components/engines';
import { AfterburnerModifierDetails, ComponentModifier, EngineModifierDetails, GunMounts, GunSelection, ModifierDetails, ShieldGeneratorModifierDetails, ShipTemplate, StructureSlotType, UtilityModifierDetails, UtilityMounts, WeaponMounts } from '../../data/ships/shipTemplate';
import { Color3, Observer, PointerEventTypes } from "@babylonjs/core";
import { Align, Edge, FlexContainer, FlexDirection, FlexItem, Gutter, Justify } from "../../utils/guiHelpers";
import { MercScreen } from "../screen";
import * as GUI from "@babylonjs/gui"
import { AppContainer } from "../../app.container";
import { SpaceCombatScene } from '../spaceCombat/spaceCombatLoop';
import { AfterburnerTypes, Afterburners } from '../../data/components/afterburners';
import { Gun, GunType } from '../../data/guns/gun';
import * as Guns from '../../data/guns';
import * as Weapons from '../../data/weapons';
import * as GunAffixes from '../../data/affixes/gunAffixes';
import { Weapon } from '../../data/weapons/weapon';
import { allGunSelections, gunSelectionName, applyModifier, allAmmos } from '../../world/factories';
import { GunAffix } from '../../data/affixes/gunAffix';


type ComponentType = "Afterburner" | "Engine" | "Radar" | "Shields" | "Thrusters" | "Utility";

export class ShipCustomizerScreen extends MercScreen {
  root: FlexContainer
  ship: ShipTemplate
  observers = new Set<unknown>()

  leftScroll: FlexContainer
  centerScroll: FlexContainer
  rightScroll: FlexContainer

  currentSection: string
  shipSlots: FlexItem[]
  gunMounts: FlexItem[]
  shipSlotContainer: FlexContainer
  gunSelections: GunSelection[]

  constructor(ship: ShipTemplate) {
    super("ShipCustomizer")
    this.ship = ship
    this.gunSelections = allGunSelections()
    this.setupMain()
  }
  dispose(): void {
    this.root.dispose()
    for (let item of this.observers) {
      let observer = item as Observer<unknown>
      observer.remove()
    }
    this.observers.clear()
    super.dispose()
  }

  setupMain(): void {
    let root = new FlexContainer("shipsRoot", this.gui, undefined, FlexDirection.Row)
    // shipsRoot = shipsRoot
    root.style.setPadding(Edge.All, 10)
    root.width = AppContainer.instance.engine.getRenderWidth()
    root.height = AppContainer.instance.engine.getRenderHeight()
    this.observers.add(AppContainer.instance.engine.onResizeObservable.add(() => {
      root.width = AppContainer.instance.engine.getRenderWidth()
      root.height = AppContainer.instance.engine.getRenderHeight()
      root.markDirty()
      console.log("Resize: ", root.width, root.height )
    }))
    this.root = root

    const leftScroll = new FlexContainer("scroll-left")
    leftScroll.style.setFlex(1)
    leftScroll.style.setGap(Gutter.Row, 15)
    leftScroll.style.setPadding(Edge.All, 15)
    root.addControl(leftScroll)
    this.leftScroll = leftScroll

    const centerScrollView = new GUI.ScrollViewer("scroll-center")
    const center = new FlexContainer("scroll-center", undefined, centerScrollView)
    center.style.setFlex(1)
    center.style.setGap(Gutter.Row, 15)
    center.style.setPadding(Edge.All, 15)
    root.addControl(center)
    this.centerScroll = center

    const selectButton = this.buttonItem("select", "Select", () => {
      // navigate to next screen
      let oldScene = AppContainer.instance.gameScene
      // TODO send the ship to the combat scene
      let nextScene = new SpaceCombatScene(this.ship)
      AppContainer.instance.gameScene = nextScene
      oldScene.dispose()
    });
    (selectButton.item as GUI.Button).textBlock.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    center.addControl(selectButton)

    const statsScroll = FlexContainer.CreateScrollView("right-scroll-view", root)
    statsScroll.style.setFlex(1)
    statsScroll.style.setGap(Gutter.Row, 15)
    statsScroll.style.setPadding(Edge.All, 15)
    this.rightScroll = statsScroll

    this.menuSection(this.leftScroll)
    this.addShipSections(this.rightScroll)
  }

  MenuSections = {
    Stats: 0,
    Components: 1,
    Guns: 2,
    Weapons: 3,
  }
  selectMenuSection: (section: number) => void
  menuSection(container: FlexContainer) {
    const leftScrollView = new GUI.Rectangle("scroll-left")
    const detailsSection = new FlexContainer("details", undefined, leftScrollView)
    detailsSection.style.setFlex(1)
    detailsSection.style.setGap(Gutter.Row, 15)
    detailsSection.style.setPadding(Edge.Right, 15)
    detailsSection.style.setPadding(Edge.Left, 15)
    const [segmentedControl, updateSegmentControl] = this.createSegmentedControl(["Stat", "Comp", "Guns", "Weap"], (section) => {
      detailsSection.children.forEach((child) => {
        console.log("removing", child)
        detailsSection.removeControl(child)
          child.dispose().dispose()
      })
      switch (section) {
        case this.MenuSections.Stats:
          this.statsSection(detailsSection)
          break
        case this.MenuSections.Components:
          this.componentsSection(detailsSection)
          break
        case this.MenuSections.Guns:
          this.gunSection(detailsSection)
          break
        case this.MenuSections.Weapons:
          this.weaponSection(detailsSection)
          break
      }
    })
    this.selectMenuSection = updateSegmentControl
    container.addControl(segmentedControl)
    container.addControl(detailsSection)
  }
  statsSection(container: FlexContainer) {
    container.addControl(this.textItem("name", `Ship Name: ${this.ship.name}`))
    container.addControl(this.textItem("class", `Ship Class: ${this.ship.weightClass}`))
    container.addControl(this.textItem("weight", `Ship Weight: ${this.ship.maxWeight} / ${this.ship.maxWeight}`))
    let row = new FlexContainer()
    row.style.setFlexDirection(FlexDirection.Row)
    row.addControl(this.textItem("cruise-label", `Cruise Speed:`, true))
    row.addControl(this.textItem("cruis-speed", `${this.ship.engineSlot.base.cruiseSpeed}.mps`, true))
    container.addControl(row)
    container.addControl(this.textItem("cruise", `Cruise Speed: ${this.ship.engineSlot.base.cruiseSpeed}.mps`))
    container.addControl(this.textItem("max", `Max Speed: ${this.ship.afterburnerSlot.base.maxSpeed}.mps`))
    container.addControl(this.textItem("flight", `-= Flight =-`))
    container.addControl(this.textItem("pitch", `Pitch: ${this.ship.thrustersSlot.base.pitch}.dps`))
    container.addControl(this.textItem("yaw", `Yaw: ${this.ship.thrustersSlot.base.yaw}.dps`))
    container.addControl(this.textItem("roll", `Roll: ${this.ship.thrustersSlot.base.roll}.dps`))
    container.addControl(this.textItem("durability", `-= Durability =-`))
    container.addControl(this.textItem("shields fore", `Shields Fore: ${this.ship.shieldsSlot.base.fore/10}(cm)`))
    container.addControl(this.textItem("shields aft",  `Shields Aft:  ${this.ship.shieldsSlot.base.aft/10}(cm)`))
  }
  printComponentModifier(name: string, modifier: ComponentModifier): FlexContainer {
    const container = new FlexContainer(`modifier-${name}`)
    container.style.setFlexDirection(FlexDirection.Row)
    const label = this.textblock("label", ``)
    if (name) {
      label.text = `${name}:` 
    }
    label.resizeToFit = true
    label.forceResizeWidth = true
    
    const item = new FlexItem("label", label)
    container.addControl(item)
    const mod = modifier.value < 0 ? " " : " +"
    const value = modifier.percent ? `${modifier.value * 100}%` : `${modifier.value}`
    const valueItem = new FlexItem("modifier", this.textblock("modifier", `${mod}${value}`, true))
    container.addControl(valueItem)
    label.onAfterDrawObservable.addOnce(() => {
      let measure = label.transformedMeasure
      item.node.markDirty()
      console.log(measure)
    })
    return container
  }

  // this is list of controls
  ComponentsGroups = [
    {
      id: 'Afterburner' as ComponentType,
      title: `-= Afterburners =-`,
      parts: Object.entries(Afterburners),
      slot: "afterburnerSlot",
    },
    {
      id: 'Engine' as ComponentType,
      title: `-= Engines =-`,
      parts: Object.entries(Engines),
      slot: "engineSlot",
    },
    {
      id: 'Shields' as ComponentType,
      title: `-= Shields =-`,
      parts: Object.entries(Shields),
      slot: "shieldsSlot",
    },
    {
      id: 'Utility' as ComponentType,
      title: `-= Utilities =-`,
      parts: Object.entries(Utilities),
      slot: "",
    },
    {
      id: 'Utility' as ComponentType,
      title: `-= Ammo =-`,
      parts: Object.entries(allAmmos()),
      slot: "",
    }
  ];
  selectComponent: (component: ModifierDetails) => void
  filterComponentsSection: (type: StructureSlotType | undefined) => void
  componentsSection(container: FlexContainer) {
    const detailsSection = new FlexContainer("details")
    detailsSection.style.setFlex(0.5)
    detailsSection.style.setGap(Gutter.Row, 15)
    detailsSection.style.setPadding(Edge.All, 15)
    container.addControl(detailsSection)
    const scrollview = FlexContainer.CreateScrollView("component-scrollview", container)
    this.selectComponent = (component: ModifierDetails) => {
      detailsSection.children.forEach((child) => {
        child.dispose().dispose()
        detailsSection.removeControl(child)
      })
      if (component.type == "Afterburner") {
        const afterburner = component as AfterburnerModifierDetails
        detailsSection.addControl(this.textItem("name", `${afterburner.name}`))
        detailsSection.addControl(this.textItem("class", `${afterburner.size}`))
        detailsSection.addControl(this.textItem("cost", `$${afterburner.cost}`))
        if (afterburner.accelleration != undefined) {
          detailsSection.addControl(this.printComponentModifier("Accelleration", afterburner.accelleration))
        }
        if (afterburner.maxSpeed != undefined) {
          detailsSection.addControl(this.printComponentModifier("Max Speed", afterburner.maxSpeed))
        }
        if (afterburner.fuelConsumeRate != undefined) {
          detailsSection.addControl(this.printComponentModifier("Fuel Rate", afterburner.fuelConsumeRate))
        }
      }
      if (component.type == "Engine") {
        const engine = component as EngineModifierDetails
        detailsSection.addControl(this.textItem("name", `${engine.name}`))
        detailsSection.addControl(this.textItem("class", `${engine.size}`))
        detailsSection.addControl(this.textItem("cost", `$${engine.cost}`))
        if (engine.accelleration != undefined) {
          detailsSection.addControl(this.printComponentModifier("Accelleration", engine.accelleration))
        }
        if (engine.cruiseSpeed != undefined) {
          detailsSection.addControl(this.printComponentModifier("top Speed", engine.cruiseSpeed))
        }
      }
      if (component.type == "Shields") {
        const shield = component as ShieldGeneratorModifierDetails
        detailsSection.addControl(this.textItem("name", `${shield.name}`))
        detailsSection.addControl(this.textItem("class", `${shield.size}`))
        detailsSection.addControl(this.textItem("cost", `$${shield.cost}`))
        if (shield.aft != undefined) {
          detailsSection.addControl(this.printComponentModifier("Aft", shield.aft))
        }
        if (shield.fore != undefined) {
          detailsSection.addControl(this.printComponentModifier("Fore", shield.fore))
        }
        if (shield.rechargeRate != undefined) {
          detailsSection.addControl(this.printComponentModifier("Recharge Rate", shield.rechargeRate))
        }
        if (shield.energyDrain != undefined) {
          detailsSection.addControl(this.printComponentModifier("Energy Drain", shield.energyDrain))
        }
      }
      if (component.type == "Utility") {
        const utility = component as UtilityModifierDetails
        detailsSection.addControl(this.textItem("name", `${utility.name}`))
        if (utility.energy != undefined) {
          detailsSection.addControl(this.printComponentModifier("Energy", utility.energy))
        }
        if (utility.fuel != undefined) {
          detailsSection.addControl(this.printComponentModifier("Fuel", utility.fuel))
        }
        if (utility.shields != undefined) {
          detailsSection.addControl(this.printComponentModifier("Shields", utility.shields))
        }
        if (utility.ammoCount != undefined) {
          detailsSection.addControl(this.textItem("ammo", `Ammo count: ${utility.ammoCount}`))
        }
        if (this.selectedShipSection != undefined) {
          const itemData = this.selectedShipSection.item.metadata as { section: string, slotIndex: number }
          if (itemData.slotIndex != undefined) {
            const slots = this.ship.structure[itemData.section].utilityMounts as UtilityMounts[]
            const slot = slots[itemData.slotIndex]
            slot.utility = structuredClone(component)
          }
          this.clearSection(this.rightScroll)
          this.addShipSections(this.rightScroll)
        }
      }
      scrollview.children.forEach((child, index) => {
        if (child instanceof FlexItem && child.item instanceof GUI.Button) {
          const button = child.item as GUI.Button
          button.background = button.metadata == component.id ? "blue" : "gray"
        }
      })
    }
    const renderComponentGroups = (componentGroups: any) => {
      for (const componentGroup of componentGroups) {
        scrollview.addControl(this.textItem(componentGroup.id, componentGroup.title))
        for (const part of componentGroup.parts) {
          const [name, component] = part
          const buttonItem = this.buttonItem(`${componentGroup.id}-${component.name}`, `${component.name}`, () => {
            this.selectComponent(component)
            if (this.selectedShipSection != undefined && this.ship[componentGroup.slot] != undefined) {
              this.ship[componentGroup.slot].modifier = structuredClone(component)
              this.clearSection(this.rightScroll)
              this.addShipSections(this.rightScroll)
            }
          }, 50)
          buttonItem.item.metadata = name
          this.draggableFlexItem(buttonItem, [this.centerScroll, this.shipSlotContainer], this.shipSlots, () => {
            this.selectComponent(component)
            let proxy = new GUI.Rectangle(`${name}-proxy`);
            proxy.widthInPixels = buttonItem.item.widthInPixels
            proxy.heightInPixels = buttonItem.item.heightInPixels
            proxy.background = "blue"
            let textblock = this.textblock(`${name}-proxy-text`, `${component.name}`)
            textblock.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
            proxy.addControl(textblock)
            return proxy
          },
          (flexItem) => {
            console.log("Dropped on item!")
            if (this.ship[componentGroup.slot] != undefined) {
              this.ship[componentGroup.slot].modifier = structuredClone(component)
            }
            this.clearSection(this.rightScroll)
            this.addShipSections(this.rightScroll)
          })
          scrollview.addControl(buttonItem)
        }
      }
    }
    renderComponentGroups(this.ComponentsGroups)
    this.selectComponent(Afterburners.HotAfterburners)
    this.filterComponentsSection = (type: StructureSlotType | undefined) => {
      if (type == undefined) {
        this.clearSection(detailsSection)
        this.clearSection(scrollview)
        renderComponentGroups(this.ComponentsGroups)
      }
      let group = this.ComponentsGroups.filter((group) => { return group.id == type })
      if (group.length > 0) {
        this.clearSection(detailsSection)
        this.clearSection(scrollview)
        renderComponentGroups(group)
      }
    }
    detailsSection._container.onDisposeObservable.addOnce(() => {
      this.selectComponent = undefined
    })
  }

  selectGun: (component: GunSelection) => void
  gunSection(container: FlexContainer) {
    const detailsSection = new FlexContainer("details")
    detailsSection.style.setFlex(0.5)
    container.addControl(detailsSection)
    const componentScrollview = FlexContainer.CreateScrollView("component-scrollview", container)
    const selectComponent = (component: GunSelection) => {
      // remove the old scroll view
      detailsSection.children.forEach((child) => {
        child.dispose().dispose()
        detailsSection.removeControl(child)
      })
      // create the new scroll view
      const detailsScrollview = FlexContainer.CreateScrollView("details-scrollview", detailsSection)
      detailsScrollview.style.setGap(Gutter.Row, 5)
      detailsScrollview.style.setPadding(Edge.All, 15)
      const gunData = Guns[component.type]
      const gunStats = gunData.tiers[component.tier ?? 1]
      const gunAffix: GunAffix = component.affix ? GunAffixes[component.affix] : undefined
      const [id, name] = gunSelectionName(component)
      detailsScrollview.addControl(this.textItem("name", `${name}`))
      detailsScrollview.addControl(this.textItem("range", `Range: ${gunStats.range} m`))
      if (gunAffix?.range != undefined) {
        detailsScrollview.addControl(this.printComponentModifier("range", gunAffix.range))
      }
      detailsScrollview.addControl(this.textItem("speed", `Speed: ${gunStats.speed} mps`))
      if (gunAffix?.speed != undefined) {
        detailsScrollview.addControl(this.printComponentModifier("|| speed", gunAffix.speed))
      }
      detailsScrollview.addControl(this.textItem("damage", `Damage: ${(gunStats.damage/10).toFixed(1)} cm`))
      if (gunAffix?.damage != undefined) {
        detailsScrollview.addControl(this.printComponentModifier("|| damage", gunAffix.damage))
      }
      detailsScrollview.addControl(this.textItem("energy", `Energy: ${gunStats.energy} kJ`))
      if (gunAffix?.energy != undefined) {
        detailsScrollview.addControl(this.printComponentModifier("|| energy", gunAffix.energy))
      }
      detailsScrollview.addControl(this.textItem("delay", `Delay: ${gunStats.delay} ms`))
      if (gunAffix?.delay != undefined) {
        detailsScrollview.addControl(this.printComponentModifier("|| delay", gunAffix.delay))
      }
      detailsScrollview.addControl(this.textItem("name", `===`))
      if (gunAffix) {
        const damage = applyModifier(gunStats.damage, gunAffix.damage) / 10
        const delay = applyModifier(gunStats.delay, gunAffix.delay)
        const energy = applyModifier(gunStats.energy, gunAffix.energy)
        const dps = (damage/delay) * 1000
        const dpkj = damage/energy
        detailsScrollview.addControl(this.textItem("dps", `|| DPS: ${dps.toFixed(2)} cm/s`))
        detailsScrollview.addControl(this.textItem("dpkj", `|| DPkJ: ${dpkj.toFixed(2)} cm/kJ`))
        if (gunData.ammo != undefined) {
          let secondsOfAmmo = gunData.ammoPerBin * (delay / 1000)
          detailsScrollview.addControl(this.textItem("s of ammo", `TTF: ${secondsOfAmmo.toFixed(2)} s`))
        }
      } else {
        detailsScrollview.addControl(this.textItem("dps", `DPS: ${(((gunStats.damage/10)/gunStats.delay) * 1000).toFixed(2)} cm/s`))
        detailsScrollview.addControl(this.textItem("dpkj", `DPkJ: ${((gunStats.damage/10)/gunStats.energy).toFixed(2)} cm/kJ`))
        if (gunData.ammo != undefined) {
          let secondsOfAmmo = gunData.ammoPerBin * (gunStats.delay / 1000)
          detailsScrollview.addControl(this.textItem("s of ammo", `TTF: ${secondsOfAmmo.toFixed(2)} s`))
        }
      }
      
      componentScrollview.children.forEach((child, index) => {
        if (child instanceof FlexItem && child.item instanceof GUI.Button) {
          const button = child.item as GUI.Button
          button.background = button.metadata == id ? "blue" : "gray"
        }
      })
    }
    this.selectGun = selectComponent

    // this is list of controls
    const componentsGroups = [
      {
        id: 'gun' as ComponentType,
        title: `-= Guns =-`,
        parts: this.gunSelections,
        slot: "gun",
      },
    ];
    for (const componentGroup of componentsGroups) {
      componentScrollview.addControl(this.textItem(componentGroup.id, componentGroup.title))
      for (const part of componentGroup.parts) {
        const gun = Guns[part.type]
        let [id, name] = gunSelectionName(part)
        const gunStats = gun.tiers[part.tier ?? 1]
        let gunModifier: GunAffix
        if (part.affix != undefined) {
          gunModifier = GunAffixes[part.affix]
        }
        
        // const [component] = part
        const buttonItem = this.buttonItem(`${componentGroup.id}-${id}`, `${name}`, () => {
          selectComponent(part)
          if (this.selectedShipSection != undefined) {
            const itemData = this.selectedShipSection.item.metadata as { section: string, slotIndex: number }
            if (itemData.slotIndex != undefined) {
              const slots = this.ship.structure[itemData.section].gunMounts as GunMounts[]
              const slot = slots[itemData.slotIndex]
              slot.base.type = part.type
              slot.base.tier = part.tier
              slot.base.affix = part.affix
            }
            this.clearSection(this.rightScroll)
            this.addShipSections(this.rightScroll)
          }
        }, 50)
        buttonItem.item.metadata = id
        this.draggableFlexItem(buttonItem, [this.centerScroll, this.shipSlotContainer], this.shipSlots, () => {
          selectComponent(part)
          let proxy = new GUI.Rectangle(`${name}-proxy`);
          proxy.widthInPixels = buttonItem.item.widthInPixels
          proxy.heightInPixels = buttonItem.item.heightInPixels
          proxy.background = "blue"
          let textblock = this.textblock(`${name}-proxy-text`, `${name}`)
          textblock.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
          proxy.addControl(textblock)
          return proxy
        },
        (flexItem) => {
          console.log("Dropped on item!")
          const itemData = flexItem.item.metadata as { section: string, slotIndex: number }
          if (itemData.slotIndex != undefined) {
            const slots = this.ship.structure[itemData.section].gunMounts as GunMounts[]
            const slot = slots[itemData.slotIndex]
            slot.base.type = part.type
            slot.base.tier = part.tier
            slot.base.affix = part.affix
          }
          this.clearSection(this.rightScroll)
          this.addShipSections(this.rightScroll)
        })
        componentScrollview.addControl(buttonItem)
      }
    }
    selectComponent( { type: "laser", tier: 1 })
  }

  selectWeapon: (component: Weapon) => void
  weaponSection(container: FlexContainer) {
    const detailsSection = new FlexContainer("details")
    detailsSection.style.setFlex(0.5)
    detailsSection.style.setGap(Gutter.Row, 15)
    detailsSection.style.setPadding(Edge.All, 15)
    container.addControl(detailsSection)
    const scrollview = FlexContainer.CreateScrollView("component-scrollview", container)
    const selectComponent = (component: Weapon) => {
      detailsSection.children.forEach((child) => {
        child.dispose().dispose()
        detailsSection.removeControl(child)
      })
      const weaponComp = component as Weapon
      detailsSection.addControl(this.textItem("name", `${weaponComp.name}`))
      detailsSection.addControl(this.textItem("range", `Range: ${weaponComp.range} m`))
      detailsSection.addControl(this.textItem("speed", `Speed: ${weaponComp.speed} mps`))
      detailsSection.addControl(this.textItem("damage", `Damage: ${(weaponComp.damage/10).toFixed(1)} cm`))
      detailsSection.addControl(this.textItem("delay", `Delay: ${weaponComp.delay} ms`))
      scrollview.children.forEach((child, index) => {
        if (child instanceof FlexItem && child.item instanceof GUI.Button) {
          const button = child.item as GUI.Button
          button.background = button.metadata == weaponComp.class ? "blue" : "gray"
        }
      })
    }
    this.selectWeapon = selectComponent

    // this is list of controls
    const componentsGroups = [
      {
        id: 'weapon' as ComponentType,
        title: `-= Weapons =-`,
        parts: Object.entries(Weapons),
        slot: "weapon",
      },
    ];
    for (const componentGroup of componentsGroups) {
      scrollview.addControl(this.textItem(componentGroup.id, componentGroup.title))
      for (const part of componentGroup.parts) {
        const [name, component] = part
        const buttonItem = this.buttonItem(`${componentGroup.id}-${component.name}`, `${component.name}`, () => {
          selectComponent(component)
          if (this.selectedShipSection != undefined) {
            const itemData = this.selectedShipSection.item.metadata as { section: string, slotIndex: number }
            if (itemData.slotIndex != undefined) {
              const slots = this.ship.structure[itemData.section].weaponMounts as WeaponMounts[]
              const slot = slots[itemData.slotIndex]
              slot.base.type = component.class
              slot.base.count = slot.maxCount
            }
            this.clearSection(this.rightScroll)
            this.addShipSections(this.rightScroll)
          }
        }, 50)
        buttonItem.item.metadata = component.class
        this.draggableFlexItem(buttonItem, [this.centerScroll, this.shipSlotContainer], this.shipSlots, () => {
          selectComponent(component)
          let proxy = new GUI.Rectangle(`${name}-proxy`);
          proxy.widthInPixels = buttonItem.item.widthInPixels
          proxy.heightInPixels = buttonItem.item.heightInPixels
          proxy.background = "blue"
          let textblock = this.textblock(`${name}-proxy-text`, `${component.name}`)
          textblock.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
          proxy.addControl(textblock)
          return proxy
        },
        (flexItem) => {
          console.log("Dropped on item!")
          const itemData = flexItem.item.metadata as { section: string, slotIndex: number }
          if (itemData.slotIndex != undefined) {
            const slots = this.ship.structure[itemData.section].weaponMonuts as WeaponMounts[]
            const slot = slots[itemData.slotIndex]
            slot.base.type = component.class
            slot.base.count = slot.maxCount
          }
          this.clearSection(this.rightScroll)
          this.addShipSections(this.rightScroll)
        })
        scrollview.addControl(buttonItem)
      }
    }
    selectComponent(Weapons.dumbfire)
  }

  draggableFlexItem(draggable: FlexItem, targetContainers: FlexContainer[], targetItems: FlexItem[], proxyCreator: () => GUI.Container, droppedOnTarget: (flexItem: FlexItem) => void) {
    let draggedItem: GUI.Control

    this.observers.add(draggable.item.onPointerDownObservable.add((downEvent) => {
      console.log("proxy down", downEvent.x, downEvent.y)
      const xoffset = draggable.item.getDimension("width").getValueInPixel(this.gui, 1) / 2
      const yoffset = draggable.item.getDimension("height").getValueInPixel(this.gui, 1) / 2
      let proxy = undefined
      let overTarget: FlexItem | undefined
      let dragging = AppContainer.instance.scene.onPointerObservable.add((event) => {
        if (event.type != PointerEventTypes.POINTERMOVE) {
          return
        }
        if (proxy == undefined) {
          console.log("creating proxy")
          proxy = proxyCreator()
          proxy.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
          proxy.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
          this.gui.addControl(proxy)
        }
        const mousex = event.event.clientX
        const mousey = event.event.clientY
        console.log("proxy dragging", mousex, mousey)
        proxy.leftInPixels = mousex - xoffset
        proxy.topInPixels = mousey - yoffset
        let newTarget: any = undefined
        targetContainers.forEach((targetContainer) => {
          if (targetContainer._container.contains(mousex, mousey)) {
            // inside target container, check if inside target item
            let target = undefined
            for (const item of targetItems) {
              if (item.item.contains(mousex, mousey)) {
                target = item
              }
            }
            newTarget = target
          }
        })
        if (newTarget != undefined) {
          overTarget = newTarget
        } else {
          overTarget = undefined
        }
        console.log("proxy l/t", proxy.leftInPixels, proxy.topInPixels)
      })
      draggable.item.onPointerUpObservable.addOnce(() => {
        console.log("proxy up")
        dragging.remove()
        if (proxy != undefined) {
          this.gui.removeControl(proxy)
          proxy.dispose
        }
        if (overTarget != undefined) {
          droppedOnTarget(overTarget)
        }
      })
    }))
  }

  selectedShipSection: FlexItem
  selectShipSection = (() => {
    return (selectItem: FlexItem) => {
      if (this.selectedShipSection == selectItem) {
        const oldButton = this.selectedShipSection.item as GUI.Button
        const oldTextBlock = oldButton.textBlock
        oldTextBlock.color = "gold";
        this.selectedShipSection = undefined
        this.filterComponentsSection(undefined)
        return
      }
      if (this.selectedShipSection != undefined) {
        const oldButton = this.selectedShipSection.item as GUI.Button
        const oldTextBlock = oldButton.textBlock
        oldTextBlock.color = "gold";
      }
      if (selectItem != undefined) {
        this.selectedShipSection = selectItem
        const newButton = this.selectedShipSection.item as GUI.Button
        const newTextBlock = newButton.textBlock
        newTextBlock.color = "blue"
      }
    }
  })();
  addShipSections(container: FlexContainer) {
    const sections = ["Front", "Core", "Left", "Right", "Back"]
    this.shipSlots = []
    this.shipSlotContainer = container
    sections.forEach((sectionName, index) => {
      const rectangle = new GUI.Rectangle(`${sectionName}-rectangle`)
      const sectionContainer = new FlexContainer(`${sectionName}-container`, undefined, rectangle)
      rectangle.thickness = 1
      
      const armor = this.ship.structure[sectionName.toLowerCase()].armor
      const sectionNameTextItem = this.textItem(sectionName, sectionName)
      const sectionTextblock = sectionNameTextItem.item as GUI.TextBlock
      sectionTextblock.resizeToFit = true
      sectionTextblock.forceResizeWidth = true
      sectionTextblock.onAfterDrawObservable.addOnce(() => {
        sectionTextblock.markAsDirty()
      })
      sectionContainer.addControl(sectionNameTextItem)
      if (armor != undefined) {
        const armorContainer = new FlexContainer(`${sectionName}-armor-container`, undefined, undefined, FlexDirection.Row)
        armorContainer.style.setAlignItems(Align.Center)
        
        const armorTextBlock: GUI.TextBlock = this.textblock(`${sectionName}-armor`, `${armor}(cm)`)
        const armorTextItem = new FlexItem(`${sectionName}-armor`, armorTextBlock)
        armorTextBlock.resizeToFit = true
        armorTextBlock.forceResizeWidth = true
        armorTextBlock.onAfterDrawObservable.addOnce(() => {
          armorTextItem.node.markDirty()
        })
        // armorTextBlock.widthInPixels = 100
        armorContainer.addControl(this.buttonItem(`${sectionName}-armor-down`, "<", () => {
          this.ship.structure[sectionName.toLowerCase()].armor -= 5
          if (this.ship.structure[sectionName.toLowerCase()].armor < 0) {
            this.ship.structure[sectionName.toLowerCase()].armor = 0
          }
          armorTextBlock.text = `${this.ship.structure[sectionName.toLowerCase()].armor}(cm)`
        }, 50, 50))
        armorContainer.addControl(armorTextItem)
        armorContainer.addControl(this.buttonItem(`${sectionName}-armor-up`, ">", () => {
          this.ship.structure[sectionName.toLowerCase()].armor += 5
          if (this.ship.structure[sectionName.toLowerCase()].armor > this.ship.structure[sectionName.toLowerCase()].maxArmor) {
            this.ship.structure[sectionName.toLowerCase()].armor = this.ship.structure[sectionName.toLowerCase()].maxArmor
          }
          armorTextBlock.text = `${this.ship.structure[sectionName.toLowerCase()].armor}(cm)`
          this.root.markDirty()
        }, 50, 50))
        sectionContainer.addControl(armorContainer)
      }

      /// COMPONENTS
      const slots = this.ship.structure[sectionName.toLowerCase()].slots as StructureSlotType[]
      for (let i = 0; i < slots.length; i += 1) {
        const slotType = slots[i]
        const slotIcon = slotType.charAt(0)
        let slotTextItem: FlexItem
        let slotTextBlock: GUI.TextBlock
        let modifier: ModifierDetails
        switch (slotType) {
          case "Afterburner": {
            const name = this.ship.afterburnerSlot.modifier?.name ?? "Afterburner Standard"
            modifier = this.ship.afterburnerSlot.modifier
            slotTextBlock = this.textblock(`${name}-slot-${i}`, `- ${slotIcon}[ ${name}`)
            break;
          }
          case "Radar": {
            const name = "Radar"
            slotTextBlock = this.textblock(`${name}-slot-${i}`, `- ${slotIcon}[ ${name}`)
            break
          }
          case "Engine": {
            const name = this.ship.engineSlot.modifier?.name ?? "Engine Standard"
            modifier = this.ship.engineSlot.modifier
            slotTextBlock = this.textblock(`${name}-slot-${i}`, `- ${slotIcon}[ ${name}`)
            break
          }
          case "PowerPlant": {
            const name = this.ship.powerPlantSlot.modifier?.name ?? "Power Plant Standard"
            modifier = this.ship.powerPlantSlot.modifier
            slotTextBlock = this.textblock(`${name}-slot-${i}`, `- ${slotIcon}[ ${name}`)
            break
          }
          case "Shields": {
            const name = this.ship.shieldsSlot.modifier?.name ?? "Shields Standard"
            modifier = this.ship.shieldsSlot.modifier
            slotTextBlock = this.textblock(`${name}-slot-${i}`, `- ${slotIcon}[ ${name}`)
            break
          }
          case "Thruster": {
            const name = this.ship.thrustersSlot.modifier?.name ?? "Thrusters Standard"
            modifier = this.ship.thrustersSlot.modifier
            slotTextBlock = this.textblock(`${name}-slot-${i}`, `- ${slotIcon}[ ${name}`)
            break
          }
          // TODO: Gun and Weapon should come from items installed on the mounts
          case "Gun": {
            const name = "Gun Slot"
            slotTextBlock = this.textblock(`${name}-slot-${i}`, `- ${slotIcon}[ ${name}`)
            break
          }
          case "Weapon": {
            const name = "Weapon Slot"
            slotTextBlock = this.textblock(`${name}-slot-${i}`, `- ${slotIcon}[ ${name}`)
            break
          }
          // TODO: generic items should come from items installed on the slot
          // chould be fuel, ammo, or battery packs
          case "Utility": {
            const name = "Utility Slot"
            slotTextBlock = this.textblock(`${name}-slot-${i}`, `- ${slotIcon}[ ${name}`)
            break
          }
          default: {
            slotTextBlock = this.textblock(`${sectionName}-slot-${i}`, `- ${slotIcon}[ `)
            // slotTextItem = this.buttonItem(`${name}-slot-${i}`, `${slotIcon}[`, () => {

            // }, 50)
            break;
          }
        }
        slotTextBlock.resizeToFit = false
        slotTextBlock.heightInPixels = 50
        slotTextBlock.textVerticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER
        const slotButton = new GUI.Button(`${sectionName}-slot-${i}`)
        slotButton.heightInPixels = 50
        slotButton.addControl(slotTextBlock);
        (slotButton as any)._textBlock = slotTextBlock
        slotTextItem = new FlexItem(`${sectionName}-slot-${i}`, slotButton)
        slotTextItem.item.metadata = {
          section: sectionName.toLowerCase(),
          type: slotType,
          slotIndex: i
        }
        const listener = slotButton.onPointerClickObservable.add(() => {
          this.selectShipSection(slotTextItem)
          this.selectMenuSection(this.MenuSections.Components)
          if (this.selectedShipSection != undefined) {
            this.filterComponentsSection(slotType)
            if (modifier != undefined) {
              // select modifier
              this.selectComponent(modifier)
            }
          }
        })
        this.observers.add(listener)
        this.shipSlots.push(slotTextItem)
        sectionContainer.addControl(slotTextItem)
        if (this.selectedShipSection?.item.metadata.section == sectionName.toLowerCase() &&
          this.selectedShipSection?.item.metadata.type == slotType &&
          this.selectedShipSection?.item.metadata.slotIndex == i) {
          this.selectShipSection(slotTextItem)
        }
      }

      /// UTILITIES
      const utilities = this.ship.structure[sectionName.toLowerCase()].utilityMounts as UtilityMounts[]
      if (utilities) {
        for (let i = 0; i < utilities.length; i += 1) {
          const slotType = "Utility"
          const slotIcon = "U"
          const mount = utilities[i]
          let slotTextItem: FlexItem
          let slotTextBlock: GUI.TextBlock
          let name = "Utility Slot"
          let utility: UtilityModifierDetails
          if (mount.utility != undefined) {
            utility = mount.utility
            name = utility.name
          }
          slotTextBlock = this.textblock(`${name}-${sectionName}-slot-${i}`, `- ${slotIcon}[ ${name}`)
          slotTextBlock.resizeToFit = false
          slotTextBlock.heightInPixels = 50
          slotTextBlock.textVerticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER
          const slotButton = new GUI.Button(`${name}-${sectionName}-slot-${i}`)
          slotButton.addControl(slotTextBlock);
          (slotButton as any)._textBlock = slotTextBlock
          slotButton.heightInPixels = 50
          slotTextItem = new FlexItem(`${name}-${sectionName}-slot-${i}`, slotButton)
          slotTextItem.item.metadata = {
            section: sectionName.toLowerCase(),
            type: slotType,
            slotIndex: i
          }
          this.observers.add(slotButton.onPointerClickObservable.add(() => {
            this.selectShipSection(slotTextItem)
            this.selectMenuSection(this.MenuSections.Components)
            if (this.selectedShipSection != undefined) {
              this.filterComponentsSection(slotType)
              if (utility != undefined) {
                // select modifier
                this.selectComponent(utility)
              }
            }
          }))
          this.shipSlots.push(slotTextItem)
          sectionContainer.addControl(slotTextItem)
          if (this.selectedShipSection?.item.metadata.section == sectionName.toLowerCase() &&
            this.selectedShipSection?.item.metadata.type == slotType &&
            this.selectedShipSection?.item.metadata.slotIndex == i) {
            this.selectShipSection(slotTextItem)
          }
        }
      }

      /// GUNS
      const guns = this.ship.structure[sectionName.toLowerCase()].gunMounts as GunMounts[]
      if (guns) {
        for (let i = 0; i < guns.length; i += 1) {
          const slotType = "Gun"
          const slotIcon = "G"
          const mount = guns[i]
          let slotTextItem: FlexItem
          let slotTextBlock: GUI.TextBlock
          let name = "Gun Slot"
          let gun: Gun
          let selection: GunSelection
          if (mount.base != undefined) {
            gun = Guns[mount.base.type]
            selection = mount.base
            const [_gunId, gunName] = gunSelectionName(selection)
            name = gunName
          }
          slotTextBlock = this.textblock(`${name}-${sectionName}-slot-${i}`, `- ${slotIcon}[ ${name}`)
          slotTextBlock.resizeToFit = false
          slotTextBlock.heightInPixels = 50
          slotTextBlock.textVerticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER
          const slotButton = new GUI.Button(`${name}-${sectionName}-slot-${i}`)
          slotButton.addControl(slotTextBlock);
          (slotButton as any)._textBlock = slotTextBlock
          slotButton.heightInPixels = 50
          slotTextItem = new FlexItem(`${name}-${sectionName}-slot-${i}`, slotButton)
          slotTextItem.item.metadata = {
            section: sectionName.toLowerCase(),
            type: slotType,
            slotIndex: i
          }
          this.observers.add(slotButton.onPointerClickObservable.add(() => {
            this.selectShipSection(slotTextItem)
            this.selectMenuSection(this.MenuSections.Guns)
            if (this.selectedShipSection != undefined) {
              if (gun != undefined) {
                // select modifier
                this.selectGun(selection)
              }
            }
          }))
          this.shipSlots.push(slotTextItem)
          sectionContainer.addControl(slotTextItem)
          if (this.selectedShipSection?.item.metadata.section == sectionName.toLowerCase() &&
            this.selectedShipSection?.item.metadata.type == slotType &&
            this.selectedShipSection?.item.metadata.slotIndex == i) {
            this.selectShipSection(slotTextItem)
          }
        }
      }

      /// WEAPONS
      const weapons = this.ship.structure[sectionName.toLowerCase()].weaponMounts as WeaponMounts[]
      if (weapons) {
        for (let i = 0; i < weapons.length; i += 1) {
          const slotType = "Weapon"
          const slotIcon = "W"
          const mount = weapons[i]
          let slotTextItem: FlexItem
          let slotTextBlock: GUI.TextBlock
          let name = "Weapon Slot"
          let weapon: Weapon
          if (mount.base != undefined) {
            weapon = Weapons[mount.base.type] as Weapon
            name = weapon.name
            name += ` x${mount.base.count}`
          }
          slotTextBlock = this.textblock(`${name}-${sectionName}-slot-${i}`, `- ${slotIcon}[ ${name}`)
          slotTextBlock.resizeToFit = false
          slotTextBlock.heightInPixels = 50
          slotTextBlock.textVerticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER
          const slotButton = new GUI.Button(`${name}-${sectionName}-slot-${i}`)
          slotButton.heightInPixels = 50
          slotButton.addControl(slotTextBlock);
          (slotButton as any)._textBlock = slotTextBlock
          slotTextItem = new FlexItem(`${name}-${sectionName}-slot-${i}`, slotButton)
          slotTextItem.item.metadata = {
            section: sectionName.toLowerCase(),
            type: slotType,
            slotIndex: i
          }
          this.observers.add(slotButton.onPointerClickObservable.add(() => {
            this.selectShipSection(slotTextItem)
            this.selectMenuSection(this.MenuSections.Weapons)
            if (this.selectedShipSection != undefined) {
              if (weapon != undefined) {
                // select modifier
                this.selectWeapon(weapon)
              }
            }
          }))
          this.shipSlots.push(slotTextItem)
          sectionContainer.addControl(slotTextItem)
          if (this.selectedShipSection?.item.metadata.section == sectionName.toLowerCase() &&
            this.selectedShipSection?.item.metadata.type == slotType &&
            this.selectedShipSection?.item.metadata.slotIndex == i) {
            this.selectShipSection(slotTextItem)
          }
        }
      }
      container.addControl(sectionContainer)
    })
  }

  updateScreen(_dt: number): void {
    this.root.layout()
  }

  clearSection(section: FlexContainer) {
    section.children.forEach((child) => {
      console.log("removing", child)
      section.removeControl(child)
        child.dispose().dispose()
    })
  }
  buttonItem(name: string, text: string, onClick: () => void, height: number = 40, width?: number): FlexItem {
    const button1 = this.button(name, text, onClick, height)
    const button1FlexItem = new FlexItem(`${name}-flex`, button1)
    const buttonWidth = width
    GUI.Button.CreateImageWithCenterTextButton
    button1FlexItem.getMeasure = (width, _widthMode, _height, _heightMode): {width: number, height: number} => {
      if (buttonWidth != undefined) {
        button1.widthInPixels = buttonWidth
      } else {
        button1.widthInPixels = width
      }
      return { width: button1.widthInPixels, height: button1.heightInPixels }
    }
    return button1FlexItem
  }

  button(name: string, text: string, onClick: () => void, height: number = 40): GUI.Button {
    let button1 = new GUI.Button(`${name}-button`)
    let text1 = this.textblock(name, text);
    (button1 as any)._textBlock = text1
    button1.addControl(text1)
    text1.leftInPixels = 15
    button1.heightInPixels = height
    this.observers.add(button1.onPointerClickObservable.add(() => {
      onClick()
    }))
    return button1
  }

  createSegmentedControl(options: string[], callback: (selectedIndex: number) => void): [FlexContainer, (segment: number) => void] {
    const stackPanel = new FlexContainer()
    stackPanel.style.setFlexDirection(FlexDirection.Row)

    const updateButtonStates = (selectedIndex: number) => {
      stackPanel.children.forEach((child, index) => {
        if (child instanceof FlexItem) {
          const button = child.item as GUI.Button
          button.background = index === selectedIndex ? "blue" : "gray"
        }
      })
    }

    let currentSegment = undefined
    const updateSegmentControl = (segment: number) => {
      if (currentSegment != segment) {
        updateButtonStates(segment)
        callback(segment)
      }
      currentSegment = segment
    }

    options.forEach((option, index) => {
        const button = this.button(`button_${index}`, option, () => {
          updateSegmentControl(index)
        })
        button.widthInPixels = this.getTextMetricsWidth(this.gui.getContext().measureText(option))
        button.width = "120px"
        button.height = "40px"
        button.color = "white"
        button.background = "gray"
        const buttonFlexItem = new FlexItem(`${name}-flex`, button)
        stackPanel.addControl(buttonFlexItem);
    });
    
    // Initialize the first button as selected
    updateSegmentControl(0)

    return [stackPanel, updateSegmentControl];
  }

  getTextMetricsWidth(textMetrics) {
    if (textMetrics.actualBoundingBoxLeft !== undefined) {
        return Math.abs(textMetrics.actualBoundingBoxLeft) + Math.abs(textMetrics.actualBoundingBoxRight);
    }
    return textMetrics.width;
  }

  textItem(name: string, text: string, fit: boolean = false): FlexItem {
    const text1 = this.textblock(name, text)
    const text1FlexItem = new FlexItem(`${name}-flex`, text1)
    text1FlexItem.getMeasure = (width, _widthMode, _height, _heightMode): {width: number, height: number} => {
      text1.widthInPixels = width
      text1.heightInPixels = text1.computeExpectedHeight()
      return { width: text1.widthInPixels, height: text1.computeExpectedHeight() }
    }
    if (fit) {
      text1.onAfterDrawObservable.addOnce(() => text1FlexItem.node.markDirty())
    }
    return text1FlexItem
  }
  textblock(name: string, text: string, fit: boolean = false): GUI.TextBlock {
    const text1 = new GUI.TextBlock(name, text)
    text1.textWrapping = GUI.TextWrapping.WordWrap
    text1.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    // text1.textVerticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    text1.fontFamily = "Regular5"
    text1.fontSizeInPixels = 15
    text1.color = "gold"
    if (fit) {
      text1.resizeToFit = true
      // text1.forceResizeWidth = true
    }
    return text1
  }
}
