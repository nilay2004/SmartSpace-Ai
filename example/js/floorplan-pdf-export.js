/**
 * Export the 2D floorplan canvas (blueprint view only) to a downloadable PDF.
 * Depends on jsPDF (jspdf.umd) loaded on window.jspdf.jsPDF.
 */
(function (window) {
  function safeFilename(name) {
    var s = String(name || "Floorplan")
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 48);
    return s || "Floorplan";
  }

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} [opts]
   * @param {string} [opts.floorName] - used in download filename
   */
  function exportFloorplanCanvasToPdf(canvas, opts) {
    var JsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!JsPDF) {
      window.alert("PDF library not loaded. Check your network connection and reload.");
      return;
    }
    if (!canvas || !canvas.getContext) {
      window.alert("Floor plan canvas not found.");
      return;
    }

    opts = opts || {};
    try {
      var imgData = canvas.toDataURL("image/png");
      var orientation = canvas.width >= canvas.height ? "landscape" : "portrait";
      var pdf = new JsPDF({
        unit: "mm",
        format: "a4",
        orientation: orientation
      });
      var pageW = pdf.internal.pageSize.getWidth();
      var pageH = pdf.internal.pageSize.getHeight();
      var margin = 12;
      var props = pdf.getImageProperties(imgData);
      var iw = props.width;
      var ih = props.height;
      var ratio = Math.min((pageW - 2 * margin) / iw, (pageH - 2 * margin) / ih);
      var w = iw * ratio;
      var h = ih * ratio;
      var x = (pageW - w) / 2;
      var y = (pageH - h) / 2;
      pdf.addImage(imgData, "PNG", x, y, w, h);
      pdf.save(safeFilename(opts.floorName) + "-blueprint.pdf");
    } catch (e) {
      window.console.error("floorplan PDF export:", e);
      window.alert("Could not create PDF: " + (e && e.message ? e.message : String(e)));
    }
  }

  window.exportFloorplanCanvasToPdf = exportFloorplanCanvasToPdf;
})(window);
