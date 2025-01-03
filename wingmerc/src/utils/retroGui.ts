import { Button, Control, TextBlock } from "@babylonjs/gui"
import { FluentControl } from "./fluentGui"

/* example box drawings
┌─┬┐  ╔═╦╗  ╓─╥╖  ╒═╤╕
│ ││  ║ ║║  ║ ║║  │ ││
├─┼┤  ╠═╬╣  ╟─╫╢  ╞═╪╡
└─┴┘  ╚═╩╝  ╙─╨╜  ╘═╧╛
┌───────────────────┐
│  ╔═══╗ Some Text  │▒
│  ║   ║ in the box │▒
│  ╚═╦═╝            │▒
╞═╤══╩══╤═══════════╡▒
│ ├──┬──┤           │▒
│ └──┴──┘           │▒
└───────────────────┘▒
 ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
┌─┬┐▌
└─┴┘█   button▄
 ▀▀▀▀    ▀▀▀▀▀▀
 */

export namespace RetroGui {
  /**
  Bright Amber	Foreground text or highlights	#FFB000	(255, 176, 0)
  Mid Amber	Regular UI elements / text	#C08000	(192, 128, 0)
  Dark Amber	Shadow or inactive elements	#805000	(128, 80, 0)
  Background	Screen background (black)	#000000	(0, 0, 0)
 */
  export const colors = {
    foreground: "#FFB000",
    regular: "#C08000",
    shadow: "#805000",
    background: "#1A0E05",
  }
  export namespace Components {
    export function configureButton(b: Button) {
      const anyB = b as any
      const textBlock = anyB._textBlock as TextBlock
      if (anyB._textBlockShadow == undefined) {
        const shadow = textBlock.clone()
        anyB._textBlockShadow = shadow
        shadow.zIndex--
        b.addControl(shadow)
      }
      const textBlockShadow = anyB._textBlockShadow as TextBlock
      const text = textBlock.text
      let over = false
      textBlock.text = `|${text}|`
      b.thickness = 0
      b.pointerEnterAnimation = () => {
        over = true
        textBlock.text = `[${text}]`
      }
      b.pointerOutAnimation = () => {
        over = false
        textBlock.text = `|${text}|`
      }
      b.pointerDownAnimation = () => {
        textBlock.text = `[${text}]`
        textBlock.topInPixels = 5
        textBlock.leftInPixels = 5
      }
      b.pointerUpAnimation = () => {
        textBlock.text = over ? `[${text}]` : `|${text}|`
        textBlock.topInPixels = 0
        textBlock.leftInPixels = 0
      }
      textBlockShadow.text = textBlock.text
      textBlockShadow.topInPixels = 5
      textBlockShadow.leftInPixels = 5
      textBlockShadow.color = RetroGui.colors.shadow
      b.widthInPixels = Grid.getGridCellWidth() * (textBlock.text.length + 4)
    }
    export function configureNakedButton(b: Button) {
      const anyB = b as any
      const textBlock = anyB._textBlock as TextBlock
      if (anyB._textBlockShadow == undefined) {
        const shadow = textBlock.clone()
        anyB._textBlockShadow = shadow
        shadow.zIndex--
        b.addControl(shadow)
      }
      const textBlockShadow = anyB._textBlockShadow as TextBlock
      const text = textBlock.text
      let over = false
      textBlock.text = `${text}`
      b.thickness = 0
      b.pointerEnterAnimation = () => {
        over = true
        textBlock.text = `${text}`
        textBlock.color = RetroGui.colors.regular
        textBlockShadow.color = RetroGui.colors.shadow
      }
      b.pointerOutAnimation = () => {
        over = false
        textBlock.text = `${text}`
        textBlock.color = RetroGui.colors.foreground
        textBlockShadow.color = RetroGui.colors.regular
      }
      b.pointerDownAnimation = () => {
        textBlock.text = `${text}`
        textBlock.topInPixels = 5
        textBlock.leftInPixels = 5
      }
      b.pointerUpAnimation = () => {
        textBlock.text = over ? `${text}` : `${text}`
        textBlock.topInPixels = 0
        textBlock.leftInPixels = 0
      }
      textBlockShadow.text = textBlock.text
      textBlockShadow.topInPixels = 5
      textBlockShadow.leftInPixels = 5
      textBlockShadow.color = RetroGui.colors.shadow
      b.widthInPixels = Grid.getGridCellWidth() * (textBlock.text.length + 4)
    }
  }

  export namespace Grid {
    let cols: number = 40 // Default grid columns
    let rows: number = 25 // Default grid rows
    let renderWidth: number = 1920 // Render target width
    let renderHeight: number = 1080 // Render target height

    export function initialize(gridRows: number, gridCols: number, targetWidth: number, targetHeight: number) {
      rows = gridRows
      cols = gridCols
      renderWidth = targetWidth
      renderHeight = targetHeight
    }

    /** reset to default  */
    export function reset() {
      cols = 40 // Default grid columns
      rows = 25 // Default grid rows
      renderWidth = 1920 // Render target width
      renderHeight = 1080 // Render target height
    }

    function parseValue(value: string, em: number, reference: number): number {
      if (value.includes("px")) {
        return parseFloat(value.replace("px", ""))
      }
      if (value.includes("em")) {
        return parseFloat(value.replace("em", "")) * em
      }
      const percentage = parseFloat(value.replace("%", "")) / 100
      return reference * percentage
    }
    /** relative position a control, aligning on the nearest grid row, col*/
    export function alignControl(control: Control, top: number, left: number, width?: string, height?: string) {
      const cellWidth = getGridCellWidth()
      const cellHeight = getGridCellHeight()
      if (top !== 0) {
        const pixelsFromTop = renderHeight * top
        const gridFromTop = Math.round(pixelsFromTop / cellHeight) * cellHeight
        control.topInPixels = gridFromTop
      }
      if (left !== 0) {
        const pixelsFromLeft = renderWidth * left
        const gridFromLeft = Math.round(pixelsFromLeft / cellWidth) * cellWidth
        control.leftInPixels = gridFromLeft
      }
      if (width) {
        const widthPixels = parseValue(width, cellWidth, renderWidth)
        const gridWidthPixels = Math.round(widthPixels / cellWidth) * cellWidth
        control.widthInPixels = gridWidthPixels
      }
      if (height) {
        const heightPixels = parseValue(height, cellHeight, renderHeight)
        const gridHeightPixels = Math.round(heightPixels / cellHeight) * cellHeight
        control.heightInPixels = gridHeightPixels
      }
      // console.log({
      //   name: control.name,
      //   top: control.topInPixels,
      //   left: control.leftInPixels,
      //   width: control.widthInPixels,
      //   height: control.heightInPixels,
      // })
    }

    /** absolute position a control */
    export function moveControl(control: Control, row: number, col: number, width?: number, height?: number) {
      const { top, left, width: cellWidth, height: cellHeight } = getGridPosition(row, col, width, height)

      control.top = `${top}px`
      control.left = `${left}px`
      if (width) {
        control.width = `${cellWidth}px`
      }
      if (height) {
        control.height = `${cellHeight}px`
      }

      control.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT
      control.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
    }

    /** absolute position a control so the box is in the middle of the cells*/
    export function moveControlMidCell(control: Control, row: number, col: number, width?: number, height?: number) {
      const { top, left, width: gridWidth, height: gridHeight } = getGridPosition(row, col, width, height)
      const cellWidth = getGridCellWidth()
      const cellHeight = getGridCellHeight()
      control.top = `${top + cellHeight / 2}px`
      control.left = `${left + cellWidth / 2}px`
      if (width) {
        control.width = `${gridWidth - cellWidth}px`
      } else {
        const colWidth = (cols - col) * cellWidth
        control.width = `${colWidth - cellWidth}px`
      }
      if (height) {
        control.height = `${gridHeight - cellHeight}px`
      } else {
        const rowHeight = (rows - row) * cellHeight
        control.height = `${rowHeight - cellHeight}px`
      }

      control.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT
      control.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
    }

    export function getGridCellWidth() {
      const cellWidth = renderWidth / cols
      return cellWidth
    }
    export function getGridCellHeight() {
      const cellHeight = renderHeight / rows
      return cellHeight
    }

    function getGridPosition(row: number, col: number, width: number, height: number) {
      const cellWidth = getGridCellWidth()
      const cellHeight = getGridCellHeight()

      return {
        top: row * cellHeight,
        left: col * cellWidth,
        width: cellWidth * width,
        height: cellHeight * height,
      }
    }

    export function getTextWidth(text: string, font: string) {
      // re-use canvas object for better performance
      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")
      context.font = font
      const metrics = context.measureText(text)
      return metrics.actualBoundingBoxRight
    }
  }
}

declare module "./fluentGui" {
  export interface FluentControl<TControl extends Control, TDerived extends FluentControl<TControl, TDerived>> {
    retroGridMoveTo(row: number, col: number, width?: number, height?: number): TDerived
    retroGridBorder(row: number, col: number, width?: number, height?: number): TDerived
  }
}
FluentControl.prototype.retroGridMoveTo = function (row: number, col: number, width?: number, height?: number) {
  RetroGui.Grid.moveControl(this.control, row, col, width, height)
  return this
}
FluentControl.prototype.retroGridBorder = function (row: number, col: number, width?: number, height?: number) {
  RetroGui.Grid.moveControlMidCell(this.control, row, col, width, height)
  return this
}
