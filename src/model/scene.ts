/// <reference path="../../lib/three.d.ts" />
/// <reference path="../../lib/jquery.d.ts" />
/// <reference path="../core/utils.ts" />
/// <reference path="../core/assets.ts" />
/// <reference path="../items/factory.ts" />

module BP3D.Model {
  /**
   * The Scene is a manager of Items and also links to a ThreeJS scene.
   */
  export class Scene {

    /** The associated ThreeJS scene. */
    private scene: THREE.Scene;

    /** */
    private items: Items.Item[] = [];

    /** */
    public needsUpdate = false;

    /** The Json loader. */
    private loader: THREE.JSONLoader;

    /** */
    private itemLoadingCallbacks = $.Callbacks();

    /** Item */
    public itemLoadedCallbacks = $.Callbacks();

    /** Item */
    public itemRemovedCallbacks = $.Callbacks();

    /**
     * Constructs a scene.
     * @param model The associated model.
     * @param textureDir The directory from which to load the textures.
     */
    constructor(private model: Model, private textureDir: string) {
      this.scene = new THREE.Scene();

      // init item loader
      this.loader = new THREE.JSONLoader();
      this.loader.crossOrigin = "";
    }

    /** Adds a non-item, basically a mesh, to the scene.
     * @param mesh The mesh to be added.
     */
    public add(mesh: THREE.Mesh) {
      this.scene.add(mesh);
    }

    /** Removes a non-item, basically a mesh, from the scene.
     * @param mesh The mesh to be removed.
     */
    public remove(mesh: THREE.Mesh) {
      this.scene.remove(mesh);
      Core.Utils.removeValue(this.items, mesh);
    }

    /** Gets the scene.
     * @returns The scene.
     */
    public getScene(): THREE.Scene {
      return this.scene;
    }

    /** Gets the items.
     * @returns The items.
     */
    public getItems(): Items.Item[] {
      return this.items;
    }

    /** Gets the count of items.
     * @returns The count.
     */
    public itemCount(): number {
      return this.items.length
    }

    /** Removes all items. */
    public clearItems() {
      var items_copy = this.items
      var scope = this;
      this.items.forEach((item) => {
        scope.removeItem(item, true);
      });
      this.items = []
    }

    /**
     * Removes an item.
     * @param item The item to be removed.
     * @param dontRemove If not set, also remove the item from the items list.
     */
    public removeItem(item: Items.Item, dontRemove?: boolean) {
      dontRemove = dontRemove || false;
      // use this for item meshes
      this.itemRemovedCallbacks.fire(item);
      item.removed();
      this.scene.remove(item);
      if (!dontRemove) {
        Core.Utils.removeValue(this.items, item);
      }
    }

    /**
     * Creates an item and adds it to the scene.
     * @param itemType The type of the item given by an enumerator.
     * @param fileName The name of the file to load.
     * @param metadata TODO
     * @param position The initial position.
     * @param rotation The initial rotation around the y axis.
     * @param scale The initial scaling.
     * @param fixed True if fixed.
     * @param floor The floor to add the item to (optional, defaults to active floor).
     */
    public addItem(itemType: Items.ItemType, fileName: string, metadata: Items.Metadata, position: THREE.Vector3, rotation: number, scale: THREE.Vector3, fixed: boolean, floor?: Model.Floor) {
      itemType = itemType || 1;
      var scope = this;

      // Special handling for procedural items (no file to load)
      if (itemType === 10 || !fileName || fileName === "null") {
        var item = new (Items.Factory.getClass(itemType) as any)(
          scope.model,
          metadata, null, null,
          position, rotation, scale
        );
        item.fixed = fixed || false;
        scope.items.push(item);
        scope.add(item);
        item.initObject();
        // Add to floor
        var targetFloor = floor || scope.model.activeFloor;
        if (targetFloor) {
          targetFloor.addItem(item);
        }
        scope.itemLoadedCallbacks.fire(item);
        return;
      }

      var loaderCallback = function (geometry: THREE.Geometry, materials: THREE.Material[]) {
        var item = new (Items.Factory.getClass(itemType) as any)(
          scope.model,
          metadata, geometry,
          new THREE.MeshFaceMaterial(materials),
          position, rotation, scale
        );
        item.fixed = fixed || false;
        scope.items.push(item);
        scope.add(item);
        item.initObject();
        // Add to floor
        var targetFloor = floor || scope.model.activeFloor;
        if (targetFloor) {
          targetFloor.addItem(item);
        }
        scope.itemLoadedCallbacks.fire(item);
      }

      this.itemLoadingCallbacks.fire();
      this.loader.load(
        Core.Assets.resolveAssetUrl(fileName),
        loaderCallback,
        undefined // TODO_Ekki
      );
    }
  }
}
