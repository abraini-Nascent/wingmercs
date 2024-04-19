import "@babylonjs/core/Debug/debugLayer"
import "@babylonjs/inspector"
import "@babylonjs/loaders/glTF"
import "@babylonjs/gui/2D"
import {
  AssetsManager,
  Engine,
  Scene,
  Vector3,
  HemisphericLight,
  TargetCamera,
  MeshBuilder,
  StandardMaterial,
  CubeTexture,
  Texture,
  FreeCamera,
  Quaternion,
  TmpVectors,
} from "@babylonjs/core"
import "./world/systems/controlSystems/weaponCommandSystem";
import { AppContainer } from "./app.container";
import "./world/systems/renderSystems/updatePhysicsSystem";
import "./world/systems/deathRattleSystem";
import { loadAssets } from "./assetLoader/assetLoader";
import { MainMenuScene } from "./scenes/mainMenu/mainMenuLoop";
import { FlexTestScene } from "./scenes/flexTest/flexTest"

class App {
  assetsManager: AssetsManager
  camera: TargetCamera
  server: boolean = false
  constructor() {
    (window as any).appContainer = AppContainer.instance;

    ;(window as any).vector45DegreesUpForward = ():Vector3 =>  {
      // Define the forward direction (assumed to be Vector3.Forward())
      const forward = Vector3.Forward();
    
      // Calculate the rotation quaternion for 45 degrees around the horizontal axis
      const rotation = Quaternion.RotationAxis(Vector3.Right(), Math.PI / 4); // 45 degrees in radians
    
      // Rotate the forward vector by the rotation quaternion
      const vector45DegreesUpForward = forward.rotateByQuaternionToRef(rotation, TmpVectors.Vector3[0]);
    
      return vector45DegreesUpForward;
    }

    // create the canvas html element and attach it to the webpage
    const canvas = document.createElement("canvas")
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvas.id = "gameCanvas"
    document.body.appendChild(canvas)

    canvas.addEventListener('keydown', (event) => {
      event.preventDefault()
      event.stopPropagation()
    });

    // initialize babylon scene and engine
    const container = AppContainer.instance
    const engine = new Engine(canvas, false, { antialias: false }, false)
    const scene = new Scene(engine)
    // let camera = new TargetCamera("Camera", new Vector3(0, 0, 0))
    const camera = new FreeCamera("sceneCamera", new Vector3(0, 0, 0), scene)
    camera.inputs.clear();
    this.camera = camera
    const light1: HemisphericLight = new HemisphericLight(
      "light1",
      new Vector3(-1, -1, 0),
      scene
    )
    container.camera = camera
    container.engine = engine
    container.scene = scene

    // skybox generated from
    //https://tools.wwwtyro.net/space-3d/index.html#animationSpeed=1&fov=80&nebulae=true&pointStars=true&resolution=256&seed=4ro5nl4knq80&stars=true&sun=true
    const skybox = MeshBuilder.CreateBox("skyBox", { size: 10000.0 }, scene);
    const skyboxMaterial = new StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;
    const skycube = new CubeTexture("assets/skybox", scene, null, true, 
      //px, py, pz, nx, ny, nz
      ["assets/skybox/nebula/skybox_right.png", "assets/skybox/nebula/skybox_top.png", "assets/skybox/nebula/skybox_front.png", "assets/skybox/nebula/skybox_left.png", "assets/skybox/nebula/skybox_bottom.png", "assets/skybox/nebula/skybox_back.png"],
      () => {
        skycube.updateSamplingMode(Texture.NEAREST_NEAREST);
      }
    );
    skycube.anisotropicFilteringLevel = 0;
    skycube.wrapU = Texture.CLAMP_ADDRESSMODE;
    skycube.wrapV = Texture.CLAMP_ADDRESSMODE;
    skycube.wrapR = Texture.CLAMP_ADDRESSMODE;
    skybox.infiniteDistance = true
    skyboxMaterial.reflectionTexture = skycube
    skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    skybox.renderingGroupId = 0;

    // hide/show the Inspector
    window.addEventListener("keydown", (ev) => {
      // Shift+Ctrl+Alt+I
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
        if (scene.debugLayer.isVisible()) {
          scene.debugLayer.hide()
        } else {
          scene.debugLayer.show()
        }
      }
    })
    // handle window resize
    window.addEventListener("resize", () => {
      const scale = window.devicePixelRatio
      canvas.height = window.innerHeight * Math.round(scale)
      canvas.width = window.innerWidth * Math.round(scale)
      console.log(`[APP] resize window resize: ${window.innerHeight}, ${window.innerWidth}`)
      console.log(`[APP] resize canvas resize: ${canvas.width}, ${canvas.height}`)
      engine.resize()
    })
    // handle orientation change
    // window.addEventListener("orientationchange", () => {
    //   const scale = window.devicePixelRatio
    //   canvas.height = window.innerHeight * Math.round(scale)
    //   canvas.width = window.innerWidth * Math.round(scale)
    //   console.log(`[APP] orientation change window resize: ${window.innerHeight}, ${window.innerWidth}`)
    //   console.log(`[APP] orientation change canvas resize: ${canvas.width}, ${canvas.height}`)
    //   engine.resize()
    // });


    // load the assets and physics engine
    const onFinishedLoading = () => {
      engine.hideLoadingUI()
      Engine.audioEngine.setGlobalVolume(0.1);
      AppContainer.instance.gameScene = new MainMenuScene()
      // AppContainer.instance.gameScene = new FlexTestScene()
    }
    
    this.assetsManager = loadAssets(onFinishedLoading)

    // run the main render loop
    engine.runRenderLoop(() => {
      const dt = engine.getDeltaTime()
      AppContainer.instance.gameScene?.runLoop(dt)
    })
    // Request permission for audio on user interaction
    document.addEventListener('click', function () {
      if (Engine.audioEngine && Engine.audioEngine.canUseWebAudio && Engine.audioEngine.unlocked == false) {
        Engine.audioEngine.audioContext.resume().then(function () {
          console.log('[APP] Audio context is now unlocked');
        });
      }
  });
  }
}
new App()