/**
 * CDN / subpath base for relative asset URLs. Set via:
 *   <meta name="blueprint-asset-base" content="https://cdn.example.com/myapp/">
 * or window.BLUEPRINT_ASSET_BASE before scripts load.
 * Patches THREE loaders so models and wall/floor textures resolve under the base.
 */
(function () {
  function normalizeBase(b) {
    if (!b || typeof b !== "string") return "";
    return b.replace(/\/?$/, "/");
  }

  function readBaseFromMeta() {
    var el = document.querySelector('meta[name="blueprint-asset-base"]');
    if (!el) return "";
    var c = el.getAttribute("content");
    return c ? normalizeBase(c.trim()) : "";
  }

  function getAssetBase() {
    var fromMeta = readBaseFromMeta();
    if (fromMeta) return fromMeta;
    if (typeof window.BLUEPRINT_ASSET_BASE === "string" && window.BLUEPRINT_ASSET_BASE) {
      return normalizeBase(window.BLUEPRINT_ASSET_BASE.trim());
    }
    return "";
  }

  function resolveAssetUrl(url) {
    if (url == null || url === "") return url;
    var u = typeof url === "string" ? url : String(url);
    if (/^https?:\/\//i.test(u) || u.indexOf("//") === 0) return u;
    var base = getAssetBase();
    if (!base) {
      return u;
    }
    var rel = u.charAt(0) === "/" ? u.slice(1) : u;
    return base + rel;
  }

  window.BLUEPRINT_getAssetBase = getAssetBase;
  window.BLUEPRINT_resolveAssetUrl = resolveAssetUrl;

  if (typeof THREE === "undefined") return;

  if (THREE.JSONLoader && THREE.JSONLoader.prototype.load) {
    var jl = THREE.JSONLoader.prototype.load;
    THREE.JSONLoader.prototype.load = function (url, onLoad, onProgress) {
      return jl.call(this, resolveAssetUrl(url), onLoad, onProgress);
    };
  }

  if (THREE.TextureLoader && THREE.TextureLoader.prototype.load) {
    var tl = THREE.TextureLoader.prototype.load;
    THREE.TextureLoader.prototype.load = function (url, onLoad, onProgress, onError) {
      return tl.call(this, resolveAssetUrl(url), onLoad, onProgress, onError);
    };
  }
})();
