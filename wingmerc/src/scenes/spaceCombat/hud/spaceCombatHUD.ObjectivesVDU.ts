import { TextBlock } from "@babylonjs/gui"
import * as GUI from "@babylonjs/gui"
import { Entity } from "../../../world/world"
import { DisposeBag, FluentTextBlock, FluentVerticalStackPanel, Ref } from "../../../utils/fluentGui"
import { VDU } from "./SpaceCombatHUD.VDU"

export class ObjectivesVDU implements VDU {
  screen: GUI.Container
  disposeBag = new DisposeBag()
  detailsStack = new Ref<GUI.StackPanel>()
  objectives = new Map<string, FluentTextBlock>()
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
      new FluentTextBlock("title", "-=[Objectives]=-").resizeToFit(true).modifyControl(styleFont),
      FluentVerticalStackPanel("stack-main").storeIn(this.detailsStack).width(240).horizontalAlignment("left")
    )
      .width(240)
      .height(240)
      .build()
  }

  styleObjective(tb: TextBlock) {
    tb.fontFamily = "monospace"
    tb.color = "white"
    tb.fontSize = "18px"
    tb.height = "20px"
  }
  styleStep(tb: TextBlock) {
    tb.fontFamily = "monospace"
    tb.color = "white"
    tb.fontSize = "14px"
    tb.textWrapping = true
    tb.widthInPixels = 240
    tb.heightInPixels = 30
    tb.lineSpacing = "0px"
  }

  update(playerEntity: Entity, dt: number) {
    if (playerEntity.objectiveDetails) {
      for (const objective of playerEntity.objectiveDetails) {
        const objectiveKey = `${objective.id}`
        if (this.objectives.has(objectiveKey)) {
          // biff
          const textBlock = this.objectives.get(objectiveKey)
          if (objective.complete) {
            textBlock.color("green")
          }
        } else {
          // boff
          const textblock = new FluentTextBlock(`objective-${objective.id}`, objective.description)
            .modifyControl(this.styleObjective)
            .textHorizontalAlignment("left")
          this.detailsStack.get().addControl(textblock.build())
          this.objectives.set(objectiveKey, textblock)
        }
        for (const step of objective.steps) {
          const stepKey = objectiveKey + `.${step.id}`
          if (this.objectives.has(stepKey)) {
            // snorp
            if (objective.completedSteps.includes(step.id)) {
              const stepTB = this.objectives.get(stepKey)
              stepTB.color("green")
            }
          } else {
            const textblock = new FluentTextBlock(
              `objective-${stepKey}`,
              `- ${step.type} ${step.location ? `\r\n  at ${step.location.name}` : ""}`
            )
              .modifyControl(this.styleStep)
              .textHorizontalAlignment("left")
            const padding = textblock.boxPadding(0, 0, 5, 0)
            this.detailsStack.get().addControl(padding.build())
            this.objectives.set(stepKey, textblock)
          }
        }
      }
    }
    this.detailsStack.get().isVisible = true
  }
}
