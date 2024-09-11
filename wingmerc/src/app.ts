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
  FreeCamera,
} from "@babylonjs/core"
import "./world/systems/controlSystems/weaponCommandSystem";
import { AppContainer } from "./app.container";
import "./world/systems/renderSystems/updatePhysicsSystem";
import "./world/systems/deathRattleSystem";
import { loadAssets } from "./assetLoader/assetLoader";
import { MainMenuScene } from "./scenes/mainMenu/mainMenuLoop";
import { FlexTestScene } from "./scenes/flexTest/flexTest"
import earcut from 'earcut';
import { KeyboardMap } from "./utils/keyboard"

class App {
  assetsManager: AssetsManager
  camera: TargetCamera
  server: boolean = false
  constructor() {

    (window as any).appContainer = AppContainer.instance;
    
    // Attach earcut to the window object
    (window as any).earcut = earcut;

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

    // hide/show the Inspector
    window.addEventListener("keydown", (ev) => {
      // Shift+Ctrl+Alt+I
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === KeyboardMap.I) {
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
      Engine.audioEngine.setGlobalVolume(0.5);
      if (AppContainer.instance.debug) {
        AppContainer.instance.gameScene = new MainMenuScene()
        // AppContainer.instance.gameScene = new FlexTestScene()
      } else {
        AppContainer.instance.gameScene = new MainMenuScene()
      }
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
          queueMicrotask(() => {
            Engine.audioEngine.setGlobalVolume(0.5);
          })
        });
      }
    });

  //   const testcanvas = document.createElement('canvas');
  //   // Set canvas size
  //   const size = 1000
  //   testcanvas.width = size; // Adjust width as needed
  //   testcanvas.height = size; // Adjust height as needed
  //   testcanvas.style.width = `${size}px`
  //   testcanvas.style.height = `${size}px`

  //   // Optionally set canvas styles (e.g., border, background color)
  //   testcanvas.style.border = '1px solid black';
  //   testcanvas.style.backgroundColor = '#FF0000';

  //   // Append the canvas to the document body
  //   document.body.appendChild(testcanvas);

  //   // Now you can use the canvas context for drawing
  //   const testctx = testcanvas.getContext('2d');

  //   // Example drawing on the canvas
  //   testctx.fillStyle = 'white';
  //   testctx.fillRect(0, 0, testcanvas.width, testcanvas.height);
  //   const width = testcanvas.width;
  //   const height = testcanvas.height;

  //   const density = generateDensityMap(1, 1)
  //   const fractalDensity = generateFractalDensityMap(1, 1)
  //   const turbulenceDensityMap = generateCustomTurbulenceDensityMap(100, 100)
  //   const worleyDensity = generateWorleyDensityMap(1, 1, 0.75)
  //   const densityMap = fractalDensity

  //   for (let x = 0; x < width; x++) {
  //       for (let y = 0; y < height; y++) {
  //           const density = densityMap(x / width, y / height);
  //           const color = Math.floor(density * 255);
  //           testctx.fillStyle = `rgb(${color}, ${color}, ${color})`;
  //           testctx.fillRect(x, y, 1, 1);
  //       }
  //   }
  }
}
new App()