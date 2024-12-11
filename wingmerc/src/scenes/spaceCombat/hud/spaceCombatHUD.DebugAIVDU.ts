import { TextBlock } from "@babylonjs/gui"
import * as GUI from "@babylonjs/gui"
import { Entity, EntityForId } from "../../../world/world"
import {
  DisposeBag,
  FluentContainer,
  FluentStackPanel,
  FluentState,
  FluentTextBlock,
  FluentVerticalStackPanel,
  Ref,
} from "../../../utils/fluentGui"

export class DebugAIVDU {
  screen: GUI.Container
  disposeBag = new DisposeBag()
  detailsStack = new Ref<GUI.StackPanel>()
  missionState = new FluentState<TextBlock, FluentTextBlock>()
  objectiveState = new FluentState<TextBlock, FluentTextBlock>()
  tacticState = new FluentState<TextBlock, FluentTextBlock>()
  sohState = new FluentState<TextBlock, FluentTextBlock>()
  socState = new FluentState<TextBlock, FluentTextBlock>()
  maneuverState = new FluentState<TextBlock, FluentTextBlock>()
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
        new FluentTextBlock("mission", "")
          .modifyControl(styleFont)
          .setState(this.missionState, (tb, v) => tb.setText(v), ""),
        new FluentTextBlock("objective", "")
          .modifyControl(styleFont)
          .setState(this.objectiveState, (tb, v) => tb.setText(v), ""),
        new FluentTextBlock("tactic", "")
          .modifyControl(styleFont)
          .setState(this.tacticState, (tb, v) => tb.setText(v), ""),
        new FluentTextBlock("soh", "").modifyControl(styleFont).setState(this.sohState, (tb, v) => tb.setText(v), ""),
        new FluentTextBlock("soc", "").modifyControl(styleFont).setState(this.socState, (tb, v) => tb.setText(v), ""),
        new FluentTextBlock("maneuver", "")
          .modifyControl(styleFont)
          .setState(this.maneuverState, (tb, v) => tb.setText(v), "")
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
    if (playerEntity.targeting?.target == undefined || playerEntity.targeting?.target == "") {
      this.detailsStack.get().isVisible = false
      return
    }
    if ((window as any).pauseAi) {
      return
    }
    const ship = EntityForId(playerEntity.targeting?.target)
    const ai = ship.ai
    if (ai == undefined) {
      this.detailsStack.get().isVisible = false
      return
    }
    this.detailsStack.get().isVisible = true
    this.missionState.setValue(`mission: ${ai.blackboard.intelligence.mission}`)
    this.objectiveState.setValue(`objective: ${ai.blackboard.intelligence.objective}`)
    this.tacticState.setValue(`tactic: ${ai.blackboard.intelligence.tactic}`)
    this.sohState.setValue(`SoH: ${ai.blackboard.intelligence.stateOfHealth}`)
    this.socState.setValue(`SoC: ${ai.blackboard.intelligence.stateOfConfrontation}`)
    this.maneuverState.setValue(`maneuver: ${ai.blackboard.intelligence.maneuver}`)
  }
}
