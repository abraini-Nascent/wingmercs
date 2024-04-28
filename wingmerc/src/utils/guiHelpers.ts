import * as GUI from "@babylonjs/gui"
import { Color4, DynamicTexture, ICanvasRenderingContext, Observable, Observer } from "@babylonjs/core";
import Yoga, { Node, Edge, FlexDirection, PositionType, MeasureFunction, MeasureMode, Unit, Direction } from 'yoga-layout';

export class TintedImage extends GUI.Image {
  private _tint: Color4
  constructor(name?: string, url?: string) {
    super(name, url)
  }
  get tint() {
    return this._tint
  }
  set tint(value: Color4) {
    this._tint = value

    // create a temp context to tint the image
    // 1: draw the tint color on the image canvas
    // 2: draw the greyscale image ontop, this will create a solid tint color cutout of the greyscale image
    //   destination-atop
    //   The existing canvas is only kept where it overlaps the new shape. The new shape is drawn behind the canvas content.
    // 3: draw the color image back onto the dom image, multiply seems to work better since in color white stays white and
    // color
    //  Preserves the luma of the bottom layer, while adopting the hue and chroma of the top layer.
    // multiply
    //  The pixels of the top layer are multiplied with the corresponding pixel of the bottom layer. A darker picture is the result.
    let cutoutCanvas = document.createElement('canvas');
    let cutoutContext = cutoutCanvas.getContext('2d');
    cutoutCanvas.width = this.imageWidth
    cutoutCanvas.height = this.imageHeight;
    // fill offscreen buffer with the tint color
    cutoutContext.fillStyle = this._tint.toHexString();
    cutoutContext.fillRect(0,0,cutoutCanvas.width,cutoutCanvas.height);
    // console.log(`--- color ${this._tint.toHexString()} background ---`)
    // console.log(cutoutCanvas.toDataURL())
    // console.log("--- color background ---")
    // now we have a context filled with the tint color 
    cutoutContext.globalCompositeOperation='destination-atop';
    cutoutContext.drawImage(this.domImage as CanvasImageSource, 0, 0);
    // console.log("--- color cutout ---")
    // console.log(cutoutCanvas.toDataURL())
    // console.log("--- color cutout ---")
    // now we cut out the greyscale image and have just the cutout left
    let imageCanvas = document.createElement("canvas")
    let imageCanvasContext = imageCanvas.getContext('2d');
    imageCanvas.width = this.imageWidth;
    imageCanvas.height = this.imageHeight;
    imageCanvasContext.drawImage(this.domImage as CanvasImageSource, 0, 0);
    // console.log("--- greyscale ---")
    // console.log(imageCanvas.toDataURL())
    // console.log("--- greyscale ---")
    // now we have the greyscale on the image canvas
    imageCanvasContext.globalCompositeOperation="multiply";
    // imageCanvasContext.fillStyle = this._tint.toHexString();
    // imageCanvasContext.fillRect(0,0,imageCanvas.width,imageCanvas.height);
    imageCanvasContext.drawImage(cutoutCanvas, 0, 0);
    // now we have a tinted image on the image canvas
    // is there no faster way than this?
    // console.log("--- tinted image ---")
    this.domImage.src = imageCanvas.toDataURL()
    // console.log("--- tinted image ---")
    // console.log(imageCanvas.toDataURL())
  }
}

export class TextSizeAnimationComponent {

  textblock: GUI.TextBlock
  startSize: number
  endSize: number
  timeLength: number
  timer: number = 0
  complete: () => void

  /**
   * 
   * @param text the next for the text block
   * @param color the color for the textblock
   * @param startSize the start size in pixels
   * @param endSize the end size in pixels
   * @param timeLength the length of time to lerp from start to end in milliseconds
   * @param complete a callback called at the end of the animation
   */
  constructor (text: string, color: string, startSize: number, endSize: number, timeLength: number, complete?: () => void) {
    this.startSize = startSize
    this.endSize = endSize
    this.timeLength = timeLength
    this.complete = complete
    const textblock = new GUI.TextBlock()
    this.textblock = textblock
    textblock.name = "gameOverText"
    textblock.fontFamily = "monospace"
    textblock.text = text
    textblock.color = color
    textblock.fontSize = startSize
    textblock.height = `${startSize}px`
    textblock.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    textblock.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
  }
  /** call to clean up */
  dispose() {
    this.textblock.dispose()
  }

  update(dt: number) {
    this.timer += dt
    const alphaTime = Math.min(1, this.timer / this.timeLength)
    const alphaPixels = (this.endSize - this.startSize) * alphaTime
    const newSize = this.startSize + alphaPixels
    this.textblock.fontSize = newSize
    this.textblock.height = `${newSize}px`
  }
}

export class DynamicTextureImage extends GUI.Rectangle {
    
  private _dynamicTexture: DynamicTexture

  get dynamicTexture() {
    return this._dynamicTexture
  }

  constructor(name: string, source: DynamicTexture) {
      super(name) 
      this._dynamicTexture = source
  }

  protected _localDraw(context: ICanvasRenderingContext): void {
    // Copy the image from the source canvas to the target canvas
    const sourceCtx = this._dynamicTexture.getContext()
    const canvas = sourceCtx.canvas
    context.save()
    context.drawImage(canvas, this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height)
    context.restore();
  }
}

const debug = true
export { Align, Edge, FlexDirection, Gutter, Justify, PositionType } from 'yoga-layout';
export type FlexContainerNode = Omit<Node, "free" | "freeRecursive" | "calculateLayout" | "getAspectRatio" |"getBorder" |"getChild" |"getChildCount" |"getComputedBorder" |"getComputedBottom" |"getComputedHeight" |"getComputedLayout" |"getComputedLeft" |"getComputedMargin" |"getComputedPadding" |"getComputedRight" |"getComputedTop" |"getComputedWidth" | "getParent" | "insertChild" | "isDirty" | "isReferenceBaseline" | "markDirty" | "hasNewLayout" | "markLayoutSeen" | "removeChild" | "reset" | "setDirtiedFunc" | "setMeasureFunc" | "unsetDirtiedFunc" | "unsetMeasureFunc">
export class FlexContainer {
  private _node = Yoga.Node.create();
  name: string
  host: GUI.AdvancedDynamicTexture | GUI.Container
  _container: GUI.Container
  width: number
  height: number
  top: number = 0
  left: number = 0
  private _children: any[] = []

  public get style(): FlexContainerNode {
    return this._node as FlexContainerNode
  }
  constructor(name?: string, host?: GUI.AdvancedDynamicTexture, container?: GUI.Container, direction?: FlexDirection) {
    this._node.setFlexDirection(direction)
    this.host = host
    this.name = name
    this._container = container ?? new GUI.Rectangle(`${name??"FlexContainer"}_background`)
    this._container.horizontalAlignment = GUI.Container.HORIZONTAL_ALIGNMENT_LEFT
    this._container.verticalAlignment = GUI.Container.VERTICAL_ALIGNMENT_TOP
    if ('thickness' in this._container) {
      this._container.thickness = debug ? 1 : 0
    }
    if (this.host == undefined) {
      this.host = this._container
    } else {
      this.host.addControl(this._container)
    }
  }
  public set background(value: string) {
    this._container.background = value
  }
  public get background(): string {
    return this._container.background
  }
  public set clipChildren(value: boolean) {
    this._container.clipChildren = value
  }
  public get clipChildren(): boolean {
    return this._container.clipChildren
  }

  dispose(): void {
    this._node.free()
  }
  private _updateBackground() {
    this._container.topInPixels = this.top
    this._container.leftInPixels = this.left
    this._container.heightInPixels = this.height
    this._container.widthInPixels = this.width
  }
  
  addControl(control: GUI.Control | FlexContainer | FlexItem): FlexContainer {
    // start implementation from Control parent
    if (!control) {
      return this
    }

    if (control instanceof FlexContainer) {
      const index = this._children.indexOf(control)
      if (index !== -1) {
          return this
      }
      this._children.push(control)
      this._node.insertChild(control.style as Node, this._children.length - 1)
      this.host.addControl(control._container)
      return this
    }

    if (control instanceof FlexItem) {
      const index = this._children.indexOf(control)
      if (index !== -1) {
        return this
      }
      this._children.push(control)
      this._node.insertChild(control.node as Node, this._children.length - 1)
      this.host.addControl(control.item)
      return this
    }

    const duplicate = this._children.some((child) => {
      if (child instanceof FlexContainer) {
        return false
      }
      if (child instanceof FlexItem) {
        return child.item == control
      }
      return false
    })
    if (duplicate) {
      return this
    }

    const newItem = new FlexItem(control.name, control)
    this._children.push(newItem)
    this._node.insertChild(newItem.node, this._children.length - 1)
    this.host.addControl(control)

    return this;
  }

  removeControl(control: GUI.Control | FlexContainer): FlexContainer {
    let index = this._children.indexOf(control);

    if (index !== -1) {
      this._children.splice(index, 1);
      if (control instanceof FlexContainer) {
        this._node.removeChild(control.style as Node)
      }
      return this
    }
    index = this._children.findIndex((child) => {
      if (child instanceof FlexContainer) {
        return false
      }
      if (child instanceof FlexItem) {
        return child.item == control
      }
      return false
    })
    if (index !== -1) {
      const child = this._children.splice(index, 1)[0] as FlexItem
      this._node.removeChild(child.node as Node)
      this.host.removeControl(child.item)
    }

    return this;
  }

  layout() {
    if (this._node.isDirty() == false) {
      return
    }
    this._node.calculateLayout(this.width ?? "auto", this.height ?? "auto", Direction.LTR)
    // walk through child tree
    this.left = this._node.getComputedLeft()
    this.top = this._node.getComputedTop()
    this._updateBackground()

    console.log(`${this.name}, \r\ntop:${this.top} / left:${this.left} \r\nheight:${this.height} / width:${this.width}\r\n---`)
    const queue: {parent: FlexContainer, child: FlexContainer | FlexItem}[] = 
    this._children.map((child) => { return { parent: this, child } })
    while (queue.length > 0) {
      let next = queue.shift()
      if (next.child instanceof FlexContainer) {
        let container = next.child as FlexContainer
        const margin = container._node.getComputedMargin(Edge.Left)
        // container.left = next.parent.left + container._node.getComputedLeft()
        // container.top = next.parent.top + container._node.getComputedTop()
        container.left = container._node.getComputedLeft()
        container.top = container._node.getComputedTop()
        // TODO value by unit
        const height = container._node.getComputedHeight()
        const width = container._node.getComputedWidth()
        container.height = height
        container.width = width
        
        console.log(`${container.name}-container, \r\ntop:${container.top} / left:${container.left} \r\nheight:${container.height} / width:${container.width}\r\n---`)
        const newItems = container._children.map((item) => {
          return {
            parent: container as FlexContainer,
            child: item as FlexContainer | FlexItem
          }
        })
        queue.push(...newItems)
        container._updateBackground()
      } else {
        const control = next.child.item
        control.topInPixels = next.child.node.getComputedTop()
        control.leftInPixels = next.child.node.getComputedLeft()
        console.log(`${control.name}-parent-node, \r\ntop:${next.parent.top} / left:${next.parent.left}`)
        console.log(`${control.name}-child-node, \r\ntop:${next.child.node.getComputedTop()} / left:${next.child.node.getComputedLeft()}`)
        console.log(`${control.name}-item, \r\ntop:${control.topInPixels} / left:${control.leftInPixels} \r\nheight:${control.heightInPixels} / width:${control.widthInPixels}\r\n---`)
      }
    }
  }
}

export class FlexItem {

  item: GUI.Control
  node = Yoga.Node.create();
  name: string
  dirtyObserver: Observer<GUI.Control>

  constructor(name?: string, control?: GUI.Control) {
    this.item = control
    control.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    control.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    this.name = name
    this.node.setMeasureFunc((
      width: number,
      widthMode: MeasureMode,
      height: number,
      heightMode: MeasureMode,
    ): {
      width: number,
      height: number
    } => {
      return this.getMeasure(width, widthMode, height, heightMode)
    })
    this.dirtyObserver = this.item.onDirtyObservable.add(() => {
      setTimeout(() => {
        // wait for render cycle to finish
        if (this.item.isDirty) {
          this.node.markDirty()
        }
      }, 1)
    })
  }

  public getMeasure: MeasureFunction = (
    _width: number,
    _widthMode: MeasureMode,
    _height: number,
    _heightMode: MeasureMode,
  ): {
    width: number,
    height: number
  } => {
    let control = this.item
    if (control != undefined) {
      return {
        width: control.widthInPixels,
        height: control.heightInPixels
      }
    } else {
      return {
        width: 0,
        height: 0
      }
    }
  }

  dispose(): void {
    this.node.unsetMeasureFunc()
    this.node.free()
    this.dirtyObserver.remove()
  }

  /** If you try to add more than one item it will do nothing */
  addItem(control: GUI.Control): FlexItem {
    if (this.item != undefined) {
      return this
    }
    this.item = control
    return this
  }
  removeItem() {
    this.item = undefined
  }
}
