import { AppContainer } from './../../app.container';
export function gameInputSystem(delta: number) {
  const appContainer = AppContainer.instance
  if (appContainer.player) {
    appContainer.player.checkInput(delta)
  }
  if (appContainer.input) {
    appContainer.input.checkInput(delta)
  }
}