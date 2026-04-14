/**
 * PWA: register service worker, persist last design for offline reopen.
 */
(function () {
  var STORAGE_KEY = "blueprint3d.lastDesign.v1";
  var IDB_NAME = "blueprint3d-pwa";
  var IDB_VER = 1;
  var IDB_STORE = "kv";

  function openIdb() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(IDB_NAME, IDB_VER);
      req.onupgradeneeded = function () {
        req.result.createObjectStore(IDB_STORE);
      };
      req.onsuccess = function () {
        resolve(req.result);
      };
      req.onerror = function () {
        reject(req.error);
      };
    });
  }

  function idbGet(key) {
    return openIdb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(IDB_STORE, "readonly");
        var st = tx.objectStore(IDB_STORE);
        var g = st.get(key);
        g.onsuccess = function () {
          resolve(g.result);
        };
        g.onerror = function () {
          reject(g.error);
        };
      });
    });
  }

  function idbPut(key, value) {
    return openIdb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(IDB_STORE, "readwrite");
        tx.objectStore(IDB_STORE).put(value, key);
        tx.oncomplete = function () {
          resolve();
        };
        tx.onerror = function () {
          reject(tx.error);
        };
      });
    });
  }

  function saveLastDesign(json) {
    if (typeof json !== "string") return Promise.resolve();
    try {
      localStorage.setItem(STORAGE_KEY, json);
      return Promise.resolve();
    } catch (e) {
      return idbPut(STORAGE_KEY, json).catch(function () {});
    }
  }

  function loadLastDesign() {
    try {
      var s = localStorage.getItem(STORAGE_KEY);
      if (s) return Promise.resolve(s);
    } catch (e) {}
    return idbGet(STORAGE_KEY).then(function (v) {
      return v || null;
    });
  }

  function shouldPreferOfflineLastDesign() {
    return !navigator.onLine;
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("sw.js").catch(function (e) {
      console.warn("[PWA] Service worker registration failed:", e);
    });
  }

  window.BlueprintPWA = {
    register: registerServiceWorker,
    saveLastDesign: saveLastDesign,
    loadLastDesign: loadLastDesign,
    shouldPreferOfflineLastDesign: shouldPreferOfflineLastDesign
  };
})();
