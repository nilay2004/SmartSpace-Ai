/// <reference path="../../lib/three.d.ts" />
/// <reference path="../../lib/jquery.d.ts" />
/// <reference path="floorplan.ts" />

module BP3D.Model {
  /**
   * A Floor represents one level in a multi-floor building.
   * It contains the floorplan and associated items.
   */
  export class Floor {

    /** The floorplan for this floor. */
    public floorplan: Floorplan;

    /** The items placed on this floor. */
    public items: Items.Item[] = [];

    /** Floor name for identification. */
    public name: string;

    /** Floor level (e.g., 0 for ground, 1 for first floor). */
    public level: number;

    /** Floor height in units. */
    public height: number = 300; // default 3 meters in cm

    /**
     * Constructs a new floor.
     * @param name The name of the floor.
     * @param level The level number.
     */
    constructor(name: string, level: number) {
      this.name = name;
      this.level = level;
      this.floorplan = new Floorplan();
    }

    /**
     * Adds an item to this floor.
     * @param item The item to add.
     */
    public addItem(item: Items.Item) {
      this.items.push(item);
    }

    /**
     * Removes an item from this floor.
     * @param item The item to remove.
     */
    public removeItem(item: Items.Item) {
      Core.Utils.removeValue(this.items, item);
    }

    /**
     * Gets the items on this floor.
     * @returns The items array.
     */
    public getItems(): Items.Item[] {
      return this.items;
    }

    /**
     * Serializes the floor data.
     * @returns Serialized floor data.
     */
    public saveFloor(): any {
      var items_arr = [];
      for (var i = 0; i < this.items.length; i++) {
        var object = this.items[i];
        items_arr[i] = {
          item_name: object.metadata.itemName,
          item_type: object.metadata.itemType,
          model_url: object.metadata.modelUrl,
          xpos: object.position.x,
          ypos: object.position.y,
          zpos: object.position.z,
          rotation: object.rotation.y,
          scale_x: object.scale.x,
          scale_y: object.scale.y,
          scale_z: object.scale.z,
          fixed: object.fixed
        };
      }

      return {
        name: this.name,
        level: this.level,
        height: this.height,
        floorplan: this.floorplan.saveFloorplan(),
        items: items_arr
      };
    }

    /**
     * Loads floor data from serialized format.
     * @param data The serialized floor data.
     */
    public loadFloor(data: any) {
      this.name = data.name;
      this.level = data.level;
      this.height = data.height || 300;
      this.floorplan.loadFloorplan(data.floorplan);
      // Items will be loaded separately by the scene
    }
  }
}