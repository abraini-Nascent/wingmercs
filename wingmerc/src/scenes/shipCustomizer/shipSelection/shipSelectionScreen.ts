import { Animation, Color3, IDisposable, Mesh, Observer, TransformNode, Vector2, Vector3 } from "@babylonjs/core"
import {
  Align,
  Edge,
  FlexContainer,
  FlexDirection,
  FlexItem,
  Gutter,
  Justify,
  resizeToFitTextBlock,
} from "../../../utils/guiHelpers"
import { MercScreen } from "../../screen"
import * as GUI from "@babylonjs/gui"
import { Ships } from "../../../data/ships"
import { Entity } from "../../../world/world"
import { AngleBetweenVectors, ToDegree, generatePointsOnCircle } from "../../../utils/math"
import { AppContainer } from "../../../app.container"
import { ShipCustomizerScene } from "../shipCustomizerLoop"
import { ShipTemplate } from "../../../data/ships/shipTemplate"
import { Button, ButtonItem, TextBlock } from "../../components"
import { MainMenuScene } from "../../mainMenu/mainMenuLoop"
import { debugLog } from "../../../utils/debuglog"

export class ShipSelectionScreen extends MercScreen {
  // xr
  xrMode: boolean = false
  xrPlane: Mesh
  xrIdealWidth = 1920
  xrAspectRation = 16 / 9

  shipsRoot: FlexContainer
  shipModels: { [name: string]: Entity } = {}
  observers = new Set<unknown>()
  carouselPoints: Vector3[] = []
  carouselNames: string[] = []
  carouselNode: TransformNode
  currentIndex: number = 0
  disposibles = new Set<IDisposable>()

  onSelect: (selected: ShipTemplate) => void

  // GUI Nodes
  scrollView: FlexContainer
  statsScroll: FlexContainer

  constructor() {
    super("ShipSelection")
    this.setupMain()
  }

  dispose() {
    super.dispose()
    for (let item of this.observers) {
      let observer = item as Observer<unknown>
      observer.remove()
    }
    this.observers.clear()
    this.shipsRoot.dispose()
    this.disposibles.forEach((disposible) => {
      disposible.dispose()
    })
    this.disposibles.clear()
  }

  setupMain(): void {
    const shipsRoot = new FlexContainer("shipsRoot", this.gui, undefined, FlexDirection.Row)
    this.shipsRoot = shipsRoot
    shipsRoot.style.setPadding(Edge.All, 10)
    shipsRoot.width = AppContainer.instance.engine.getRenderWidth()
    shipsRoot.height = AppContainer.instance.engine.getRenderHeight()
    this.observers.add(
      AppContainer.instance.engine.onResizeObservable.add(() => {
        shipsRoot.width = AppContainer.instance.engine.getRenderWidth()
        shipsRoot.height = AppContainer.instance.engine.getRenderHeight()
        shipsRoot.markDirty()
        debugLog("Resize: ", shipsRoot.width, shipsRoot.height)
      })
    )

    const shipsScrollView = new GUI.ScrollViewer("scroll1")
    const shipsScroll = new FlexContainer("scroll1", undefined, shipsScrollView)
    shipsScroll.style.setFlex(1)
    shipsScroll.style.setGap(Gutter.Row, 15)
    shipsScroll.style.setPadding(Edge.All, 15)
    shipsRoot.addControl(shipsScroll)
    this.scrollView = shipsScroll

    const spacer = new FlexContainer("spacer")
    spacer.style.setFlex(1.5)
    spacer.style.setJustifyContent(Justify.FlexEnd)
    shipsRoot.addControl(spacer)

    const bottomButtonSection = new FlexContainer("bottomButtonSection")
    bottomButtonSection.style.setFlexDirection(FlexDirection.Row)
    bottomButtonSection.style.setJustifyContent(Justify.SpaceEvenly)
    spacer.addControl(bottomButtonSection)

    const back = ButtonItem(
      Button(TextBlock("back", "Back", true, undefined, GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER), () => {
        // navigate to previous screen
        let oldScene = AppContainer.instance.gameScene
        let nextScene = new MainMenuScene()
        AppContainer.instance.gameScene = nextScene
        oldScene.dispose()
      }),
      120
    )
    bottomButtonSection.addControl(back)

    const select = ButtonItem(
      Button(TextBlock("select", "Select", true, undefined, GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER), () => {
        let ship = Ships[this.carouselNames[this.currentIndex]] as ShipTemplate
        if (this.onSelect) {
          this.onSelect(ship)
        } else {
          ship = structuredClone(ship)
          let oldScene = AppContainer.instance.gameScene
          let nextScene = new ShipCustomizerScene(ship)
          AppContainer.instance.gameScene = nextScene
          oldScene.dispose()
        }
      }),
      120
    )
    bottomButtonSection.addControl(select)

    const statsScrollView = new GUI.ScrollViewer("scroll2")
    const statsScroll = new FlexContainer("scroll2", undefined, statsScrollView)
    this.statsScroll = statsScroll
    statsScroll.style.setFlex(1)
    statsScroll.style.setGap(Gutter.Row, 15)
    statsScroll.style.setPadding(Edge.All, 15)
    shipsRoot.addControl(statsScroll)
  }

  shipButtonItem(name: string, text: string, onClick: () => void, height: number = 40): FlexItem {
    const button1 = this.shipButton(name, text, onClick, height)
    const button1FlexItem = new FlexItem(`${name}-flex`, button1)
    GUI.Button.CreateImageWithCenterTextButton
    button1FlexItem.getMeasure = (width, _widthMode, _height, _heightMode): { width: number; height: number } => {
      button1.widthInPixels = width
      return { width: button1.widthInPixels, height: button1.heightInPixels }
    }
    return button1FlexItem
  }

  shipButton(name: string, text: string, onClick: () => void, height: number = 40): GUI.Button {
    let button1 = new GUI.Button(`${name}-button`)
    let text1 = this.textblock(name, text)
    ;(button1 as any)._textBlock = text1
    button1.addControl(text1)
    text1.leftInPixels = 15
    button1.heightInPixels = height
    this.observers.add(
      button1.onPointerClickObservable.add(() => {
        onClick()
      })
    )
    return button1
  }

  textItem(name: string, text: string): FlexItem {
    const text1 = this.textblock(name, text)
    const text1FlexItem = new FlexItem(`${name}-flex`, text1)
    text1FlexItem.getMeasure = (width, _widthMode, _height, _heightMode): { width: number; height: number } => {
      text1.widthInPixels = width
      text1.heightInPixels = text1.computeExpectedHeight()
      return {
        width: text1.widthInPixels,
        height: text1.computeExpectedHeight(),
      }
    }
    return text1FlexItem
  }
  textblock(name: string, text: string): GUI.TextBlock {
    const text1 = new GUI.TextBlock(name, text)
    text1.resizeToFit = true
    text1.textWrapping = GUI.TextWrapping.WordWrap
    text1.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    // text1.textVerticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    text1.fontFamily = "KongfaceRegular"
    text1.color = "gold"
    return text1
  }

  setShipStats() {
    // remove old children
    for (const child of this.statsScroll.children) {
      debugLog("[shipselection] disposing child", child)
      this.statsScroll.removeControl(child).dispose()?.dispose()
    }
    const ship = Ships[this.carouselNames[this.currentIndex]] as ShipTemplate
    this.statsScroll.addControl(this.textItem("name", `Ship Name: ${ship.name}`))
    this.statsScroll.addControl(this.textItem("class", `Ship Class: ${ship.weightClass}`))
    this.statsScroll.addControl(this.textItem("weight", `Ship Weight: ${ship.maxWeight}`))
    this.statsScroll.addControl(this.textItem("cruise", `Cruise Speed: ${ship.engineSlot.base.cruiseSpeed}.mps`))
    this.statsScroll.addControl(this.textItem("max", `Max Speed: ${ship.afterburnerSlot.base.maxSpeed}.mps`))
    this.statsScroll.addControl(this.textItem("flight", `Flight`))
    this.statsScroll.addControl(this.textItem("pitch", `Pitch: ${ship.thrustersSlot.base.pitch}.dps`))
    this.statsScroll.addControl(this.textItem("yaw", `Yaw: ${ship.thrustersSlot.base.yaw}.dps`))
    this.statsScroll.addControl(this.textItem("roll", `Roll: ${ship.thrustersSlot.base.roll}.dps`))
    this.statsScroll.addControl(this.textItem("durability", `Durability`))
    this.statsScroll.addControl(this.textItem("shields fore", `Shields Fore: ${ship.shieldsSlot.base.fore / 10}(cm)`))
    this.statsScroll.addControl(this.textItem("shields aft", `Shields Aft:  ${ship.shieldsSlot.base.aft / 10}(cm)`))
    this.statsScroll.addControl(this.textItem("armor front", `Armor Front:  ${ship.structure.front.armor / 10}(cm)`))
    this.statsScroll.addControl(this.textItem("armor back", `Armor Back:   ${ship.structure.back.armor / 10}(cm)`))
    this.statsScroll.addControl(this.textItem("armor left", `Armor Left:   ${ship.structure.left.armor / 10}(cm)`))
    this.statsScroll.addControl(this.textItem("armor right", `Armor Right:  ${ship.structure.right.armor / 10}(cm)`))
    this.statsScroll.addControl(this.textItem("systems", `Systems: ${ship.structure.core.health}`))
    this.statsScroll.addControl(this.textItem("guns", `Gun Mounts`))
    this.statsScroll.addControl(this.textItem("weapons", `Weapon Mounts`))
  }

  rotateParentToNextPoint(next: number = 1) {
    // Get the current point position and the next point position
    const currentPoint = this.carouselPoints[0]
    const nextPoint = this.carouselPoints[1]

    // Calculate the angle between the current direction and the forward direction (1, 0, 0)
    const angle = AngleBetweenVectors(currentPoint, nextPoint)

    // Apply the rotation to the parent transform node
    let rotation = angle * next
    debugLog(`next: ${next}, current: ${this.currentIndex}, angle: ${ToDegree(angle)}, rotation: ${ToDegree(rotation)}`)

    // Create animation
    const rotateAnimation = new Animation(
      "rotateAnimation",
      "rotation.y",
      30, // Frames per second
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    )

    // Define keyframes
    const keyFrames = []
    keyFrames.push({
      frame: 0,
      value: this.carouselNode.rotation.y,
    })
    keyFrames.push({
      frame: 30, // Assuming 30 frames per second, adjust this according to your needs
      value: rotation,
    })

    // Set keyframes
    rotateAnimation.setKeys(keyFrames)

    // Attach animation to the parent transform node
    this.carouselNode.animations.push(rotateAnimation)

    // Start animation
    AppContainer.instance.scene.beginAnimation(this.carouselNode, 0, 30, false, 2.75)

    this.currentIndex = next
  }

  setModels(models: { [name: string]: Entity } = {}) {
    this.shipModels = models
    this.carouselNames = []
    const points = generatePointsOnCircle(80, Object.keys(this.shipModels).length)
    this.carouselPoints = points
    this.carouselNode = new TransformNode("carouselNode")
    const center = Vector3.Zero()
    Object.entries(this.shipModels).forEach((entry, index) => {
      const [name, entity] = entry
      const node = entity.node
      this.carouselNames[index] = name
      node.position.copyFrom(points[index])
      const direction = center.subtract(node.position)
      node.lookAt(node.position.add(direction), Math.PI)
      node.parent = this.carouselNode

      let shipIndex = index
      let ship = Ships[name] as ShipTemplate
      this.scrollView.addControl(
        this.shipButtonItem(name, ship.name, () => {
          this.rotateParentToNextPoint(shipIndex)
          this.setShipStats()
        })
      )
    })
    let camera = AppContainer.instance.camera
    camera.position.setAll(0)
    camera.position.y = 25
    camera.setTarget(points[0])
    this.setShipStats()

    // setInterval(() => {
    //   this.rotateParentToNextPoint(1)
    // }, 1000)
  }

  updateScreen(_dt: number): void {
    this.shipsRoot.layout()
    MercScreen.xrPanel(this)
  }
}
