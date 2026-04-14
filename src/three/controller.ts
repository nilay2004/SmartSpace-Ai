/// <reference path="../../lib/jquery.d.ts" />
/// <reference path="../../lib/three.d.ts" />
/// <reference path="../core/utils.ts" />
/// <reference path="../model/model.ts" />
/// <reference path="../items/item.ts" />

module BP3D.Three {
  export class Controller {
    public enabled = true;
    public needsUpdate = true;

    private scene: Model.Scene;
    private plane: THREE.Mesh = null;
    private mouse: THREE.Vector2 = new THREE.Vector2();
    private intersectedObject: Items.Item = null;
    private mouseoverObject: Items.Item = null;
    private selectedObject: Items.Item = null;
    private mouseDown = false;
    private mouseMoved = false;
    private rotateMouseOver = false;

    private states = {
      UNSELECTED: 0,
      SELECTED: 1,
      DRAGGING: 2,
      ROTATING: 3,
      ROTATING_FREE: 4,
      PANNING: 5
    };
    private state = this.states.UNSELECTED;

    constructor(
      private three: any,
      private model: Model.Model,
      private camera: THREE.Camera,
      private element: JQuery,
      private controls: any,
      private hud: any
    ) {
      this.scene = model.scene;
      this.init();
    }

    private init() {
      this.element.mousedown(this.mouseDownEvent.bind(this));
      this.element.mouseup(this.mouseUpEvent.bind(this));
      this.element.mousemove(this.mouseMoveEvent.bind(this));

      this.scene.itemRemovedCallbacks.add(this.itemRemoved.bind(this));
      this.scene.itemLoadedCallbacks.add(this.itemLoaded.bind(this));
      this.setGroundPlane();
    }

    private itemLoaded(item: any) {
      if (!item.position_set) {
        this.setSelectedObject(item);
        this.switchState(this.states.DRAGGING);
        var pos = item.position.clone();
        pos.y = 0;
        var vec = this.three.projectVector(pos);
        this.clickPressed(vec);
      }
      item.position_set = true;
    }

    private clickPressed(vec2?: THREE.Vector2) {
      vec2 = vec2 || this.mouse;
      if (this.selectedObject == null) {
        return;
      }
      var intersection = this.itemIntersection(this.mouse, this.selectedObject);
      if (intersection) {
        this.selectedObject.clickPressed(intersection);
      }
    }

    private clickDragged(vec2?: THREE.Vector2) {
      vec2 = vec2 || this.mouse;
      if (this.selectedObject == null) {
        return;
      }
      var intersection = this.itemIntersection(this.mouse, this.selectedObject);
      if (intersection) {
        if (this.isRotating()) {
          this.selectedObject.rotate(intersection);
        } else {
          this.selectedObject.clickDragged(intersection);
        }
      }
    }

    private itemRemoved(item: any) {
      if (item === this.selectedObject) {
        this.selectedObject!.setUnselected();
        this.selectedObject!.mouseOff();
        this.setSelectedObject(null);
      }
    }

    private setGroundPlane() {
      var size = 10000;
      this.plane = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshBasicMaterial());
      this.plane.rotation.x = -Math.PI / 2;
      this.plane.visible = false;
      this.scene.add(this.plane);
    }

    private checkWallsAndFloors(event?: any) {
      if (this.state == this.states.UNSELECTED && this.mouseoverObject == null) {
        var wallEdgePlanes = this.model.activeFloor.floorplan.wallEdgePlanes();
        var wallIntersects = this.getIntersections(
          this.mouse, wallEdgePlanes, true);
        if (wallIntersects.length > 0) {
          var wall = (wallIntersects[0].object as any).edge;
          this.three.wallClicked.fire(wall);
          return;
        }

        var floorPlanes = this.model.activeFloor.floorplan.floorPlanes();
        if (floorPlanes) {
          var floorIntersects = this.getIntersections(
            this.mouse, floorPlanes, false);
          if (floorIntersects.length > 0) {
            var room = (floorIntersects[0].object as any).room;
            this.three.floorClicked.fire(room);
            return;
          }
        }

        this.three.nothingClicked.fire();
      }
    }

    private mouseMoveEvent(event: JQueryMouseEventObject) {
      if (this.enabled) {
        event.preventDefault();

        this.mouseMoved = true;

        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;

        if (!this.mouseDown) {
          this.updateIntersections();
        }

        switch (this.state) {
          case this.states.UNSELECTED:
            this.updateMouseover();
            break;
          case this.states.SELECTED:
            this.updateMouseover();
            break;
          case this.states.DRAGGING:
          case this.states.ROTATING:
          case this.states.ROTATING_FREE:
            this.clickDragged();
            this.hud.update();
            this.needsUpdate = true;
            break;
        }
      }
    }

    public isRotating() {
      return (this.state == this.states.ROTATING || this.state == this.states.ROTATING_FREE);
    }

    private mouseDownEvent(event: JQueryMouseEventObject) {
      if (this.enabled) {
        event.preventDefault();

        this.mouseMoved = false;
        this.mouseDown = true;

        switch (this.state) {
          case this.states.SELECTED:
            if (this.rotateMouseOver) {
              this.switchState(this.states.ROTATING);
            } else if (this.intersectedObject != null) {
              this.setSelectedObject(this.intersectedObject);
              if (!this.intersectedObject!.fixed) {
                this.switchState(this.states.DRAGGING);
              }
            }
            break;
          case this.states.UNSELECTED:
            if (this.intersectedObject != null) {
              this.setSelectedObject(this.intersectedObject);
              if (!this.intersectedObject!.fixed) {
                this.switchState(this.states.DRAGGING);
              }
            }
            break;
          case this.states.DRAGGING:
          case this.states.ROTATING:
            break;
          case this.states.ROTATING_FREE:
            this.switchState(this.states.SELECTED);
            break;
        }
      }
    }

    private mouseUpEvent(event: JQueryMouseEventObject) {
      if (this.enabled) {
        this.mouseDown = false;

        switch (this.state) {
          case this.states.DRAGGING:
            if (this.selectedObject != null) {
              this.selectedObject.clickReleased();
            }
            this.switchState(this.states.SELECTED);
            break;
          case this.states.ROTATING:
            if (this.selectedObject != null) {
              this.selectedObject.clickReleased();
            }
            this.switchState(this.states.SELECTED);
            break;
          case this.states.UNSELECTED:
            if (!this.mouseMoved) {
              this.checkWallsAndFloors();
            }
            break;
          case this.states.SELECTED:
            if (this.intersectedObject == null && !this.mouseMoved) {
              this.switchState(this.states.UNSELECTED);
              this.checkWallsAndFloors();
            }
            break;
          case this.states.ROTATING_FREE:
            if (this.selectedObject != null) {
              this.selectedObject.clickReleased();
            }
            this.switchState(this.states.SELECTED);
            break;
        }
      }
    }

    private switchState(newState: number) {
      if (newState != this.state) {
        this.onExit(this.state);
        this.onEntry(newState);
      }
      this.state = newState;
      this.hud.setRotating(this.isRotating());
    }

    private onEntry(state: number) {
      switch (state) {
        case this.states.UNSELECTED:
          this.setSelectedObject(null);
        case this.states.SELECTED:
          this.controls.enabled = true;
          break;
        case this.states.ROTATING:
        case this.states.ROTATING_FREE:
          this.controls.enabled = false;
          break;
        case this.states.DRAGGING:
          this.three.setCursorStyle("move");
          this.clickPressed();
          this.controls.enabled = false;
          break;
      }
    }

    private onExit(state: number) {
      switch (state) {
        case this.states.UNSELECTED:
        case this.states.SELECTED:
          break;
        case this.states.DRAGGING:
          if (this.mouseoverObject) {
            this.three.setCursorStyle("pointer");
          } else {
            this.three.setCursorStyle("auto");
          }
          break;
        case this.states.ROTATING:
        case this.states.ROTATING_FREE:
          break;
      }
    }

    public getSelectedObject() {
      return this.selectedObject;
    }

    private updateIntersections() {
      var hudObject = this.hud.getObject();
      if (hudObject != null) {
        var hudIntersects = this.getIntersections(
          this.mouse,
          hudObject,
          false, false, true);
        if (hudIntersects.length > 0) {
          this.rotateMouseOver = true;
          this.hud.setMouseover(true);
          this.intersectedObject = null;
          return;
        }
      }
      this.rotateMouseOver = false;
      this.hud.setMouseover(false);

      var items = this.model.scene.getItems();
      var intersects = this.getIntersections(
        this.mouse,
        items,
        false, true);

      if (intersects.length > 0) {
        this.intersectedObject = intersects[0].object as Items.Item;
      } else {
        this.intersectedObject = null;
      }
    }

    private normalizeVector2(vec2: THREE.Vector2) {
      var retVec: THREE.Vector2 = new THREE.Vector2();
      retVec.x = ((vec2.x - this.three.widthMargin) / (window.innerWidth - this.three.widthMargin)) * 2 - 1;
      retVec.y = -((vec2.y - this.three.heightMargin) / (window.innerHeight - this.three.heightMargin)) * 2 + 1;
      return retVec;
    }

    private mouseToVec3(vec2: THREE.Vector2) {
      var normVec2 = this.normalizeVector2(vec2)
      var vector: THREE.Vector3 = new THREE.Vector3(
        normVec2.x, normVec2.y, 0.5);
      vector.unproject(this.camera);
      return vector;
    }

    public itemIntersection(vec2: THREE.Vector2, item: any): THREE.Intersection {
      if (item == null) {
        return null;
      }
      var customIntersections = item.customIntersectionPlanes();
      var intersections: THREE.Intersection[] | null = null;
      if (customIntersections && customIntersections.length > 0) {
        intersections = this.getIntersections(vec2, customIntersections, true);
      } else {
        intersections = this.getIntersections(vec2, this.plane);
      }
      if (intersections && intersections.length > 0) {
        return intersections[0];
      } else {
        return null;
      }
    }

    public getIntersections(vec2: THREE.Vector2, objects: any, filterByNormals?: boolean, onlyVisible?: boolean, recursive?: boolean, linePrecision?: number): THREE.Intersection[] {

      var vector = this.mouseToVec3(vec2);

      onlyVisible = onlyVisible || false;
      filterByNormals = filterByNormals || false;
      recursive = recursive || false;
      linePrecision = linePrecision || 20;

      var direction = vector.sub(this.camera.position).normalize();
      var raycaster = new THREE.Raycaster(
        this.camera.position,
        direction);
      raycaster.linePrecision = linePrecision;
      var intersections: THREE.Intersection[];
      if (objects instanceof Array) {
        intersections = raycaster.intersectObjects(objects, recursive);
      } else {
        intersections = raycaster.intersectObject(objects, recursive);
      }
      
      if (onlyVisible) {
        intersections = Core.Utils.removeIf(intersections, function (intersection) {
          return !intersection.object.visible;
        });
      }

      if (filterByNormals) {
        intersections = Core.Utils.removeIf(intersections, function (intersection) {
          var dot = intersection.face.normal.dot(direction);
          return (dot > 0)
        });
      }
      return intersections;
    }

    public setSelectedObject(object: any) {
      if (this.state === this.states.UNSELECTED) {
        this.switchState(this.states.SELECTED);
      }
      if (this.selectedObject != null) {
        this.selectedObject.setUnselected();
      }
      if (object != null) {
        this.selectedObject = object;
        this.selectedObject!.setSelected();
        this.three.itemSelectedCallbacks.fire(object);
      } else {
        this.selectedObject = null;
        this.three.itemUnselectedCallbacks.fire();
      }
      this.needsUpdate = true;
    }

    private updateMouseover() {
      if (this.intersectedObject != null) {
        if (this.mouseoverObject != null) {
          if (this.mouseoverObject !== this.intersectedObject) {
            this.mouseoverObject.mouseOff();
            this.mouseoverObject = this.intersectedObject;
            this.mouseoverObject!.mouseOver();
            this.needsUpdate = true;
          } else {
            // do nothing, mouseover already set
          }
        } else {
          this.mouseoverObject = this.intersectedObject;
          this.mouseoverObject!.mouseOver();
          this.three.setCursorStyle("pointer");
          this.needsUpdate = true;
        }
      } else if (this.mouseoverObject != null) {
        this.mouseoverObject.mouseOff();
        this.three.setCursorStyle("auto");
        this.mouseoverObject = null;
        this.needsUpdate = true;
      }
    }
  }
}
