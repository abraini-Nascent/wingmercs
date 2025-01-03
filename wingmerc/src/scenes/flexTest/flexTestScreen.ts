import { Color3 } from "@babylonjs/core"
import { Align, Edge, FlexContainer, FlexDirection, FlexItem, Gutter, Justify } from "../../utils/guiHelpers"
import { MercScreen } from "../screen"
import * as GUI from "@babylonjs/gui"

export class FlexTestScreen extends MercScreen {
  root: FlexContainer
  constructor() {
    super("FlexTest")
    this.setupMain()
  }
  setupMain(): void {
    /**
<Layout config={{useWebDefaults: false}}>
  <Node style={{width: 250, height: 475, padding: 10}}>
    <Node style={{flex: 1, rowGap: 10}}>
      <Node style={{height: 60}} />
      <Node style={{flex: 1, marginInline: 10}} />
      <Node style={{flex: 2, marginInline: 10}} />
      <Node
        style={{
          position: "absolute",
          width: "100%",
          bottom: 0,
          height: 64,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
        }}
      >
        <Node style={{height: 40, width: 40}} />
        <Node style={{height: 40, width: 40}} />
        <Node style={{height: 40, width: 40}} />
        <Node style={{height: 40, width: 40}} />
      </Node>
    </Node>
  </Node>
</Layout>
 */

    const scrollviewplain = new GUI.ScrollViewer("plain")
    scrollviewplain.heightInPixels = 600
    scrollviewplain.widthInPixels = 800
    scrollviewplain.background = "red"
    this.gui.addControl(scrollviewplain)
    const singleContainer = new GUI.Container("single-container")
    scrollviewplain.addControl(singleContainer)
    let offset = 20
    singleContainer.heightInPixels = 20
    for (let i = 0; i < 20; i += 1) {
      const textbox = new GUI.TextBlock(`text-${i}`, `TEXT TEST ${i}`)
      textbox.fontFamily = "monospace"
      textbox.topInPixels = offset
      textbox.heightInPixels = 50
      textbox.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
      offset += 50
      singleContainer.addControl(textbox)
    }
    singleContainer.heightInPixels += offset + 50

    const root = new FlexContainer("root", this.gui, undefined, FlexDirection.Row)
    root.style.setPadding(Edge.All, 10)
    root.width = 250
    root.height = 475

    const child0 = new FlexContainer("child0")
    child0.style.setFlex(1)
    child0.style.setGap(Gutter.Row, 10)
    root.addControl(child0)

    const child1 = new FlexContainer("child1")
    child1.style.setHeight(60)
    child0.addControl(child1)
    const child2 = new FlexContainer("child2")
    child2.style.setFlex(1)
    child2.style.setMargin(Edge.Start, 10)
    child2.style.setMargin(Edge.End, 10)
    child0.addControl(child2)
    const child3 = new FlexContainer("child3")
    child3.style.setFlex(2)
    child3.style.setMargin(Edge.Start, 10)
    child3.style.setMargin(Edge.End, 10)
    child3.style.setPadding(Edge.All, 10)
    // child3.clipChildren = true
    child0.addControl(child3)

    const child5 = FlexContainer.CreateScrollView("scroll-test", child3)
    // const scrollView = new GUI.ScrollViewer("scroll1")
    // scrollView.wheelPrecision = 1
    // scrollView.freezeControls = false
    // const child4 = new FlexContainer("child4", undefined, scrollView)
    // child3.addControl(child4)
    // const direct = new GUI.Container("direct")
    // scrollView.addControl(direct)

    // const child5 = new FlexContainer("child5", undefined)
    // child5.style.setFlexGrow(1)
    // direct.addControl(child5._container)
    // direct.onBeforeDrawObservable.addOnce(() => {
    //   child5.layout()
    //   direct.heightInPixels = child5.height
    //   direct.widthInPixels = child5.width
    // })
    // // child4.addControl(child5)
    // child4.style.setFlex(1)

    let directOffset = 0
    for (let i = 0; i < 20; i += 1) {
      const text = new GUI.TextBlock(`text-${i + 1}`, `I am item number: ${i + 1} !`)
      text.resizeToFit = true
      text.textWrapping = GUI.TextWrapping.WordWrap
      text.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
      text.textVerticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
      text.fontFamily = "monospace"
      text.topInPixels = directOffset
      // directOffset += 50
      // direct.addControl(text)
      // continue;
      const textFlexItem = new FlexItem(`text-${i + 1}-flex`, text)
      textFlexItem.getMeasure = (width, _widthMode, _height, _heightMode): { width: number; height: number } => {
        text.widthInPixels = width
        text.heightInPixels = text.computeExpectedHeight()
        const result = { width: text.widthInPixels, height: text.heightInPixels }
        return result
      }
      child5.addControl(textFlexItem)
    }

    const bottomBar = new FlexContainer("bottomBar")
    bottomBar.style.setPosition(Edge.Bottom, 0)
    bottomBar.style.setWidthPercent(100)
    bottomBar.style.setHeight(64)
    bottomBar.style.setFlexDirection(FlexDirection.Row)
    bottomBar.style.setAlignItems(Align.Center)
    bottomBar.style.setJustifyContent(Justify.SpaceEvenly)
    child0.addControl(bottomBar)

    const icon1 = new GUI.Rectangle("icon1")
    icon1.widthInPixels = 40
    icon1.heightInPixels = 40
    icon1.background = Color3.Red().toHexString()
    bottomBar.addControl(icon1)

    const icon2 = new GUI.Rectangle("icon2")
    icon2.widthInPixels = 40
    icon2.heightInPixels = 40
    icon2.background = Color3.Green().toHexString()
    bottomBar.addControl(icon2)

    const icon3 = new GUI.Rectangle("icon3")
    icon3.widthInPixels = 40
    icon3.heightInPixels = 40
    icon3.background = Color3.Blue().toHexString()
    bottomBar.addControl(icon3)

    const icon4 = new GUI.Rectangle("icon4")
    icon4.widthInPixels = 40
    icon4.heightInPixels = 40
    icon4.background = Color3.Yellow().toHexString()
    bottomBar.addControl(icon4)

    this.root = root
  }

  updateScreen(_dt: number): void {
    this.root.layout()
  }
}
