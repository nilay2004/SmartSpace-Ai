/**
 * AIPlanner.js
 * World-Class Layout Heuristics and Auto-Furnish Engine for Blueprint3D
 */
(function() {
  'use strict';

  function AIPlanner(blueprint3d) {
    this.blueprint3d = blueprint3d;
    this.model = blueprint3d.model;
    
    // Preset Furniture Sets
    this.presets = {
      'living_room': [
        { name: "Sofa - Grey", url: "models/js/cb-rochelle-gray_baked.js", type: 1, importance: 10, align: 'wall' },
        { name: "Coffee Table - Wood", url: "models/js/ik-stockholmcoffee-brown.js", type: 1, importance: 8, align: 'center_front', relativeTo: "Sofa - Grey" },
        { name: "Media Console - White", url: "models/js/cb-clapboard_baked.js", type: 1, importance: 9, align: 'wall_opposite', relativeTo: "Sofa - Grey" },
        { name: "Floor Lamp", url: "models/js/ore-3legged-white_baked.js", type: 1, importance: 5, align: 'corner' }
      ],
      'bedroom': [
        { name: "Full Bed", url: "models/js/ik_nordli_full.js", type: 1, importance: 10, align: 'wall_center' },
        { name: "Bedside table - White", url: "models/js/cb-archnight-white_baked.js", type: 1, importance: 8, align: 'side', relativeTo: "Full Bed" },
        { name: "Wardrobe - White", url: "models/js/ik-kivine_baked.js", type: 1, importance: 9, align: 'wall' },
        { name: "Mirror", url: "models/js/mirror.json", type: 2, importance: 4, align: 'wall' }
      ],
      'dining_room': [
        { name: "Dining Table", url: "models/js/cb-scholartable_baked.js", type: 1, importance: 10, align: 'room_center' },
        { name: "Chair", url: "models/js/gus-churchchair-whiteoak.js", type: 1, importance: 8, count: 4, align: 'around', relativeTo: "Dining Table" }
      ]
    };
  }

  AIPlanner.prototype.autoFurnish = function(roomType) {
    var self = this;
    var rooms = this.model.floorplan.getRooms();
    if (rooms.length === 0) {
      alert("Please draw a room first!");
      return;
    }

    var room = this.getSelectedRoom() || rooms[0];
    
    if (!roomType) {
      var meta = (this.model.floorplan.getRoomMeta && this.model.floorplan.getRoomMeta(room.getUuid())) || {};
      var t = (meta.type || "").trim().toLowerCase();
      if (t === "living") roomType = "living_room";
      else if (t === "bedroom") roomType = "bedroom";
      else if (t === "dining") roomType = "dining_room";
      else roomType = "living_room"; // default
    }

    var itemsDef = this.presets[roomType];
    if (!itemsDef) return;

    this.clearRoomItems(room);

    var corners = room.interiorCorners;
    var walls = this.getRoomWalls(room);
    
    // Find the longest wall
    var mainWall = this.findBestWall(walls);
    var oppositeWall = this.getOppositeWall(walls, mainWall);

    itemsDef.forEach(function(def, index) {
      setTimeout(function() {
        var posData;
        var rot = 0;

        if (def.align === 'wall' || def.align === 'wall_center') {
          posData = self.getPositionOnWall(mainWall, 0.5, 45, corners);
          rot = posData.normalAngle + Math.PI;
        } else if (def.align === 'wall_opposite') {
          posData = self.getPositionOnWall(oppositeWall, 0.5, 45, corners);
          rot = posData.normalAngle + Math.PI;
        } else if (def.align === 'center_front') {
          // Increase offset to 150cm to avoid clumping with sofa
          posData = self.getPositionOnWall(mainWall, 0.5, 150, corners);
          rot = posData.normalAngle;
        } else if (def.align === 'side') {
          var ratio = (index % 2 === 0) ? 0.25 : 0.75;
          posData = self.getPositionOnWall(mainWall, ratio, 40, corners);
          rot = posData.normalAngle + Math.PI;
        } else if (def.align === 'corner') {
          posData = self.getPositionOnWall(mainWall, 0.05, 50, corners);
          rot = posData.normalAngle + Math.PI/4;
        } else if (def.align === 'room_center') {
          var center = self.getRoomCenter(room);
          posData = { x: center.x, z: center.z };
          rot = 0;
        } else {
          var center = self.getRoomCenter(room);
          posData = { x: center.x, z: center.z };
          rot = 0;
        }

        // Safety: ensure inside room
        if (BP3D.Core.Utils.pointInPolygon(posData.x, posData.z, corners)) {
          self.spawnItem(def, posData, rot);
        } else {
          self.spawnItem(def, self.getRoomCenter(room), 0);
        }
      }, index * 200);
    });
  };

  AIPlanner.prototype.findBestWall = function(walls) {
    // Sort by length, but prioritize walls that aren't too short for a sofa/bed
    var sorted = walls.slice().sort(function(a, b) {
      return b.length - a.length;
    });
    return sorted[0]; // Return longest wall
  };

  AIPlanner.prototype.getRoomWalls = function(room) {
    var walls = [];
    var corners = room.interiorCorners;
    for (var i = 0; i < corners.length; i++) {
      var c1 = corners[i];
      var c2 = corners[(i + 1) % corners.length];
      var dx = c2.x - c1.x;
      var dz = c2.z - c1.z;
      walls.push({
        p1: c1,
        p2: c2,
        length: Math.sqrt(dx*dx + dz*dz),
        angle: Math.atan2(dz, dx),
        midpoint: { x: (c1.x + c2.x)/2, z: (c1.z + c2.z)/2 }
      });
    }
    return walls;
  };

  AIPlanner.prototype.getOppositeWall = function(walls, mainWall) {
    var best = null;
    var maxDist = -1;
    var mainMid = mainWall.midpoint;

    walls.forEach(function(w) {
      // Skip the main wall itself and its immediate neighbors for better results
      if (w === mainWall) return;
      
      // Calculate distance between midpoints
      var d = Math.sqrt(Math.pow(w.midpoint.x - mainMid.x, 2) + Math.pow(w.midpoint.z - mainMid.z, 2));
      
      // We want the wall that is furthest away AND roughly parallel (dot product of normals)
      // For simplicity, furthest distance is usually the best opposite wall
      if (d > maxDist) {
        maxDist = d;
        best = w;
      }
    });
    return best || walls[1];
  };

  AIPlanner.prototype.getPositionOnWall = function(wall, ratio, offset, roomCorners) {
    var dx = wall.p2.x - wall.p1.x;
    var dz = wall.p2.z - wall.p1.z;
    
    // Normal candidates
    var nx1 = -dz / wall.length;
    var nz1 = dx / wall.length;
    
    // Try first normal
    var testX = wall.p1.x + dx * ratio + nx1 * 10;
    var testZ = wall.p1.z + dz * ratio + nz1 * 10;
    
    var nx, nz;
    if (BP3D.Core.Utils.pointInPolygon(testX, testZ, roomCorners)) {
      nx = nx1; nz = nz1;
    } else {
      nx = -nx1; nz = -nz1; // Flip normal if it points outside
    }
    
    return {
      x: wall.p1.x + dx * ratio + nx * offset,
      z: wall.p1.z + dz * ratio + nz * offset,
      normalAngle: Math.atan2(nz, nx)
    };
  };

  AIPlanner.prototype.spawnItem = function(def, pos, rot) {
    var metadata = {
      itemName: def.name,
      resizable: true,
      itemType: def.type,
      modelUrl: def.url
    };
    var scaleVec = new THREE.Vector3(1, 1, 1);
    var posVec = new THREE.Vector3(pos.x, 40, pos.z);
    this.model.scene.addItem(def.type, def.url, metadata, posVec, rot, scaleVec, false);
  };

  AIPlanner.prototype.getSelectedRoom = function() {
    // In Blueprint3D, the "active" room is often determined by the camera position
    // or by a click in the 2D floorplanner.
    // For 3D, we'll check if the camera is inside any room.
    var camPos = this.blueprint3d.three.getCamera().position;
    var rooms = this.model.floorplan.getRooms();
    
    for (var i = 0; i < rooms.length; i++) {
      if (BP3D.Core.Utils.pointInPolygon(camPos.x, camPos.z, rooms[i].interiorCorners)) {
        return rooms[i];
      }
    }
    return null;
  };

  AIPlanner.prototype.getRoomCenter = function(room) {
    var sumX = 0, sumZ = 0;
    var corners = room.interiorCorners;
    corners.forEach(function(c) {
      sumX += c.x;
      sumZ += c.z;
    });
    return { x: sumX / corners.length, z: sumZ / corners.length };
  };

  AIPlanner.prototype.clearRoomItems = function(room) {
    var sceneItems = this.model.scene.getItems();
    for (var i = sceneItems.length - 1; i >= 0; i--) {
      var it = sceneItems[i];
      // Only remove if it's not the "User (3D)" model
      if (it.metadata.itemName !== "User (3D)" && BP3D.Core.Utils.pointInPolygon(it.position.x, it.position.z, room.interiorCorners)) {
        it.remove();
      }
    }
  };

  AIPlanner.prototype.placeItemHeuristically = function(def, room, center) {
    var self = this;
    var count = def.count || 1;
    
    // Calculate room dimensions for scaling/spacing
    var corners = room.interiorCorners;
    var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    corners.forEach(function(c) {
      minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x);
      minZ = Math.min(minZ, c.z); maxZ = Math.max(maxZ, c.z);
    });
    var roomWidth = maxX - minX;
    var roomDepth = maxZ - minZ;

    for (var i = 0; i < count; i++) {
      var pos = { x: center.x, z: center.z };
      var rot = 0;

      // Advanced Heuristic Positioning based on Room Dimensions
      if (def.align === 'wall') {
        pos.z = minZ + 50; // Push to top wall
        pos.x += (i - (count-1)/2) * Math.min(100, roomWidth / (count + 1));
      } else if (def.align === 'wall_center') {
        pos.z = minZ + 80; // Headboard against wall
      } else if (def.align === 'room_center') {
        // Keep at center
      } else if (def.align === 'center_front') {
        pos.z = center.z + 50;
      } else if (def.align === 'wall_opposite') {
        pos.z = maxZ - 50; // Push to bottom wall
        rot = Math.PI;
      } else if (def.align === 'corner') {
        pos.x = minX + 50;
        pos.z = minZ + 50;
      } else if (def.align === 'around') {
        var radius = Math.min(80, roomWidth/4, roomDepth/4);
        var angle = (i / count) * Math.PI * 2;
        pos.x += Math.cos(angle) * radius;
        pos.z += Math.sin(angle) * radius;
        rot = angle + Math.PI/2;
      } else if (def.align === 'side') {
        // Find "relativeTo" item if it exists in the current queue (not implemented yet, using offset)
        pos.x = center.x + (i === 0 ? -80 : 80);
        pos.z = minZ + 80;
      }

      // Ensure item is within room bounds
      pos.x = Math.max(minX + 30, Math.min(maxX - 30, pos.x));
      pos.z = Math.max(minZ + 30, Math.min(maxZ - 30, pos.z));

      var metadata = {
        itemName: def.name,
        resizable: true,
        itemType: def.type,
        modelUrl: def.url
      };

      var scaleVec = new THREE.Vector3(1, 1, 1);
      var posVec = new THREE.Vector3(pos.x, 40, pos.z); // Standard height

      this.model.scene.addItem(def.type, def.url, metadata, posVec, rot, scaleVec, false);
    }
  };

  window.initAIPlanner = function(bp3d) {
    var planner = new AIPlanner(bp3d);
    
    $("#auto-furnish-btn").click(function() {
      planner.autoFurnish();
    });

    return planner;
  };

})();
