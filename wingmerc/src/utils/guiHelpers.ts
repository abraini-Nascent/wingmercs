import * as GUI from "@babylonjs/gui"
import { Color4, DynamicTexture, ICanvasRenderingContext } from "@babylonjs/core";

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
    console.log(`--- color ${this._tint.toHexString()} background ---`)
    console.log(cutoutCanvas.toDataURL())
    console.log("--- color background ---")
    // now we have a context filled with the tint color 
    cutoutContext.globalCompositeOperation='destination-atop';
    cutoutContext.drawImage(this.domImage as CanvasImageSource, 0, 0);
    console.log("--- color cutout ---")
    console.log(cutoutCanvas.toDataURL())
    console.log("--- color cutout ---")
    // now we cut out the greyscale image and have just the cutout left
    let imageCanvas = document.createElement("canvas")
    let imageCanvasContext = imageCanvas.getContext('2d');
    imageCanvas.width = this.imageWidth;
    imageCanvas.height = this.imageHeight;
    imageCanvasContext.drawImage(this.domImage as CanvasImageSource, 0, 0);
    console.log("--- greyscale ---")
    console.log(imageCanvas.toDataURL())
    console.log("--- greyscale ---")
    // now we have the greyscale on the image canvas
    imageCanvasContext.globalCompositeOperation="multiply";
    // imageCanvasContext.fillStyle = this._tint.toHexString();
    // imageCanvasContext.fillRect(0,0,imageCanvas.width,imageCanvas.height);
    imageCanvasContext.drawImage(cutoutCanvas, 0, 0);
    // now we have a tinted image on the image canvas
    // is there no faster way than this?
    console.log("--- tinted image ---")
    this.domImage.src = imageCanvas.toDataURL()
    console.log("--- tinted image ---")
    console.log(imageCanvas.toDataURL())
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

export class DynamicTextureImage extends GUI.Rectangle{
    
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