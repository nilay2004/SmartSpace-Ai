/// <reference path="floor_item.ts" />
/// <reference path="in_wall_floor_item.ts" />
/// <reference path="in_wall_item.ts" />
/// <reference path="on_floor_item.ts" />
/// <reference path="stair_item.ts" />
/// <reference path="wall_floor_item.ts" />
/// <reference path="wall_item.ts" />

module BP3D.Items {
  export type ItemType = 1 | 2 | 3 | 7 | 8 | 9 | 10;
  const item_types = {
    1: Items.FloorItem,
    2: Items.WallItem,
    3: Items.InWallItem,
    7: Items.InWallFloorItem,
    8: Items.OnFloorItem,
    9: Items.WallFloorItem,
    10: Items.StairItem
  };

  /** Factory class to create items. */
  export class Factory {
    /** Gets the class for the specified item. */
    public static getClass(itemType: ItemType) { 
      return item_types[itemType]
    }
  }
}
