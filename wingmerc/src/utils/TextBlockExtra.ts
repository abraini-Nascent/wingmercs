import { ICanvasRenderingContext } from "@babylonjs/core"
import { Control, TextBlock, ValueAndUnit } from "@babylonjs/gui"
import { FluentControl, FluentTextBlock } from "./fluentGui"

/**
 * Text Block with Line Spacing
 * https://forum.babylonjs.com/u/Pryme8
 * https://playground.babylonjs.com/#76VV63#2
 * https://forum.babylonjs.com/t/add-font-letter-spacing/33041/16
 */
export class TextBlockExtra extends TextBlock {
  private _letterSpacing: number = 0
  private _letterWidth: number = undefined
  private _attributes: TextBlockExtra.Attribute[] = undefined

  public set letterSpacingInPixels(value: number) {
    this._letterSpacing = value
    this.markAllAsDirty()
  }
  public get letterSpacingInPixels(): number {
    return this._letterSpacing
  }

  public set letterWidthInPixels(value: number | undefined) {
    this._letterWidth = value
    this.markAllAsDirty()
  }
  public get letterWidthInPixels(): number | undefined {
    return this._letterWidth
  }

  setAttribute(start: number, length: number, color: string) {
    if (this._attributes == undefined) {
      this._attributes = []
    }
    this._attributes.push({ start, end: start + length, color })
  }
  clearAttributes() {
    this._attributes = []
  }

  constructor(name?: string, text?: string) {
    super(name, text)
    const monkey = this as any
    monkey._drawText = this._ourDrawText
  }

  textWithWidth(context: ICanvasRenderingContext, text: string, xIn: number, y: number, charWidth: number) {
    const value = new ValueAndUnit(0, ValueAndUnit.UNITMODE_PIXEL)
    let totalWidth = charWidth * text.length
    let x = xIn
    value.updateInPlace(totalWidth)
    totalWidth = value.getValueInPixel(this.host, this._cachedParentMeasure.width)

    switch ((this as any)._textHorizontalAlignment) {
      case Control.HORIZONTAL_ALIGNMENT_RIGHT:
        x -= totalWidth
        break
      case Control.HORIZONTAL_ALIGNMENT_CENTER:
        x -= totalWidth / 2
        break
    }

    // console.log({ text, xIn, x, totalWidth })

    let offset, char
    for (offset = 0; offset < text.length; offset = offset + 1) {
      char = text.charAt(offset)
      let raw = offset * charWidth
      value.updateInPlace(raw)
      let current = x + value.getValueInPixel(this.host, this._cachedParentMeasure.width)
      if (this.outlineWidth) {
        context.strokeText(char, current, y)
      }
      let originalStyle
      if (this._attributes != undefined) {
        const attributes = this._attributes.filter((a) => a.start <= offset && a.end > offset)
        for (const attribute of attributes) {
          if (attribute.color) {
            originalStyle = context.fillStyle
            context.fillStyle = attribute.color
          }
        }
      }
      // console.log(char, current, y, charWidth)
      context.fillText(char, current, y)
      if (originalStyle) {
        context.fillStyle = originalStyle
      }
    }
  }

  textWithSpacing(context: ICanvasRenderingContext, text: string, x: number, y: number, spacing: number) {
    const total_width = context.measureText(text).width + spacing * (text.length - 1)
    const align = (context as any).textAlign
    ;(context as any).textAlign = "left"

    switch (align) {
      case "right":
        x -= total_width
        break
      case "center":
        x -= total_width / 2
        break
    }

    let offset, pair_width, char_width, char_next_width, pair_spacing, char, char_next

    for (offset = 0; offset < text.length; offset = offset + 1) {
      char = text.charAt(offset)
      pair_spacing = 0
      if (offset + 1 < text.length) {
        char_next = text.charAt(offset + 1)
        pair_width = context.measureText(char + char_next).width
        char_width = context.measureText(char).width
        char_next_width = context.measureText(char_next).width
        pair_spacing = pair_width - char_width - char_next_width
      }

      if (this.outlineWidth) {
        context.strokeText(char, x, y)
      }
      context.fillText(char, x, y)
      x = x + char_width + pair_spacing + spacing
    }

    ;(context as any).textAlign = align
  }

  private _ourDrawText(text: string, textWidth: number, y: number, context: ICanvasRenderingContext): void {
    var width = this._currentMeasure.width
    var x = 0
    switch ((this as any)._textHorizontalAlignment) {
      case Control.HORIZONTAL_ALIGNMENT_LEFT:
        x = 0
        break
      case Control.HORIZONTAL_ALIGNMENT_RIGHT:
        x = width - textWidth
        break
      case Control.HORIZONTAL_ALIGNMENT_CENTER:
        x = (width - textWidth) / 2
        break
    }

    if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
      context.shadowColor = this.shadowColor
      context.shadowBlur = this.shadowBlur
      context.shadowOffsetX = this.shadowOffsetX
      context.shadowOffsetY = this.shadowOffsetY
    }

    if (this._letterWidth != undefined) {
      switch ((this as any)._textHorizontalAlignment) {
        case Control.HORIZONTAL_ALIGNMENT_RIGHT:
          // x = text.length * this._letterWidth
          x = width
          break
        case Control.HORIZONTAL_ALIGNMENT_CENTER:
          x = width / 2
          // x = text.length * this._letterWidth * 0.5
          break
      }
      this.textWithWidth(context, this.text, this._currentMeasure.left + x, y, this.letterWidthInPixels)
    } else if (this._letterSpacing !== 0) {
      switch ((this as any)._textHorizontalAlignment) {
        case Control.HORIZONTAL_ALIGNMENT_CENTER:
          x -= text.length * this._letterSpacing * 0.5
          break
        case Control.HORIZONTAL_ALIGNMENT_RIGHT:
          x -= text.length * this._letterSpacing
          break
      }
      this.textWithSpacing(context, this.text, this._currentMeasure.left + x, y, this._letterSpacing)
    } else {
      if (this.outlineWidth) {
        context.strokeText(text, this._currentMeasure.left + x, y)
      }
      context.fillText(text, this._currentMeasure.left + x, y)
    }

    if (this.underline) {
      context.beginPath()
      context.lineWidth = Math.round(this.fontSizeInPixels * 0.05)
      context.moveTo(this._currentMeasure.left + x, y + 3)
      context.lineTo(this._currentMeasure.left + x + textWidth, y + 3)
      context.stroke()
      context.closePath()
    }

    if (this.lineThrough) {
      context.beginPath()
      context.lineWidth = Math.round(this.fontSizeInPixels * 0.05)
      context.moveTo(this._currentMeasure.left + x, y - this.fontSizeInPixels / 3)
      context.lineTo(this._currentMeasure.left + x + textWidth, y - this.fontSizeInPixels / 3)
      context.stroke()
      context.closePath()
    }
  }

  static isExtra(tb: TextBlock | TextBlockExtra): TextBlockExtra | undefined {
    if (tb instanceof TextBlockExtra) {
      return tb
    }
    return undefined
  }
}
export namespace TextBlockExtra {
  export type Attribute = {
    start: number
    end: number
    color?: string
  }
}

export class FluentTextBlockExtra extends FluentTextBlock {
  get extra() {
    return this.control as TextBlockExtra
  }
  constructor(name: string)
  constructor(existing: TextBlockExtra)
  constructor(name: string, text: string)
  constructor(arg1?: string | TextBlockExtra, existing?: string | TextBlockExtra) {
    if (typeof arg1 == "string" && typeof existing == "string") {
      const control = new TextBlockExtra(arg1)
      control.text = existing
      super(control)
    } else if (typeof arg1 == "string" && existing == undefined) {
      const control = new TextBlockExtra(arg1)
      super(control)
    } else if (arg1 instanceof TextBlockExtra) {
      super(arg1)
    } else {
      const control = new TextBlockExtra()
      super(control)
    }
  }

  letterSpacing(pixels: number) {
    this.extra.letterSpacingInPixels = pixels
    return this
  }
  letterWidth(pixels: number) {
    this.extra.letterWidthInPixels = pixels
    return this
  }
}
