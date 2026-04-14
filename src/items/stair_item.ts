/// <reference path="on_floor_item.ts" />

module BP3D.Items {
  /**
   * A Stair item that connects floors vertically.
   */
  export class StairItem extends OnFloorItem {
    private connectedFloors: Model.Floor[] = [];

  constructor(model: Model.Model, metadata: Metadata, geometry: THREE.Geometry, material: THREE.MeshFaceMaterial, position: THREE.Vector3, rotation: number, scale: THREE.Vector3) {
    // Create staircase geometry and material if not provided
    if (!geometry) {
      geometry = StairItem.createStaircaseGeometry();
    }
    if (!material) {
      const lambertMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown wood color
      material = new THREE.MeshFaceMaterial([lambertMaterial]);
    }
    super(model, metadata, geometry, material, position, rotation, scale);
  }

    /** Create a simple staircase geometry */
    private static createStaircaseGeometry(): THREE.Geometry {
      const geometry = new THREE.Geometry();

      // Staircase parameters
      const numSteps = 8;
      const stepHeight = 0.25; // 25cm per step
      const stepDepth = 0.25; // 25cm deep
      const stepWidth = 1.0; // 1m wide
      const riserThickness = 0.02; // 2cm thick risers
      const treadThickness = 0.04; // 4cm thick treads

      // Create steps
      for (let i = 0; i < numSteps; i++) {
        const y = i * stepHeight;
        const z = i * stepDepth;

        // Riser (vertical part)
        const riserGeom = new THREE.CubeGeometry(stepWidth, stepHeight, riserThickness);
        const riserMesh = new THREE.Mesh(riserGeom);
        riserMesh.position.set(stepWidth/2, y + stepHeight/2, z - riserThickness/2);
        riserMesh.updateMatrix();
        geometry.merge(riserMesh.geometry as THREE.Geometry, riserMesh.matrix);

        // Tread (horizontal part)
        const treadGeom = new THREE.CubeGeometry(stepWidth, treadThickness, stepDepth);
        const treadMesh = new THREE.Mesh(treadGeom);
        treadMesh.position.set(stepWidth/2, y + stepHeight - treadThickness/2, z + stepDepth/2);
        treadMesh.updateMatrix();
        geometry.merge(treadMesh.geometry as THREE.Geometry, treadMesh.matrix);
      }

      // Add stringers (side supports)
      const totalHeight = numSteps * stepHeight;
      const totalDepth = numSteps * stepDepth;

      // Left stringer
      const leftStringerGeom = new THREE.CubeGeometry(0.08, totalHeight, totalDepth);
      const leftStringerMesh = new THREE.Mesh(leftStringerGeom);
      leftStringerMesh.position.set(0.04, totalHeight/2, totalDepth/2);
      leftStringerMesh.updateMatrix();
      geometry.merge(leftStringerMesh.geometry as THREE.Geometry, leftStringerMesh.matrix);

      // Right stringer
      const rightStringerGeom = new THREE.CubeGeometry(0.08, totalHeight, totalDepth);
      const rightStringerMesh = new THREE.Mesh(rightStringerGeom);
      rightStringerMesh.position.set(stepWidth - 0.04, totalHeight/2, totalDepth/2);
      rightStringerMesh.updateMatrix();
      geometry.merge(rightStringerMesh.geometry as THREE.Geometry, rightStringerMesh.matrix);

      geometry.computeBoundingBox();
      geometry.computeFaceNormals();
      geometry.computeVertexNormals();

      return geometry;
    }

    /** */
    public placeInRoom() {
      // Stairs don't need special placement logic beyond on floor
      super.placeInRoom();
      this.updateFloorConnections();
    }

    /** Update which floors this staircase connects */
    private updateFloorConnections() {
      const floors = this.model.floors;
      this.connectedFloors = [];

      // Get staircase bounding box in world coordinates
      const box = new THREE.Box3().setFromObject(this);
      const stairBottom = box.min.y;
      const stairTop = box.max.y;

      // Calculate cumulative floor heights
      let currentHeight = 0;
      for (const floor of floors) {
        const floorBottom = currentHeight;
        const floorTop = currentHeight + (floor.height / 100); // Convert cm to meters

        // Check if staircase spans this floor's height range
        if (stairBottom < floorTop && stairTop > floorBottom) {
          this.connectedFloors.push(floor);
        }

        currentHeight = floorTop;
      }

      // Ensure at least the current floor is connected
      if (this.connectedFloors.length === 0) {
        this.connectedFloors.push(this.model.activeFloor);
      }
    }

    /** Get connected floors */
    public getConnectedFloors(): Model.Floor[] {
      return this.connectedFloors;
    }

    /** */
    public removed() {
      // Handle removal if needed
      this.connectedFloors = [];
    }
  }
}