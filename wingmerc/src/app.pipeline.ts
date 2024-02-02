import { AppContainer } from "./app.container";
import { Interceptor, Process } from "./utils/pipeline";

/**
 * shorthand access to global pipeline
 * @param event 
 * @param input 
 * @returns 
 */
export function processEvent<T>(event: string, input: T): T {
  return AppContainer.instance.pipeline.process(event, input)
}

/**
 * container object that stores an interceptor to allow easy removal from the global pipeline using `unsubscribe()`.
 * unsibscribe is called on deinit allowing interceptors to be automatically cleaned up when subscription is no longer stored
 */
export class InterceptorSubscription {
  constructor(public event: string, public interceptor: Interceptor) {}
  deinit() {
    this.unsubscribe();
  }
  public unsubscribe(): boolean {
    return AppContainer.instance.pipeline.removeInterceptor(this.event, this.interceptor);
  }
}

/**
 * shorthand to add an event interceptor to the global pipeline
 * @param event 
 * @param process 
 * @returns a shorthand object to unsubscribed an interceptor from the global pipeline
 */
export function interceptEvent(event: string, process: Process): InterceptorSubscription {
  const interceptor = AppContainer.instance.pipeline.addInterceptor(event, process)
  return new InterceptorSubscription(event, interceptor)
}