/// <reference path="../../lib/three.d.ts" />
/// <reference path="../core/utils.ts" />
/// <reference path="../core/assets.ts" />
/// <reference path="../model/room.ts" />

module BP3D.Three {
  export class Floor {
    private room: Model.Room;
    private scene: THREE.Scene;
    private floorPlane: THREE.Mesh | null = null;
    private roofPlane: THREE.Mesh | null = null;
    private heightOffset: number = 0;

    constructor(scene: THREE.Scene, room: Model.Room, heightOffset: number = 0) {
      this.room = room;
      this.scene = scene;
      this.heightOffset = heightOffset;
      this.init();
    }

    private init() {
      this.room.fireOnFloorChange(() => this.redraw());
      this.floorPlane = this.buildFloor();
      // roofs look weird, so commented out
      //this.roofPlane = this.buildRoof();
    }

    private redraw() {
      this.removeFromScene();
      this.floorPlane = this.buildFloor();
      this.addToScene();
    }

    private buildFloor(): THREE.Mesh {
      var textureSettings = this.room.getTexture();
      // setup texture
      var loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      var floorTexture = loader.load(Core.Assets.resolveAssetUrl(textureSettings.url));
      floorTexture.wrapS = THREE.RepeatWrapping;
      floorTexture.wrapT = THREE.RepeatWrapping;
      floorTexture.repeat.set(1, 1);
      var floorMaterialTop = new THREE.MeshPhongMaterial({
        map: floorTexture,
        side: THREE.DoubleSide,
        // ambient: 0xffffff, TODO_Ekki
        color: 0xcccccc,
        specular: 0x0a0a0a
      });

      var textureScale = textureSettings.scale;
      // http://stackoverflow.com/questions/19182298/how-to-texture-a-three-js-mesh-created-with-shapegeometry
      // scale down coords to fit 0 -> 1, then rescale

      var points: THREE.Vector2[] = [];
      this.room.interiorCorners.forEach((corner) => {
        points.push(new THREE.Vector2(
          corner.x / textureScale,
          corner.y / textureScale));
      });
      var shape = new THREE.Shape(points);

      var geometry = new THREE.ShapeGeometry(shape);

       var floor = new THREE.Mesh(geometry, floorMaterialTop);

       floor.rotation.set(Math.PI / 2, 0, 0);
       floor.position.y = this.heightOffset;
       floor.scale.set(textureScale, textureScale, textureScale);
       floor.receiveShadow = true;
       floor.castShadow = false;
       return floor;
    }

    private buildRoof(): THREE.Mesh {
      // setup texture
      var roofMaterial = new THREE.MeshBasicMaterial({
        side: THREE.FrontSide,
        color: 0xe5e5e5
      });

      var points: THREE.Vector2[] = [];
      this.room.interiorCorners.forEach((corner) => {
        points.push(new THREE.Vector2(
          corner.x,
          corner.y));
      });
      var shape = new THREE.Shape(points);
      var geometry = new THREE.ShapeGeometry(shape);
      var roof = new THREE.Mesh(geometry, roofMaterial);

      roof.rotation.set(Math.PI / 2, 0, 0);
      roof.position.y = 250;
      return roof;
    }

    public addToScene() {
      if (this.floorPlane) {
        this.scene.add(this.floorPlane);
      }
      //this.scene.add(this.roofPlane);
      // hack so we can do intersect testing
      if (this.room.floorPlane) {
        this.scene.add(this.room.floorPlane);
      }
    }

    public removeFromScene() {
      if (this.floorPlane) {
        this.scene.remove(this.floorPlane);
      }
      //this.scene.remove(this.roofPlane);
      if (this.room.floorPlane) {
        this.scene.remove(this.room.floorPlane);
      }
    }
  }
}
