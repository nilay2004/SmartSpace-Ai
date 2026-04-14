/// <reference path="../../lib/three.d.ts" />
/// <reference path="../core/utils.ts" />
/// <reference path="../model/model.ts" />
/// <reference path="metadata.ts" />

module BP3D.Items {

  /**
   * An Item is an abstract entity for all things placed in the scene,
   * e.g. at walls or on the floor.
   */
  export abstract class Item extends THREE.Mesh {

    private scene: Model.Scene;
    private errorGlow: THREE.Mesh = new THREE.Mesh();
    private hover = false;
    private selected = false;
    private highlighted = false;
    private selectionHelper: THREE.BoxHelper = null;
    private error = false;
    private emissiveColor = 0x444444;
    private errorColor = 0xff0000;
    private resizable: boolean;

    /** Does this object affect other floor items */
    protected obstructFloorMoves = true;

    protected position_set = false;

    /** Show rotate option in context menu */
    public allowRotate = true;

    public fixed = false;

    /** dragging */
    private dragOffset = new THREE.Vector3();

    public halfSize: THREE.Vector3;

    /**
     * @param model
     * @param metadata
     * @param geometry  THREE.Geometry (old Three.js)
     * @param material  THREE.MeshFaceMaterial
     * @param position
     * @param rotation
     * @param scale
     */
    constructor(
      protected model: Model.Model,
      public metadata: Metadata,
      geometry: THREE.Geometry,
      material: THREE.MeshFaceMaterial,
      position: THREE.Vector3,
      rotation: number,
      scale: THREE.Vector3
    ) {
      super(geometry, material);

      this.scene = this.model.scene;

      this.errorColor = 0xff0000;
      this.resizable = !!metadata.resizable;

      this.castShadow = true;
      this.receiveShadow = false;

      if (position) {
        this.position.copy(position);
        this.position_set = true;
      }

      // center in its boundingbox
      this.geometry.computeBoundingBox();
      const box = this.geometry.boundingBox;

      // older three.js uses applyMatrix instead of applyMatrix4
      this.geometry.applyMatrix(
        new THREE.Matrix4().makeTranslation(
          -0.5 * (box.max.x + box.min.x),
          -0.5 * (box.max.y + box.min.y),
          -0.5 * (box.max.z + box.min.z)
        )
      );
      this.geometry.computeBoundingBox();
      this.halfSize = this.objectHalfSize();

      if (rotation) {
        this.rotation.y = rotation;
      }

      if (scale != null) {
        this.setScale(scale.x, scale.y, scale.z);
      }

      this.selectionHelper = new THREE.BoxHelper(this, 0x00ffff);
      this.selectionHelper.visible = false;
    }

    public remove(): void {
      this.scene.removeItem(this);
    }

    public resize(height: number, width: number, depth: number): void {
      const x = width / this.getWidth();
      const y = height / this.getHeight();
      const z = depth / this.getDepth();
      this.setScale(x, y, z);
    }

    public setScale(x: number, y: number, z: number): void {
      const scaleVec = new THREE.Vector3(x, y, z);
      this.halfSize.multiply(scaleVec);
      scaleVec.multiply(this.scale);
      this.scale.set(scaleVec.x, scaleVec.y, scaleVec.z);
      this.resized();
      this.scene.needsUpdate = true;
      if (this.selectionHelper) {
        this.selectionHelper.update();
      }
    }

    public setFixed(fixed: boolean): void {
      this.fixed = fixed;
    }

    /** Subclass can define to take action after a resize. */
    protected abstract resized(): void;

    public getHeight(): number {
      return this.halfSize.y * 2.0;
    }

    public getWidth(): number {
      return this.halfSize.x * 2.0;
    }

    public getDepth(): number {
      return this.halfSize.z * 2.0;
    }

    public abstract placeInRoom(): void;

    public initObject(): void {
      this.placeInRoom();
      this.scene.add(this.selectionHelper);
      this.scene.needsUpdate = true;
    }

    public updateEdgeVisibility(_visible: boolean, _front: boolean): void {
      // optional override
    }

    public removed(): void {
      if (this.selectionHelper) {
        this.scene.remove(this.selectionHelper);
      }
    }

    /** on is a bool */
    public updateHighlight(): void {
      const on = this.hover || this.selected;
      this.highlighted = on;
      const hex = on ? this.emissiveColor : 0x000000;

      const mf = <THREE.MeshFaceMaterial>this.material;
      const materials: THREE.Material[] = mf.materials;

      for (let i = 0; i < materials.length; i++) {
        const m: any = materials[i];
        if (m.emissive && typeof m.emissive.setHex === "function") {
          m.emissive.setHex(hex);
        }
      }

      if (this.selectionHelper) {
        this.selectionHelper.visible = on;
        if (on) {
          this.selectionHelper.update();
        }
      }
    }

    public mouseOver(): void {
      this.hover = true;
      this.updateHighlight();
    }

    public mouseOff(): void {
      this.hover = false;
      this.updateHighlight();
    }

    public setSelected(): void {
      this.selected = true;
      this.updateHighlight();
    }

    public setUnselected(): void {
      this.selected = false;
      this.updateHighlight();
    }

    /** intersection has attributes point (vec3) and object (THREE.Mesh) */
    public clickPressed(intersection: any): void {
      this.dragOffset.copy(intersection.point).sub(this.position);
    }

    public clickDragged(intersection: any): void {
      if (intersection) {
        this.moveToPosition(
          intersection.point.clone().sub(this.dragOffset),
          intersection
        );
      }
    }

    public rotate(intersection: { point: THREE.Vector3 } | null): void {
      if (intersection) {
        let angle = Core.Utils.angle(
          0,
          1,
          intersection.point.x - this.position.x,
          intersection.point.z - this.position.z
        );

        const snapTolerance = Math.PI / 16.0;

        // snap to intervals near Math.PI/2
        for (let i = -4; i <= 4; i++) {
          if (Math.abs(angle - i * (Math.PI / 2)) < snapTolerance) {
            angle = i * (Math.PI / 2);
            break;
          }
        }

        this.rotation.y = angle;
        if (this.selectionHelper) {
          this.selectionHelper.update();
        }
      }
    }

    public moveToPosition(vec3: THREE.Vector3, _intersection?: any): void {
      this.position.copy(vec3);
      if (this.selectionHelper) {
        this.selectionHelper.update();
      }
    }

    public clickReleased(): void {
      if (this.error) {
        this.hideError();
      }
    }

    /**
     * Returns an array of planes to use other than the ground plane
     * for passing intersection to clickPressed and clickDragged
     */
    public customIntersectionPlanes(): THREE.Object3D[] {
      return [];
    }

    /**
     * returns the 2d corners of the bounding polygon
     *
     * offset is Vector3 (used for getting corners of object at a new position)
     *
     * TODO: handle rotated objects better!
     */
    public getCorners(position?: THREE.Vector3): { x: number; y: number }[] {

      const pos = position || this.position;
      const halfSize = this.halfSize.clone();

      const c1 = new THREE.Vector3(-halfSize.x, 0, -halfSize.z);
      const c2 = new THREE.Vector3(halfSize.x, 0, -halfSize.z);
      const c3 = new THREE.Vector3(halfSize.x, 0, halfSize.z);
      const c4 = new THREE.Vector3(-halfSize.x, 0, halfSize.z);

      const transform = new THREE.Matrix4();
      transform.makeRotationY(this.rotation.y);

      c1.applyMatrix4(transform);
      c2.applyMatrix4(transform);
      c3.applyMatrix4(transform);
      c4.applyMatrix4(transform);

      c1.add(pos);
      c2.add(pos);
      c3.add(pos);
      c4.add(pos);

      return [
        { x: c1.x, y: c1.z },
        { x: c2.x, y: c2.z },
        { x: c3.x, y: c3.z },
        { x: c4.x, y: c4.z }
      ];
    }

    public abstract isValidPosition(vec3: THREE.Vector3): boolean;

    public showError(vec3?: THREE.Vector3): void {
      const p = vec3 || this.position;
      if (!this.error) {
        this.error = true;
        this.errorGlow = this.createGlow(this.errorColor, 0.8, true);
        this.scene.add(this.errorGlow);
      }
      this.errorGlow.position.copy(p);
    }

    public hideError(): void {
      if (this.error) {
        this.error = false;
        this.scene.remove(this.errorGlow);
      }
    }

    private objectHalfSize(): THREE.Vector3 {
      const objectBox = new THREE.Box3();
      objectBox.setFromObject(this);
      return objectBox.max.clone().sub(objectBox.min).divideScalar(2);
    }

    public createGlow(
      color: number,
      opacity: number = 0.2,
      ignoreDepth: boolean = false
    ): THREE.Mesh {

      const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        blending: THREE.AdditiveBlending,
        opacity: opacity,
        transparent: true,
        depthTest: !ignoreDepth
      });

      const glowGeometry = <THREE.Geometry>this.geometry.clone();
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(this.position);
      glow.rotation.copy(this.rotation);
      glow.scale.copy(this.scale);
      return glow;
    }
  }
}
