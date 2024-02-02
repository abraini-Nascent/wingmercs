export type Process = (input: unknown) => unknown
export class Interceptor {
  public next: Interceptor;
  constructor(public process: Process) { }
}

export class Pipeline {
  private head: Interceptor;
  private tail: Interceptor;
  constructor(private name: string) {
    this.head = null;
    this.tail = null;
  }
  addInterceptor(process: Process): Interceptor {
    const interceptor = new Interceptor(process);
    if (!this.head) {
      this.head = interceptor;
      this.tail = interceptor;
    } else {
      this.tail.next = interceptor;
      this.tail = interceptor;
    }
    return interceptor
  }
  removeInterceptor(interceptor: Interceptor): boolean {
    if (!this.head) {
      return false;
    }
    let previous: Interceptor;
    let current = this.head;
    while (current) {
      if (current === interceptor) {
        break;
      }
      previous = current;
      current = current.next;
    }
    if (current) {
      if (previous) {
        previous.next = current.next;
      } else {
        this.head = current.next;
      }
      return true;
    }
    return false;
  }
  process<T>(input: T): T {
    let current = this.head;
    while (current) {
      input = current.process(input);
      current = current.next;
    }
    return input;
  }
}

export class EventPipeline {
  events: Map<string, Pipeline> = new Map()
  constructor() { }

  addInterceptor(event: string, process: Process): Interceptor {
    if (this.events.has(event)) {
      return this.events.get(event).addInterceptor(process);
    } else {
      const pipeline = new Pipeline(event);
      const interceptor = pipeline.addInterceptor(process);
      this.events.set(event, pipeline);
      return interceptor;
    }
  }
  removeInterceptor(event: string, interceptor: Interceptor): boolean {
    if (this.events.has(event)) {
      return this.events.get(event).removeInterceptor(interceptor);
    } else {
      return false;
    }
  }
  process<T>(event: string, input: T): T {
    const pipeline = this.events.get(event);
    if (pipeline) {
      return pipeline.process(input);
    } else {
      return input;
    }
  }
}