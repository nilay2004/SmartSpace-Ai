/// <reference path="../../lib/jquery.d.ts" />
/// <reference path="../model/model.ts" />
/// <reference path="floorplanner_view.ts" />

module BP3D.Floorplanner {
  /** how much will we move a corner to make a wall axis aligned (cm) */
  const snapTolerance = 25;

  export class Floorplanner {
    private canvasElement: any;
    private view: FloorplannerView;
    public mode: number;
    public activeCorner: Model.Corner;
    public activeWall: Model.Wall;
    public lastNode: Model.Corner;
    private mouseDown: boolean;
    private mouseMoved: boolean;
    private rawMouseX: number;
    private rawMouseY: number;
    private mouseX: number;
    private mouseY: number;
    public targetX: number;
    public targetY: number;
    private lastX: number;
    private lastY: number;
    public originX: number;
    public originY: number;
    public cmPerPixel: number;
    public pixelsPerCm: number;
    public wallWidth: number;
    public modeResetCallbacks: any;
    public zoom: number = 1.0;

    /**
     * @param canvas The associated canvas.
     * @param model The associated model.
     */
    constructor(canvas: string, private model: Model.Model) {

      this.canvasElement = $("#" + canvas);

      this.view = new FloorplannerView(this.model, this, canvas);

      const cmPerFoot = 30.48;
      const pixelsPerFoot = 15.0;
      this.cmPerPixel = cmPerFoot * (1.0 / pixelsPerFoot);
      this.pixelsPerCm = 1.0 / this.cmPerPixel;

      this.wallWidth = 10.0 * this.pixelsPerCm;

      // Listen to active floor changes
      this.model.activeFloorChangedCallbacks.add(() => {
        this.view.draw();
      });

      // Initialization:

      this.setMode(floorplannerModes.MOVE);

      const scope = this;

      this.canvasElement.mousedown(() => {
        scope.mousedown();
      });
      this.canvasElement.mousemove((event: any) => {
        scope.mousemove(event);
      });
      this.canvasElement.mouseup(() => {
        scope.mouseup();
      });
      this.canvasElement.mouseleave(() => {
        scope.mouseleave();
      });
      this.canvasElement.on('mousewheel DOMMouseScroll', (event: any) => {
        scope.mousewheel(event);
      });

      $(document).keyup((e) => {
        if (e.keyCode == 27) {
          scope.escapeKey();
        }
      });

      this.model.activeFloor.floorplan.roomLoadedCallbacks.add(() => {
        scope.reset();
      });
    }

    /** */
    private escapeKey() {
      this.setMode(floorplannerModes.MOVE);
    }

    /** */
    private updateTarget() {
      if (this.mode == floorplannerModes.DRAW && this.lastNode) {
        if (Math.abs(this.mouseX - this.lastNode.x) < snapTolerance) {
          this.targetX = this.lastNode.x;
        } else {
          this.targetX = this.mouseX;
        }
        if (Math.abs(this.mouseY - this.lastNode.y) < snapTolerance) {
          this.targetY = this.lastNode.y;
        } else {
          this.targetY = this.mouseY;
        }
      } else {
        this.targetX = this.mouseX;
        this.targetY = this.mouseY;
      }

      this.view.draw();
    }

    /** */
    private mousedown() {
      this.mouseDown = true;
      this.mouseMoved = false;
      this.lastX = this.rawMouseX;
      this.lastY = this.rawMouseY;

      // delete
      if (this.mode == floorplannerModes.DELETE) {
        if (this.activeCorner) {
          this.activeCorner.removeAll();
        } else if (this.activeWall) {
          this.activeWall.remove();
        } else {
          this.setMode(floorplannerModes.MOVE);
        }
      }
    }

    /** */
    private mousemove(event: any) {
      this.mouseMoved = true;

      // update mouse
      this.rawMouseX = event.clientX;
      this.rawMouseY = event.clientY;

      this.mouseX =
        (event.clientX - this.canvasElement.offset().left) / (this.pixelsPerCm * this.zoom) +
        this.originX * this.cmPerPixel;
      this.mouseY =
        (event.clientY - this.canvasElement.offset().top) / (this.pixelsPerCm * this.zoom) +
        this.originY * this.cmPerPixel;

      // update target (snapped position of actual mouse)
      if (
        this.mode == floorplannerModes.DRAW ||
        (this.mode == floorplannerModes.MOVE && this.mouseDown)
      ) {
        this.updateTarget();
      }

      // update object target
      if (this.mode != floorplannerModes.DRAW && !this.mouseDown) {
        const hoverCorner = this.model.activeFloor.floorplan.overlappedCorner(this.mouseX, this.mouseY);
        const hoverWall = this.model.activeFloor.floorplan.overlappedWall(this.mouseX, this.mouseY);
        let draw = false;
        if (hoverCorner != this.activeCorner) {
          this.activeCorner = hoverCorner;
          draw = true;
        }
        // corner takes precedence
        if (this.activeCorner == null) {
          if (hoverWall != this.activeWall) {
            this.activeWall = hoverWall;
            draw = true;
          }
        } else {
          this.activeWall = null;
        }
        if (draw) {
          this.view.draw();
        }
      }

      // panning
      if (this.mouseDown && !this.activeCorner && !this.activeWall) {
        this.originX += (this.lastX - this.rawMouseX) * this.cmPerPixel / this.zoom;
        this.originY += (this.lastY - this.rawMouseY) * this.cmPerPixel / this.zoom;
        this.lastX = this.rawMouseX;
        this.lastY = this.rawMouseY;
        this.view.draw();
      }

      // dragging
      if (this.mode == floorplannerModes.MOVE && this.mouseDown) {
        if (this.activeCorner) {
          this.activeCorner.move(this.mouseX, this.mouseY);
          this.activeCorner.snapToAxis(snapTolerance);
        } else if (this.activeWall) {
          this.activeWall.relativeMove(
            (this.rawMouseX - this.lastX) * this.cmPerPixel / this.zoom,
            (this.rawMouseY - this.lastY) * this.cmPerPixel / this.zoom
          );
          this.activeWall.snapToAxis(snapTolerance);
          this.lastX = this.rawMouseX;
          this.lastY = this.rawMouseY;
        }
        this.view.draw();
      }
    }

    /** */
    private mouseup() {
      this.mouseDown = false;

      // drawing
      if (this.mode == floorplannerModes.DRAW && !this.mouseMoved) {
        const corner = this.model.activeFloor.floorplan.newCorner(this.targetX, this.targetY);
        if (this.lastNode != null) {
          this.model.activeFloor.floorplan.newWall(this.lastNode, corner);
        }
        if (corner.mergeWithIntersected() && this.lastNode != null) {
          this.setMode(floorplannerModes.MOVE);
        }
        this.lastNode = corner;
      }
    }

    /** */
    private mouseleave() {
      this.mouseDown = false;
    }

    /** */
    private mousewheel(event: any) {
      event.preventDefault();
      const delta = event.originalEvent.wheelDelta || -event.originalEvent.detail;
      if (delta > 0) {
        this.zoomIn();
      } else {
        this.zoomOut();
      }
    }

    /** Zoom in. */
    public zoomIn() {
      this.zoom *= 1.1;
      this.zoom = Math.min(10, this.zoom);
      this.view.draw();
    }

    /** Zoom out. */
    public zoomOut() {
      this.zoom /= 1.1;
      this.zoom = Math.max(0.01, this.zoom);
      this.view.draw();
    }

    /** */
    private reset() {
      this.resizeView();
      this.setMode(floorplannerModes.MOVE);
      this.resetOrigin();
      this.view.draw();
    }

    /** */
    private resizeView() {
      this.view.handleWindowResize();
    }

    /** */
    private setMode(mode: number) {
      this.lastNode = null;
      this.mode = mode;
      this.modeResetCallbacks.fire(mode);
      this.updateTarget();
    }

    /** Sets the origin so that floorplan is centered */
    private resetOrigin() {
      const centerX = this.canvasElement.innerWidth() / 2.0;
      const centerY = this.canvasElement.innerHeight() / 2.0;
      const centerFloorplan = this.model.activeFloor.floorplan.getCenter();
      this.originX = centerFloorplan.x * this.pixelsPerCm - centerX;
      this.originY = centerFloorplan.z * this.pixelsPerCm - centerY;
    }

    /** Convert from THREEjs coords to canvas coords. */
    public convertX(x: number): number {
      return (x - this.originX * this.cmPerPixel) * this.pixelsPerCm * this.zoom;
    }

    /** Convert from THREEjs coords to canvas coords. */
    public convertY(y: number): number {
      return (y - this.originY * this.cmPerPixel) * this.pixelsPerCm * this.zoom;
    }
  }
}
