/// <reference path="../../lib/three.d.ts" />
/// <reference path="main.ts" />

namespace BP3D.Three {
  /**
   * World-class AR controller that:
   * - Uses WebXR immersive-ar when available (mobile / AR hardware).
   * - Falls back to a full-screen camera overlay + 3D on laptops/desktops.
   *
   * This class is framework-agnostic; it only needs a Three.Main instance
   * and an "AR" trigger element (e.g. a button) in the DOM.
   */
  export class ARMode {
    private readonly three: Three.Main;
    private readonly renderer: THREE.WebGLRenderer;
    private readonly camera: THREE.PerspectiveCamera;
    private readonly scene: Model.Scene;

    // WebXR state
    private xrSession: XRSession | null = null;
    private xrRefSpace: XRReferenceSpace | null = null;
    private xrViewerSpace: XRReferenceSpace | null = null;
    private xrHitTestSource: XRHitTestSource | null = null;

    // Camera-overlay state
    private cameraOverlayActive = false;
    private cameraStream: MediaStream | null = null;
    private originalCanvasParent: Node | null = null;
    private originalCanvasSibling: Node | null = null;

    private savedControlsEnabled: boolean | null = null;
    private savedAutoClear: boolean;
    private savedCameraMatrixAutoUpdate: boolean;

    constructor(three: Three.Main) {
      this.three = three;
      this.renderer = three.getRenderer();
      this.camera = three.getCamera();
      this.scene = three.getScene();

      this.savedAutoClear = this.renderer.autoClear;
      this.savedCameraMatrixAutoUpdate = this.camera.matrixAutoUpdate;

      this.onXRFrame = this.onXRFrame.bind(this);
      this.onXRSessionEnd = this.onXRSessionEnd.bind(this);
    }

    /** True when any AR mode (WebXR or camera overlay) is active. */
    public isActive(): boolean {
      return !!this.xrSession || this.cameraOverlayActive;
    }

    /** Entry point: prefers WebXR AR, falls back to camera-based AR. */
    public async start(): Promise<void> {
      if (this.isActive()) {
        return;
      }

      // Prefer real WebXR if available.
      const xr = (navigator as any).xr as XRSystem | undefined;
      if (xr && typeof xr.isSessionSupported === "function") {
        try {
          const supported = await xr.isSessionSupported("immersive-ar");
          if (supported) {
            await this.startWebXR(xr);
            return;
          }
        } catch {
          // Ignore and fall back.
        }
      }

      await this.startCameraOverlay();
    }

    /** Stops whichever AR mode is active. */
    public stop(): void {
      if (this.xrSession) {
        try {
          this.xrSession.end();
        } catch {
          // ignore
        }
      }
      this.stopCameraOverlay();
      this.cleanupCommon();
    }

    // ----------------------
    // WebXR immersive AR
    // ----------------------

    private async startWebXR(xr: XRSystem): Promise<void> {
      if (this.xrSession) {
        return;
      }

      try {
        const session = await xr.requestSession("immersive-ar", {
          requiredFeatures: ["hit-test", "local-floor"],
        } as any);

        this.xrSession = session;

        const anyControls: any = (this.three as any).controls;
        if (anyControls && typeof anyControls.enabled === "boolean") {
          this.savedControlsEnabled = anyControls.enabled;
          anyControls.enabled = false;
        }

        this.savedAutoClear = this.renderer.autoClear;
        this.savedCameraMatrixAutoUpdate = this.camera.matrixAutoUpdate;
        this.camera.matrixAutoUpdate = false;

        const gl = this.renderer.getContext();
        if ((gl as any).makeXRCompatible) {
          await (gl as any).makeXRCompatible();
        }

        const XRWebGLLayerCtor = (window as any).XRWebGLLayer;
        if (XRWebGLLayerCtor) {
          const layer = new XRWebGLLayerCtor(session, gl);
          session.updateRenderState({ baseLayer: layer });
        }

        session.addEventListener("end", this.onXRSessionEnd);

        this.xrRefSpace = await session.requestReferenceSpace("local-floor");
        this.xrViewerSpace = await session.requestReferenceSpace("viewer");

        if ((session as any).requestHitTestSource && this.xrViewerSpace) {
          this.xrHitTestSource = await (session as any).requestHitTestSource({
            space: this.xrViewerSpace,
          });
        }

        session.requestAnimationFrame(this.onXRFrame);
      } catch (e) {
        alert(
          "Failed to start immersive AR. Your current browser or device may not fully support WebXR AR."
        );
        this.stop();
      }
    }

    private onXRSessionEnd(): void {
      this.xrSession = null;
      this.xrRefSpace = null;
      this.xrViewerSpace = null;
      this.xrHitTestSource = null;
      this.cleanupCommon();
    }

    private onXRFrame(time: number, frame: XRFrame): void {
      const session = frame.session;
      if (!this.xrSession || session !== this.xrSession || !this.xrRefSpace) {
        return;
      }

      session.requestAnimationFrame(this.onXRFrame);

      const pose = frame.getViewerPose(this.xrRefSpace);
      if (!pose) {
        return;
      }

      const glLayer = session.renderState.baseLayer;
      if (!glLayer) {
        return;
      }

      const gl = this.renderer.getContext();
      gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);

      const view = pose.views[0];
      const viewport = glLayer.getViewport(view);
      if (viewport) {
        this.renderer.setSize(viewport.width, viewport.height, false);
        this.renderer.setViewport(
          viewport.x,
          viewport.y,
          viewport.width,
          viewport.height
        );
      }

      if (view.projectionMatrix) {
        this.camera.projectionMatrix.fromArray(view.projectionMatrix as any);
      }

      if ((view as any).transform && (view as any).transform.matrix) {
        const viewMatrix = new THREE.Matrix4();
        viewMatrix.fromArray((view as any).transform.matrix);
        const cameraMatrix = new THREE.Matrix4();
        cameraMatrix.getInverse(viewMatrix);
        this.camera.matrix.copy(cameraMatrix);
        this.camera.matrix.decompose(
          this.camera.position,
          this.camera.quaternion,
          this.camera.scale
        );
        this.camera.updateMatrixWorld(true);
      }

      if (this.xrHitTestSource && (frame as any).getHitTestResults) {
        const hits: XRHitTestResult[] = (frame as any).getHitTestResults(
          this.xrHitTestSource
        );
        if (hits && hits.length > 0 && this.scene) {
          const hit = hits[0];
          const pose = hit.getPose(this.xrRefSpace);
          if (pose && (pose as any).transform) {
            const t: any = (pose as any).transform;
            const pos = t.position || { x: 0, y: 0, z: -1 };
            (this.scene.getScene() as any).position.set(
              pos.x,
              pos.y,
              pos.z
            );
            if (t.orientation) {
              (this.scene.getScene() as any).quaternion.set(
                t.orientation.x,
                t.orientation.y,
                t.orientation.z,
                t.orientation.w
              );
            }
          }
        }
      }

      this.renderer.autoClear = true;
      this.renderer.render(this.scene.getScene(), this.camera);
    }

    // ----------------------
    // Camera-overlay AR
    // ----------------------

    private async startCameraOverlay(): Promise<void> {
      if (this.cameraOverlayActive) {
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert(
          "Camera-based AR view needs webcam access, which is not available in this browser."
        );
        return;
      }

      this.cameraOverlayActive = true;

      let overlay = document.getElementById("ar-overlay");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "ar-overlay";
        overlay.style.position = "fixed";
        overlay.style.left = "0";
        overlay.style.top = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.zIndex = "2000";
        overlay.style.backgroundColor = "#000";
        overlay.style.overflow = "hidden";

        const video = document.createElement("video");
        video.id = "ar-video";
        video.style.position = "absolute";
        video.style.top = "0";
        video.style.left = "0";
        video.style.width = "100%";
        video.style.height = "100%";
        video.style.objectFit = "cover";
        video.setAttribute("playsinline", "true");
        video.autoplay = true;
        overlay.appendChild(video);

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "Exit AR";
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "16px";
        closeBtn.style.right = "20px";
        closeBtn.className = "btn btn-default";
        closeBtn.onclick = () => this.stopCameraOverlay();
        overlay.appendChild(closeBtn);

        document.body.appendChild(overlay);
      } else {
        overlay.style.display = "block";
      }

      const videoEl = document.getElementById("ar-video") as HTMLVideoElement;

      // Move renderer canvas into overlay so 3D aligns visually with camera feed.
      const canvas = this.renderer.domElement;
      if (!this.originalCanvasParent) {
        this.originalCanvasParent = canvas.parentNode;
        this.originalCanvasSibling = canvas.nextSibling;
      }
      overlay!.appendChild(canvas);

      this.renderer.setSize(window.innerWidth, window.innerHeight, false);
      (this.camera as any).aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" as any },
          audio: false,
        });
        this.cameraStream = stream;
        if ("srcObject" in videoEl) {
          (videoEl as any).srcObject = stream;
        } else if (window.URL && window.URL.createObjectURL) {
          videoEl.src = window.URL.createObjectURL(stream);
        }
        await videoEl.play();
      } catch {
        alert(
          "Could not start webcam for AR view. Please allow camera permission or try a different browser."
        );
        this.stopCameraOverlay();
      }
    }

    private stopCameraOverlay(): void {
      this.cameraOverlayActive = false;

      const overlay = document.getElementById("ar-overlay");
      if (overlay) {
        overlay.style.display = "none";
      }

      if (this.cameraStream) {
        this.cameraStream.getTracks().forEach((t) => t.stop());
        this.cameraStream = null;
      }

      const canvas = this.renderer.domElement;
      if (this.originalCanvasParent) {
        if (
          this.originalCanvasSibling &&
          this.originalCanvasSibling.parentNode === this.originalCanvasParent
        ) {
          this.originalCanvasParent.insertBefore(
            canvas,
            this.originalCanvasSibling
          );
        } else {
          this.originalCanvasParent.appendChild(canvas);
        }
      }

      if ((this.three as any).updateWindowSize) {
        (this.three as any).updateWindowSize();
      }
    }

    // ----------------------
    // Common cleanup
    // ----------------------

    private cleanupCommon(): void {
      const anyControls: any = (this.three as any).controls;
      if (
        anyControls &&
        typeof this.savedControlsEnabled === "boolean"
      ) {
        anyControls.enabled = this.savedControlsEnabled;
      }

      this.renderer.autoClear = this.savedAutoClear;
      this.camera.matrixAutoUpdate = this.savedCameraMatrixAutoUpdate;
      this.camera.updateProjectionMatrix();
    }

    /**
     * Helper to bind AR behavior to a button element.
     * Call this from your app bootstrap code.
     */
    public static attachToButton(
      three: Three.Main,
      button: HTMLElement
    ): ARMode {
      const mode = new ARMode(three);
      button.style.display = "inline-block";
      button.addEventListener("click", (e) => {
        e.preventDefault();
        if (mode.isActive()) {
          mode.stop();
        } else {
          void mode.start();
        }
      });
      return mode;
    }
  }
}

