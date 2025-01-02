import * as GUI from "@babylonjs/gui"
import { FlexContainer, FlexDirection, FlexItem } from "../utils/guiHelpers"

export function MainMenuButton(name: string, text: string): GUI.Button {
  let button = GUI.Button.CreateSimpleButton(name, text)
  button.textBlock.fontFamily = "Regular5"
  button.textBlock.color = "gold"
  button.textBlock.fontSizeInPixels = 15
  button.heightInPixels = 40
  button.widthInPixels = 280
  button.background = "dark blue"
  return button
}
export function clearSection(section: FlexContainer) {
  section.children.forEach((child) => {
    console.log("removing", child)
    section.removeControl(child)
    child.dispose().dispose()
  })
}
export function ButtonItem(button: GUI.Button, width?: number): FlexItem {
  const buttonFlexItem = new FlexItem(`${name}-flex`, button)
  const buttonWidth = width
  buttonFlexItem.getMeasure = (width, _widthMode, _height, _heightMode): { width: number; height: number } => {
    if (buttonWidth != undefined) {
      button.widthInPixels = buttonWidth
    } else {
      button.widthInPixels = width
    }
    return { width: button.widthInPixels, height: button.heightInPixels }
  }
  return buttonFlexItem
}

export function Button(textBlock: GUI.TextBlock, onClick: () => void, height: number = 40): GUI.Button {
  const button = new GUI.Button(`${textBlock.name}-button`)
  ;(button as any)._textBlock = textBlock
  button.addControl(textBlock)
  // textBlock.leftInPixels = 15
  button.heightInPixels = height
  let observer = button.onPointerClickObservable.add(() => {
    onClick()
  })
  textBlock.onDisposeObservable.addOnce(() => {
    observer.remove()
    observer = undefined
  })
  return button
}

export function TextItem(textBlock: GUI.TextBlock): FlexItem {
  const textFlexItem = new FlexItem(`${textBlock.name}-flex`, textBlock)
  textFlexItem.getMeasure = (width, _widthMode, _height, _heightMode): { width: number; height: number } => {
    if (textBlock.resizeToFit == false) {
      textBlock.widthInPixels = width
    }
    textBlock.heightInPixels = textBlock.computeExpectedHeight()
    return { width: textBlock.widthInPixels, height: textBlock.computeExpectedHeight() }
  }
  if (textBlock.resizeToFit) {
    textBlock.onAfterDrawObservable.addOnce(() => textFlexItem.node.markDirty())
  }
  return textFlexItem
}

export type TextStyle = {
  fontFamily: string
  fontSizeInPixels: number
  color: string
}
export const Styles = {
  GoldLabel: {
    fontFamily: "Regular5",
    fontSizeInPixels: 15,
    color: "gold",
  } as TextStyle,
}
export function TextBlock(
  name: string,
  text: string,
  fit: boolean = false,
  style: TextStyle = Styles.GoldLabel,
  horrizontalAlignment: number = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
): GUI.TextBlock {
  const text1 = new GUI.TextBlock(name, text)
  text1.textWrapping = GUI.TextWrapping.WordWrap
  text1.textHorizontalAlignment = horrizontalAlignment
  // text1.textVerticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
  text1.fontFamily = style.fontFamily
  text1.fontSizeInPixels = style.fontSizeInPixels
  text1.color = style.color
  if (fit) {
    text1.resizeToFit = true
    text1.forceResizeWidth = true
  }
  return text1
}

export function getTextMetricsWidth(textMetrics) {
  if (textMetrics.actualBoundingBoxLeft !== undefined) {
    return Math.abs(textMetrics.actualBoundingBoxLeft) + Math.abs(textMetrics.actualBoundingBoxRight)
  }
  return textMetrics.width
}

export function createSegmentedControl(
  options: string[],
  callback: (selectedIndex: number) => void
): [FlexContainer, (segment: number) => void] {
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
    stackPanel.addControl(buttonFlexItem)
  })

  // Initialize the first button as selected
  updateSegmentControl(0)

  return [stackPanel, updateSegmentControl]
}
