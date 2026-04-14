// vr-mode.js — WebXR VR Mode for Blueprint3D
// Handles entering VR sessions, stereo rendering, and camera tracking for VR headsets.

(function () {
  'use strict';

  function VRMode(blueprint3d) {
    this.blueprint3d = blueprint3d;
    this.three = blueprint3d.three;
    this.renderer = this.three.getRenderer ? this.three.getRenderer() : this.three.renderer;
    this.camera = this.three.getCamera ? this.three.getCamera() : this.three.camera;
    this.scene = this.three.getScene ? this.three.getScene().getScene() : null;
    
    this.session = null;
    this.supported = false;
    this._supportChecked = false;
    
    this._saved = {
      controlsEnabled: true,
      autoClear: true
    };

    this._onSessionStarted = this._onSessionStarted.bind(this);
    this._onSessionEnded = this._onSessionEnded.bind(this);
    this._onXRFrame = this._onXRFrame.bind(this);
  }

  VRMode.prototype.checkSupport = function (callback) {
    var self = this;
    if (!navigator.xr) {
      callback(false);
      return;
    }
    navigator.xr.isSessionSupported('immersive-vr').then(function (supported) {
      self.supported = supported;
      self._supportChecked = true;
      callback(supported);
    }).catch(function () {
      self.supported = false;
      self._supportChecked = true;
      callback(false);
    });
  };

  VRMode.prototype.toggle = function () {
    if (this.session) {
      this.stop();
    } else {
      this.start();
    }
  };

  VRMode.prototype.start = function () {
    var self = this;
    if (!navigator.xr || this.session) return;

    var sessionInit = { optionalFeatures: ['local-floor', 'bounded-floor'] };
    navigator.xr.requestSession('immersive-vr', sessionInit).then(this._onSessionStarted).catch(function(e) {
      console.error("VR Session failed:", e);
      alert("Could not start VR session. Make sure your VR headset is connected.");
    });
  };

  VRMode.prototype._onSessionStarted = function (session) {
    var self = this;
    this.session = session;
    session.addEventListener('end', this._onSessionEnded);

    // Save state
    if (this.three.controls) {
      this._saved.controlsEnabled = this.three.controls.enabled;
      this.three.controls.enabled = false;
    }
    this._saved.autoClear = this.renderer.autoClear;

    // Configure renderer for XR
    var gl = this.renderer.getContext();
    if (gl.makeXRCompatible) {
      gl.makeXRCompatible().then(function() {
        self.renderer.xr.setSession(session);
        self.renderer.xr.enabled = true;
      });
    } else {
      this.renderer.xr.setSession(session);
      this.renderer.xr.enabled = true;
    }

    // Adjust camera for VR eye level if needed
    // Blueprint3D scale is usually 1 unit = 1cm, WebXR is 1 unit = 1m
    // We might need to scale the camera/scene if not already handled
    
    this.renderer.setAnimationLoop(this._onXRFrame);
    
    var btn = document.getElementById('enter-vr');
    if (btn) btn.innerHTML = '<span class="glyphicon glyphicon-eye-close"></span> Exit VR';
  };

  VRMode.prototype.stop = function () {
    if (this.session) {
      this.session.end();
    }
  };

  VRMode.prototype._onSessionEnded = function () {
    this.session = null;
    this.renderer.xr.enabled = false;
    this.renderer.setAnimationLoop(null);
    
    if (this.three.controls) {
      this.three.controls.enabled = this._saved.controlsEnabled;
    }
    this.renderer.autoClear = this._saved.autoClear;

    if (this.three.updateWindowSize) {
      this.three.updateWindowSize();
    }

    var btn = document.getElementById('enter-vr');
    if (btn) btn.innerHTML = '<span class="glyphicon glyphicon-sunglasses"></span> View in VR';
  };

  VRMode.prototype._onXRFrame = function (time, frame) {
    // Three.js handles the XR rendering loop when renderer.xr.enabled is true
    this.renderer.render(this.scene, this.camera);
  };

  window.initBlueprintVR = function (blueprint3d) {
    var vrBtn = document.getElementById('enter-vr');
    if (!vrBtn || !blueprint3d) return;

    var mode = new VRMode(blueprint3d);
    
    mode.checkSupport(function(supported) {
      if (supported) {
        vrBtn.style.display = 'inline-block';
      } else {
        // Fallback for cardboard/mobile VR if WebXR not fully supported
        vrBtn.style.display = 'inline-block';
        vrBtn.title = "WebXR not detected. Mobile VR mode may be limited.";
      }
    });

    vrBtn.addEventListener('click', function(e) {
      e.preventDefault();
      mode.toggle();
    });

    return mode;
  };

})();
