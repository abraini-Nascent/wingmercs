import "@babylonjs/core/Debug/debugLayer"
import "@babylonjs/inspector"
import "@babylonjs/loaders/glTF"
import "@babylonjs/gui/2D"
import { AssetsManager, Engine, Scene, Vector3, HemisphericLight, TargetCamera, FreeCamera } from "@babylonjs/core"
import "./world/systems/controlSystems/weaponCommandSystem"
import { AppContainer } from "./app.container"
import "./world/systems/renderSystems/updatePhysicsSystem"
import "./world/systems/deathRattleSystem"
import { loadAssets } from "./assetLoader/assetLoader"
import { MainMenuScene } from "./scenes/mainMenu/mainMenuLoop"
import earcut from "earcut"
import { KeyboardMap } from "./utils/keyboard"
import { VRSystem } from "./world/systems/renderSystems/vrSystem"
import { StatsScene } from "./scenes/statsScene/statsLoop"
import { Dirk } from "./data/ships"
import { ShipCustomizerRetroScene } from "./scenes/shipCustomizer/shipCustomizerRetroLoop"
import { MissionSelectRetroScene } from "./scenes/missionSelectScene/missionSelectRetroLoop"
import { debugLog } from "./utils/debuglog"
import { ControlsMenuScene } from "./scenes/controlsMenu/controlsMenuLoop"
import { SettingsMenuScene } from "./scenes/settingsMenu/settingsMenuLoop"

class App {
  assetsManager: AssetsManager
  camera: TargetCamera
  server: boolean = false
  constructor() {
    ;(window as any).appContainer = AppContainer.instance

    // Attach earcut to the window object
    ;(window as any).earcut = earcut

    // create the canvas html element and attach it to the webpage
    const canvas = document.createElement("canvas")
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvas.id = "gameCanvas"
    document.body.appendChild(canvas)

    canvas.addEventListener("keydown", (event) => {
      event.preventDefault()
      event.stopPropagation()
    })

    // initialize babylon scene and engine
    const container = AppContainer.instance
    const engine = new Engine(canvas, false, { antialias: false }, false)
    const scene = new Scene(engine)
    // scene.performancePriority = ScenePerformancePriority.Intermediate
    scene.skipPointerMovePicking = true
    scene.autoClear = false
    scene.clearColor.set(0, 0, 0, 1)
    // let camera = new TargetCamera("Camera", new Vector3(0, 0, 0))
    const camera = new FreeCamera("sceneCamera", new Vector3(0, 0, 0), scene)
    camera.inputs.clear()
    this.camera = camera
    const light1: HemisphericLight = new HemisphericLight("light1", new Vector3(-1, -1, 0), scene)
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
      debugLog(`[APP] resize window resize: ${window.innerHeight}, ${window.innerWidth}`)
      debugLog(`[APP] resize canvas resize: ${canvas.width}, ${canvas.height}`)
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
      Engine.audioEngine.setGlobalVolume(0.5)
      if (AppContainer.instance.debug) {
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get("screen-test")) {
          switch (urlParams.get("screen-test")) {
            case "stats": {
              AppContainer.instance.gameScene = new StatsScene(
                {
                  livesLeft: 1,
                  timeLeft: 56,
                  total: 90000,
                },
                {
                  afterburnerFuelSpent: 100,
                  armorDamageGiven: 100,
                  armorDamageTaken: 50,
                  driftTime: 1000,
                  missilesEaten: 1,
                  missilesDodged: 1,
                  missilesHit: 1,
                  missilesLaunched: 1,
                  roundsHit: 50,
                  roundsMissed: 25,
                  shieldDamageGiven: 500,
                  shieldDamageTaken: 250,
                  totalKills: 5,
                }
              )
              break
            }
            case "ship": {
              AppContainer.instance.gameScene = new ShipCustomizerRetroScene(Dirk)
              break
            }
            case "mission": {
              AppContainer.instance.gameScene = new MissionSelectRetroScene()
              break
            }
            case "controls": {
              AppContainer.instance.gameScene = new ControlsMenuScene()
              break
            }
            case "settings": {
              AppContainer.instance.gameScene = new SettingsMenuScene()
              break
            }
          }
        } else {
          // AppContainer.instance.gameScene = new MissionSelectScene()
          // AppContainer.instance.gameScene = new MissionOverScene()
          AppContainer.instance.gameScene = new MainMenuScene()
          // AppContainer.instance.gameScene = new FlexTestScene()
        }
      } else {
        AppContainer.instance.gameScene = new MainMenuScene()
      }
      VRSystem.tryVR()
    }

    this.assetsManager = loadAssets(onFinishedLoading)

    // run the main render loop
    engine.runRenderLoop(() => {
      const dt = Math.min(1000, engine.getDeltaTime())
      // limit dt to a max timestep
      AppContainer.instance.gameScene?.runLoop(dt)
    })
    // Request permission for audio on user interaction
    document.addEventListener("click", function () {
      if (Engine.audioEngine && Engine.audioEngine.canUseWebAudio && Engine.audioEngine.unlocked == false) {
        Engine.audioEngine.audioContext.resume().then(function () {
          debugLog("[APP] Audio context is now unlocked")
          queueMicrotask(() => {
            Engine.audioEngine.setGlobalVolume(0.5)
          })
        })
      }
    })

    // for (const diff of [20, 40, 60, 80, 100]) console.log(generateMission(diff))

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
