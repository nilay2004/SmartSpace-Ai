/// <reference path="../../lib/jquery.d.ts" />
/// <reference path="../../lib/three.d.ts" />
/// <reference path="controller.ts" />
/// <reference path="floorPlan.ts" />
/// <reference path="lights.ts" />
/// <reference path="skybox.ts" />
/// <reference path="controls.ts" />
/// <reference path="hud.ts" />

module BP3D.Three {
  export class Main {
    public element: JQuery;
    public controls: Three.Controls = null;
    public heightMargin: number = null;
    public widthMargin: number = null;
    public elementHeight: number = null;
    public elementWidth: number = null;
    public itemSelectedCallbacks = $.Callbacks();
    public itemUnselectedCallbacks = $.Callbacks();
    public wallClicked = $.Callbacks();
    public floorClicked = $.Callbacks();
    public nothingClicked = $.Callbacks();

    private model: Model.Model;
    private scene: Model.Scene;
    private canvasElement: any;
    private options: any;
    private domElement: HTMLElement = null;
    private camera: THREE.PerspectiveCamera = null;
    private renderer: THREE.WebGLRenderer = null;
    private controller: Three.Controller = null;
    private floorplan: Three.Floorplan = null;
    private hud: Three.HUD = null;
    private lights: any = null;
    private skybox: any = null;
    private needsUpdate = false;
    private lastRender = Date.now();
    private mouseOver = false;
    private hasClicked = false;

    constructor(model: Model.Model, element: any, canvasElement: any, opts: any) {
      this.model = model;
      this.scene = model.scene;
      this.element = $(element);
      this.canvasElement = canvasElement;

      this.options = {
        resize: true,
        pushHref: false,
        spin: true,
        spinSpeed: .00002,
        clickPan: true,
        canMoveFixedItems: false
      };

      // override with manually set options
      for (var opt in this.options) {
        if (this.options.hasOwnProperty(opt) && opts.hasOwnProperty(opt)) {
          this.options[opt] = opts[opt];
        }
      }

      this.init();
    }

    private init() {
      THREE.ImageUtils.crossOrigin = "";

      this.domElement = this.element.get(0); // Container
      this.camera = new THREE.PerspectiveCamera(45, 1, 1, 10000);
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true // required to support .toDataURL()
      });
      this.renderer.autoClear = false;
      this.renderer.shadowMapEnabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      this.skybox = new (Three.Skybox as any)(this.scene);

      this.controls = new Three.Controls(this.camera, this.domElement);

      this.hud = new Three.HUD(this);

      this.controller = new Three.Controller(
        this, this.model, this.camera, this.element, this.controls, this.hud);

      this.domElement.appendChild(this.renderer.domElement);

      // handle window resizing
      this.updateWindowSize();
      if (this.options.resize) {
        $(window).resize(() => this.updateWindowSize());
      }

      // setup camera nicely
      this.centerCamera();
      this.model.floorplan.fireOnUpdatedRooms(() => this.centerCamera());

      this.lights = new (Three.Lights as any)(this.scene, this.model.floorplan);

      this.floorplan = new Three.Floorplan(this.scene.getScene(),
        this.model.floorplan, this.controls);

      this.animate();

      this.element.mouseenter(() => {
        this.mouseOver = true;
      }).mouseleave(() => {
        this.mouseOver = false;
      }).click(() => {
        this.hasClicked = true;
      });
    }

    private spin() {
      if (this.options.spin && !this.mouseOver && !this.hasClicked) {
        var theta = 2 * Math.PI * this.options.spinSpeed * (Date.now() - this.lastRender);
        this.controls.rotateLeft(theta);
        this.controls.update()
      }
    }

    public dataUrl() {
      var dataUrl = this.renderer.domElement.toDataURL("image/png");
      return dataUrl;
    }

    public stopSpin() {
      this.hasClicked = true;
    }

    public getOptions() {
      return this.options;
    }

    public getModel() {
      return this.model;
    }

    public getScene() {
      return this.scene;
    }

    public getController() {
      return this.controller;
    }

    public getCamera() {
      return this.camera;
    }

    public getRenderer() {
      return this.renderer;
    }

    public setNeedsUpdate() {
      this.needsUpdate = true;
    }

    private shouldRender() {
      // Do we need to draw a new frame
      if (this.controls.needsUpdate || this.controller.needsUpdate || this.needsUpdate || this.model.scene.needsUpdate) {
        this.controls.needsUpdate = false;
        this.controller.needsUpdate = false;
        this.needsUpdate = false;
        this.model.scene.needsUpdate = false;
        return true;
      } else {
        return false;
      }
    }

    private render() {
      this.spin();
      if (this.shouldRender()) {
        this.renderer.clear();
        this.renderer.render(this.scene.getScene(), this.camera);
        this.renderer.clearDepth();
        this.renderer.render(this.hud.getScene(), this.camera);
      }
      this.lastRender = Date.now();
    }

    private animate() {
      var delay = 50;
      setTimeout(() => {
        requestAnimationFrame(() => this.animate());
      }, delay);
      this.render();
    }

    public rotatePressed() {
      // rotatePressed method not available on Controller; do nothing
    }

    public rotateReleased() {
      // rotateReleased method not available on Controller; do nothing
    }

    public setCursorStyle(cursorStyle: string) {
      this.domElement.style.cursor = cursorStyle;
    }

    public updateWindowSize() {
      this.heightMargin = this.element.offset().top;
      this.widthMargin = this.element.offset().left;

      this.elementWidth = this.element.innerWidth();
      if (this.options.resize) {
        this.elementHeight = window.innerHeight - this.heightMargin;
      } else {
        this.elementHeight = this.element.innerHeight();
      }

      this.camera.aspect = this.elementWidth / this.elementHeight;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(this.elementWidth, this.elementHeight);
      this.needsUpdate = true;
    }

    public centerCamera() {
      var yOffset = 150.0;

      var pan = this.model.floorplan.getCenter();
      pan.y = yOffset;

      this.controls.target = pan;

      var distance = this.model.floorplan.getSize().z * 1.5;

      var offset = pan.clone().add(
        new THREE.Vector3(0, distance, distance));
      //scope.controls.setOffset(offset);
      this.camera.position.copy(offset);

      this.controls.update();
    }

    // projects the object's center point into x,y screen coords
    // x,y are relative to top left corner of viewer
    public projectVector(vec3: THREE.Vector3, ignoreMargin?: boolean) {
      ignoreMargin = ignoreMargin || false;

      var widthHalf = this.elementWidth / 2;
      var heightHalf = this.elementHeight / 2;

      var vector = new THREE.Vector3();
      vector.copy(vec3);
      vector.project(this.camera);

      var vec2 = new THREE.Vector2();

      vec2.x = (vector.x * widthHalf) + widthHalf;
      vec2.y = - (vector.y * heightHalf) + heightHalf;

      if (!ignoreMargin) {
        vec2.x += this.widthMargin;
        vec2.y += this.heightMargin;
      }

      return vec2;
    }
  }
}
