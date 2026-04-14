/// <reference path="../../lib/three.d.ts" />
/// <reference path="floor.ts" />
/// <reference path="edge.ts" />

module BP3D.Three {
  export class Floorplan {
    private scene: THREE.Scene;
    private model: Model.Model;
    private controls: Three.Controls;
    private floors: Three.Floor[] = [];
    private edges: Three.Edge[] = [];

    constructor(scene: THREE.Scene, model: Model.Model, controls: Three.Controls) {
      this.scene = scene;
      this.model = model;
      this.controls = controls;

      // Redraw when any floorplan changes
      this.model.floors.forEach((floor) => {
        floor.floorplan.fireOnUpdatedRooms(() => this.redraw());
      });

      this.redraw();
    }

    public redraw() {
      // clear scene
      this.floors.forEach((floor) => {
        floor.removeFromScene();
      });

      this.edges.forEach((edge) => {
        edge.remove();
      });
      this.floors = [];
      this.edges = [];

      // draw floors for all floors
      this.model.floors.forEach((floor) => {
        floor.floorplan.getRooms().forEach((room) => {
          var threeFloor = new Three.Floor(this.scene, room, floor.height * floor.level);
          this.floors.push(threeFloor);
          threeFloor.addToScene();
        });

        // draw edges for this floor
        floor.floorplan.wallEdges().forEach((edge) => {
          var threeEdge = new Three.Edge(
            this.scene, edge, this.controls, floor.height * floor.level);
          this.edges.push(threeEdge);
        });
      });
    }
  }
}
