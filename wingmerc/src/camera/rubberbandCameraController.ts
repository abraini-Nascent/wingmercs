import { Quaternion, TargetCamera, Vector3 } from "@babylonjs/core";

/**
 * From: https://forum.babylonjs.com/t/camera-following-position-and-rotation/9711/9
 * FollowCamera doesn't match target rotation, even when the same UP as the target is given
 */
export class RubberbandCameraController {
  static TURN = Quaternion.FromEulerAngles(0, Math.PI, 0);
  private camera: TargetCamera;
  private _radius: number;
  private followTarget: Vector3;
  follow: {position: Vector3, rotationQuaternion: Quaternion}; // type the duck

  constructor(camera: TargetCamera, follow: {position: Vector3, rotationQuaternion: Quaternion}, radius: number = 50) {
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
    const p = this.follow.position.clone();
    
    const q = this.follow.rotationQuaternion ?? Quaternion.Identity();
    
    // move the target up
    let u = Vector3.Up();
    u.rotateByQuaternionToRef(q, u)
    u = u.multiplyByFloats(10, 10, 10)
    p.addInPlace(u)

    // move the target forward
    let f = Vector3.Forward()
    f.rotateByQuaternionToRef(q, f)
    f = f.multiplyByFloats(300, 300, 300)
    // p.addInPlace(f)

    const t = this.followTarget.rotateByQuaternionToRef(q, Vector3.Zero() ).addInPlace(p);

    // interpolate position
    c.position = Vector3.Lerp(c.position, t, 0.33);

    // camera somehow looks backwards, so turn it
    const tq = q.multiply(RubberbandCameraController.TURN);

    // interpolate rotation
    Quaternion.SlerpToRef(c.rotationQuaternion, tq, 0.33, c.rotationQuaternion);
  }
}