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
   * @param {string} [opts.previewDataUrl] - 3D preview image data
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
      var previewData = opts.previewDataUrl;

      var pdf = new JsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait"
      });

      var pageW = pdf.internal.pageSize.getWidth();
      var pageH = pdf.internal.pageSize.getHeight();
      var margin = 12;
      var currentY = margin;

      // Add Floor Name
      pdf.setFontSize(18);
      pdf.text(opts.floorName || "Floorplan", margin, currentY + 10);
      currentY += 20;

      // Add 2D Blueprint
      var props = pdf.getImageProperties(imgData);
      var iw = props.width;
      var ih = props.height;
      var maxW = pageW - 2 * margin;
      var maxH = (pageH - 2 * margin - 30) / (previewData ? 2 : 1);
      var ratio = Math.min(maxW / iw, maxH / ih);
      var w = iw * ratio;
      var h = ih * ratio;
      var x = (pageW - w) / 2;
      pdf.addImage(imgData, "PNG", x, currentY, w, h);
      currentY += h + 10;

      // Add 3D Preview if available
      if (previewData && previewData !== "data:,") {
        var pProps = pdf.getImageProperties(previewData);
        var piw = pProps.width;
        var pih = pProps.height;
        var pRatio = Math.min(maxW / piw, maxH / pih);
        var pw = piw * pRatio;
        var ph = pih * pRatio;
        var px = (pageW - pw) / 2;

        // If it doesn't fit on the same page, add a new page
        if (currentY + ph + 20 > pageH - margin) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0); // Ensure black text
        pdf.text("3D Preview View", margin, currentY + 10);
        currentY += 15;
        
        // Use JPEG for the 3D preview to save space and potentially avoid transparency issues
        pdf.addImage(previewData, "PNG", px, currentY, pw, ph, undefined, 'FAST');
      }

      pdf.save(safeFilename(opts.floorName) + "-blueprint.pdf");
    } catch (e) {
      window.console.error("floorplan PDF export:", e);
      window.alert("Could not create PDF: " + (e && e.message ? e.message : String(e)));
    }
  }

  window.exportFloorplanCanvasToPdf = exportFloorplanCanvasToPdf;
})(window);
