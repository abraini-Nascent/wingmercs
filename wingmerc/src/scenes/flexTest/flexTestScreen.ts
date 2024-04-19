import { Color3 } from "@babylonjs/core";
import { Align, Edge, FlexContainer, FlexDirection, FlexItem, Gutter, Justify } from "../../utils/guiHelpers";
import { MercScreen } from "../screen";
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

    const root = new FlexContainer("root", this.gui, FlexDirection.Row)
    // root.flexDetails.setWidth(250)
    // root.flexDetails.setHeight(475)
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
    child3.clipChildren = true
    child0.addControl(child3)

    const text1 = new GUI.TextBlock("text1", "Can we make a text block work with yoga flow so that they work and align correctly?")
    text1.resizeToFit = true
    text1.textWrapping = GUI.TextWrapping.WordWrap
    text1.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    text1.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    text1.fontFamily = "monospace"
    const text2 = new GUI.TextBlock("text2", "What if we make two text blocks, will they align properly in the parent container, and make it soo long that it will go past the container???")
    text2.resizeToFit = true
    text2.textWrapping = GUI.TextWrapping.WordWrap
    text2.fontFamily = "monospace"
    const text1FlexItem = new FlexItem("test1-flex", text1)
    text1FlexItem.getMeasure = (width, widthMode, height, heightMode): {width: number, height: number} => {
      text1.widthInPixels = width
      text1.heightInPixels = text1.computeExpectedHeight()
      return { width: text1.widthInPixels, height: text1.computeExpectedHeight() }
    }
    const text2FlexItem = new FlexItem("test2-flex", text2)
    text2FlexItem.getMeasure = (width, widthMode, height, heightMode): {width: number, height: number} => {
      text2.widthInPixels = width
      text2.heightInPixels = text2.computeExpectedHeight()
      return { width: text2.widthInPixels, height: text2.computeExpectedHeight() }
    }
    child3.addControl(text1FlexItem)
    child3.addControl(text2FlexItem)

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

  updateScreen(dt: number): void {
    this.root.layout()
  }
}