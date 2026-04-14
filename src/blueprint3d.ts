/// <reference path="core/assets.ts" />
/// <reference path="model/model.ts" />
/// <reference path="floorplanner/floorplanner.ts" />
/// <reference path="three/main.ts" />

namespace BP3D {
  /** Startup options. */
  export interface Options {
    /** */
    widget?: boolean;

    /** */
    threeElement?: string;

    /** */
    threeCanvasElement? : string;

    /** */
    floorplannerElement?: string;

    /**
     * Optional origin for all relative asset URLs (e.g. CDN URL including path prefix).
     * Example: https://cdn.example.com/app/ — models/textures/foo.png becomes absolute under that base.
     */
    assetBase?: string;

    /** The texture directory. */
    textureDir?: string;
  }

  /** Blueprint3D core application. */
  export class Blueprint3d {

    private model: Model.Model;

    private three: any; // Three.Main;

    private floorplanner: Floorplanner.Floorplanner | undefined;

    /** Creates an instance.
     * @param options The initialization options.
     */
    constructor(options: Options) {
      if (options.assetBase !== undefined && options.assetBase !== null && options.assetBase !== "") {
        Core.Assets.configureAssetBase(options.assetBase);
      }
      var textureDir = Core.Assets.resolveAssetUrl(options.textureDir || "models/textures/");
      this.model = new Model.Model(textureDir);
      this.three = new Three.Main(this.model, options.threeElement, options.threeCanvasElement, {});

      if (!options.widget) {
        this.floorplanner = new Floorplanner.Floorplanner(options.floorplannerElement || "", this.model);
      }
      else {
        this.three.getController().enabled = false;
      }
    }
  }
}
