/// <reference path="../../lib/three.d.ts" />
/// <reference path="../../lib/jquery.d.ts" />
/// <reference path="../core/utils.ts" />
/// <reference path="corner.ts" />
/// <reference path="floorplan.ts" />
/// <reference path="half_edge.ts" />

/*
TODO
var Vec2 = require('vec2')
var segseg = require('segseg')
var Polygon = require('polygon')
*/

namespace BP3D.Model {

  /** Default texture to be used if nothing is provided. */
  const defaultRoomTexture = {
    url: "rooms/textures/hardwood.png",
    scale: 400
  }

  /** 
   * A Room is the combination of a Floorplan with a floor plane. 
   */
  export class Room {

    /** */
    public interiorCorners: { x: number, y: number }[] = [];

    /** */
    private edgePointer: HalfEdge = null;

    /** floor plane for intersection testing */
    public floorPlane: THREE.Mesh = null;

    /** */
    private customTexture = false;

    /** */
    private floorChangeCallbacks = $.Callbacks();

    /**
     *  ordered CCW
     */
    constructor(private floorplan: Floorplan, public corners: Corner[]) {
      this.updateWalls();
      this.updateInteriorCorners();
      this.generatePlane();
    }

    /** Room area in cm^2, based on interior polygon. */
    public getAreaCm2(): number {
      const pts = this.interiorCorners;
      if (!pts || pts.length < 3) return 0;
      let sum = 0;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        sum += a.x * b.y - b.x * a.y;
      }
      return Math.abs(sum) * 0.5;
    }

    /** Centroid in cm, based on interior polygon. */
    public getCentroid(): { x: number; y: number } {
      const pts = this.interiorCorners;
      if (!pts || pts.length < 3) {
        // fallback: average corners
        const base = this.corners;
        if (!base || base.length === 0) return { x: 0, y: 0 };
        let x = 0, y = 0;
        for (let i = 0; i < base.length; i++) {
          x += base[i].x;
          y += base[i].y;
        }
        return { x: x / base.length, y: y / base.length };
      }

      let a2 = 0; // 2 * area signed
      let cx = 0;
      let cy = 0;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const q = pts[(i + 1) % pts.length];
        const cross = p.x * q.y - q.x * p.y;
        a2 += cross;
        cx += (p.x + q.x) * cross;
        cy += (p.y + q.y) * cross;
      }
      if (Math.abs(a2) < 1e-9) return { x: pts[0].x, y: pts[0].y };
      const inv = 1 / (3 * a2);
      return { x: cx * inv, y: cy * inv };
    }

    public getUuid(): string {
      var cornerUuids = Core.Utils.map(this.corners, function (c) {
        return c.id;
      });
      cornerUuids.sort();
      return cornerUuids.join();
    }

    public fireOnFloorChange(callback: () => void) {
      this.floorChangeCallbacks.add(callback);
    }

    public getTexture() {
      var uuid = this.getUuid();
      var tex = this.floorplan.getFloorTexture(uuid);
      return tex || defaultRoomTexture;
    }

    /** 
     * textureStretch always true, just an argument for consistency with walls
     */
    public setTexture(textureUrl: string, textureStretch: boolean, textureScale: number) {
      var uuid = this.getUuid();
      this.floorplan.setFloorTexture(uuid, textureUrl, textureScale);
      this.floorChangeCallbacks.fire();
    }

    private generatePlane() {
      var points: THREE.Vector2[] = [];
      this.interiorCorners.forEach((corner) => {
        points.push(new THREE.Vector2(
          corner.x,
          corner.y));
      });
      var shape = new THREE.Shape(points);
      var geometry = new THREE.ShapeGeometry(shape);
      this.floorPlane = new THREE.Mesh(geometry,
        new THREE.MeshBasicMaterial({
          side: THREE.DoubleSide
        }));
      this.floorPlane.visible = false;
      this.floorPlane.rotation.set(Math.PI / 2, 0, 0);
      (<any>this.floorPlane).room = this; // js monkey patch
    }

    private cycleIndex(index: number) {
      if (index < 0) {
        return index += this.corners.length;
      } else {
        return index % this.corners.length;
      }
    }

    private updateInteriorCorners() {
      var edge = this.edgePointer;
      while (edge) {
        this.interiorCorners.push(edge.interiorStart());
        edge.generatePlane();
        if (edge.next === this.edgePointer) {
          break;
        } else {
          edge = edge.next;
        }
      }
    }

    /** 
     * Populates each wall's half edge relating to this room
     * this creates a fancy doubly connected edge list (DCEL)
     */
    private updateWalls() {

      var prevEdge: HalfEdge = null;
      var firstEdge: HalfEdge = null;

      for (var i = 0; i < this.corners.length; i++) {

        var firstCorner = this.corners[i];
        var secondCorner = this.corners[(i + 1) % this.corners.length];

        // find if wall is heading in that direction
        var wallTo = firstCorner.wallTo(secondCorner);
        var wallFrom = firstCorner.wallFrom(secondCorner);
        var edge: HalfEdge;

        if (wallTo) {
          edge = new HalfEdge(this, wallTo, true);
        } else if (wallFrom) {
          edge = new HalfEdge(this, wallFrom, false);
        } else {
          // something horrible has happened
          console.log("corners arent connected by a wall, uh oh");
          continue;
        }

        if (i == 0) {
          firstEdge = edge;
        } else {
          edge.prev = prevEdge!;
          prevEdge!.next = edge;
          if (i + 1 == this.corners.length) {
            firstEdge!.prev = edge;
            edge.next = firstEdge!;
          }
        }
        prevEdge = edge;
      }

      // hold on to an edge reference
      this.edgePointer = firstEdge;
    }
  }
}
