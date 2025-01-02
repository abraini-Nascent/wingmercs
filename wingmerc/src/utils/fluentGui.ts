import { EventState, Observable, Observer, TmpVectors } from "@babylonjs/core"
import {
  AdvancedDynamicTexture,
  Button,
  Container,
  Control,
  Grid,
  Image,
  InputText,
  Rectangle,
  ScrollViewer,
  StackPanel,
  TextBlock,
  Vector2WithInfo,
} from "@babylonjs/gui"

export class DisposeBag {
  private observers: Set<Observer<any>> = new Set()

  public add<T>(observer: Observer<T>): void {
    this.observers.add(observer)
  }

  public dispose(): void {
    this.observers.forEach((observer) => {
      this.observers.delete(observer)
      observer.remove()
    })
  }
}

export class Ref<T extends Control> {
  private component: T | null = null
  private disposed: boolean = false
  private diposeObserver: Observer<Control>

  /** Hold a reference to the underlying component of a FluentControl */
  capture(fluentControl: FluentControl<T, any>): FluentControl<T, any> {
    if (this.component && !this.disposed) {
      throw new Error("Ref is already holding a valid control.")
    }
    const builtControl = fluentControl.build()
    this.component = builtControl as T
    this.setupDisposeListener()
    return fluentControl
  }

  // Listen for the held componets disposed event, set ourselves as disposed when the held component is disposed
  private setupDisposeListener(): void {
    if (this.component) {
      this.diposeObserver = this.component.onDisposeObservable.addOnce(() => {
        this.disposed = true
        this.component = null
        this.diposeObserver = undefined
      })
    }
  }

  /** The current component of null if the held component was disposed */
  public get(): T | null {
    return this.disposed ? null : this.component
  }

  /** The current component is set and was not disposed */
  public isValid(): boolean {
    return !this.disposed && this.component !== null
  }

  /** Set the ref as disposed, clears the set component */
  public dispose(): void {
    this.disposed = true
    this.component = null
    if (this.diposeObserver) {
      this.diposeObserver.remove()
      this.diposeObserver = undefined
    }
  }
}

/// Control base class

export abstract class FluentControl<TControl extends Control, TDerived extends FluentControl<TControl, TDerived>> {
  protected control: TControl

  constructor(control: TControl) {
    this.control = control
  }

  // Helper for adding callbacks to observables and storing the observer into a dispose bag
  protected addObserver<T>(
    observable: Observable<T>,
    callback: (eventData: T, eventState: EventState) => void,
    disposeBag?: DisposeBag
  ) {
    const observer = observable.add(callback)
    if (disposeBag) {
      disposeBag.add(observer)
    }
  }

  /** Attach to an Advanced Dynamic Texture to be rendered in */
  public hostIn(host: AdvancedDynamicTexture): TDerived {
    host.addControl(this.control)
    return this as unknown as TDerived
  }

  public storeIn(ref: Ref<TControl> | (() => Ref<TControl>)): TDerived {
    if (typeof ref == "function") {
      ref().capture(this)
    } else {
      ref.capture(this)
    }
    return this as unknown as TDerived
  }

  // Build the underlying Babylon.js control
  public build(): TControl {
    return this.control
  }

  // Set alpha
  public alpha(value: number): TDerived {
    this.control.alpha = value
    return this as unknown as TDerived
  }

  // Set color (foreground color)
  public color(value: string): TDerived {
    this.control.color = value
    return this as unknown as TDerived
  }

  // Set font family
  public fontFamily(value: string): TDerived {
    this.control.fontFamily = value
    return this as unknown as TDerived
  }

  // Set font size
  public fontSize(value: string | number): TDerived {
    this.control.fontSize = value
    return this as unknown as TDerived
  }

  // Set font style
  public fontStyle(value: string): TDerived {
    this.control.fontStyle = value
    return this as unknown as TDerived
  }

  // Set font weight
  public fontWeight(value: string): TDerived {
    this.control.fontWeight = value
    return this as unknown as TDerived
  }

  public hide(): TDerived {
    this.control.isVisible = false
    return this as unknown as TDerived
  }

  public show(): TDerived {
    this.control.isVisible = true
    return this as unknown as TDerived
  }

  // Set height
  public height(value: number | string): TDerived {
    if (typeof value == "number") {
      this.control.heightInPixels = value
    } else {
      this.control.height = value
    }
    return this as unknown as TDerived
  }

  // Set width
  public width(value: number | string): TDerived {
    if (typeof value == "number") {
      this.control.widthInPixels = value
    } else {
      this.control.width = value
    }
    return this as unknown as TDerived
  }

  // Set width and height
  public size(width: number | string, height: number | string) {
    return this.width(width).height(height)
  }

  // Set top
  public top(value: number | string): TDerived {
    if (typeof value == "number") {
      this.control.topInPixels = value
    } else {
      this.control.top = value
    }
    return this as unknown as TDerived
  }
  /** Bottom positioning logic is derrived from the height of the parent container and the height of the held container */
  public bottom(value: number): TDerived {
    this.control.topInPixels = this.control.parent.heightInPixels - value - this.control.heightInPixels
    return this as unknown as TDerived
  }

  // Set left
  public left(value: number | string): TDerived {
    if (typeof value == "number") {
      this.control.leftInPixels = value
    } else {
      this.control.left = value
    }
    return this as unknown as TDerived
  }

  /** Right positioning logic is derrived from the width of the parent container and the width of the held container */
  public right(value: number): TDerived {
    this.control.leftInPixels = this.control.parent.widthInPixels - value - this.control.widthInPixels
    return this as unknown as TDerived
  }

  // Set horizontal alignment
  public horizontalAlignment(value: number | "left" | "center" | "right"): TDerived {
    if (typeof value == "number") {
      this.control.horizontalAlignment = value
    }
    switch (value) {
      case "left": {
        this.control.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT
        break
      }
      case "center": {
        this.control.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
        break
      }
      case "right": {
        this.control.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT
        break
      }
    }
    return this as unknown as TDerived
  }

  // Set vertical alignment
  public verticalAlignment(value: number | "top" | "center" | "bottom"): TDerived {
    if (typeof value == "number") {
      this.control.verticalAlignment = value
    }
    switch (value) {
      case "top": {
        this.control.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
        break
      }
      case "center": {
        this.control.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER
        break
      }
      case "bottom": {
        this.control.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM
        break
      }
    }
    return this as unknown as TDerived
  }

  // Set z-index
  public zIndex(value: number): TDerived {
    this.control.zIndex = value
    return this as unknown as TDerived
  }

  // Set shadow blur
  public shadowBlur(value: number): TDerived {
    this.control.shadowBlur = value
    return this as unknown as TDerived
  }

  // Set shadow offset on X-axis
  public shadowOffsetX(value: number): TDerived {
    this.control.shadowOffsetX = value
    return this as unknown as TDerived
  }

  // Set shadow offset on Y-axis
  public shadowOffsetY(value: number): TDerived {
    this.control.shadowOffsetY = value
    return this as unknown as TDerived
  }

  // Set shadow color
  public shadowColor(value: string): TDerived {
    this.control.shadowColor = value
    return this as unknown as TDerived
  }

  // Set isPointerBlocker
  public isPointerBlocker(value: boolean): TDerived {
    this.control.isPointerBlocker = value
    return this as unknown as TDerived
  }

  // Set hover cursor
  public hoverCursor(value: string): TDerived {
    this.control.hoverCursor = value
    return this as unknown as TDerived
  }

  /** Gets or sets front color of control if it's disabled. Only applies to Checkbox class. */
  public disabledColorItem(value: string): TDerived {
    this.control.disabledColorItem = value
    return this as unknown as TDerived
  }

  /**
   * Border color when control is focused
   * When not defined the ADT color will be used. If no ADT color is defined, focused state won't have any border
   */
  public focusedColor(value: string): TDerived {
    this.control.focusedColor = value
    return this as unknown as TDerived
  }
  /**
   * The tab index of this control. -1 indicates this control is not part of the tab navigation.
   * A positive value indicates the order of the control in the tab navigation.
   * A value of 0 indicated the control will be focused after all controls with a positive index.
   * More than one control can have the same tab index and the navigation would then go through all controls with the same value in an order defined by the layout or the hierarchy.
   * The value can be changed at any time.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
   */
  public tabIndex(value: number): TDerived {
    this.control.tabIndex = value
    return this as unknown as TDerived
  }

  /** provide access if things need to get super specific and off the rails */
  public modifyControl(modifier: (control: TControl) => void): TDerived {
    modifier(this.control)
    return this as unknown as TDerived
  }

  public hitTestVisible(value: boolean): TDerived {
    this.control.isHitTestVisible = value
    return this as unknown as TDerived
  }

  /// Padding and Box Padding

  // A modifier system (similar to padding, alignment, etc.)
  public padding(top: number, right: number, bottom: number, left: number): TDerived {
    this.control.paddingTopInPixels = top
    this.control.paddingRightInPixels = right
    this.control.paddingBottomInPixels = bottom
    this.control.paddingLeftInPixels = left
    return this as unknown as TDerived
  }

  /** mimics css box model padding by addind space _around_ the content size */
  public boxPadding(top: number, right?: number, bottom?: number, left?: number): FluentBoxModelContainer {
    return new FluentBoxModelContainer(this).setBoxPadding(top, right, bottom, left)
  }

  /** Sets the state and runs the update function with the current state value even if there is no initial value */
  public bindState<T>(state: FluentState<T>, updateFn: (control: TDerived, newValue: T) => void): TDerived {
    state.bind(this as unknown as TDerived, updateFn)
    return this as unknown as TDerived
  }

  /// Events

  public onPointerClick(
    callback: (control: TDerived, eventData: Vector2WithInfo, eventState: EventState) => void,
    disposeBag?: DisposeBag
  ): TDerived {
    this.addObserver(
      this.control.onPointerClickObservable,
      (e, s) => {
        callback(this as unknown as TDerived, e, s)
      },
      disposeBag
    )
    return this as unknown as TDerived
  }

  public onPointerEnter(
    callback: (eventData: Control, eventState: EventState) => void,
    disposeBag?: DisposeBag
  ): TDerived {
    this.addObserver(this.control.onPointerEnterObservable, callback, disposeBag)
    return this as unknown as TDerived
  }

  public onPointerOut(
    callback: (eventData: Control, eventState: EventState) => void,
    disposeBag?: DisposeBag
  ): TDerived {
    this.addObserver(this.control.onPointerOutObservable, callback, disposeBag)
    return this as unknown as TDerived
  }

  public onPointerDown(
    callback: (control: TDerived, eventData: Vector2WithInfo, eventState: EventState) => void,
    disposeBag?: DisposeBag
  ): TDerived {
    this.addObserver(
      this.control.onPointerDownObservable,
      (e, s) => {
        callback(this as unknown as TDerived, e, s)
      },
      disposeBag
    )
    return this as unknown as TDerived
  }

  public onPointerUp(
    callback: (control: TDerived, eventData: Vector2WithInfo, eventState: EventState) => void,
    disposeBag?: DisposeBag
  ): TDerived {
    this.addObserver(
      this.control.onPointerUpObservable,
      (e, s) => {
        callback(this as unknown as TDerived, e, s)
      },
      disposeBag
    )
    return this as unknown as TDerived
  }
}

/// Box Model helper

export class FluentBoxModelContainer extends FluentControl<Container, FluentContainer> {
  private child: FluentControl<Control, any>
  private _padding: { top: number; right: number; bottom: number; left: number }
  private _disposeBag = new DisposeBag()

  constructor(child: FluentControl<Control, any>) {
    const container = new Container(`box-model-${child.build()}`)
    super(container)
    this.child = child
    container.addControl(child.build())
    this._padding = { top: 0, right: 0, bottom: 0, left: 0 }
  }

  // Fluent method to set padding
  public setBoxPadding(top: number, right?: number, bottom?: number, left?: number): FluentBoxModelContainer {
    // If right, bottom, left are undefined, it's uniform padding
    this._padding = {
      top: top,
      right: right ?? top,
      bottom: bottom ?? top,
      left: left ?? right ?? top,
    }

    // listen to changed to the childs size
    const child = this.child.build()
    this.addObserver(
      child.getDimension("width").onChangedObservable,
      () => {
        console.log("box padding, get dimension width", child.getDimension("width").value)
        this._updateDimentions()
      },
      this._disposeBag
    )
    this.addObserver(
      child.getDimension("height").onChangedObservable,
      () => {
        console.log("box padding, get dimension height", child.getDimension("height").value)
        this._updateDimentions()
      },
      this._disposeBag
    )
    this.control.onDisposeObservable.addOnce(() => {
      this._disposeBag.dispose()
    })

    // Adjust the container size by adding padding to the child's width and height
    this._updateDimentions()

    return this
  }
  private _updateDimentions() {
    const child = this.child.build()
    const childWidth = child.widthInPixels || 0
    const childHeight = child.heightInPixels || 0
    this.control.widthInPixels = childWidth + this._padding.left + this._padding.right
    this.control.heightInPixels = childHeight + this._padding.top + this._padding.bottom
    console.log("box padding, control size", this.control.widthInPixels, this.control.heightInPixels)
  }
}

/// State Management

export interface FluentState<T> {
  getValue(): any
  /** Method to run the update function and update the state value.
   * Update is run with new value before old value is overriden in the state object with new value.
   * You can get the old value from the state object in your update function if you need to compare old and new value set. */
  setValue(newValue: any): void
  bind<C extends Control, FC extends FluentControl<C, FC>>(
    control: FluentControl<any, any>,
    updateFn: (control: FC, newValue: T) => void
  )
}
export class FluentSubjectState<T> implements FluentState<T> {
  private value: any
  private observers: {
    control: FluentControl<any, any>
    updateFn: (control: FluentControl<any, any>, newValue: any) => void
  }[] = []

  constructor(initialValue?: any) {
    this.value = initialValue
  }

  // Method to read the current state value
  public getValue(): any {
    return this.value
  }

  public setValue(newValue: any): void {
    if (this.value !== newValue) {
      for (const observer of this.observers) {
        observer.updateFn(observer.control, newValue)
      }
      this.value = newValue
    }
  }

  bind<C extends Control, FC extends FluentControl<C, FC>>(
    control: FluentControl<C, FC>,
    updateFn: (control: FC, newValue: T) => void
  ) {
    this.observers.push({ control, updateFn })
    return control
  }
}

export class FluentBehaviourState<T> implements FluentState<T> {
  private value: T
  private observers: {
    control: FluentControl<any, any>
    updateFn: (control: FluentControl<any, any>, newValue: any) => void
  }[] = []

  constructor(initialValue: T) {
    this.value = initialValue
  }

  // Method to read the current state value
  public getValue(): T {
    return this.value
  }

  /** Method to run the update function and update the state value.
   * Update is run with new value before old value is overriden in the state object with new value.
   * You can get the old value from the state object in your update function if you need to compare old and new value set. */
  public setValue(newValue: any): void {
    for (const observer of this.observers) {
      observer.updateFn(observer.control, newValue)
    }
    this.value = newValue
  }

  bind<C extends Control, FC extends FluentControl<C, FC>>(
    control: FluentControl<any, any>,
    updateFn: (control: FC, newValue: T) => void
  ) {
    this.observers.push({ control, updateFn })
    updateFn(control as any, this.value)
    return control
  }
}

/// Containers

function FluentContainerCtor(name?: string): FluentContainer
function FluentContainerCtor(existing?: Container): FluentContainer
function FluentContainerCtor(
  name?: string,
  ...controls: (FluentControl<Control, any> | FluentControl<Control, any>[])[]
): FluentContainer
function FluentContainerCtor(
  arg1?: string | Container,
  ...controls: (FluentControl<Control, any> | FluentControl<Control, any>)[]
): FluentContainer {
  return new FluentContainer(arg1 as any, controls as any)
}
export class FluentContainer extends FluentControl<Container, FluentContainer> {
  constructor(name?: string)
  constructor(existing?: Container)
  constructor(name?: string, ...controls: (FluentControl<Control, any> | FluentControl<Control, any>[])[])
  constructor(arg1?: string | Container, ...controls: (FluentControl<Control, any> | FluentControl<Control, any>[])[]) {
    let container: Container

    if (typeof arg1 === "string") {
      container = new Container(arg1)
    } else if (arg1 instanceof Container) {
      container = arg1
    } else {
      container = new Container()
    }

    // Pass the initialized panel to the base FluentControl class
    super(container)

    const flatControls = controls.flat()

    // Add each control to the container
    flatControls.forEach((control) => {
      this.addControl(control)
    })
  }

  // Add a control to the container
  public addControl(...controls: (FluentControl<any, any> | FluentControl<any, any>[])[]): FluentContainer {
    for (const control of controls.flat()) {
      const builtControl = control.build()
      this.control.addControl(builtControl)
    }
    return this
  }

  public removeControl(input: FluentControl<any, any> | Control): FluentContainer {
    let removeControl
    if (input instanceof FluentControl) {
      removeControl = (input as any).control
    } else {
      removeControl = input
    }
    this.control.removeControl(removeControl)
    return this
  }

  /** Remove all the child controls */
  public clear(): FluentContainer {
    this.control.clearControls()
    return this
  }

  /** Grow to the size of the position of the furthest child */
  public growHeight(ratio: number = 1): FluentContainer {
    let maxHeight = 0
    this.control.children.forEach((c) => {
      if (c.topInPixels + c.heightInPixels > maxHeight) {
        maxHeight = c.topInPixels + c.heightInPixels
      }
    })
    this.control.heightInPixels = maxHeight * ratio
    console.log(maxHeight, maxHeight * ratio)
    return this
  }

  /** Apply a background color to the container */
  public background(color: string): FluentContainer {
    this.control.background = color
    return this
  }

  /** Set the container's width */
  public width(value: string | number | ((height: string | number) => string | number)): FluentContainer {
    if (typeof value == "function") {
      this.control.width = value(this.control.width)
    } else {
      this.control.width = value
    }
    return this
  }

  /** Set the container's height */
  public height(value: string | number | ((height: string | number) => string | number)): FluentContainer {
    if (typeof value == "function") {
      this.control.height = value(this.control.height)
    } else {
      this.control.height = value
    }
    return this
  }

  /** Sets a boolean indicating the container should try to adapt to its childrens height */
  public adaptHeightToChildren(value: boolean = true): FluentContainer {
    this.control.adaptHeightToChildren = value
    return this
  }

  /** Sets a boolean indicating the container should try to adapt to its childrens width */
  public adaptWidthToChildren(value: boolean = true): FluentContainer {
    this.control.adaptWidthToChildren = value
    return this
  }

  // Dynamic updates to the container
  public updateControls(controls: FluentControl<Control, any>[]): FluentContainer {
    this.control.clearControls()

    // Add the new controls
    controls.forEach((control) => this.addControl(control))
    return this
  }

  // Modifier for padding
  public padding(top: number, right: number, bottom: number, left: number): FluentContainer {
    this.control.paddingTopInPixels = top
    this.control.paddingRightInPixels = right
    this.control.paddingBottomInPixels = bottom
    this.control.paddingLeftInPixels = left
    return this
  }
}

export class FluentScrollViewer extends FluentControl<ScrollViewer, FluentScrollViewer> {
  constructor(name?: string)
  constructor(existing?: ScrollViewer)
  constructor(child?: FluentControl<Container, any>)
  constructor(name?: string, child?: FluentControl<Container, any>)
  constructor(
    arg1?: string | ScrollViewer | FluentControl<Container, any>,
    childOrExisting?: ScrollViewer | FluentControl<Container, any>
  ) {
    let scroller: ScrollViewer

    // Case 1: If `arg1` is a string (name), create a new ScrollViewer with that name
    if (typeof arg1 === "string") {
      scroller = new ScrollViewer(arg1)

      super(scroller)

      // Handle child assignment
      if (childOrExisting instanceof FluentControl) {
        this.addControl(childOrExisting)
      }

      // Case 2: If `arg1` is an instance of ScrollViewer, use the existing one
    } else if (arg1 instanceof ScrollViewer) {
      scroller = arg1
      super(scroller)

      // Case 3: If `arg1` is a FluentControl (child), create a new unnamed ScrollViewer and assign the child
    } else if (arg1 instanceof FluentControl) {
      scroller = new ScrollViewer()
      super(scroller)
      this.addControl(arg1)
      // Case 4: No arguments, create an unnamed ScrollViewer
    } else {
      scroller = new ScrollViewer()
      super(scroller)
    }
  }

  // Add a FluentControl
  public addControl(control: FluentControl<any, any>): FluentScrollViewer {
    if (this.control.children.length > 0) {
      throw Error("ViewScroller should only have one child!")
    }
    const builtControl = control.build()
    this.control.addControl(builtControl)
    return this
  }

  // Dynamic updates to the stack panel
  public updateControls(controls: FluentControl<Control, any>[]): FluentScrollViewer {
    this.control.clearControls()

    // Add the new controls
    controls.forEach((control) => this.addControl(control))
    return this
  }

  public setWheelPrecision(value: number): FluentScrollViewer {
    this.control.wheelPrecision = value
    return this
  }

  public setScrollBackground(color: string): FluentScrollViewer {
    this.control.scrollBackground = color
    return this
  }

  public setBarColor(color: string): FluentScrollViewer {
    this.control.barColor = color
    return this
  }

  public setThumbImage(value: Image): FluentScrollViewer {
    this.control.thumbImage = value
    return this
  }

  public setHorizontalThumbImage(value: Image): FluentScrollViewer {
    this.control.horizontalThumbImage = value
    return this
  }

  public setVerticalThumbImage(value: Image): FluentScrollViewer {
    this.control.verticalThumbImage = value
    return this
  }

  public setBarSize(value: number): FluentScrollViewer {
    this.control.barSize = value
    return this
  }

  public setThumbLength(value: number): FluentScrollViewer {
    this.control.thumbLength = value
    return this
  }

  public setThumbHeight(value: number): FluentScrollViewer {
    this.control.thumbHeight = value
    return this
  }

  public setBarImageHeight(value: number): FluentScrollViewer {
    this.control.barImageHeight = value
    return this
  }

  public setHorizontalBarImageHeight(value: number): FluentScrollViewer {
    this.control.horizontalBarImageHeight = value
    return this
  }

  public setVerticalBarImageHeight(value: number): FluentScrollViewer {
    this.control.verticalBarImageHeight = value
    return this
  }

  public setBarBackground(color: string): FluentScrollViewer {
    this.control.barBackground = color
    return this
  }

  public setBarImage(value: Image): FluentScrollViewer {
    this.control.barImage = value
    return this
  }

  public setHorizontalBarImage(value: Image): FluentScrollViewer {
    this.control.horizontalBarImage = value
    return this
  }

  public setVerticalBarImage(value: Image): FluentScrollViewer {
    this.control.verticalBarImage = value
    return this
  }
}

/** its width will depend on the children, while its height will be 100% of the parent, unless specified. */
export function FluentHorizontalStackPanel(name?: string): FluentStackPanel
/** its width will depend on the children, while its height will be 100% of the parent, unless specified. */
export function FluentHorizontalStackPanel(existing?: StackPanel): FluentStackPanel
/** its width will depend on the children, while its height will be 100% of the parent, unless specified. */
export function FluentHorizontalStackPanel(name?: string, ...controls: FluentControl<Control, any>[]): FluentStackPanel
/** its width will depend on the children, while its height will be 100% of the parent, unless specified. */
export function FluentHorizontalStackPanel(
  arg1?: string | StackPanel,
  ...controls: FluentControl<Control, any>[]
): FluentStackPanel {
  return new FluentStackPanel(arg1 as any, ...controls).setHorizontal()
}
/** its height will depend on the children, while its width will be 100% of the parent, unless specified. */
export function FluentVerticalStackPanel(name?: string): FluentStackPanel
/** its height will depend on the children, while its width will be 100% of the parent, unless specified. */
export function FluentVerticalStackPanel(existing?: StackPanel): FluentStackPanel
/** its height will depend on the children, while its width will be 100% of the parent, unless specified. */
export function FluentVerticalStackPanel(
  name?: string,
  ...controls: (FluentControl<Control, any> | FluentControl<Control, any>[])[]
): FluentStackPanel
/** its height will depend on the children, while its width will be 100% of the parent, unless specified. */
export function FluentVerticalStackPanel(
  arg1?: string | StackPanel,
  ...controls: (FluentControl<Control, any> | FluentControl<Control, any>[])[]
): FluentStackPanel {
  return new FluentStackPanel(arg1 as any, ...controls.flat()).setVertical()
}
/**
 * If the panel is vertical, its height will depend on the children, while its width will be 100% of the parent, unless specified. If the panel is horizontal, its width will depend on the children, while its height will be 100% of the parent, unless specified.
 */
export class FluentStackPanel extends FluentControl<StackPanel, FluentStackPanel> {
  constructor(name?: string)
  constructor(existing?: StackPanel)
  constructor(name?: string, ...controls: FluentControl<Control, any>[])
  constructor(
    arg1?: string | StackPanel,
    ...controls: (FluentControl<Control, any> | FluentControl<Control, any>[])[]
  ) {
    const flattenedControls = controls?.flat() ?? []
    let panel: StackPanel

    if (typeof arg1 === "string") {
      panel = new StackPanel(arg1)
    } else if (arg1 instanceof StackPanel) {
      panel = arg1
    } else {
      panel = new StackPanel()
    }

    // Pass the initialized panel to the base FluentControl class
    super(panel)

    // Add any additional FluentControls passed as children
    flattenedControls.forEach((control) => {
      this.addControl(control)
    })
  }

  // Add a FluentControl
  public addControl(control: FluentControl<any, any>): FluentStackPanel {
    const builtControl = control.build()
    this.control.addControl(builtControl)
    return this
  }

  // Dynamic updates to the container
  public updateControls(controls: FluentControl<Control, any>[]): FluentStackPanel {
    this.control.clearControls()

    // Add the new controls
    controls.forEach((control) => this.addControl(control))
    return this
  }

  // Apply vertical orientation
  /** its height will depend on the children, while its width will be 100% of the parent, unless specified. */
  public setVertical(): FluentStackPanel {
    this.control.isVertical = true
    return this
  }

  // Apply horizontal orientation
  /** its width will depend on the children, while its height will be 100% of the parent, unless specified. */
  public setHorizontal(): FluentStackPanel {
    this.control.isVertical = false
    return this
  }

  /** Sets a boolean indicating the container should try to adapt to its childrens height */
  public adaptHeightToChildren(value: boolean = true): FluentStackPanel {
    this.control.adaptHeightToChildren = value
    return this
  }

  /** Sets a boolean indicating the container should try to adapt to its childrens width */
  public adaptWidthToChildren(value: boolean = true): FluentStackPanel {
    this.control.adaptWidthToChildren = value
    return this
  }

  // A modifier system (similar to padding, alignment, etc.)
  public padding(top: number, right: number, bottom: number, left: number): FluentStackPanel {
    this.control.paddingTopInPixels = top
    this.control.paddingRightInPixels = right
    this.control.paddingBottomInPixels = bottom
    this.control.paddingLeftInPixels = left
    return this
  }
}

export class FluentGrid extends FluentControl<Grid, FluentGrid> {
  private controls: {
    row: number
    col: number
    control: FluentControl<any, any>
  }[] = []
  private rowCount: number = -1
  private colCount: number = -1
  constructor(name?: string)
  constructor(existing?: Grid)
  constructor(arg1?: string | Grid, existing?: Grid) {
    let name = ""
    let grid: Grid | undefined
    if (typeof arg1 == "string") {
      name = arg1
      grid = existing ?? new Grid(name)
    } else if (arg1 instanceof Grid) {
      grid = arg1
    } else {
      grid = new Grid()
    }
    super(grid)
    // this.control = grid
  }

  // Define the number of rows and columns in the grid
  public addRow(rowDefinition: number, isPixel = true): FluentGrid {
    this.control.addRowDefinition(rowDefinition, isPixel)
    this.rowCount += 1
    return this
  }

  public addColumn(colDefinition: number, isPixel = true): FluentGrid {
    this.control.addColumnDefinition(colDefinition, isPixel)
    this.colCount += 1
    return this
  }

  public addControl(control: FluentControl<any, any>): FluentGrid {
    if (this.rowCount == -1 || this.colCount == -1) {
      console.error("You must add at least one row and col before using addControl!")
      return this
    }
    const builtControl = control.build()
    this.control.addControl(builtControl, this.rowCount, this.colCount)
    this.controls.push({ row: this.rowCount, col: this.colCount, control })
    return this
  }

  // Add a control to the specified row and column
  public addControlAt(control: FluentControl<any, any>, row: number, col: number, colSpan?: number): FluentGrid {
    const builtControl = control.build()
    this.control.addControl(builtControl, row, col)
    this.controls.push({ row, col, control })
    if (colSpan) {
      this.control
    }
    return this
  }

  // Dynamic updates
  public updateGridControls(controls: { row: number; col: number; control: FluentControl<any, any> }[]): FluentGrid {
    this.control.clearControls()
    this.controls = []

    // Rebuild the grid with new controls
    controls.forEach(({ row, col, control }) => this.addControlAt(control, row, col))
    return this
  }
}

export class FluentRectangle extends FluentControl<Rectangle, FluentRectangle> {
  constructor(name?: string, child?: FluentControl<Container, any>)
  constructor(existing?: Rectangle, child?: FluentControl<Container, any>)
  constructor(arg1?: string | Rectangle, child?: FluentControl<Container, any>) {
    let name = ""
    let rectangle: Rectangle | undefined

    if (typeof arg1 === "string") {
      name = arg1
      rectangle = new Rectangle(name)
    } else if (arg1 instanceof Rectangle) {
      rectangle = arg1
    }

    super(rectangle)
    this.control = rectangle
    if (child) {
      this.addControl(child)
    }
  }

  // // Set the width of the rectangle
  // public width(value: string | number): FluentRectangle {
  //   this.control.width = value
  //   return this
  // }

  // // Set the height of the rectangle
  // public height(value: string | number): FluentRectangle {
  //   this.control.height = value
  //   return this
  // }

  /** Set the thickness of the border */
  public thickness(value: number): FluentRectangle {
    this.control.thickness = value
    return this
  }

  // Set the color of the rectangle's border
  public color(value: string): FluentRectangle {
    this.control.color = value
    return this
  }

  // Set the background color of the rectangle
  public background(value: string): FluentRectangle {
    this.control.background = value
    return this
  }

  // Add a control to the rectangle
  public addControl(control: FluentControl<any, any>): FluentRectangle {
    const builtControl = control.build()
    this.control.addControl(builtControl)
    return this
  }

  // Modifier for corner radius
  public cornerRadius(value: number): FluentRectangle {
    this.control.cornerRadius = value
    return this
  }
}

/// Interactive components

function FluentTextBlockCtor(name: string): FluentTextBlock
function FluentTextBlockCtor(existing: TextBlock): FluentTextBlock
function FluentTextBlockCtor(name: string, text: string): FluentTextBlock
function FluentTextBlockCtor(arg1?: string | TextBlock, existing?: string | TextBlock): FluentTextBlock {
  return new FluentTextBlock(arg1 as any, existing as any)
}

export class FluentTextBlock extends FluentControl<TextBlock, FluentTextBlock> {
  constructor(name: string)
  constructor(existing: TextBlock)
  constructor(name: string, text: string)
  constructor(arg1?: string | TextBlock, existing?: string | TextBlock) {
    if (typeof arg1 == "string" && typeof existing == "string") {
      const control = new TextBlock(arg1)
      control.text = existing
      super(control)
    } else if (typeof arg1 == "string" && existing == undefined) {
      const control = new TextBlock(arg1)
      super(control)
    } else if (arg1 instanceof TextBlock) {
      super(arg1)
    } else {
      const control = new TextBlock()
      super(control)
    }
  }

  /** Sets text to display */
  public setText(value: string | ((text: string) => string)): FluentTextBlock {
    if (typeof value === "string") {
      this.control.text = value
    } else {
      this.control.text = value(this.control.text)
    }
    return this
  }
  public text(): string {
    return this.control.text
  }

  /** Sets a boolean indicating that the TextBlock will be resized to fit its content */
  public resizeToFit(value: boolean = true): FluentTextBlock {
    this.control.resizeToFit = value
    return this
  }

  /** Sets text horizontal alignment (BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER by default) */
  public textHorizontalAlignment(value: number | "left" | "center" | "right"): FluentTextBlock {
    if (typeof value == "number") {
      this.control.textHorizontalAlignment = value
      return this
    }
    switch (value) {
      case "left": {
        this.control.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT
        break
      }
      case "center": {
        this.control.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER
        break
      }
      case "right": {
        this.control.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_RIGHT
        break
      }
    }
    return this
  }
  /** Sets text vertical alignment (BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER by default) */
  public textVerticalAlignment(value: number | "top" | "center" | "bottom"): FluentTextBlock {
    if (typeof value == "number") {
      this.control.textVerticalAlignment = value
      return this
    }
    switch (value) {
      case "top": {
        this.control.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_TOP
        break
      }
      case "center": {
        this.control.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_CENTER
        break
      }
      case "bottom": {
        this.control.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_BOTTOM
        break
      }
    }
    return this
  }
}

export class FluentInputText extends FluentControl<InputText, FluentInputText> {
  constructor(name: string)
  constructor(existing: InputText)
  constructor(name: string, text: string)
  constructor(arg1?: string | InputText, existing?: string | InputText) {
    if (typeof arg1 == "string" && typeof existing == "string") {
      const inputText = new InputText(arg1)
      inputText.text = existing
      super(inputText)
    } else if (typeof arg1 == "string" && existing == undefined) {
      const inputText = new InputText(arg1)
      super(inputText)
    } else if (arg1 instanceof InputText) {
      super(arg1)
    } else {
      const inputText = new InputText()
      super(inputText)
    }
  }

  // Fluent setter for text
  public setText(value: string): FluentInputText {
    this.control.text = value
    return this
  }

  // Event handler for text change
  public onTextChanged(
    callback: (eventData: InputText, eventState: EventState) => void,
    disposeBag?: DisposeBag
  ): FluentInputText {
    this.addObserver(this.control.onTextChangedObservable, callback, disposeBag)
    return this
  }
}

/// Buttons

export class FluentButton extends FluentContainer {
  get button(): Button {
    return this.control as Button
  }
  constructor(arg1: string | Button | undefined) {
    if (typeof arg1 == "string") {
      const button = new Button(arg1)
      super(button)
    } else {
      const button = arg1 ?? new Button()
      super(button)
    }
  }
  thickness(value: number): this {
    this.button.thickness = value
    return this
  }
  textBlock(cb: (tb: FluentTextBlock) => void): this {
    if ((this.button as any)._textBlock) {
      cb(new FluentTextBlock((this.button as any)._textBlock))
    }
    return this
  }
  /** Gets or sets background color of control if it's disabled */
  public disabledColor(value: string): this {
    this.control.disabledColor = value
    return this
  }
}

/// Buttons

export class FluentImageButton extends FluentButton {
  constructor(name: string, text: string, imageUrl: string) {
    super(Button.CreateImageButton(name, text, imageUrl))
  }
}
export class FluentImageOnlyButton extends FluentButton {
  constructor(name: string, imageUrl: string) {
    super(Button.CreateImageOnlyButton(name, imageUrl))
  }
}
export class FluentSimpleButton extends FluentButton {
  constructor(name: string, text: string) {
    super(Button.CreateSimpleButton(name, text))
  }
}
export class FluentImageWithCenterTextButton extends FluentButton {
  constructor(name: string, text: string, imageUrl: string) {
    super(Button.CreateImageWithCenterTextButton(name, text, imageUrl))
  }
}

/// Image

export class FluentImage extends FluentControl<Image, FluentImage> {
  constructor(name: string, imageUrl: string) {
    super(new Image(name, imageUrl))
  }
}
/// EXAMPLE

const disposeBag = new DisposeBag()
const buttonRef = new Ref<Button>()
const headlineState = new FluentBehaviourState<string>("Headline2")
new FluentContainer("root")
  .addControl(
    new FluentStackPanel("stack panel")
      .setHorizontal()
      .addControl(
        new FluentRectangle("border")
          .width("200px")
          .height("100px")
          .background("green")
          .onPointerClick((eventData, eventState) => {
            console.log("Rectangle clicked!")
          }, disposeBag)
          .onPointerEnter((eventData, eventState) => {
            console.log("Pointer entered!")
          }, disposeBag)
          .modifyControl((c) => (c.thickness = 5))
      )
      // .addControl(
      //   // buttonRef.capture(
      //   //   new FluentSimpleButton("button", "Lets GO!").color("blue").onPointerClick((data) => {
      //   //     if (buttonRef.isValid) {
      //   //       new FluentButton(buttonRef.get()).color("red")
      //   //     }
      //   //   }, disposeBag)
      //   // )
      // )
      .addControl(new FluentTextBlock("tb", "Headline").bindState(headlineState, (c, v) => c.setText(v)))
  )
  .build()

headlineState.setValue("Healine 2")

// Later, when we want to remove all event listeners:
disposeBag.dispose()

export const fg = {
  Container: FluentContainerCtor,
  Rectangle: FluentRectangle,
  StackPanel: FluentStackPanel,
  VStack: FluentVerticalStackPanel,
  HStack: FluentHorizontalStackPanel,
  ScrollViewer: FluentScrollViewer,
  TextBlock: FluentTextBlockCtor,
  InputText: FluentInputText,
  Button: FluentButton,
  SimpleButton: FluentSimpleButton,
  ImageButton: FluentImageButton,
  ImageOnlyButton: FluentImageOnlyButton,
  ImageWithCenterTextButton: FluentImageWithCenterTextButton,
}
