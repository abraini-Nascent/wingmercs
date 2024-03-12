export class Pool<T> {
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