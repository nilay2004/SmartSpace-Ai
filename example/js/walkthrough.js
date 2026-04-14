// walkthrough.js — First-Person Walkthrough for Blueprint3D 
 // Strategy: swap the main app's camera with our walk camera. 
 // The existing render loop keeps running — it just renders from our viewpoint. 
 
 (function () { 
 
   var active        = false; 
   var wtCamera      = null; 
   var savedCamera   = null;  // we save & restore the original camera position/rotation 
   var yaw           = 0; 
   var pitch         = 0; 
   var lastTime      = null; 
   var pointerLocked = false; 
   var rafId         = null; 
   var userModel     = null; // The User (3D) item in the scene
 
   var keys = { 
     w:false, a:false, s:false, d:false, 
     ArrowUp:false, ArrowLeft:false, ArrowDown:false, ArrowRight:false 
   }; 
 
   var SPEED  = 250; 
   var HEIGHT = 160; 
   var SENS   = 0.002; 
 
   // ── Inject button ────────────────────────────────────────────────────────── 
   function injectButton() { 
     if (document.getElementById('walkthrough-btn')) return; 
     var bar = document.getElementById('main-controls'); 
     if (!bar) return; 
     var btn = document.createElement('a'); 
     btn.id        = 'walkthrough-btn'; 
     btn.href      = '#'; 
     btn.className = 'btn btn-default btn-sm'; 
     btn.style.marginLeft = '4px'; 
     btn.innerHTML = '<span class="glyphicon glyphicon-eye-open"></span> Walk Through'; 
     btn.addEventListener('click', function (e) { e.preventDefault(); enter(); }); 
     bar.appendChild(btn); 
   } 
 
   // ── Build HUD ────────────────────────────────────────────────────────────── 
   function buildHUD() { 
     if (document.getElementById('wt-hud')) return; 
     var hud = document.createElement('div'); 
     hud.id = 'wt-hud'; 
     hud.style.cssText = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;pointer-events:none;'; 
 
     // Crosshair 
     hud.innerHTML += 
       '<div style="position:absolute;top:50%;left:50%;width:20px;height:20px;transform:translate(-50%,-50%)">' + 
         '<div style="position:absolute;top:9px;left:0;right:0;height:2px;background:rgba(255,255,255,.9)"></div>' + 
         '<div style="position:absolute;left:9px;top:0;bottom:0;width:2px;background:rgba(255,255,255,.9)"></div>' + 
       '</div>'; 
 
     // Info bar 
     var info = document.createElement('div'); 
     info.id = 'wt-info'; 
     info.style.cssText = 'position:absolute;bottom:20px;left:0;right:0;text-align:center;color:#fff;font-size:13px;font-family:sans-serif;text-shadow:0 1px 4px rgba(0,0,0,.9);'; 
     info.textContent = 'Click the room to start  |  W A S D to walk  |  ESC to exit'; 
     hud.appendChild(info); 
 
     // Exit button 
     var ex = document.createElement('button'); 
     ex.style.cssText = 'position:absolute;top:14px;right:14px;padding:8px 18px;background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.5);border-radius:8px;color:#fff;font-size:13px;cursor:pointer;pointer-events:auto;'; 
     ex.textContent = 'Exit Walkthrough'; 
     ex.addEventListener('click', exit); 
     hud.appendChild(ex); 
 
     document.body.appendChild(hud); 
   } 
 
   // ── Enter ────────────────────────────────────────────────────────────────── 
   function enter() { 
     if (active) return; 
 
     if (!window.bp3d) { 
       alert('App not ready. Add   window.bp3d = blueprint3d;   in example.js after blueprint3d is created.'); 
       return; 
     } 
 
     // Make sure we are in the 3D viewer 
     var viewer = document.getElementById('viewer'); 
     if (!viewer || viewer.style.display === 'none') { 
       alert('Switch to the Design (3D) tab first, then click Walk Through.'); 
       return; 
     } 
 
     buildHUD(); 
 
     var three  = window.bp3d.three; 
     var fp     = window.bp3d.model.floorplan; 
 
     // ── Get the real camera blueprint3d is using ─────────────────────────── 
     var mainCam = three.getCamera(); 
 
     // Save full camera state 
     savedCamera = { 
       px: mainCam.position.x, 
       py: mainCam.position.y, 
       pz: mainCam.position.z, 
       rx: mainCam.rotation.x, 
       ry: mainCam.rotation.y, 
       rz: mainCam.rotation.z, 
       order: mainCam.rotation.order, 
       fov:   mainCam.fov, 
       near:  mainCam.near 
     }; 
 
     // ── Reposition the SAME camera to eye level ──────────────────────────── 
     // We don't create a new camera — we move the existing one. 
     // Blueprint3d's render loop will then render from our position. 
     var center = fp.getCenter(); 
 
     mainCam.position.set(center.x, HEIGHT, center.z); 
     mainCam.near = 1; 
     mainCam.fov  = 75; 
     mainCam.updateProjectionMatrix(); 
 
     yaw   = 0; 
     pitch = 0; 
     mainCam.rotation.order = 'YXZ'; 
     mainCam.rotation.set(pitch, yaw, 0); 
 
     // Disable blueprint3d's orbit controls so they don't fight us 
     three.controls.enabled = false; 
 
     active   = true; 
     lastTime = performance.now(); 
 
     // Find the User (3D) model to make it follow the camera
     userModel = null;
     var items = window.bp3d.model.scene.getItems();
     for (var i = 0; i < items.length; i++) {
       if (items[i].metadata.itemName === "User (3D)") {
         userModel = items[i];
         break;
       }
     }

     document.getElementById('wt-hud').style.display = 'block'; 
 
     // ── Lock pointer to the viewer div ───────────────────────────────────── 
     var viewerCanvas = document.querySelector('#viewer canvas'); 
     if (viewerCanvas) { 
       viewerCanvas.addEventListener('click', lockPointer); 
     } 
     document.addEventListener('pointerlockchange',    onLockChange); 
     document.addEventListener('mozpointerlockchange', onLockChange); 
     document.addEventListener('mousemove', onMouseMove); 
     document.addEventListener('keydown',   onKeyDown); 
     document.addEventListener('keyup',     onKeyUp); 
 
     // ── Our update loop — runs alongside blueprint3d's render loop ───────── 
     // blueprint3d renders on its own timer (~20ms). We just update the camera 
     // position here and tell it needsUpdate so it re-renders. 
     function loop(now) { 
       if (!active) return; 
       rafId = requestAnimationFrame(loop); 
 
       var dt = Math.min((now - lastTime) / 1000, 0.1); 
       lastTime = now; 
 
       if (pointerLocked) { 
         moveCamera(dt, mainCam); 
         
         // Sync user model position for mirrors
         if (userModel) {
           userModel.position.x = mainCam.position.x;
           userModel.position.z = mainCam.position.z;
           userModel.rotation.y = yaw; // face the direction of camera
         }

         three.needsUpdate(); 
       } 
     } 
     rafId = requestAnimationFrame(loop); 
   } 
 
   // ── Exit ─────────────────────────────────────────────────────────────────── 
   function exit() { 
     if (!active) return; 
     active        = false; 
     pointerLocked = false; 
 
     if (rafId) { cancelAnimationFrame(rafId); rafId = null; } 
 
     // Restore camera to original position 
     if (window.bp3d && savedCamera) { 
       var cam = window.bp3d.three.getCamera(); 
       cam.position.set(savedCamera.px, savedCamera.py, savedCamera.pz); 
       cam.rotation.order = savedCamera.order; 
       cam.rotation.set(savedCamera.rx, savedCamera.ry, savedCamera.rz); 
       cam.fov  = savedCamera.fov; 
       cam.near = savedCamera.near; 
       cam.updateProjectionMatrix(); 
 
       // Re-enable orbit controls 
       window.bp3d.three.controls.enabled = true; 
       window.bp3d.three.needsUpdate(); 
       window.bp3d.three.centerCamera(); 
     } 
 
     // Cleanup events 
     var vc = document.querySelector('#viewer canvas'); 
     if (vc) vc.removeEventListener('click', lockPointer); 
     document.removeEventListener('pointerlockchange',    onLockChange); 
     document.removeEventListener('mozpointerlockchange', onLockChange); 
     document.removeEventListener('mousemove', onMouseMove); 
     document.removeEventListener('keydown',   onKeyDown); 
     document.removeEventListener('keyup',     onKeyUp); 
 
     if (document.exitPointerLock)    document.exitPointerLock(); 
     if (document.mozExitPointerLock) document.mozExitPointerLock(); 
 
     Object.keys(keys).forEach(function (k) { keys[k] = false; }); 
 
     var hud = document.getElementById('wt-hud'); 
     if (hud) hud.style.display = 'none'; 
   } 
 
   // ── Pointer lock ─────────────────────────────────────────────────────────── 
   function lockPointer() { 
     var vc = document.querySelector('#viewer canvas'); 
     if (!vc) return; 
     var req = vc.requestPointerLock || vc.mozRequestPointerLock; 
     if (req) req.call(vc); 
   } 
 
   function onLockChange() { 
     var vc = document.querySelector('#viewer canvas'); 
     pointerLocked = ( 
       document.pointerLockElement    === vc || 
       document.mozPointerLockElement === vc 
     ); 
     var info = document.getElementById('wt-info'); 
     if (info) { 
       info.textContent = pointerLocked 
         ? 'W A S D to walk  |  Mouse to look  |  ESC to exit' 
         : 'Click the room to capture mouse and walk'; 
     } 
   } 
 
   // ── Mouse look ───────────────────────────────────────────────────────────── 
   function onMouseMove(e) { 
     if (!pointerLocked || !window.bp3d) return; 
     yaw   -= e.movementX * SENS; 
     pitch -= e.movementY * SENS; 
     pitch  = Math.max(-1.2, Math.min(1.2, pitch)); 
     var cam = window.bp3d.three.getCamera(); 
     cam.rotation.order = 'YXZ'; 
     cam.rotation.set(pitch, yaw, 0); 
     window.bp3d.three.needsUpdate(); 
   } 
 
   // ── Keys ─────────────────────────────────────────────────────────────────── 
   function onKeyDown(e) { 
     if (e.key === 'Escape') { exit(); return; } 
     if (keys.hasOwnProperty(e.key)) { keys[e.key] = true; e.preventDefault(); } 
   } 
   function onKeyUp(e) { 
     if (keys.hasOwnProperty(e.key)) keys[e.key] = false; 
   } 
 
   // ── Movement ─────────────────────────────────────────────────────────────── 
   function moveCamera(dt, cam) { 
     var fwd  = keys.w || keys.ArrowUp; 
     var back = keys.s || keys.ArrowDown; 
     var lft  = keys.a || keys.ArrowLeft; 
     var rgt  = keys.d || keys.ArrowRight; 
     if (!fwd && !back && !lft && !rgt) return; 
 
     var sinY = Math.sin(yaw), cosY = Math.cos(yaw); 
     var dx = 0, dz = 0; 
     if (fwd)  { dx -= sinY; dz -= cosY; } 
     if (back) { dx += sinY; dz += cosY; } 
     if (lft)  { dx -= cosY; dz += sinY; } 
     if (rgt)  { dx += cosY; dz -= sinY; } 
 
     var len = Math.sqrt(dx*dx + dz*dz); 
     if (len > 0) { dx /= len; dz /= len; } 
 
     cam.position.x += dx * SPEED * dt; 
     cam.position.z += dz * SPEED * dt; 
     cam.position.y  = HEIGHT; 
   } 
 
   // ── Init ─────────────────────────────────────────────────────────────────── 
   if (document.readyState === 'loading') { 
     document.addEventListener('DOMContentLoaded', injectButton); 
   } else { 
     injectButton(); 
   } 
 
 })(); 
