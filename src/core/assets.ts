module BP3D.Core {
  /**
   * Optional CDN or subpath prefix for all relative asset URLs (models, textures).
   * Set via Blueprint3d options (assetBase) or configureAssetBase before loading.
   */
  export class Assets {
    private static base = "";

    /** Normalizes base to end with a single slash, or empty. */
    public static configureAssetBase(base: string) {
      Assets.base = Assets.normalizeBase(base || "");
    }

    public static getAssetBase(): string {
      return Assets.base;
    }

    private static normalizeBase(base: string): string {
      if (!base) {
        return "";
      }
      return base.replace(/\/?$/, "/");
    }

    /**
     * Prefixes relative paths with the configured asset base.
     * Absolute http(s) URLs and protocol-relative URLs are returned unchanged.
     */
    public static resolveAssetUrl(path: string): string {
      if (!path) {
        return path;
      }
      var p = path;
      if (/^https?:\/\//i.test(p) || p.indexOf("//") === 0) {
        return p;
      }
      if (p.charAt(0) === "/" && !Assets.base) {
        return p;
      }
      var rel = p.charAt(0) === "/" ? p.slice(1) : p;
      return Assets.base + rel;
    }
  }
}
