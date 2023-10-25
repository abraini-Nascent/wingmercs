import "@babylonjs/core/Debug/debugLayer"
import "@babylonjs/inspector"
import "@babylonjs/loaders/glTF"
import "@babylonjs/gui/2D"
import HavokPhysics from "@babylonjs/havok";
import { AdvancedDynamicTexture, InputText } from "@babylonjs/gui/2D"
import {
  AssetsManager,
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  TransformNode,
  DeviceSourceManager,
  DeviceType,
  FlyCameraKeyboardInput,
  XboxInput,
  Quaternion,
  Tools,
  Matrix,
  FollowCamera,
  TargetCamera,
  Camera,
  LinesMesh,
} from "@babylonjs/core"
import { Entity, GFrame, world } from "./world"
import { random } from "./random"
import { net } from "./net"
import guiContent from "./data/guiContent.json"
import { TextBlock } from "@babylonjs/gui"
import { decode, encode } from "@msgpack/msgpack"

const ObjModels: { [name: string]: any } = {}
const divFps = document.getElementById("fps");

function DegreeToRadian(degrees: number): number {
  return degrees * (Math.PI/180)
}

class Pool<T> {
  private objects: T[] = []
  ctor: ()=> T
  constructor(ctor: ()=> T) {
    this.ctor = ctor
  }
  getObject(ctor?: () => T ): T {
    if (this.objects.length > 0) {
      return this.objects.pop()
    } else {
      return (ctor ?? this.ctor)()
    }
  }

  release(object: T): void {
    this.objects.push(object);
  }
}
const Vector3Pool = new Pool<Vector3>(() => { return new Vector3() })
/* Create some queries: */
const queries = {
  updateRender: world.with("position", "node"),
  moving: world.with("position", "velocity", "acceleration"),
  meshed: world.with("meshName")
}

function moveSystem() {
  for (const { position, velocity, acceleration } of queries.moving) {
    velocity.x += acceleration.x
    velocity.y += acceleration.y
    velocity.z += acceleration.z
    const vec = new Vector3(velocity.x, velocity.y, velocity.z)
    // if (vec.length() > 1) {
    //   vec.normalize()
    //   velocity.x = vec.x
    //   velocity.y = vec.y
    //   velocity.z = vec.z
    // }
    position.x += velocity.x / 1000
    position.y += velocity.y / 1000
    position.z += velocity.z / 1000
  }
}

/**
 * From: https://forum.babylonjs.com/t/camera-following-position-and-rotation/9711/9
 * FollowCamera doesn't match target rotation, even when the same UP as the target is given
 */
class RubberbandCameraController {
  static TURN = Quaternion.FromEulerAngles(0, Math.PI, 0);
  private camera: TargetCamera;
  private _radius: number;
  private followTarget: Vector3;
  follow: {position: Vector3, rotationQuaternion: Quaternion}; // type the duck

  constructor(camera: TargetCamera, follow: {position: Vector3, rotationQuaternion: Quaternion}, radius: number = 15) {
    this.camera = camera;
    this.radius = radius;
    this.follow = follow;
    camera.rotationQuaternion = RubberbandCameraController.TURN.clone();
    camera.position = follow.position.add( this.followTarget );
  }

  set radius(r: number) {
    this._radius = r;
    this.followTarget = new Vector3(0, 0, this._radius);
  }

  public update() {
    const c = this.camera;
    const p = this.follow.position;
    const q = this.follow.rotationQuaternion ?? Quaternion.Identity();

    const t = this.followTarget.rotateByQuaternionToRef(q, Vector3.Zero() ).addInPlace(p);

    // interpolate position
    c.position = Vector3.Lerp(c.position, t, 0.33);

    // camera somehow looks backwards, so turn it
    const tq = q.multiply(RubberbandCameraController.TURN);

    // interpolate rotation
    Quaternion.SlerpToRef(c.rotationQuaternion, tq, 0.33, c.rotationQuaternion);
  }
}

let playerFollowCamera: RubberbandCameraController = undefined;
function cameraSystem(player: PlayerAgent, camera: TargetCamera) {
  if (player?.node == undefined || camera == undefined) { return }

  let ship = player.node
  if (ship && playerFollowCamera == undefined) {
    playerFollowCamera = new RubberbandCameraController(camera, ship)
  } else {
    playerFollowCamera.update()
  }
}

let acc = 0
const NetTik = 10
const NetTikMili = 1000/NetTik
let server = false
let onIncData
// oof
let cheapId = 0
let netId2worldId = []
let worldId2netId = []
let lastSync = 0
// foo
function netSyncSystem(dt: number) {

  if (server == false && net.conn != undefined && onIncData == undefined) {
    onIncData = (data) => {
      console.time("net frame decode")
      const payload = decode(data) as { syn: number, entities: Partial<Entity>[] }
      if (payload.syn < lastSync) { console.log("[net] out of order frame"); return }
      lastSync = payload.syn
      for (const entityData of payload.entities) {
        const id = entityData["_id"]
        delete entityData["_id"]
        let localId = netId2worldId[id]
        if (localId != undefined) {
          const entity = world.entity(localId)
          world.update(entity, entityData)
        } else {
          const newEntity = world.add(entityData as Entity)
          const newId = world.id(newEntity)
          netId2worldId[id] = newId
        }
      }
      console.timeEnd("net frame decode")
    }
    net.onData(onIncData)
  }
  acc += dt
  if (acc < NetTikMili) {
    return
  }
  acc -= NetTikMili
  if (acc > NetTikMili * 0.5) {
    acc = 0
  }
  if (net.conn == undefined || server == false) {
    return
  }
  console.time("net frame encode")
  const frame = new GFrame()
  const message = encode({syn: ++lastSync, entities: frame.payload})
  net.send(message)
  console.timeEnd("net frame encode")
}

function updateRenderSystem() {
  for (const { position, node, rotationQuaternion, rotation } of queries.updateRender) {
    let transform = node as TransformNode
    transform.position.x = position.x
    transform.position.y = position.y
    transform.position.z = position.z
    if (rotationQuaternion != null) {
      if (transform.rotationQuaternion == null) {
        transform.rotationQuaternion = Quaternion.Identity()
      }
      transform.rotationQuaternion.x = rotationQuaternion.x
      transform.rotationQuaternion.y = rotationQuaternion.y
      transform.rotationQuaternion.z = rotationQuaternion.z
      transform.rotationQuaternion.w = rotationQuaternion.w
    }
    if (rotation != undefined) {
      transform.rotation.set(rotation.x, rotation.y, rotation.z)
    }
  }
}

queries.meshed.onEntityAdded.subscribe(
  (() => {
    let i = 0
    return (entity) => {
      const meshNode = ObjModels[entity.meshName] as TransformNode
      // create the mesh
      const newNode = new TransformNode(`${entity.meshName}-node-${i}`)
      const children = meshNode.getChildMeshes()
      for (let mi = 0; mi < children.length; mi += 1) {
        const mesh = children[mi]
        const instanceMesh = (mesh as Mesh).clone(`${entity.meshName}-mesh-${i}-${mi}`, newNode)
        //.createInstance(`asteroid-mesh-${i}-${mi}`)
        instanceMesh.isVisible = true
        // instanceMesh.setParent(newNode)
      }
      world.addComponent(entity, "node", newNode)
    }
  })()
)

class AsteroidScene {
  constructor(count: number, radius: number) {
    const meteorNode = ObjModels["meteor"] as TransformNode
    /*
    r = R * sqrt(random())
    theta = random() * 2 * PI
    (Assuming random() gives a value between 0 and 1 uniformly)

    If you want to convert this to Cartesian coordinates, you can do

    x = centerX + r * cos(theta)
    y = centerY + r * sin(theta)
    */

    for (let i = 0; i < count; i += 1) {
      const r = radius * Math.sqrt(random())
      const theta = random() * 2 * Math.PI
      const phi = random() * Math.PI;
      const x = r * Math.cos(theta)
      const z = r * Math.sin(theta)
      const y = r * Math.cos(phi)
      const velocity = {
        x: random(),
        y: random(),
        z: random()
      }
      const rotation = new Vector3(random(), random(), random()).normalize()
      world.add({
        meshName: "meteor", 
        position: {
          x, y, z
        },
        velocity,
        acceleration: {x:0, y:0, z:0},
        rotation
      })
    }
  }
}
class PlayerAgent {
  playerEntity: Entity
  dsm: DeviceSourceManager
  node: TransformNode
  onNode: () => void
  
  pitchSpeed = 10; // Degrees per second
  yawSpeed = 10; // Degrees per second

  constructor(engine: Engine) {
    
    const playerEntity = world.add({
      meshName: "craftCargoA",
      position: {x: 0, y: 0, z: 0},
      velocity: {x: 0, y: 0, z: 0},
      direction: {x: 0, y: 0, z: -1},
      acceleration: {x: 0, y: 0, z: 0},
      rotationQuaternion: {w: 0, x: 0, y:0, z:0},
      rotation: {x: 0, y: 0, z: -1},
      health: 100
    })
    this.playerEntity = playerEntity
    this.dsm = new DeviceSourceManager(engine)
  }
  /**
   * 
   * @param dt delta time in milliseconds
   */
  checkInput(dt: number) {
    // mushy
    if (this.playerEntity.node != undefined && this.node != this.playerEntity.node) {
      this.node = this.playerEntity.node as TransformNode
      if (this.onNode) {
        this.onNode()
      }
    }
    // "LEFT", // [37]
    // "UP", // [38]
    // "RIGHT", // [39]
    // "DOWN", // [40]
    let up = 0, down = 0, left = 0, right = 0;
    // UP
    if(this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(38)) {
      up = 1
    }
    // DOWN
    if(this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(40)) {
      down = 1
    }
    // RIGHT
    if(this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(39)) {
      right = 1
    }
    // LEFT
    if(this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(37)) {
      left = 1
    }
    if ((this.playerEntity as any).applyYawPitchRoll == undefined) {
      // change the raw objects to babylonjs classes
      this.playerEntity.rotation = new Vector3(this.playerEntity.rotation.x, this.playerEntity.rotation.y, this.playerEntity.rotation.z);
      this.playerEntity.rotationQuaternion = new Quaternion()
      Quaternion.RotationYawPitchRoll(this.playerEntity.rotation.y, this.playerEntity.rotation.x, this.playerEntity.rotation.z);
      // this.playerEntity.rotationQuaternion = new Quaternion(this.playerEntity.rotationQuaternion.x, this.playerEntity.rotationQuaternion.y, this.playerEntity.rotationQuaternion.z, this.playerEntity.rotationQuaternion.w)
      ;(this.playerEntity as any).applyYawPitchRoll = function(yaw, pitch, roll) {
        var axis = new Vector3(0, 0, -1);
        var partRotQuat  = new Quaternion();

        Quaternion.RotationAxisToRef(axis, roll, partRotQuat);
        (this.rotationQuaternion as Quaternion).multiplyInPlace(partRotQuat);
    
        Quaternion.RotationAxisToRef(axis.set(-1, 0, 0), pitch, partRotQuat);
        this.rotationQuaternion.multiplyInPlace(partRotQuat);
    
        Quaternion.RotationAxisToRef(axis.set(0, 1, 0), yaw, partRotQuat);
        this.rotationQuaternion.multiplyInPlace(partRotQuat);
    
        this.rotationQuaternion.toEulerAnglesToRef(this.rotation);
        this.direction.x = this.rotation.x
        this.direction.y = this.rotation.y
        this.direction.z = this.rotation.z
      }
    }
    if (up || down || left || right) {
      // Positive for down, negative for up
      const deltaPitch = (((this.pitchSpeed * (down - up)) * 10) / 1000) * dt;
      // Positive for right, negative for left
      const deltaYaw = (((this.yawSpeed * (right - left)) * 10) / 1000) * dt;
      // call modify method
      ;(this.playerEntity as any).applyYawPitchRoll(DegreeToRadian(deltaYaw), DegreeToRadian(deltaPitch), 0);
    }

    // "SPACE", // [32]
    let afterburner = 0
    if (this.dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(32)) {
      afterburner = 1
    }
    if (afterburner) {
      const forward = new Vector3(0, 0, -1)
      let burn = afterburner * 1 * (dt / 1000)
      // if (burn > 0.3) {
      //   burn = 0.3
      // }
      forward.multiplyInPlace(new Vector3(burn, burn, burn))
      forward.applyRotationQuaternionInPlace((this.playerEntity.rotationQuaternion as Quaternion))
      const acceleration  = new Vector3(this.playerEntity.acceleration.x, this.playerEntity.acceleration.y, this.playerEntity.acceleration.z)
      acceleration.addInPlace(forward)
      // if (acceleration.length() > 0.1) {
      //   acceleration.normalizeFromLength(0.1)
      // }
      this.playerEntity.acceleration.x = acceleration.x
      this.playerEntity.acceleration.y = acceleration.y
      this.playerEntity.acceleration.z = acceleration.z
    } else {
      const acceleration  = new Vector3(this.playerEntity.acceleration.x, this.playerEntity.acceleration.y, this.playerEntity.acceleration.z)
      Vector3.LerpToRef(acceleration, Vector3.Zero(), 1 * (dt / 1000), acceleration)
      this.playerEntity.acceleration.x = acceleration.x
      this.playerEntity.acceleration.y = acceleration.y
      this.playerEntity.acceleration.z = acceleration.z

      // dampners
      const velocity  = new Vector3(this.playerEntity.velocity.x, this.playerEntity.velocity.y, this.playerEntity.velocity.z)
      Vector3.LerpToRef(velocity, Vector3.Zero(), 1 * (dt / 1000), velocity)
      this.playerEntity.velocity.x = velocity.x
      this.playerEntity.velocity.y = velocity.y
      this.playerEntity.velocity.z = velocity.z
    }
  }
}
class Gui {
  gui: AdvancedDynamicTexture
  onStart: () => void
  onConnect: (peerId: string) => void
  constructor() {
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("myUI");
    this.gui = advancedTexture
    advancedTexture.parseSerializedObject(guiContent)
    this.gui.getControlByName("StartButton").onPointerClickObservable.add(() => {
      if (this.onStart) {
        this.onStart()
      }
    })
    this.gui.getControlByName("ConnectButton").onPointerClickObservable.add(() => {
      if (this.onConnect) {
        const peerId = (this.gui.getControlByName("PeerInputText") as InputText).text
        this.onConnect(peerId)
      }
    })
  }
  setPeerId(id) {
    const textblock = this.gui.getControlByName("PeerIdTextBlock") as TextBlock
    textblock.text = id
  }
}
class App {
  assetsManager: AssetsManager
  asteroidScene: AsteroidScene
  gui: Gui
  player: PlayerAgent
  camera: TargetCamera
  constructor() {
    // create the canvas html element and attach it to the webpage
    var canvas = document.createElement("canvas")
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    canvas.id = "gameCanvas"
    document.body.appendChild(canvas)

    // initialize babylon scene and engine
    var engine = new Engine(canvas, true)
    var scene = new Scene(engine)

    let camera = new TargetCamera("Camera", new Vector3(0, 0, 0))
    this.camera = camera
    var light1: HemisphericLight = new HemisphericLight(
      "light1",
      new Vector3(1, 1, 0),
      scene
    )
    // var sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);

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

    engine.displayLoadingUI()
    let assetsManager = new AssetsManager(scene)
    let models: [string, string, string][] = [
      ["craftCargoA", "craft_cargoA", "/assets/craft_cargoA.glb"],
      ["craftCargoB", "craft_cargoB", "/assets/craft_cargoB.glb"],
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
      this.gui = new Gui()
      this.gui.onStart = () => {
        console.log("[App] gui said start")
        server = true
        if (this.asteroidScene == undefined) {
          this.asteroidScene = new AsteroidScene(500, 20)
        }
      }
      this.gui.onConnect = (peerId) => {
        console.log("[App] gui said connect to peer", peerId)
        net.connect(peerId)
      }
      this.gui.setPeerId(net.id)
      this.player = new PlayerAgent(engine)
      // this.camera.target = new Vector3(this.player.playerEntity.position.x, this.player.playerEntity.position.y, this.player.playerEntity.position.z)
      // this.player.onNode = () => {
      //   this.camera.lockedTarget = this.player.node.getChildMeshes(true)[0]
      // }
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
    .then(() => {
      onFinishedLoading()
    })
    
    assetsManager.load()

    // run the main render loop
    engine.runRenderLoop(() => {
      const delta = engine.getDeltaTime()
      if (this.player) {
        this.player.checkInput(delta)
      }
      moveSystem()
      netSyncSystem(delta)
      updateRenderSystem()
      cameraSystem(this.player, this.camera)
      scene.render()
      // divFps.innerHTML = engine.getFps().toFixed() + " fps";
      if (this.player?.playerEntity?.velocity) {
        let vel = new Vector3(this.player.playerEntity.velocity.x, this.player.playerEntity.velocity.y, this.player.playerEntity.velocity.z)
        divFps.innerHTML = vel.length().toFixed() + " mps";
        // divFps.innerHTML += `(${this.player.playerEntity.direction.x},${this.player.playerEntity.direction.y},${this.player.playerEntity.direction.z})`
      }
    })
  }
}
new App()
