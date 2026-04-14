// Minimal Three.js typings for the "new_project" namespace-based sources.
// The main project already ships its own `lib/three.d.ts`; this is a lightweight shim
// so `/// <reference path="../../lib/three.d.ts" />` inside `new_project/src/**` resolves.

declare namespace THREE {
  class Vector2 { constructor(x?: number, y?: number); x: number; y: number; }
  class Vector3 { constructor(x?: number, y?: number, z?: number); x: number; y: number; z: number; }
  class Geometry {}
  class Shape { constructor(points?: Vector2[]); }
  class ShapeGeometry { constructor(shape: Shape); }
  class MeshBasicMaterial { constructor(params?: any); }
  class MeshFaceMaterial {}
  class Mesh {
    constructor(geometry?: any, material?: any);
    visible: boolean;
    rotation: { set(x: number, y: number, z: number): void };
  }
  const DoubleSide: any;
}

