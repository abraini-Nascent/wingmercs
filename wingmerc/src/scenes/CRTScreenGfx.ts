import { AppContainer } from "./../app.container"
import {
  ArcRotateCamera,
  Camera,
  IDisposable,
  Layer,
  LayerSceneComponent,
  PostProcess,
  RenderTargetTexture,
  Scene,
  SceneComponentConstants,
  Vector3,
} from "@babylonjs/core"
import { AdvancedDynamicTexture } from "@babylonjs/gui"

export class CRTScreenGfx implements IDisposable {
  uiScene: Scene
  uiLayer: Layer
  uiRenderTarget: RenderTargetTexture
  uiCamera: Camera
  crtEffect: PostProcess

  public gui: AdvancedDynamicTexture

  constructor() {
    // Create the UI scene
    const uiScene = new Scene(AppContainer.instance.engine)
    this.uiScene = uiScene

    // UI camera (orthographic camera for 2D)
    const uiCamera = new ArcRotateCamera("UICamera", Math.PI / 2, Math.PI / 4, 3, Vector3.Zero(), uiScene)
    uiCamera.mode = Camera.ORTHOGRAPHIC_CAMERA
    uiCamera.orthoLeft = -1
    uiCamera.orthoRight = 1
    uiCamera.orthoTop = 1
    uiCamera.orthoBottom = -1
    this.uiCamera = uiCamera
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI("Stats", true, uiScene)
    const uiRenderTarget = new RenderTargetTexture(
      "UIRenderTarget",
      { width: 1024, height: 1024 },
      AppContainer.instance.scene,
      false
    )
    uiRenderTarget.renderList = uiScene.meshes // Add only the UI elements to the render list
    this.uiRenderTarget = uiRenderTarget

    let time = 0.0 // For animation
    let alpha = 0 // For the v-sync line
    const scanlineDark = 0.4 // Darkness of scanlines
    const scanlineThick = 5.0 // Thickness of scanlines
    const curveAmount = 0.01 // Curve distortion amount
    const noiseIntensity = 0.125 // the amount of noise
    const jitterAmount = 0.001 // Controls the blur strength

    // Apply the CRT shader as a PostProcess
    const crtEffect = new PostProcess(
      "CRT",
      "/assets/shaders/crt-jitter",
      [
        "time",
        "jitterAmount",
        "noiseIntensity",
        "vSyncAlpha",
        "scanlineDark",
        "scanlineThick",
        "curveDistortion",
        "screenHeight",
      ], // Custom uniforms
      null, // No custom samplers
      1.0, // Full resolution
      uiCamera
    )
    this.crtEffect = crtEffect

    // Update uniforms in each frame

    crtEffect.onApply = (effect) => {
      time += AppContainer.instance.engine.getDeltaTime() * 0.001 // Increment time
      effect.setFloat("time", time)
      alpha += AppContainer.instance.engine.getDeltaTime() * 0.00025 // Increment time
      if (alpha > 1) {
        alpha = 0
      }
      effect.setFloat("time", time)
      effect.setFloat("jitterAmount", jitterAmount)
      effect.setFloat("noiseIntensity", noiseIntensity)
      effect.setFloat("vSyncAlpha", alpha)
      effect.setFloat("scanlineDark", scanlineDark)
      effect.setFloat("scanlineThick", scanlineThick)
      effect.setFloat("curveDistortion", curveAmount)
      effect.setFloat("screenHeight", AppContainer.instance.engine.getRenderHeight())
    }

    // Layer for compositing UI over the main scene
    const uiLayer = new Layer("UILayer", null, AppContainer.instance.scene)
    uiLayer.texture = uiRenderTarget
    this.uiLayer = uiLayer
  }

  update(dt: number) {
    this.uiScene.render()
  }

  dispose() {
    this.uiRenderTarget.dispose()
    this.uiLayer.dispose()
    this.uiCamera.dispose()
    this.crtEffect.dispose()
    this.uiScene.dispose()
    this.gui.dispose()
    AppContainer.instance.scene.onAfterRenderObservable.addOnce(() => {
      AppContainer.instance.camera.setEnabled(true)
      AppContainer.instance.scene.setActiveCameraById(AppContainer.instance.camera.id)
    })
  }
}
