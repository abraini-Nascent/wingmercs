import { AppContainer } from "./../../../app.container"
import { TextBlock } from "@babylonjs/gui"
import * as GUI from "@babylonjs/gui"
import { Entity } from "../../../world/world"
import {
  DisposeBag,
  FluentBehaviourState,
  FluentState,
  FluentTextBlock,
  FluentVerticalStackPanel,
  Ref,
} from "../../../utils/fluentGui"
import { VDU } from "./SpaceCombatHUD.VDU"

export class DebugInputVDU implements VDU {
  screen: GUI.Container
  disposeBag = new DisposeBag()
  detailsStack = new Ref<GUI.StackPanel>()
  pitchState = new FluentBehaviourState<string>("")
  yawState = new FluentBehaviourState<string>("")
  rollState = new FluentBehaviourState<string>("")
  burnerState = new FluentBehaviourState<string>("")
  driftState = new FluentBehaviourState<string>("")
  breakState = new FluentBehaviourState<string>("")
  throttleState = new FluentBehaviourState<string>("")
  fpsState = new FluentBehaviourState<string>("")
  get mainComponent(): GUI.Control {
    return this.screen
  }
  constructor() {
    this.setupMain()
  }
  dispose() {
    this.disposeBag.dispose()
  }
  vduButtonPressed(_button: number) {}
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
        new FluentTextBlock("pitch", "").modifyControl(styleFont).bindState(this.pitchState, (tb, v) => tb.setText(v)),
        new FluentTextBlock("yaw", "").modifyControl(styleFont).bindState(this.yawState, (tb, v) => tb.setText(v)),
        new FluentTextBlock("roll", "").modifyControl(styleFont).bindState(this.rollState, (tb, v) => tb.setText(v)),
        new FluentTextBlock("burner", "")
          .modifyControl(styleFont)
          .bindState(this.burnerState, (tb, v) => tb.setText(v)),
        new FluentTextBlock("drift", "").modifyControl(styleFont).bindState(this.driftState, (tb, v) => tb.setText(v)),
        new FluentTextBlock("break", "").modifyControl(styleFont).bindState(this.breakState, (tb, v) => tb.setText(v)),
        new FluentTextBlock("throttle", "")
          .modifyControl(styleFont)
          .bindState(this.throttleState, (tb, v) => tb.setText(v)),
        new FluentTextBlock("fps", "").modifyControl(styleFont).bindState(this.fpsState, (tb, v) => tb.setText(v))
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
