import HavokPhysics from '@babylonjs/havok';
import { AssetsManager, HavokPlugin, TransformNode, Vector3 } from "@babylonjs/core"
import { Models } from "./models"
import { AppContainer } from "../app.container"
import { ObjModels } from "./objModels"

export function loadAssets(onFinishedLoading: () => void) {
  // load the assets and physics engine
  const engine = AppContainer.instance.engine
  const scene = AppContainer.instance.scene
  engine.displayLoadingUI()
  let assetsManager = new AssetsManager(scene)
  
  for (let [modelName, nodeName, modelPath] of Models) {
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
  /// Load fonts
  const fontFaceRegular = new FontFace("Regular5", "url(./assets/fonts/GravityRegular5.ttf)");
  const fontFaceKong = new FontFace("KongfaceRegular", "url(./assets/fonts/kongtext.regular.ttf)");
  const fontLoaded = Promise.all([fontFaceRegular.load(), fontFaceKong.load()]).then(function(loadedFonts) {
    loadedFonts.forEach((loadedFont) => {
      const fonts = document.fonts as any
      fonts.add(loadedFont);
      console.log('Font loaded:', loadedFont);
    })
  }).catch(function(error) {
    console.error('Font loading failed:', error);
  });
  Promise.all([
    new Promise((resolve) => {
      assetsManager.onFinish = (tasks) => {
        console.dir(tasks)
        resolve({})
      }
    }),
    HavokPhysics(),
    fontLoaded
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
  return assetsManager
}