import { TextBlock } from "@babylonjs/gui";
import * as GUI from "@babylonjs/gui"
import { randomItem } from "../../utils/random";

const STATIC_SYMBOLS = "⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟⠠⠡⠢⠣⠤⠥⠦⠧⠨⠩⠪⠫⠬⠭⠮⠯⠰⠱⠲⠳⠴⠵⠶⠷⠸⠹⠺⠻⠼⠽⠾⠿"
export class StaticVDU {

  staticPanel: GUI.StackPanel
  lines: TextBlock[] = []
  acc: number = 0
  reset: number = 300

  get mainComponent(): GUI.Control {
    return this.staticPanel
  }
  get isVisible(): boolean {
    return this.staticPanel.isVisible
  }
  set isVisible(value: boolean) {
    this.staticPanel.isVisible = value
  }
  constructor() {
    this.setupComponents()
  }
  dispose() {
    Object.values(this.lines).forEach((tb) => tb.dispose())
    this.staticPanel.dispose()
  }
  setupComponents() {
    const staticPanel = new GUI.StackPanel("Static Panel")
    staticPanel.isVertical = true
    staticPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    staticPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    staticPanel.width = "240px"
    staticPanel.height = "240px"
    this.staticPanel = staticPanel
    for (let i = 0; i < 10; i += 1) {
      const line = this.StaticText(`line ${i}`, "")
      this.lines[i] = line
      this.staticPanel.addControl(line)
    }
  }

  update(dt) {
    this.acc += dt
    if (this.acc < this.reset) {
      return
    }
    this.acc = this.acc % this.reset
    for (const line of this.lines) {
      let lineText = ""
      for (let i = 0; i < 15; i += 1) {
        lineText += randomItem(STATIC_SYMBOLS)
      }
      line.text = lineText
    }
  }

  StaticText(name: string, value: string): GUI.TextBlock {
    const gunTextBlock = new GUI.TextBlock(name)
    gunTextBlock.fontFamily = "monospace"
    gunTextBlock.text = value
    gunTextBlock.color = "white"
    gunTextBlock.fontSize = 24
    gunTextBlock.height = "24px"
    gunTextBlock.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    gunTextBlock.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    this.staticPanel.addControl(gunTextBlock)
    return gunTextBlock
  }
}