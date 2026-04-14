/// <reference path="../../lib/three.d.ts" />
/// <reference path="../../lib/jquery.d.ts" />
/// <reference path="floorplan.ts" />
/// <reference path="scene.ts" />
/// <reference path="floor.ts" />

namespace BP3D.Model {
  /**
   * A Model manages multiple Floors, each with a Floorplan and associated Scene items.
   */
  export class Model {

    /** The floors in the building. */
    public floors: Floor[] = [];

    /** The current active floor for editing. */
    public activeFloor: Floor;

    /** */
    public scene: Scene;

    /** Callbacks when active floor changes. */
    public activeFloorChangedCallbacks = $.Callbacks();

    /** */
    private roomLoadingCallbacks = $.Callbacks();

    /** */
    private roomLoadedCallbacks = $.Callbacks();

    /** name */
    private roomSavedCallbacks = $.Callbacks();

    /** success (bool), copy (bool) */
    private roomDeletedCallbacks = $.Callbacks();

    /** Constructs a new model.
     * @param textureDir The directory containing the textures.
     */
    constructor(textureDir: string) {
      this.scene = new Scene(this, textureDir);
      // Create default ground floor
      var groundFloor = new Floor("Ground Floor", 0);
      this.floors.push(groundFloor);
      this.activeFloor = groundFloor;
    }

    public loadSerialized(json: string) {
      // TODO: better documentation on serialization format.
      // TODO: a much better serialization format.
      this.roomLoadingCallbacks.fire();

      var data = JSON.parse(json);
      if (data.floors) {
        // Multi-floor format
        this.floors = [];
        this.scene.clearItems();
        data.floors.forEach((floorData: any) => {
          var floor = new Floor(floorData.name, floorData.level);
          floor.loadFloor(floorData);
          this.floors.push(floor);
          this.loadItemsForFloor(floor, floorData.items);
        });
        this.activeFloor = this.floors[0];
      } else {
        // Legacy single-floor format
        this.floors = [];
        var groundFloor = new Floor("Ground Floor", 0);
        groundFloor.loadFloor({name: "Ground Floor", level: 0, floorplan: data.floorplan});
        this.floors.push(groundFloor);
        this.activeFloor = groundFloor;
        this.scene.clearItems();
        this.loadItemsForFloor(groundFloor, data.items);
      }

      this.roomLoadedCallbacks.fire();
    }

    public exportSerialized(): string {
      var floors_arr = [];
      for (var i = 0; i < this.floors.length; i++) {
        floors_arr[i] = this.floors[i].saveFloor();
      }

      var building = {
        floors: floors_arr
      };

      return JSON.stringify(building);
    }

    private loadItemsForFloor(floor: Floor, items: any[]) {
      items.forEach((item) => {
        var position = new THREE.Vector3(
          item.xpos, item.ypos, item.zpos);
        var metadata = {
          itemName: item.item_name,
          resizable: item.resizable,
          itemType: item.item_type,
          modelUrl: item.model_url
        };
        var scale = new THREE.Vector3(
          item.scale_x,
          item.scale_y,
          item.scale_z
        );
        this.scene.addItem(
          item.item_type,
          item.model_url,
          metadata,
          position,
          item.rotation,
          scale,
          item.fixed,
          floor);
      });
    }

    /**
     * Adds a new floor to the model.
     * @param name The name of the floor.
     * @param level The level number.
     * @returns The new floor.
     */
    public addFloor(name: string, level: number): Floor {
      var floor = new Floor(name, level);
      this.floors.push(floor);
      return floor;
    }

    /**
     * Removes a floor from the model.
     * @param floor The floor to remove.
     */
    public removeFloor(floor: Floor) {
      if (this.floors.length > 1) {
        // Remove items from scene
        floor.getItems().forEach((item) => {
          this.scene.removeItem(item);
        });
        Core.Utils.removeValue(this.floors, floor);
        if (this.activeFloor === floor) {
          this.activeFloor = this.floors[0];
        }
      }
    }

    /**
     * Sets the active floor for editing.
     * @param floor The floor to set as active.
     */
    public setActiveFloor(floor: Floor) {
      this.activeFloor = floor;
      this.activeFloorChangedCallbacks.fire(floor);
    }
  }
}
