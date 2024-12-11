import { AppContainer } from "./../../../app.container"
import { TextBlock } from "@babylonjs/gui"
import * as GUI from "@babylonjs/gui"
import { Entity } from "../../../world/world"
import { DisposeBag, FluentState, FluentTextBlock, FluentVerticalStackPanel, Ref } from "../../../utils/fluentGui"

export class DebugInputVDU {
  screen: GUI.Container
  disposeBag = new DisposeBag()
  detailsStack = new Ref<GUI.StackPanel>()
  pitchState = new FluentState<TextBlock, FluentTextBlock>()
  yawState = new FluentState<TextBlock, FluentTextBlock>()
  rollState = new FluentState<TextBlock, FluentTextBlock>()
  burnerState = new FluentState<TextBlock, FluentTextBlock>()
  driftState = new FluentState<TextBlock, FluentTextBlock>()
  breakState = new FluentState<TextBlock, FluentTextBlock>()
  throttleState = new FluentState<TextBlock, FluentTextBlock>()
  fpsState = new FluentState<TextBlock, FluentTextBlock>()
  get mainComponent(): GUI.Control {
    return this.screen
  }
  constructor() {
    this.setupMain()
  }
  dispose() {
    this.disposeBag.dispose()
  }
  setupMain() {
    const styleFont = (control: GUI.TextBlock) => {
      control.fontFamily = "monospace"
      control.color = "white"
      control.fontSize = 15
      control.resizeToFit = true
      control.height = "20px"
    }
    this.screen = FluentVerticalStackPanel(
      "stack",
      new FluentTextBlock("title", "-=[AI Debugging]=-").resizeToFit(true).modifyControl(styleFont),
      FluentVerticalStackPanel(
        "stack-main",
        new FluentTextBlock("pitch", "")
          .modifyControl(styleFont)
          .setState(this.pitchState, (tb, v) => tb.setText(v), ""),
        new FluentTextBlock("yaw", "").modifyControl(styleFont).setState(this.yawState, (tb, v) => tb.setText(v), ""),
        new FluentTextBlock("roll", "").modifyControl(styleFont).setState(this.rollState, (tb, v) => tb.setText(v), ""),
        new FluentTextBlock("burner", "")
          .modifyControl(styleFont)
          .setState(this.burnerState, (tb, v) => tb.setText(v), ""),
        new FluentTextBlock("drift", "")
          .modifyControl(styleFont)
          .setState(this.driftState, (tb, v) => tb.setText(v), ""),
        new FluentTextBlock("break", "")
          .modifyControl(styleFont)
          .setState(this.breakState, (tb, v) => tb.setText(v), ""),
        new FluentTextBlock("throttle", "")
          .modifyControl(styleFont)
          .setState(this.throttleState, (tb, v) => tb.setText(v), ""),
        new FluentTextBlock("fps", "").modifyControl(styleFont).setState(this.fpsState, (tb, v) => tb.setText(v), "")
      )
        .storeIn(this.detailsStack)
        .width(240)
        .horizontalAlignment("left")
    )
      .width(240)
      .height(240)
      .build()
  }

  update(playerEntity: Entity, dt: number) {
    const ship = playerEntity.movementCommand
    this.detailsStack.get().isVisible = true
    this.pitchState.setValue(`pitch: ${ship?.pitch.toFixed(2) ?? 0}`)
    this.yawState.setValue(`yaw..: ${ship?.yaw.toFixed(2) ?? 0}`)
    this.rollState.setValue(`roll.: ${ship?.roll.toFixed(2) ?? 0}`)
    this.burnerState.setValue(`burn.: ${ship?.afterburner.toFixed(2) ?? 0}`)
    this.driftState.setValue(`drift: ${ship?.drift.toFixed(2) ?? 0}`)
    this.breakState.setValue(`break: ${ship?.brake.toFixed(2) ?? 0}`)
    this.throttleState.setValue(`speed: ${ship?.deltaSpeed.toFixed(2) ?? 0}`)
    this.fpsState.setValue(`fps: ${AppContainer.instance.engine.getFps().toFixed()}`)
  }
}
