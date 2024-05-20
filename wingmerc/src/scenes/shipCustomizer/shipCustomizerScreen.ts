import { AfterburnerModifierDetails, ComponentModifier, ShipTemplate, StructureSlotType } from '../../data/ships/shipTemplate';
import { barks } from './../../data/barks';
import { Color3, Observer, PointerEventTypes } from "@babylonjs/core";
import { Align, Edge, FlexContainer, FlexDirection, FlexItem, Gutter, Justify } from "../../utils/guiHelpers";
import { MercScreen } from "../screen";
import * as GUI from "@babylonjs/gui"
import { AppContainer } from "../../app.container";
import { SpaceCombatScene } from '../spaceCombat/spaceCombatLoop';
import { AfterburnerTypes, Afterburners } from '../../data/components/afterburners';

export class ShipCustomizerScreen extends MercScreen {
  root: FlexContainer
  ship: ShipTemplate
  observers = new Set<unknown>()

  leftScroll: FlexContainer
  centerScroll: FlexContainer
  rightScroll: FlexContainer

  currentSection: string
  shipSlots: FlexItem[]
  shipSlotContainer: FlexContainer

  constructor(ship: ShipTemplate) {
    super("ShipCustomizer")
    this.ship = ship
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
      let nextScene = new SpaceCombatScene()
      AppContainer.instance.gameScene = nextScene
      oldScene.dispose()
    });
    (selectButton.item as GUI.Button).textBlock.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    center.addControl(selectButton)

    const rightScrollView = new GUI.ScrollViewer("scroll-right")
    const statsScroll = new FlexContainer("scroll-right", undefined, rightScrollView)
    statsScroll.style.setFlex(1)
    statsScroll.style.setGap(Gutter.Row, 15)
    statsScroll.style.setPadding(Edge.All, 15)
    this.rightScroll = statsScroll
    root.addControl(statsScroll)

    this.menuSection(this.leftScroll)
    this.addShipSections(this.rightScroll)
  }

  menuSection(container: FlexContainer) {
    const leftScrollView = new GUI.ScrollViewer("scroll-left")
    const detailsSection = new FlexContainer("details", undefined, leftScrollView)
    detailsSection.style.setFlex(1)
    detailsSection.style.setGap(Gutter.Row, 15)
    detailsSection.style.setPadding(Edge.All, 15)
    const segmentedControl = this.createSegmentedControl(["Stat", "Comp", "Guns", "Weap"], (section) => {
      detailsSection.children.forEach((child) => {
        console.log("removing", child)
        detailsSection.removeControl(child)
          child.dispose().dispose()
      })
      switch (section) {
        case 0:
          this.statsSection(detailsSection)
          break
        case 1:
          this.compSection(detailsSection)
      }
    })
    container.addControl(segmentedControl)
    container.addControl(detailsSection)
  }
  statsSection(container: FlexContainer) {
    container.addControl(this.textItem("name", `Ship Name: ${this.ship.name}`))
    container.addControl(this.textItem("class", `Ship Class: ${this.ship.weightClass}`))
    container.addControl(this.textItem("weight", `Ship Weight: ${this.ship.maxWeight} / ${this.ship.maxWeight}`))
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
    const label = this.textblock("label", `${name}: `)
    label.resizeToFit = true
    label.forceResizeWidth = true
    
    const item = new FlexItem("label", label)
    container.addControl(item)
    const mod = modifier.value < 0 ? "" : "+"
    const value = modifier.percent ? `${modifier.value * 100}%` : `${modifier.value}`
    container.addControl(new FlexItem("modifier", this.textblock("modifier", `${mod}${value}`)))
    label.onAfterDrawObservable.addOnce(() => {
      let measure = label.transformedMeasure
      item.node.markDirty()
      console.log(measure)
    })
    return container
  }
  compSection(container: FlexContainer) {
    const detailsSection = new FlexContainer("details")
    detailsSection.style.setFlex(1)
    detailsSection.style.setGap(Gutter.Row, 15)
    detailsSection.style.setPadding(Edge.All, 15)
    container.addControl(detailsSection)
    const selectComponent = (name: string, component: unknown, type: "afterburners" | "engines" | "radar"
    ) => {
      detailsSection.children.forEach((child) => {
        child.dispose().dispose()
        detailsSection.removeControl(child)
      })
      if (type == "afterburners") {
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
      container.children.forEach((child, index) => {
        if (child instanceof FlexItem && child.item instanceof GUI.Button) {
          const button = child.item as GUI.Button
          button.background = button.metadata == name ? "blue" : "gray"
        }
      })
    }
    container.addControl(this.textItem("afterburners", `-= Afterburners =-`))
    for (const afterBurner of Object.entries(Afterburners)) {
      const [name, component] = afterBurner
      const buttonItem = this.buttonItem(`afterburner-${component.name}`, `${component.name}`, () => {
        selectComponent(name, component, "afterburners")
      }, 50)
      buttonItem.item.metadata = name
      this.draggableFlexItem(buttonItem, this.shipSlotContainer, this.shipSlots, () => {
        let proxy = new GUI.Rectangle(`${name}-proxy`)
        proxy.widthInPixels = buttonItem.item.widthInPixels
        proxy.heightInPixels = buttonItem.item.heightInPixels
        proxy.background = "grey"
        return proxy
      },
      (flexItem) => {
        console.log("Dropped on item!")
        this.ship.afterburnerSlot.modifier = structuredClone(component)
        this.addShipSections(this.rightScroll)
      })
      container.addControl(buttonItem)
      // this.textItem(`afterburner-${component.name}`, `${component.name}`))
    }
    selectComponent(AfterburnerTypes.Light, Afterburners.Light, "afterburners")
  }

  draggableFlexItem(draggable: FlexItem, targetContainer: FlexContainer, targetItems: FlexItem[], proxyCreator: () => GUI.Container, droppedOnTarget: (flexItem: FlexItem) => void) {
    let draggedItem: GUI.Control

    this.observers.add(draggable.item.onPointerDownObservable.add((downEvent) => {
      console.log("proxy down", downEvent)
      let xoffset = draggable.item.getDimension("width").getValueInPixel(this.gui, 1) / 2
      let yoffset = draggable.item.getDimension("height").getValueInPixel(this.gui, 1) / 2
      let proxy = proxyCreator()
      let overTarget: FlexItem | undefined
      proxy.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
      proxy.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
      this.gui.addControl(proxy)
      let dragging = AppContainer.instance.scene.onPointerObservable.add((event) => {
        if (event.type != PointerEventTypes.POINTERMOVE) {
          return
        }
        const mousex = event.event.clientX
        const mousey = event.event.clientY
        console.log("proxy dragging", mousex, mousey)
        proxy.leftInPixels = mousex - xoffset
        proxy.topInPixels = mousey - yoffset
        if (targetContainer._container.contains(mousex, mousey)) {
          // inside target container, check if inside target item
          let target = undefined
          for (const item of targetItems) {
            if (item.item.contains(mousex, mousey)) {
              target = item
            }
          }
          overTarget = target
        } else {
          overTarget = undefined
        }
        console.log("proxy l/t", proxy.leftInPixels, proxy.topInPixels)
      })
      draggable.item.onPointerUpObservable.addOnce(() => {
        console.log("proxy up")
        dragging.remove()
        this.gui.removeControl(proxy)
        proxy.dispose
        if (overTarget != undefined) {
          droppedOnTarget(overTarget)
        }
      })
    }))
  }

  addShipSections(container: FlexContainer) {
    const sections = ["Front", "Core", "Left", "Right", "Back"]
    sections.forEach((name, index) => {
      const rectangle = new GUI.Rectangle(`${name}-rectangle`)
      const sectionContainer = new FlexContainer(`${name}-container`, undefined, rectangle)
      rectangle.thickness = 1
      
      const armor = this.ship.structure[name.toLowerCase()].armor
      const sectionName = this.textItem(name, name)
      const sectionTextblock = sectionName.item as GUI.TextBlock
      sectionTextblock.resizeToFit = true
      sectionTextblock.forceResizeWidth = true
      sectionTextblock.onAfterDrawObservable.addOnce(() => {
        sectionTextblock.markAsDirty()
      })
      sectionContainer.addControl(sectionName)
      if (armor != undefined) {
        const armorContainer = new FlexContainer(`${name}-armor-container`, undefined, undefined, FlexDirection.Row)
        armorContainer.style.setAlignItems(Align.Center)
        
        const armorTextBlock: GUI.TextBlock = this.textblock(`${name}-armor`, `${armor}(cm)`)
        const armorTextItem = new FlexItem(`${name}-armor`, armorTextBlock)
        armorTextBlock.resizeToFit = true
        armorTextBlock.forceResizeWidth = true
        armorTextBlock.onAfterDrawObservable.addOnce(() => {
          armorTextItem.node.markDirty()
        })
        // armorTextBlock.widthInPixels = 100
        armorContainer.addControl(this.buttonItem(`${name}-armor-down`, "<", () => {
          this.ship.structure[name.toLowerCase()].armor -= 5
          if (this.ship.structure[name.toLowerCase()].armor < 0) {
            this.ship.structure[name.toLowerCase()].armor = 0
          }
          armorTextBlock.text = `${this.ship.structure[name.toLowerCase()].armor}(cm)`
        }, 50, 50))
        armorContainer.addControl(armorTextItem)
        armorContainer.addControl(this.buttonItem(`${name}-armor-up`, ">", () => {
          this.ship.structure[name.toLowerCase()].armor += 5
          if (this.ship.structure[name.toLowerCase()].armor > this.ship.structure[name.toLowerCase()].maxArmor) {
            this.ship.structure[name.toLowerCase()].armor = this.ship.structure[name.toLowerCase()].maxArmor
          }
          armorTextBlock.text = `${this.ship.structure[name.toLowerCase()].armor}(cm)`
          this.root.markDirty()
        }, 50, 50))
        sectionContainer.addControl(armorContainer)
      }
      this.shipSlots = []
      this.shipSlotContainer = container
      const slots = this.ship.structure[name.toLowerCase()].slots as StructureSlotType[]
      // debugger
      for (let i = 0; i < slots.length; i += 1) {
        const slotType = slots[i]
        const slotIcon = slotType.charAt(0)
        let slotTextItem: FlexItem
        let slotTextBlock: GUI.TextBlock
        switch (slotType) {
          case "Afterburner": {
            const name = this.ship.afterburnerSlot.modifier?.name ?? "Afterburner"
            slotTextBlock = this.textblock(`${name}-slot-${i}`, `- ${slotIcon}[ ${name}`)
            break;
          }
          case "Radar": {
            const name = "Radar"
            slotTextBlock = this.textblock(`${name}-slot-${i}`, `- ${slotIcon}[ ${name}`)
            break
          }
          case "Engine": {
            const name = this.ship.engineSlot.modifier?.name ?? "Engine"
            slotTextBlock = this.textblock(`${name}-slot-${i}`, `- ${slotIcon}[ ${name}`)
            break
          }
          case "PowerPlant": {
            const name = this.ship.powerPlantSlot.modifier?.name ?? "Power Plant"
            slotTextBlock = this.textblock(`${name}-slot-${i}`, `- ${slotIcon}[ ${name}`)
            break
          }
          case "Shields": {
            const name = this.ship.shieldsSlot.modifier?.name ?? "Shields"
            slotTextBlock = this.textblock(`${name}-slot-${i}`, `- ${slotIcon}[ ${name}`)
            break
          }
          case "Thruster": {
            const name = this.ship.thrustersSlot.modifier?.name ?? "Thrusters"
            slotTextBlock = this.textblock(`${name}-slot-${i}`, `- ${slotIcon}[ ${name}`)
            break
          }
          // TODO: Gun and Weapon should come from items installed on the mounts
          case "Gun": {
            const name = "Gun"
            slotTextBlock = this.textblock(`${name}-slot-${i}`, `- ${slotIcon}[ ${name}`)
            break
          }
          case "Weapon": {
            const name = "Weapon"
            slotTextBlock = this.textblock(`${name}-slot-${i}`, `- ${slotIcon}[ ${name}`)
            break
          }
          // TODO: generic items should come from items installed on the slot
          // chould be fuel, ammo, or battery packs
          case "Generic": {
            const name = "Empty"
            slotTextBlock = this.textblock(`${name}-slot-${i}`, `- ${slotIcon}[ ${name}`)
            break
          }
          default: {
            slotTextBlock = this.textblock(`${name}-slot-${i}`, `- ${slotIcon}[ `)
            // slotTextItem = this.buttonItem(`${name}-slot-${i}`, `${slotIcon}[`, () => {

            // }, 50)
            break;
          }
        }
        slotTextBlock.resizeToFit = false
        slotTextBlock.heightInPixels = 50
        slotTextBlock.textVerticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER
        slotTextItem = new FlexItem(`${name}-slot-${i}`, slotTextBlock)
        this.shipSlots.push(slotTextItem)
        sectionContainer.addControl(slotTextItem)
      }
      container.addControl(sectionContainer)
    })
  }

  updateScreen(_dt: number): void {
    this.root.layout()
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

  createSegmentedControl(options: string[], callback: (selectedIndex: number) => void): FlexContainer {
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

    options.forEach((option, index) => {
        const button = this.button(`button_${index}`, option, () => {
          callback(index)
          updateButtonStates(index)
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
    updateButtonStates(0)
    callback(0)

    return stackPanel;
  }

  getTextMetricsWidth(textMetrics) {
    if (textMetrics.actualBoundingBoxLeft !== undefined) {
        return Math.abs(textMetrics.actualBoundingBoxLeft) + Math.abs(textMetrics.actualBoundingBoxRight);
    }
    return textMetrics.width;
  }

  textItem(name: string, text: string): FlexItem {
    const text1 = this.textblock(name, text)
    const text1FlexItem = new FlexItem(`${name}-flex`, text1)
    text1FlexItem.getMeasure = (width, _widthMode, _height, _heightMode): {width: number, height: number} => {
      text1.widthInPixels = width
      text1.heightInPixels = text1.computeExpectedHeight()
      return { width: text1.widthInPixels, height: text1.computeExpectedHeight() }
    }
    return text1FlexItem
  }
  textblock(name: string, text: string): GUI.TextBlock {
    const text1 = new GUI.TextBlock(name, text)
    text1.textWrapping = GUI.TextWrapping.WordWrap
    text1.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    // text1.textVerticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    text1.fontFamily = "KongfaceRegular"
    text1.color = "gold"
    return text1
  }
}
