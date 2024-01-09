import "@babylonjs/core/Debug/debugLayer"
import "@babylonjs/inspector"
import "@babylonjs/loaders/glTF"
import "@babylonjs/gui/2D"
import HavokPhysics from "@babylonjs/havok";
import {
  AssetsManager,
  Engine,
  Scene,
  Vector3,
  HemisphericLight,
  TransformNode,
  TargetCamera,
  HavokPlugin,
  MeshBuilder,
  StandardMaterial,
  CubeTexture,
  Texture,
  Mesh,
  Quaternion,
  Material,
  Color3,
  Color4,
  LinesMesh,
  FreeCamera,
} from "@babylonjs/core"
import { net } from "./net"
import { ObjModels } from "./objModels";
import { AsteroidScene } from "./map/asteroidScene";
import { MenuGui } from "./gui/menuGui";
import { PlayerAgent } from "./agents/playerAgent";
import { ArenaRadius, moveCommandSystem, moveSystem, warpSystem } from "./world/systems/moveSystem";
import { updateRenderSystem } from "./world/systems/updateRenderSystem";
import { cameraSystem } from "./world/systems/cameraSystem";
import { netSyncClientSystem } from "./world/systems/netClientSystem";
import { netSyncServerSystem } from "./world/systems/netServerSystem";
import { rotationalVelocitySystem } from "./world/systems/rotationalVelocitySystem";
import { particleSystem } from "./world/systems/particleSystem";
import { gunCooldownSystem } from "./world/systems/gunCooldownSystem";
import "./world/systems/weaponsSystem";
import { AppContainer } from "./app.container";
import "./world/systems/updatePhysicsSystem";
import { engineRechargeSystem } from "./world/systems/engineRechargeSystem";
import { aiSystem } from "./world/systems/aiSystem";
import { shieldRechargeSystem } from "./world/systems/shieldRechargeSystem";
import { InputAgent } from "./agents/inputAgent";
import { SpaceDebrisAgent } from "./agents/spaceDebrisAgent";
import { RegisterDeathComes } from "./world/systems/deathRattleSystem";
import { missileTargetingSystem } from "./world/systems/missileTargetingSystem";
import { missileSteeringSystem } from "./world/systems/missileSteeringSystem";
const divFps = document.getElementById("fps");

class App {
  assetsManager: AssetsManager
  asteroidScene: AsteroidScene
  gui: MenuGui
  player: PlayerAgent
  spaceDebris: SpaceDebrisAgent
  input: InputAgent
  camera: TargetCamera
  server: boolean = false
  constructor() {
    // create the canvas html element and attach it to the webpage
    var canvas = document.createElement("canvas")
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvas.id = "gameCanvas"
    document.body.appendChild(canvas)

    // initialize babylon scene and engine
    const container = AppContainer.instance
    var engine = new Engine(canvas, false, { antialias: false }, false)
    var scene = new Scene(engine)
    // let camera = new TargetCamera("Camera", new Vector3(0, 0, 0))
    const camera = new FreeCamera("sceneCamera", new Vector3(0, 0, 0), scene)
    camera.inputs.clear();
    this.camera = camera
    var light1: HemisphericLight = new HemisphericLight(
      "light1",
      new Vector3(-1, -1, 0),
      scene
    )
    container.camera = camera
    container.engine = engine
    container.scene = scene

    RegisterDeathComes()
    // skybox generated from
    //https://tools.wwwtyro.net/space-3d/index.html#animationSpeed=1&fov=80&nebulae=true&pointStars=true&resolution=256&seed=4ro5nl4knq80&stars=true&sun=true
    const skybox = MeshBuilder.CreateBox("skyBox", { size: 10000.0 }, scene);
    const skyboxMaterial = new StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;
    const skycube = new CubeTexture("assets/skybox", scene, null, true, 
      //px, py, pz, nx, ny, nz
      ["assets/skybox/skybox_right.png", "assets/skybox/skybox_top.png", "assets/skybox/skybox_front.png", "assets/skybox/skybox_left.png", "assets/skybox/skybox_bottom.png", "assets/skybox/skybox_back.png"],
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

    // boundy spheres
    /*
    var material = new StandardMaterial("mat", scene);
    material.emissiveColor = Color3.White();
    material.wireframe = true
    const boundrySphereOne = MeshBuilder.CreateSphere("boundry-1", { segments: 10, diameter: ArenaRadius*2, sideOrientation: Mesh.DOUBLESIDE })
    boundrySphereOne.material = material
    boundrySphereOne.rotationQuaternion = Quaternion.Identity()
    const boundrySphereTwo = MeshBuilder.CreateSphere("boundry-2", { segments: 10, diameter: ArenaRadius*2+6, sideOrientation: Mesh.DOUBLESIDE })
    boundrySphereTwo.material = material 
    boundrySphereTwo.rotationQuaternion = Quaternion.RotationAxisToRef(Vector3.Left(), DegreeToRadian(90), Quaternion.Identity());
    const boundrySphereThree = MeshBuilder.CreateSphere("boundry-3", { segments: 10, diameter: ArenaRadius*2+3, sideOrientation: Mesh.DOUBLESIDE })
    boundrySphereThree.material = material
    boundrySphereThree.rotationQuaternion = Quaternion.RotationAxisToRef(new Vector3(0, 0, -1), DegreeToRadian(90), Quaternion.RotationAxisToRef(Vector3.Left(), DegreeToRadian(90), Quaternion.Identity()));

    const sphereOptions = [
      { sphere: boundrySphereOne, yaw: 1 / 300, pitch: 0, roll: 0 },
      { sphere: boundrySphereTwo, yaw: 1 / 300, pitch: 0, roll: 0 },
      { sphere: boundrySphereThree, yaw: 1 / 300, pitch: 0, roll: 0 },
    ]
    scene.onBeforeRenderObservable.add(() => {
      const dt = engine.getDeltaTime()
      for (const option of sphereOptions) {
        let rotationVec = option.sphere.rotation
        let rotationQuaternionB = option.sphere.rotationQuaternion
        // Quaternion.RotationYawPitchRoll(rotationVec.y, rotationVec.x, rotationVec.z);
        // helpful yaw, pitch, roll implementation found in https://playground.babylonjs.com/#UL7W2M
        const { pitch, yaw, roll } = option
        var axis = new Vector3(0, 0, -1);
        var partRotQuat  = new Quaternion();

        Quaternion.RotationAxisToRef(axis, roll / 100, partRotQuat);
        (rotationQuaternionB as Quaternion).multiplyInPlace(partRotQuat);

        Quaternion.RotationAxisToRef(axis.set(-1, 0, 0), pitch / 100, partRotQuat);
        rotationQuaternionB.multiplyInPlace(partRotQuat);

        Quaternion.RotationAxisToRef(axis.set(0, 1, 0), yaw / 100, partRotQuat);
        rotationQuaternionB.multiplyInPlace(partRotQuat);
        
        rotationQuaternionB.toEulerAnglesToRef(rotationVec);
      }
    })
    */
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

    // load the assets and physics engine
    engine.displayLoadingUI()
    let assetsManager = new AssetsManager(scene)
    let models: [string, string, string][] = [
      ["craftCargoA", "craft_cargoA", "/assets/craft_cargoA.glb"],
      ["craftCargoB", "craft_cargoB", "/assets/craft_cargoB.glb"],
      ["craftSpeederA", "craft_speederA", "/assets/craft_speederA_scaled.glb"],
      ["craftSpeederAHull", "craft_speederA", "/assets/craft_speederA_hull.glb"],
      ["meteor", "meteor", "/assets/meteor.glb"],
      ["meteorHalf", "meteor_half", "/assets/meteor_half.glb"],
      ["meteorDetailed", "meteor_detailed", "/assets/meteor_detailed.glb"],
    ]
    for (let [modelName, nodeName, modelPath] of models) {
      let objMeshTask = assetsManager.addMeshTask(
        modelName,
        nodeName,
        modelPath,
        ""
      )
      objMeshTask.onSuccess = (task) => {
        if (task.loadedTransformNodes[0] != undefined) {
          task.loadedTransformNodes[0]
            .getChildMeshes()
            .forEach((m) => (m.isVisible = false))
          ObjModels[modelName] = task.loadedTransformNodes[0] as TransformNode
        } else {
          let node = new TransformNode(modelName, scene)
          for (const mesh of task.loadedMeshes) {
            mesh.isVisible = false
            mesh.position.x = 0
            mesh.position.y = 0
            mesh.position.z = 0
            mesh.setParent(node)
          }
          ObjModels[modelName] = node
        }
        // this.objModels[modelName].isVisible = false
        console.log(`[Assets] loaded model: ${modelName}`)
      }
      objMeshTask.onError = (task, message, exception) => {
        console.log(
          `[Assets] failed ${task.name}: msg ${message}, error: ${exception}`
        )
      }
    }
    this.assetsManager = assetsManager
    const onFinishedLoading = () => {
      engine.hideLoadingUI()
      this.gui = new MenuGui()
      this.gui.onStart = () => {
        console.log("[App] gui said start")
        this.server = true
        if (this.asteroidScene == undefined) {
          this.asteroidScene = new AsteroidScene(10, ArenaRadius)
        }
        this.gui.close()
        this.gui = undefined
      }
      this.gui.onConnected = (peerId) => {
        console.log("[App] gui said connected to peer", peerId)
        net.conn.once("data", () => {
          // as soon as we get data, close the gui
          this.gui.close()
          this.gui = undefined
        })
      }
      this.gui.setPeerId(net.id)
      this.player = new PlayerAgent(engine)
      this.input = new InputAgent()
      this.spaceDebris = new SpaceDebrisAgent(scene)
      AppContainer.instance.player = this.player;
      (window as any).appContainer = AppContainer.instance
    }
    Promise.all([
      new Promise((resolve) => {
        assetsManager.onFinish = (tasks) => {
          console.dir(tasks)
          resolve({})
        }
      }),
      HavokPhysics()
    ])
    .then(([_, havokInstance]) => {
      const havokPlugin = new HavokPlugin(true, havokInstance)
      const container = AppContainer.instance
      container.havokInstance = havokInstance
      container.havokPlugin = havokPlugin
      scene.enablePhysics(Vector3.Zero(), havokPlugin)
      onFinishedLoading()
    })
    
    assetsManager.load()

    // run the main render loop
    engine.runRenderLoop(() => {
      if (this.gui) {
        // don't start the game while menu is open
        scene.render()
        return;
      }
      const delta = engine.getDeltaTime()
      gunCooldownSystem(delta)
      shieldRechargeSystem(delta)
      engineRechargeSystem(delta)
      if (this.player) {
        this.player.checkInput(delta)
      }
      if (this.input) {
        this.input.checkInput(delta)
      }
      aiSystem(delta)
      moveCommandSystem(delta)
      rotationalVelocitySystem()
      moveSystem(delta)
      particleSystem()
      missileSteeringSystem(delta)
      missileTargetingSystem(delta)
      warpSystem()
      if (this.server) {
        netSyncServerSystem(delta)
      } else {
        netSyncClientSystem(delta)
      }
      updateRenderSystem()
      if (this.spaceDebris) {
        this.spaceDebris.update(delta)
      }
      cameraSystem(this.player, this.camera)

      // show debug axis
      // if (this.player?.playerEntity?.node) {
      // if (window.velocity == undefined) {
      //   let ball = MeshBuilder.CreateBox("velocity", {
      //     size: 1.0
      //   })
      //   window.velocity = ball
      // }
      //   if (window.driftVelocity == undefined) {
      //     let ball = MeshBuilder.CreateBox("driftVelocity", {
      //       size: 5.0
      //     })
      //     window.driftVelocity = ball
      //   }
      //   if (this.player.playerEntity.velocity) {
      //     let ball = window.velocity as Mesh
      //     ball.position.x = this.player.playerEntity.position.x + (this.player.playerEntity.velocity.x) 
      //     ball.position.y = this.player.playerEntity.position.y + (this.player.playerEntity.velocity.y) 
      //     ball.position.z = this.player.playerEntity.position.z + (this.player.playerEntity.velocity.z)
      //     if (this.player.playerEntity.breakingVelocity) {
      //       ball.position.x += this.player.playerEntity.breakingVelocity.x
      //       ball.position.y += this.player.playerEntity.breakingVelocity.y
      //       ball.position.z += this.player.playerEntity.breakingVelocity.z
      //     }
      //   }
      //   let ball = window.driftVelocity as Mesh
      //   if (this.player.playerEntity.driftVelocity) {
      //     ball.isVisible = true
      //     ball.position.x = this.player.playerEntity.position.x + (this.player.playerEntity.driftVelocity.x)
      //     ball.position.y = this.player.playerEntity.position.y + (this.player.playerEntity.driftVelocity.y)
      //     ball.position.z = this.player.playerEntity.position.z + (this.player.playerEntity.driftVelocity.z)
          
      //   } else {
      //     ball.isVisible = false
      //   }
      // }

      scene.render()
      // divFps.innerHTML = engine.getFps().toFixed() + " fps";
      if (this.player?.playerEntity?.currentSpeed) {
        divFps.innerHTML = `${this.player?.playerEntity?.currentSpeed.toFixed(0) ?? 0} mps`;
      }
    })
  }
}
new App()


/**
 * 
 * NOTES:
 * 
 * Main Screen
 * Wing Mercs
 * - [Host]
 * = [Join]
 * 
 * Host
 * [ID]
 * Connected:
 * - ID1
 * - ID2
 * [Start]
 * [Back]
 * 
 * Connect
 * [Input]
 * [Connect] -> Connected
 * [Back]
 * 
 * [TODO]:
 * - collision
 * -- x large asteroids explode to medium
 * -- x medium explode to small
 * -- x small explode to dust
 * -- ships collide and take damage
 * - assets
 * -- x laser 
 * -- ufo alien
 * -- thruster burn cone
 * -- x ship trails
 * - gameplay
 * -- win when user gets 10000 points
 * -- add alien ship and ai
 * -- aliens shoot at nearest player
 * -- x add out of bounds spheres rotating
 * -- reset when win/lose
 * - bugs
 * -- client particles not appearing on host
 * [LEARN]
 * - Art
 * -- low poly hard models
 * -- generate pixel textures
 * - Net Code
 * -- lag compensation
 * -- lerping corrections
 * -- peer -> peer 4 player multiplayer
 * -- background task shifting state to other players
 * 
 */