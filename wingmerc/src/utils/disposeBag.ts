import { IDisposable } from "@babylonjs/core"

export class DisposableBag {
  private disposables: Set<IDisposable> = new Set()

  /** Disposable to be disposed */
  public add<T extends IDisposable>(disposable: T): T {
    this.disposables.add(disposable)
    return disposable
  }

  /** Does not call dispose on the deleted IDisposable */
  public delete(disposable: IDisposable): void {
    this.disposables.delete(disposable)
  }

  public dispose(): void {
    this.disposables.forEach((disposable) => {
      console.log("[DisposeBag] disposing", disposable)
      disposable.dispose()
      this.disposables.delete(disposable)
    })
  }

  deinit() {
    this.dispose()
  }
}
