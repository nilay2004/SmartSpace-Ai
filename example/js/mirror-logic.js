// mirror-logic.js — Real-time Reflections for Blueprint3D
// This script detects "Mirror" items and adds real-time reflection capabilities.

(function () {
  'use strict';

  function initMirrorLogic(blueprint3d) {
    var scene = blueprint3d.model.scene;
    var three = blueprint3d.three;
    var renderer = three.getRenderer();
    var mainScene = three.getScene().getScene();

    scene.itemLoadedCallbacks.add(function (item) {
      if (item.metadata.itemName === "Mirror") {
        setupMirrorReflection(item);
      }
    });

    function setupMirrorReflection(item) {
      // Create a CubeCamera for real-time reflections
      // near, far, resolution
      var cubeCamera = new THREE.CubeCamera(1, 10000, 512);
      mainScene.add(cubeCamera);

      // Replace the item's material with a reflective one
      var mirrorMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        envMap: cubeCamera.renderTarget,
        reflectivity: 0.9,
        shininess: 100
      });

      // Apply to the front face (assuming the model has multiple materials or a single one)
      if (item.material && item.material.materials) {
        // poster/mirror models usually have front face as material 0 or 1
        item.material.materials.forEach(function(mat, index) {
            item.material.materials[index] = mirrorMaterial;
        });
      } else {
        item.material = mirrorMaterial;
      }

      // Update logic
      function updateReflection() {
        if (!item.visible) return;
        
        // Hide the mirror itself during reflection capture to avoid self-reflection artifacts
        item.visible = false;
        
        // Position the cube camera at the mirror's position
        cubeCamera.position.copy(item.position);
        
        // Update the reflection
        cubeCamera.updateCubeMap(renderer, mainScene);
        
        // Show the mirror again
        item.visible = true;
      }

      // Hook into the render loop
      // Since blueprint3d doesn't have a direct "beforeRender" hook easily accessible,
      // we'll use requestAnimationFrame to update before the next frame.
      function loop() {
        if (item.parent) {
          updateReflection();
          requestAnimationFrame(loop);
        }
      }
      loop();
      
      // Clean up if item is removed
      scene.itemRemovedCallbacks.add(function(removedItem) {
        if (removedItem === item) {
          mainScene.remove(cubeCamera);
          if (cubeCamera.renderTarget) {
            cubeCamera.renderTarget.dispose();
          }
        }
      });
    }
  }

  // Wait for bp3d to be initialized
  var checkInterval = setInterval(function() {
    if (window.bp3d) {
      initMirrorLogic(window.bp3d);
      clearInterval(checkInterval);
    }
  }, 500);

})();
