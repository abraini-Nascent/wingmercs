import HavokPhysics from "@babylonjs/havok"
import { AssetsManager, HavokPlugin, Mesh, TransformNode, Vector3 } from "@babylonjs/core"
import { Models } from "./models"
import { AppContainer } from "../app.container"
import { ObjModels } from "./objModels"
import { SoundData, SoundFiles, SoundPool } from "../utils/sounds/soundEffects"
import { debugLog } from "../utils/debuglog"
import { debugDir } from "../utils/debugDir"

export function loadAssets(onFinishedLoading: () => void) {
  // load the assets and physics engine
  const engine = AppContainer.instance.engine
  const scene = AppContainer.instance.scene
  engine.displayLoadingUI()
  let assetsManager = new AssetsManager(scene)

  for (let [modelName, nodeName, modelPath, scale] of Models) {
    let objMeshTask = assetsManager.addMeshTask(modelName, nodeName, modelPath, "")
    objMeshTask.onSuccess = (task) => {
      if (task.loadedTransformNodes[0] != undefined) {
        task.loadedTransformNodes[0].getChildMeshes().forEach((m: Mesh) => {
          m.isVisible = false
          m.setEnabled(false)
          if (scale != undefined) {
            m.scaling.setAll(scale)
            m.bakeCurrentTransformIntoVertices()
          }
        })
        ObjModels[modelName] = task.loadedTransformNodes[0] as TransformNode
        debugLog(`[Assets] loaded transform for: ${modelName}`)
      } else {
        let node = new TransformNode(modelName, scene)
        for (const mesh of task.loadedMeshes) {
          mesh.isVisible = false
          mesh.setEnabled(false)
          mesh.position.x = 0
          mesh.position.y = 0
          mesh.position.z = 0
          mesh.setParent(node)
          if (scale) {
            mesh.scaling.setAll(scale)
            ;(mesh as Mesh).bakeCurrentTransformIntoVertices()
          }
        }
        debugLog(`[Assets] loaded meshes for: ${modelName}`)
        ObjModels[modelName] = node
      }
      // this.objModels[modelName].isVisible = false
      debugLog(`[Assets] loaded model: ${modelName}`)
    }
    objMeshTask.onError = (task, message, exception) => {
      debugLog(`[Assets] failed ${task.name}: msg ${message}, error: ${exception}`)
    }
  }
  /// Load fonts
  const fontFaceRegular = new FontFace("Regular5", "url(./assets/fonts/GravityRegular5.ttf)")
  const fontFaceKong = new FontFace("KongfaceRegular", "url(./assets/fonts/kongtext.regular.ttf)")
  const fontLoaded = Promise.all([fontFaceRegular.load(), fontFaceKong.load()])
    .then(function (loadedFonts) {
      loadedFonts.forEach((loadedFont) => {
        const fonts = document.fonts as any
        fonts.add(loadedFont)
        debugLog("[Assets] Font loaded:", loadedFont)
      })
    })
    .catch(function (error) {
      console.error("[Assets] Font loading failed:", error)
    })
  /// Load Soundfiles
  for (const soundNamespace of Object.entries(SoundFiles)) {
    const [name, files] = soundNamespace
    let idx = 0
    SoundData[name] = []
    for (const file of files) {
      let index = idx
      const task = assetsManager.addBinaryFileTask(`${name}-${idx}`, file)
      task.onSuccess = (task) => {
        debugLog("[Assets] Sound Loaded:", file)
        SoundData[name][index] = task.data
      }
      task.onError = (_task, message) => {
        debugLog("[Assets] Sound Failed:", file, message)
      }
      idx += 1
    }
  }

  /// Wait for everything to be loaded
  Promise.all([
    new Promise((resolve) => {
      assetsManager.onFinish = (tasks) => {
        debugDir(tasks)
        SoundPool.prime()
        resolve({})
      }
    }),
    HavokPhysics(),
    fontLoaded,
  ]).then(([_, havokInstance]) => {
    const havokPlugin = new HavokPlugin(true, havokInstance)
    const container = AppContainer.instance
    container.havokInstance = havokInstance
    container.havokPlugin = havokPlugin
    scene.enablePhysics(new Vector3(0, 0, 0), havokPlugin)
    onFinishedLoading()
  })

  assetsManager.load()
  return assetsManager
}
