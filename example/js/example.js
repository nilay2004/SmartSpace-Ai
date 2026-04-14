
/*
 * Camera Buttons
 */

var CameraButtons = function(blueprint3d) {

  var orbitControls = blueprint3d.three.controls;
  var three = blueprint3d.three;

  var panSpeed = 30;
  var directions = {
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4
  }

  function init() {
    // Camera controls
    $("#zoom-in").click(zoomIn);
    $("#zoom-out").click(zoomOut);  
    $("#zoom-in").dblclick(preventDefault);
    $("#zoom-out").dblclick(preventDefault);

    $("#reset-view").click(three.centerCamera)

    $("#move-left").click(function(){
      pan(directions.LEFT)
    })
    $("#move-right").click(function(){
      pan(directions.RIGHT)
    })
    $("#move-up").click(function(){
      pan(directions.UP)
    })
    $("#move-down").click(function(){
      pan(directions.DOWN)
    })

    $("#move-left").dblclick(preventDefault);
    $("#move-right").dblclick(preventDefault);
    $("#move-up").dblclick(preventDefault);
    $("#move-down").dblclick(preventDefault);
  }

  function preventDefault(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function pan(direction) {
    switch (direction) {
      case directions.UP:
        orbitControls.panXY(0, panSpeed);
        break;
      case directions.DOWN:
        orbitControls.panXY(0, -panSpeed);
        break;
      case directions.LEFT:
        orbitControls.panXY(panSpeed, 0);
        break;
      case directions.RIGHT:
        orbitControls.panXY(-panSpeed, 0);
        break;
    }
  }

  function zoomIn(e) {
    e.preventDefault();
    orbitControls.dollyIn(1.1);
    orbitControls.update();
  }

  function zoomOut(e) {
    e.preventDefault();
    orbitControls.dollyOut(1.1);
    orbitControls.update();
  }

  init();
}

/*
 * High-quality render export
 */
var RenderExport = function(blueprint3d) {
  function downloadDataUrl(dataUrl, filename) {
    var a = window.document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function init() {
    $("#renderPng").click(function(e) {
      e.preventDefault();
      var scale = parseInt(window.prompt("Render scale (1, 2, 4)", "2"), 10);
      if (!scale || scale < 1) scale = 1;
      if (scale > 4) scale = 4;
      var dataUrl = (blueprint3d.three.renderToDataUrl)
        ? blueprint3d.three.renderToDataUrl(scale)
        : blueprint3d.three.dataUrl();
      downloadDataUrl(dataUrl, "render.png");
    });
  }

  init();
}

/*
 * Context menu for selected item
 */ 

var ContextMenu = function(blueprint3d) {

  var scope = this;
  var selectedItem;
  var three = blueprint3d.three;

  function init() {
    $("#context-menu-delete").click(function(event) {
        selectedItem.remove();
    });

    three.itemSelectedCallbacks.add(itemSelected);
    three.itemUnselectedCallbacks.add(itemUnselected);

    initResize();

    $("#fixed").click(function() {
        var checked = $(this).prop('checked');
        selectedItem.setFixed(checked);
    });

    // Color picker events
    $("#item-color-picker").on("input change", function() {
        var color = $(this).val();
        $("#item-color-label").text(color);
        if (selectedItem) {
            updateItemColor(selectedItem, color);
        }
    });

    $(".color-preset").on("click", function() {
        var color = $(this).css("background-color");
        // Convert rgb to hex
        var hex = rgbToHex(color);
        $("#item-color-picker").val(hex).trigger("change");
    });
  }

  function rgbToHex(rgb) {
    if (rgb.startsWith("#")) return rgb;
    var match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return "#ffffff";
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(match[1]) + hex(match[2]) + hex(match[3]);
  }

  function updateItemColor(item, colorHex) {
    var color = new THREE.Color(colorHex);
    item.traverse(function(child) {
        if (child instanceof THREE.Mesh) {
            if (child.material) {
                var materials = [];
                if (Array.isArray(child.material)) {
                    materials = child.material;
                } else if (child.material.materials && Array.isArray(child.material.materials)) {
                    materials = child.material.materials;
                } else {
                    materials = [child.material];
                }

                materials.forEach(function(mat) {
                    if (mat.color) {
                        mat.color.copy(color);
                    }
                    // For baked models, remove the texture map so the solid color is applied properly
                    // rather than just tinting the original texture.
                    if (mat.map) {
                        mat.map = null;
                    }
                    mat.needsUpdate = true;
                });
            }
        }
    });
    // Ensure the 3D view renders the change
    if (blueprint3d && blueprint3d.three) {
        blueprint3d.three.setNeedsUpdate();
    }
  }

  function cmToIn(cm) {
    return cm / 2.54;
  }

  function inToCm(inches) {
    return inches * 2.54;
  }

  function itemSelected(item) {
    selectedItem = item;

    $("#context-menu-name").text(item.metadata.itemName);

    $("#item-width").val(cmToIn(selectedItem.getWidth()).toFixed(0));
    $("#item-height").val(cmToIn(selectedItem.getHeight()).toFixed(0));
    $("#item-depth").val(cmToIn(selectedItem.getDepth()).toFixed(0));

    $("#context-menu").show();

    $("#fixed").prop('checked', item.fixed);

    // Show color section for sofas/chairs
    var name = (item.metadata.itemName || "").toLowerCase();
    if (name.indexOf("sofa") !== -1 || name.indexOf("chair") !== -1 || name.indexOf("sectional") !== -1) {
        $("#item-color-section").show();
        // Try to get current color
        item.traverse(function(child) {
            if (child instanceof THREE.Mesh && child.material) {
                var mat = Array.isArray(child.material) ? child.material[0] : child.material;
                if (mat && mat.color) {
                    var hex = "#" + mat.color.getHexString();
                    $("#item-color-picker").val(hex);
                    $("#item-color-label").text(hex);
                    return false; // break traverse
                }
            }
        });
    } else {
        $("#item-color-section").hide();
    }
  }

  function resize() {
    selectedItem.resize(
      inToCm($("#item-height").val()),
      inToCm($("#item-width").val()),
      inToCm($("#item-depth").val())
    );
  }

  function initResize() {
    $("#item-height").change(resize);
    $("#item-width").change(resize);
    $("#item-depth").change(resize);
  }

  function itemUnselected() {
    selectedItem = null;
    $("#context-menu").hide();
  }

  init();
}

/*
 * Loading modal for items
 */

var ModalEffects = function(blueprint3d) {

  var scope = this;
  var blueprint3d = blueprint3d;
  var itemsLoading = 0;

  this.setActiveItem = function(active) {
    itemSelected = active;
    update();
  }

  function update() {
    if (itemsLoading > 0) {
      $("#loading-modal").show();
    } else {
      $("#loading-modal").hide();
    }
  }

  function init() {
    blueprint3d.model.scene.itemLoadingCallbacks.add(function() {
      itemsLoading += 1;
      update();
    });

     blueprint3d.model.scene.itemLoadedCallbacks.add(function() {
      itemsLoading -= 1;
      update();
    });   

    update();
  }

  init();
}

/*
 * Side menu
 */

var SideMenu = function(blueprint3d, floorplanControls, modalEffects) {
  var blueprint3d = blueprint3d;
  var floorplanControls = floorplanControls;
  var modalEffects = modalEffects;

  var ACTIVE_CLASS = "active";

  var tabs = {
    "FLOORPLAN" : $("#floorplan_tab"),
    "FLOORS" : $("#floors_tab"),
    "SHOP" : $("#items_tab"),
    "DESIGN" : $("#design_tab")
  }

  var scope = this;
  this.stateChangeCallbacks = $.Callbacks();

  this.states = {
    "DEFAULT" : {
      "div" : $("#viewer"),
      "tab" : tabs.DESIGN
    },
    "FLOORPLAN" : {
      "div" : $("#floorplanner"),
      "tab" : tabs.FLOORPLAN
    },
    "FLOORS" : {
      "div" : $("#viewer"),
      "tab" : tabs.FLOORS
    },
    "SHOP" : {
      "div" : $("#add-items"),
      "tab" : tabs.SHOP
    }
  }

  // sidebar state
  var currentState = scope.states.FLOORPLAN;

  function newPlan() {
    blueprint3d.model.scene.clearItems();
    blueprint3d.model.floorplan.reset();
    setTimeout(function() {
      blueprint3d.model.loadSerialized(window.CUSTOM_LAYOUT);
    }, 100);
  }

  function loadDesign() {
    var files = $("#loadFile").get(0).files;
    if (!files || files.length === 0) return;
    
    var reader = new FileReader();
    reader.onload = function(event) {
        var data = event.target.result;
        try {
            // Parse JSON to check the format
            var parsedData = JSON.parse(data);
            
            // Check for valid format (must have either 'floors' or both 'floorplan' and 'items')
            var isValidFormat = (parsedData.floors && Array.isArray(parsedData.floors)) || 
                               (parsedData.floorplan && parsedData.items);
                               
            if (!isValidFormat) {
                throw new Error("The file format is not recognized as a valid Blueprint3D design.");
            }
            
            // Handle multi-floor format if the current model doesn't support it directly
            if (parsedData.floors && Array.isArray(parsedData.floors) && !blueprint3d.model.floors) {
                // If the model only supports a single floor, load the first one from the floors array
                var firstFloor = parsedData.floors[0];
                if (firstFloor) {
                    var singleFloorData = {
                        floorplan: firstFloor.floorplan,
                        items: firstFloor.items
                    };
                    blueprint3d.model.loadSerialized(JSON.stringify(singleFloorData));
                }
            } else {
                // Otherwise load directly
                blueprint3d.model.loadSerialized(data);
            }
            
            // Refresh UI components
            if (window.floorsPanel && typeof window.floorsPanel.updateFloorsList === "function") {
                window.floorsPanel.updateFloorsList();
            }
            
            // Center camera and ensure redraw
            if (blueprint3d.three && typeof blueprint3d.three.centerCamera === "function") {
                blueprint3d.three.centerCamera();
            }
            
            if (blueprint3d.three && typeof blueprint3d.three.needsUpdate === "function") {
                blueprint3d.three.needsUpdate();
            }
            
            // Alert user success (optional, but helpful for confirmation)
            console.log("Design loaded successfully.");
        } catch (e) {
            console.error("Error loading design:", e);
            alert("Failed to load design file. Please make sure it's a valid .blueprint3d file.\nError: " + e.message);
        } finally {
            $("#loadFile").val(""); // reset so same file can be loaded again
        }
    };
    
    reader.onerror = function() {
        alert("Error reading file from disk.");
        $("#loadFile").val("");
    };
    
    reader.readAsText(files[0]);
  }

  function saveDesign() {
    var data = blueprint3d.model.exportSerialized();
    if (window.BlueprintPWA && typeof BlueprintPWA.saveLastDesign === "function") {
      BlueprintPWA.saveLastDesign(data);
    }
    var a = window.document.createElement('a');
    var blob = new Blob([data], {type : 'text'});
    a.href = window.URL.createObjectURL(blob);
    a.download = 'design.blueprint3d';
    document.body.appendChild(a)
    a.click();
    document.body.removeChild(a)
  }

  function init() {
    for (var tab in tabs) {
      var elem = tabs[tab];
      elem.click(tabClicked(elem));
    }

    $("#mobile-menu-toggle").click(function() {
      $(".sidebar").toggleClass("active");
      $(".sidebar-overlay").toggleClass("active");
    });

    $(".sidebar-overlay").click(function() {
      $(".sidebar").removeClass("active");
      $(".sidebar-overlay").removeClass("active");
    });

    $("#update-floorplan").click(floorplanUpdate);
    $("#new").click(newPlan);
    $("#loadFile").change(loadDesign);
    // Ensure clicking the parent button also triggers the file input
    $(".btn-file").click(function(e) {
        if (e.target.id !== "loadFile") {
            $("#loadFile").click();
        }
    });
    $("#saveFile").click(saveDesign);

    initLeftMenu();

    blueprint3d.three.updateWindowSize();
    handleWindowResize();

    initItems();
  }

  function floorplanUpdate() {
    setCurrentState(scope.states.DEFAULT);
  }

  function tabClicked(tab) {
    return function() {
      // Close mobile menu
      $(".sidebar").removeClass("active");
      $(".sidebar-overlay").removeClass("active");

      // Stop three from spinning
      blueprint3d.three.stopSpin();

      // Selected a new tab
      for (var key in scope.states) {
        var state = scope.states[key];
        if (state.tab == tab) {
          setCurrentState(state);
          break;
        }
      }
    }
  }
  
  function setCurrentState(newState) {

    if (currentState == newState) {
      return;
    }

    // show the right tab as active
    if (currentState.tab !== newState.tab) {
      if (currentState.tab != null) {
        currentState.tab.removeClass(ACTIVE_CLASS);          
      }
      if (newState.tab != null) {
        newState.tab.addClass(ACTIVE_CLASS);
      }
    }

    // set item unselected
    blueprint3d.three.getController().setSelectedObject(null);

    // show and hide the right divs
    if (newState === scope.states.FLOORPLAN) {
      // In 2D mode, keep 3D as a floating preview
      $("#viewer").addClass("preview-mode").show();
      $("#floorplanner").show();
      $("#add-items").hide();
    } else {
      // Transition out of 2D mode
      $("#viewer").removeClass("preview-mode");
      currentState.div.hide();
      newState.div.show();
    }

    // Ensure resizing happens after visibility change
    setTimeout(handleWindowResize, 0);

    // If we just clicked the preview, switch to Design tab
    $("#viewer.preview-mode").off('click').on('click', function() {
      setCurrentState(scope.states.DEFAULT);
    });

    // show layouts panel only when Design (3D) tab is active
    if (newState === scope.states.DEFAULT) {
      $("#layouts-panel").show().css({ visibility: "visible", display: "block" });
      // Scroll layout panel into view within sidebar; refresh slider width
      setTimeout(function() {
        var el = document.getElementById("layouts-panel");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        if (window.layoutSlider && window.layoutSlider.refresh) window.layoutSlider.refresh();
      }, 80);
    } else {
      $("#layouts-panel").hide();
    }

    // custom actions
    if (newState == scope.states.FLOORPLAN) {
      floorplanControls.updateFloorplanView();
      floorplanControls.handleWindowResize();
    } 

    if (newState == scope.states.SHOP) {
      initItems();
    }

    if (currentState == scope.states.FLOORPLAN) {
      blueprint3d.model.floorplan.update();
    }

    if (newState == scope.states.DEFAULT) {
      blueprint3d.three.updateWindowSize();
    }
 
    // set new state
    handleWindowResize();    
    currentState = newState;

    scope.stateChangeCallbacks.fire(newState);
  }

  function initLeftMenu() {
    $( window ).resize( handleWindowResize );
    handleWindowResize();

    // Initialize layout slider (pass setCurrentState function)
    initLayoutSlider(blueprint3d, function(state) {
      setCurrentState(state);
    }, scope.states);
  }
  
  // Expose setCurrentState for external use
  this.setCurrentState = setCurrentState;

  function handleWindowResize() {
    var winHeight = window.innerHeight;
    var topOffset = 56; // Top bar height (matches --topbar-height in CSS)
    
    $(".sidebar").height(winHeight - topOffset);
    $("#add-items").height(winHeight - topOffset);
    $("#floorplanner").height(winHeight - topOffset);

    // Update viewer size
    if ($("#viewer").hasClass("preview-mode")) {
      // Don't set height/width via JS for preview mode, CSS handles it
      // But we still need to tell Three.js the dimensions
      if (blueprint3d.three.updateWindowSize) {
        blueprint3d.three.updateWindowSize($("#viewer").innerWidth(), $("#viewer").innerHeight());
      }
    } else {
      $("#viewer").height(winHeight - topOffset);
      if (blueprint3d.three.updateWindowSize) {
        blueprint3d.three.updateWindowSize();
      }
    }
  };

  // TODO: this doesn't really belong here
  function initItems() {
    $("#add-items").find(".add-item").unbind('mousedown').mousedown(function(e) {
      var modelUrl = $(this).attr("model-url");
      var itemTypeStr = $(this).attr("model-type");
      
      // Materials cannot be added as 3D items and cause the loading screen to hang
      if (itemTypeStr === "texture-floor" || itemTypeStr === "texture-wall") {
        alert("To apply materials, please go to the Design tab, click on a floor or wall, and select a material from the left panel.");
        setCurrentState(scope.states.DEFAULT);
        return;
      }
      
      var itemType = parseInt(itemTypeStr);
      // Handle procedural items that don't have model files
      if (modelUrl === "null" || modelUrl === "") {
        modelUrl = null;
      }
      var metadata = {
        itemName: $(this).attr("model-name"),
        resizable: true,
        modelUrl: modelUrl,
        itemType: itemType
      }

      blueprint3d.model.scene.addItem(itemType, modelUrl, metadata);
      setCurrentState(scope.states.DEFAULT);
    });
  }

  init();

}

/*
 * Change floor and wall textures
 */

var TextureSelector = function (blueprint3d, sideMenu) {

  var scope = this;
  var three = blueprint3d.three;
  var isAdmin = isAdmin;

  var currentTarget = null;

  function initTextureSelectors() {
    $(".texture-select-thumbnail").click(function(e) {
      var textureUrl = $(this).attr("texture-url");
      var textureStretch = ($(this).attr("texture-stretch") == "true");
      var textureScale = parseInt($(this).attr("texture-scale"));
      currentTarget.setTexture(textureUrl, textureStretch, textureScale);

      e.preventDefault();
    });
  }

  function init() {
    three.wallClicked.add(wallClicked);
    three.floorClicked.add(floorClicked);
    three.itemSelectedCallbacks.add(reset);
    three.nothingClicked.add(reset);
    sideMenu.stateChangeCallbacks.add(reset);
    initTextureSelectors();
  }

  function wallClicked(halfEdge) {
    currentTarget = halfEdge;
    $("#floorTexturesDiv").hide();  
    $("#wallTextures").show();  
  }

  function floorClicked(room) {
    currentTarget = room;
    $("#wallTextures").hide();  
    $("#floorTexturesDiv").show();  
  }

  function reset() {
    $("#wallTextures").hide();  
    $("#floorTexturesDiv").hide();  
  }

  init();
}

/*
 * Rooms panel (name + area list)
 */
var RoomsPanel = function (blueprint3d, viewerFloorplanner, sideMenu) {
  var model = blueprint3d.model;
  var floorplan = model.floorplan;
  var floorplanner = viewerFloorplanner.floorplanner;
  var ROOM_TYPES = [
    "",
    "Hall",
    "Living",
    "Kitchen",
    "Bedroom",
    "Bathroom",
    "Dining",
    "Balcony",
    "Study",
    "Store",
    "Other"
  ];

  function init() {
    // Update list whenever rooms change.
    floorplan.fireOnUpdatedRooms(update);

    $("#rooms-export-csv").on("click", function (e) {
      e.preventDefault();
      exportCsv();
    });

    // Sun/time-of-day slider (updates directional light).
    $("#sun-time").on("input change", function() {
      var v = parseFloat($(this).val());
      updateSun(v);
    });

    $("#lighting-preset").on("change", function() {
      var p = $(this).val();
      var lights = blueprint3d.three.lights;
      if (lights && lights.applyPreset) {
        lights.applyPreset(p);
      }
      updateSun(parseFloat($("#sun-time").val() || "12"));
      if (blueprint3d.three.needsUpdate) {
        blueprint3d.three.needsUpdate();
      }
    });

    // Show/hide panel based on current state.
    sideMenu.stateChangeCallbacks.add(function (state) {
      if (state === sideMenu.states.FLOORPLAN) {
        $("#rooms-panel").show();
        update();
      } else {
        $("#rooms-panel").hide();
      }
    });

    // Initial visibility (we start in FLOORPLAN in this app).
    $("#rooms-panel").show();
    update();
    // apply default preset
    var lights = blueprint3d.three.lights;
    if (lights && lights.applyPreset) {
      lights.applyPreset($("#lighting-preset").val());
    }
    updateSun(parseFloat($("#sun-time").val() || "12"));
  }

  function formatHour(h) {
    var hh = Math.floor(h);
    var mm = Math.round((h - hh) * 60);
    if (mm === 60) { hh += 1; mm = 0; }
    return (hh < 10 ? "0" + hh : "" + hh) + ":" + (mm < 10 ? "0" + mm : "" + mm);
  }

  function updateSun(hour) {
    $("#sun-time-label").text(formatHour(hour));
    var lights = blueprint3d.three.lights;
    var dir = lights && lights.getDirLight ? lights.getDirLight() : null;
    if (!dir) return;
    // Map 6..18 -> -80..80 degrees elevation and rotate around plan center.
    var t = (hour - 6) / 12;
    t = Math.max(0, Math.min(1, t));
    var elev = (-80 + 160 * t) * Math.PI / 180;
    var az = (45) * Math.PI / 180;
    var center = floorplan.getCenter();
    var r = 800;
    var y = 300 + 250 * Math.sin(Math.max(0.05, Math.min(1.55, Math.abs(elev))));
    var base = 0.2 + 1.2 * Math.max(0, Math.sin((t) * Math.PI));
    var mult = (dir.userData && dir.userData.presetIntensity) ? dir.userData.presetIntensity : 1.0;
    dir.intensity = base * mult;
    dir.position.set(center.x + Math.cos(az) * r, y, center.z + Math.sin(az) * r);
    dir.target.position.copy(center);
    // Request a redraw.
    if (blueprint3d.three.needsUpdate) {
      blueprint3d.three.needsUpdate();
    }
  }

  function focusRoom(room) {
    if (!room || !room.getCentroid) return;
    var c = room.getCentroid();
    var centerX = floorplanner.canvasElement.innerWidth() / 2.0;
    var centerY = floorplanner.canvasElement.innerHeight() / 2.0;
    floorplanner.originX = c.x * floorplanner.pixelsPerCm - centerX;
    floorplanner.originY = c.y * floorplanner.pixelsPerCm - centerY;
    floorplanner.view.draw();
  }

  function renameRoom(room) {
    var uuid = room.getUuid();
    var meta = (floorplan.getRoomMeta && floorplan.getRoomMeta(uuid)) || {};
    var currentName = meta.name || "";
    var nextName = window.prompt("Room name", currentName);
    if (nextName === null) return;
    nextName = ("" + nextName).trim();
    if (floorplan.setRoomMeta) {
      floorplan.setRoomMeta(uuid, { name: nextName });
    }
    floorplanner.view.draw();
    update();
  }

  function setRoomType(room, type) {
    var uuid = room.getUuid();
    if (floorplan.setRoomMeta) {
      floorplan.setRoomMeta(uuid, { type: (type || "").trim() });
    }
    floorplanner.view.draw();
    update();
  }

  function roomDisplayName(room) {
    var uuid = room.getUuid();
    var meta = (floorplan.getRoomMeta && floorplan.getRoomMeta(uuid)) || {};
    var n = (meta.name || "").trim();
    return n ? n : "Room";
  }

  function roomDisplayType(room) {
    var uuid = room.getUuid();
    var meta = (floorplan.getRoomMeta && floorplan.getRoomMeta(uuid)) || {};
    return (meta.type || "").trim();
  }

  function update() {
    var rooms = floorplan.getRooms() || [];
    var list = $("#rooms-list");
    list.empty();

    // Sort by area (desc)
    rooms = rooms.slice(0).sort(function (a, b) {
      var aa = (a.getAreaCm2 ? a.getAreaCm2() : 0);
      var bb = (b.getAreaCm2 ? b.getAreaCm2() : 0);
      return bb - aa;
    });

    var totalFt2 = 0;
    rooms.forEach(function (room) {
      var cm2 = room.getAreaCm2 ? room.getAreaCm2() : 0;
      var ft2 = cm2 / (30.48 * 30.48);
      totalFt2 += ft2;

      var name = roomDisplayName(room);
      var type = roomDisplayType(room);
      var area = (Math.round(ft2 * 100) / 100).toFixed(2) + " ft²";

      var row = $('<div class="room-row" style="display:flex; align-items:center; justify-content:space-between; padding:6px 8px; border:1px solid #eee; border-radius:6px; margin-bottom:6px; cursor:pointer;"></div>');
      var left = $('<div style="min-width:0;"></div>');
      var title = type ? (name + " (" + type + ")") : name;
      left.append('<div style="font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + title + '</div>');
      left.append('<div class="small text-muted">' + area + '</div>');
      var actions = $('<div style="display:flex; gap:6px; align-items:center;"></div>');
      var typeSelect = $('<select class="form-control input-sm" style="height:24px; padding:0 6px; font-size:11px; width:92px;"></select>');
      ROOM_TYPES.forEach(function (t) {
        var opt = $('<option></option>').attr("value", t).text(t ? t : "Type");
        if (t === type) opt.attr("selected", "selected");
        typeSelect.append(opt);
      });
      var renameBtn = $('<button class="btn btn-xs btn-default" type="button">Rename</button>');
      actions.append(typeSelect);
      actions.append(renameBtn);
      row.append(left);
      row.append(actions);

      row.on("click", function () { focusRoom(room); });
      typeSelect.on("click", function (e) { e.stopPropagation(); });
      typeSelect.on("change", function (e) {
        e.preventDefault();
        e.stopPropagation();
        setRoomType(room, $(this).val());
      });
      renameBtn.on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        renameRoom(room);
      });

      list.append(row);
    });

    $("#rooms-total").text("Total: " + (Math.round(totalFt2 * 100) / 100).toFixed(2) + " ft² • " + rooms.length + " room(s)");
  }

  function csvEscape(s) {
    s = (s === null || s === undefined) ? "" : ("" + s);
    if (/[",\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function exportCsv() {
    var rooms = floorplan.getRooms() || [];
    // stable sort by name then area desc
    rooms = rooms.slice(0).sort(function (a, b) {
      var an = roomDisplayName(a).toLowerCase();
      var bn = roomDisplayName(b).toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      var aa = (a.getAreaCm2 ? a.getAreaCm2() : 0);
      var bb = (b.getAreaCm2 ? b.getAreaCm2() : 0);
      return bb - aa;
    });

    var lines = [];
    lines.push(["Name", "Type", "Area (ft^2)", "Perimeter (ft)"].map(csvEscape).join(","));

    var totalArea = 0;
    var totalPerim = 0;
    rooms.forEach(function (room) {
      var name = roomDisplayName(room);
      var type = roomDisplayType(room);
      var cm2 = room.getAreaCm2 ? room.getAreaCm2() : 0;
      var areaFt2 = cm2 / (30.48 * 30.48);
      var perimCm = room.getPerimeterCm ? room.getPerimeterCm() : 0;
      var perimFt = perimCm / 30.48;
      totalArea += areaFt2;
      totalPerim += perimFt;
      lines.push([
        name,
        type,
        (Math.round(areaFt2 * 100) / 100).toFixed(2),
        (Math.round(perimFt * 100) / 100).toFixed(2)
      ].map(csvEscape).join(","));
    });

    lines.push(["TOTAL", "", (Math.round(totalArea * 100) / 100).toFixed(2), (Math.round(totalPerim * 100) / 100).toFixed(2)].map(csvEscape).join(","));

    var csv = lines.join("\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var a = window.document.createElement("a");
    a.href = window.URL.createObjectURL(blob);
    a.download = "rooms-schedule.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  init();
};

/*
 * Floorplanner controls
 */

var ViewerFloorplanner = function(blueprint3d) {

  var canvasWrapper = '#floorplanner';

  // buttons
  var move = '#move';
  var remove = '#delete';
  var draw = '#draw';
  var door = '#place-door';
  var windowBtn = '#place-window';
  var zoomIn = '#zoom-in-floorplan';
  var zoomOut = '#zoom-out-floorplan';
  var exportPdf = '#export-floorplan-pdf';

  var activeStlye = 'btn-primary disabled';

  this.floorplanner = blueprint3d.floorplanner;

  var scope = this;

  function init() {

    $( window ).resize( scope.handleWindowResize );
    scope.handleWindowResize();

    // mode buttons
    scope.floorplanner.modeResetCallbacks.add(function(mode) {
      $(draw).removeClass(activeStlye);
      $(remove).removeClass(activeStlye);
      $(move).removeClass(activeStlye);
      $(door).removeClass(activeStlye);
      $(windowBtn).removeClass(activeStlye);
      if (mode == BP3D.Floorplanner.floorplannerModes.MOVE) {
          $(move).addClass(activeStlye);
      } else if (mode == BP3D.Floorplanner.floorplannerModes.DRAW) {
          $(draw).addClass(activeStlye);
      } else if (mode == BP3D.Floorplanner.floorplannerModes.DELETE) {
          $(remove).addClass(activeStlye);
      } else if (mode == BP3D.Floorplanner.floorplannerModes.DOOR) {
          $(door).addClass(activeStlye);
      } else if (mode == BP3D.Floorplanner.floorplannerModes.WINDOW) {
          $(windowBtn).addClass(activeStlye);
      }

      if (mode == BP3D.Floorplanner.floorplannerModes.DRAW) {
        $("#draw-walls-hint").show();
        scope.handleWindowResize();
      } else {
        $("#draw-walls-hint").hide();
      }
    });

    $(move).click(function(){
      scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.MOVE);
    });

    $(draw).click(function(){
      scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.DRAW);
    });

    $(remove).click(function(){
      scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.DELETE);
    });

    $(door).click(function(){
      scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.DOOR);
    });

    $(windowBtn).click(function(){
      scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.WINDOW);
    });

    $(zoomIn).click(function(){
      scope.floorplanner.zoomIn();
    });

    $(zoomOut).click(function(){
      scope.floorplanner.zoomOut();
    });

    $(exportPdf).click(function () {
      scope.floorplanner.view.draw();
      var canvas = document.getElementById("floorplanner-canvas");
      if (!canvas || typeof window.exportFloorplanCanvasToPdf !== "function") {
        return;
      }
      var floorName = "Floorplan";
      try {
        if (blueprint3d.model && blueprint3d.model.activeFloor && blueprint3d.model.activeFloor.name) {
          floorName = blueprint3d.model.activeFloor.name;
        }
      } catch (e) {}
      window.exportFloorplanCanvasToPdf(canvas, { floorName: floorName });
    });
  }

  this.updateFloorplanView = function() {
    scope.floorplanner.reset();
  }

  this.handleWindowResize = function() {
    var topOffset = $(canvasWrapper).offset().top;
    // On some mobile browsers, offset().top can be inaccurate during transitions
    if (topOffset < 56 && window.innerWidth < 768) topOffset = 56; 
    $(canvasWrapper).height(window.innerHeight - topOffset);
    scope.floorplanner.resizeView();
  };

  init();
}; 



/*
 * Layout Slider
 */

var LayoutSlider = function(blueprint3d, setStateFn, states) {
  var currentSlide = 0;
  var layouts = [
    {
      key: "1rk",
      title: "1RK",
      subtitle: "1 Room + Kitchen",
      description: "Perfect for studio apartments with an open kitchen area."
    },
    {
      key: "1bhk",
      title: "1BHK",
      subtitle: "1 Bedroom, Hall, Kitchen",
      description: "Ideal for small families with separate bedroom and living space."
    },
    {
      key: "2bhk",
      title: "2BHK",
      subtitle: "2 Bedrooms, Hall, Kitchen",
      description: "Spacious layout with two bedrooms and a common hall area."
    }
  ];

  function init() {
    var slider = $("#layout-slider");
    var dotsContainer = $(".layout-slider-dots");
    
    // Create slides
    layouts.forEach(function(layout, index) {
      // Create slide
      var slide = $('<div class="layout-slide" data-layout="' + layout.key + '" data-index="' + index + '"></div>');
      var preview = $('<div class="layout-preview"></div>');
      var canvas = $('<canvas width="200" height="150"></canvas>');
      preview.append(canvas);
      
      var title = $('<div class="layout-slide-title">' + layout.title + '</div>');
      var subtitle = $('<div class="layout-slide-subtitle">' + layout.subtitle + '</div>');
      
      slide.append(preview);
      slide.append(title);
      slide.append(subtitle);
      slider.append(slide);
      
      // Draw preview
      drawLayoutPreview(canvas[0], layout.key);
      
      // Create dot
      var dot = $('<button class="layout-slider-dot" data-index="' + index + '"></button>');
      dotsContainer.append(dot);
    });
    
    // Set first slide as active
    showSlide(0);
    
    // Navigation handlers
    $(".layout-slider-prev").on("click", function() {
      prevSlide();
    });
    
    $(".layout-slider-next").on("click", function() {
      nextSlide();
    });
    
    // Dot navigation
    $(document).on("click", ".layout-slider-dot", function() {
      var index = parseInt($(this).data("index"));
      showSlide(index);
    });
    
    // Slide click to load
    $(document).on("click", ".layout-slide", function() {
      var index = parseInt($(this).data("index"));
      showSlide(index);
    });
    
    // Load button
    $(".layout-load-btn").on("click", function() {
      loadCurrentLayout();
    });
  }
  
  function drawLayoutPreview(canvas, layoutKey) {
    var ctx = canvas.getContext("2d");
    var width = canvas.width;
    var height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, width, height);
    
    // Get layout data
    var json = window.PRESET_LAYOUTS && window.PRESET_LAYOUTS[layoutKey];
    if (!json) return;
    
    try {
      var data = JSON.parse(json);
      var corners = data.floorplan.corners;
      var walls = data.floorplan.walls;
      
      if (!corners || !walls) return;
      
      // Calculate bounds
      var minX = Infinity, maxX = -Infinity;
      var minY = Infinity, maxY = -Infinity;
      for (var id in corners) {
        var c = corners[id];
        if (c && typeof c.x === 'number' && typeof c.y === 'number') {
          minX = Math.min(minX, c.x);
          maxX = Math.max(maxX, c.x);
          minY = Math.min(minY, c.y);
          maxY = Math.max(maxY, c.y);
        }
      }
      
      if (minX === Infinity) return; // No valid corners
      
      var rangeX = maxX - minX;
      var rangeY = maxY - minY;
      if (rangeX === 0 || rangeY === 0) return;
      
      var padding = 15;
      var scale = Math.min((width - padding * 2) / rangeX, (height - padding * 2) / rangeY);
      var offsetX = (width - rangeX * scale) / 2;
      var offsetY = (height - rangeY * scale) / 2;
      
      // Draw walls
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2.5;
      walls.forEach(function(wall) {
        var c1 = corners[wall.corner1];
        var c2 = corners[wall.corner2];
        if (c1 && c2 && typeof c1.x === 'number' && typeof c2.x === 'number') {
          var x1 = offsetX + (c1.x - minX) * scale;
          var y1 = offsetY + (c1.y - minY) * scale;
          var x2 = offsetX + (c2.x - minX) * scale;
          var y2 = offsetY + (c2.y - minY) * scale;
          
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      });
      
      // Draw corners (small dots)
      ctx.fillStyle = "#428bca";
      for (var id in corners) {
        var c = corners[id];
        if (c && typeof c.x === 'number') {
          var x = offsetX + (c.x - minX) * scale;
          var y = offsetY + (c.y - minY) * scale;
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } catch (e) {
      console.error("Error drawing layout preview:", e);
    }
  }
  
  function showSlide(index) {
    if (index < 0 || index >= layouts.length) return;
    
    currentSlide = index;
    var layout = layouts[index];
    
    // Update slider position (use 200 if wrapper not yet visible)
    var slider = $("#layout-slider");
    var slideWidth = slider.parent().width() || 200;
    slider.css("transform", "translateX(-" + (index * slideWidth) + "px)");
    
    // Update active states
    $(".layout-slide").removeClass("active");
    $(".layout-slide[data-index='" + index + "']").addClass("active");
    
    $(".layout-slider-dot").removeClass("active");
    $(".layout-slider-dot[data-index='" + index + "']").addClass("active");
    
    // Update info
    $(".layout-title").text(layout.title + " - " + layout.subtitle);
    $(".layout-description").text(layout.description);
    $(".layout-load-btn").data("layout", layout.key);
  }
  
  function nextSlide() {
    var next = (currentSlide + 1) % layouts.length;
    showSlide(next);
  }
  
  function prevSlide() {
    var prev = (currentSlide - 1 + layouts.length) % layouts.length;
    showSlide(prev);
  }
  
  function loadCurrentLayout() {
    var layout = layouts[currentSlide];
    var json = window.PRESET_LAYOUTS && window.PRESET_LAYOUTS[layout.key];
    if (json) {
      try {
        blueprint3d.three.getController().setSelectedObject(null);
        blueprint3d.model.loadSerialized(json);
        // Switch to Design view if not already there
        if (setStateFn && states) {
          setStateFn(states.DEFAULT);
        }
        
        // Refresh UI components
        if (window.floorsPanel && typeof window.floorsPanel.updateFloorsList === "function") {
          window.floorsPanel.updateFloorsList();
        }
        
        blueprint3d.three.centerCamera();
        
        if (blueprint3d.three && typeof blueprint3d.three.needsUpdate === "function") {
          blueprint3d.three.needsUpdate();
        }
      } catch (e) {
        console.error("Error loading layout:", e);
        alert("Failed to load preset layout: " + e.message);
      }
    }
  }
  
  init();
  
  return {
    showSlide: showSlide,
    loadCurrentLayout: loadCurrentLayout,
    refresh: function() { showSlide(currentSlide); }
  };
}

var FloorsPanel = function (blueprint3d, sideMenu) {
  var model = blueprint3d.model;

  function init() {
    // Show/hide panel based on current state.
    sideMenu.stateChangeCallbacks.add(function (state) {
      if (state === sideMenu.states.FLOORS) {
        $("#floors-panel").show();
        updateFloorsList();
      } else {
        $("#floors-panel").hide();
      }
    });

    $("#add-floor-btn").on("click", function() {
      var floorNames = model.floors.map(function(f) { return f.name; });
      var newName = "Floor " + (model.floors.length + 1);
      var counter = 1;
      while (floorNames.includes(newName)) {
        newName = "Floor " + (model.floors.length + 1 + counter);
        counter++;
      }
      var newFloor = model.addFloor(newName, model.floors.length);
      updateFloorsList();
      setActiveFloor(newFloor);
    });

    updateFloorsList();
  }

  function updateFloorsList() {
    var $list = $("#floors-list");
    $list.empty();

    model.floors.forEach(function(floor, index) {
      var $floorItem = $("<div>").addClass("floor-item").css({
        "padding": "8px",
        "margin-bottom": "4px",
        "border": "1px solid #ddd",
        "border-radius": "4px",
        "cursor": "pointer"
      });

      if (floor === model.activeFloor) {
        $floorItem.addClass("active").css("background-color", "#e7f3ff");
      }

      var $name = $("<span>").text(floor.name).css("font-weight", "bold");
      var $level = $("<small>").text(" (Level " + floor.level + ")").css("color", "#666");

      $floorItem.append($name).append($level);

      if (model.floors.length > 1) {
        var $deleteBtn = $("<button>").addClass("btn btn-xs btn-danger pull-right")
          .html('<span class="glyphicon glyphicon-trash"></span>')
          .on("click", function(e) {
            e.stopPropagation();
            if (confirm("Delete floor '" + floor.name + "'? This will remove all items on this floor.")) {
              model.removeFloor(floor);
              updateFloorsList();
            }
          });
        $floorItem.append($deleteBtn);
      }

      $floorItem.on("click", function() {
        setActiveFloor(floor);
      });

      $list.append($floorItem);
    });
  }

  function setActiveFloor(floor) {
    model.setActiveFloor(floor);
    updateFloorsList();
    // Notify other components that active floor changed
    if (blueprint3d.three && blueprint3d.three.needsUpdate) {
      blueprint3d.three.needsUpdate();
    }
  }

  init();

  return {
    updateFloorsList: updateFloorsList
  };
}

function initLayoutSlider(blueprint3d, setStateFn, states) {
  if (!$("#layouts-panel").length) return;
  if (!window.PRESET_LAYOUTS) {
    console.warn("Layouts: PRESET_LAYOUTS not loaded. Ensure layouts.js is loaded.");
    $("#layout-slider").closest(".panel-body").append(
      '<p class="text-warning small">Layout presets failed to load. Check console.</p>'
    );
    return;
  }
  try {
    window.layoutSlider = new LayoutSlider(blueprint3d, setStateFn, states);
  } catch (e) {
    console.error("Layout slider init error:", e);
  }
}

/*
 * Initialize!
 */

$(document).ready(function() {

  // main setup
  var opts = {
    floorplannerElement: 'floorplanner-canvas',
    threeElement: '#viewer',
    threeCanvasElement: 'three-canvas',
    textureDir: "models/textures/",
    assetBase: (typeof window.BLUEPRINT_getAssetBase === "function") ? window.BLUEPRINT_getAssetBase() : "",
    widget: false
  }
  var blueprint3d = new BP3D.Blueprint3d(opts);
  window.bp3d = blueprint3d; // Expose for walkthrough.js

  var modalEffects = new ModalEffects(blueprint3d);
  var viewerFloorplanner = new ViewerFloorplanner(blueprint3d);
  var contextMenu = new ContextMenu(blueprint3d);
  var sideMenu = new SideMenu(blueprint3d, viewerFloorplanner, modalEffects);
  var textureSelector = new TextureSelector(blueprint3d, sideMenu);        
  var cameraButtons = new CameraButtons(blueprint3d);
  var roomsPanel = new RoomsPanel(blueprint3d, viewerFloorplanner, sideMenu);
  var floorsPanel = new FloorsPanel(blueprint3d, sideMenu);
  window.floorsPanel = floorsPanel;

  if (window.initBlueprintVR) {
    window.initBlueprintVR(blueprint3d);
  }

  if (window.initAIPlanner) {
    window.initAIPlanner(blueprint3d);
  }

  function loadDefaultPreset() {
    try {
      if (!navigator.onLine) {
        blueprint3d.model.loadSerialized(window.CUSTOM_LAYOUT);
        blueprint3d.three.centerCamera();
        return;
      }
      var presetLayout = '{"floorplan":{"corners":{"c1":{"x":308.8640000000001,"y":0},"c2":{"x":1231.7119999999993,"y":0},"c3":{"x":1231.7119999999993,"y":724},"c4":{"x":308.8640000000001,"y":724},"dba26377-1998-4f5d-970a-f2827d60e390":{"x":1231.7119999999993,"y":161.17067700195304},"eb6606b7-59c3-4589-e332-96287a45e0bc":{"x":825.1519999999997,"y":161.17067700195304},"2292688f-2592-4f38-6e66-89d89bd666f8":{"x":825.1519999999997,"y":0},"1fb0c64c-08a2-77b2-777f-8c7263553194":{"x":825.1519999999997,"y":161.17067700195304},"b115c1c3-6cfb-9723-086f-d22c439443b0":{"x":825.1519999999997,"y":724}},"walls":[{"corner1":"c1","corner2":"2292688f-2592-4f38-6e66-89d89bd666f8","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"c2","corner2":"dba26377-1998-4f5d-970a-f2827d60e390","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"c3","corner2":"b115c1c3-6cfb-9723-086f-d22c439443b0","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"c4","corner2":"c1","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"dba26377-1998-4f5d-970a-f2827d60e390","corner2":"c3","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"dba26377-1998-4f5d-970a-f2827d60e390","corner2":"1fb0c64c-08a2-77b2-777f-8c7263553194","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"1fb0c64c-08a2-77b2-777f-8c7263553194","corner2":"2292688f-2592-4f38-6e66-89d89bd666f8","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"2292688f-2592-4f38-6e66-89d89bd666f8","corner2":"c2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"1fb0c64c-08a2-77b2-777f-8c7263553194","corner2":"b115c1c3-6cfb-9723-086f-d22c439443b0","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"b115c1c3-6cfb-9723-086f-d22c439443b0","corner2":"c4","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}}],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[{"item_name":"World Class Toilet Seat","item_type":1,"model_url":"models/js/toilet-seat.json","xpos":1205.794934474077,"ypos":36,"zpos":56.8006559327377,"rotation":-1.5707963267948966,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Dresser - White","item_type":1,"model_url":"models/js/we-narrow6white_baked.js","xpos":1200.180072030805,"ypos":35.56,"zpos":454.49185921021154,"rotation":-1.5707963267948966,"scale_x":2.733333333333337,"scale_y":0.9985398840390354,"scale_z":0.9829797444252664,"fixed":false},{"item_name":"Open Door","item_type":7,"model_url":"models/js/open_door.js","xpos":911.299037382791,"ypos":110.800000297771,"zpos":161.67066955566406,"rotation":0,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Open Door","item_type":7,"model_url":"models/js/open_door.js","xpos":824.6519775390625,"ypos":110.800000297771,"zpos":261.3297291348599,"rotation":-1.5707963267948966,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Dresser - White","item_type":1,"model_url":"models/js/we-narrow6white_baked.js","xpos":1027.066201986063,"ypos":35.56,"zpos":685.711534802538,"rotation":3.141592653589793,"scale_x":1.866666666666668,"scale_y":0.9985398840390354,"scale_z":0.9829797444252664,"fixed":false},{"item_name":"Full Bed","item_type":1,"model_url":"models/js/ik_nordli_full.js","xpos":683.5751405552651,"ypos":49.53,"zpos":592.9368202227345,"rotation":-1.5707963267948966,"scale_x":1.288142857142857,"scale_y":0.9906,"scale_z":1.0033010033010032,"fixed":false},{"item_name":"Dining Table","item_type":1,"model_url":"models/js/cb-scholartable_baked.js","xpos":398.50064546714765,"ypos":38.078950895925004,"zpos":597.8339958356213,"rotation":0,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Chair","item_type":1,"model_url":"models/js/gus-churchchair-whiteoak.js","xpos":399.13499833720766,"ypos":39.47743068655714,"zpos":666.1723386115017,"rotation":3.141592653589793,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Chair","item_type":1,"model_url":"models/js/gus-churchchair-whiteoak.js","xpos":386.17890956535484,"ypos":39.47743068655714,"zpos":513.6034737211673,"rotation":0,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Wardrobe - White","item_type":1,"model_url":"models/js/ik-kivine_baked.js","xpos":790.413489606724,"ypos":94.999999385175,"zpos":426.0458296139562,"rotation":-1.5707963267948966,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Sectional - Olive","item_type":1,"model_url":"models/js/we-crosby2piece-greenbaked.json","xpos":590.1683201781508,"ypos":45.72,"zpos":311.1342757475881,"rotation":3.141592653589793,"scale_x":1.0628423615337796,"scale_y":1.0076133080433942,"scale_z":0.9948936625795949,"fixed":false},{"item_name":"Closed Door","item_type":7,"model_url":"models/js/closed-door28x80_baked.js","xpos":406.5222549799156,"ypos":110.80000022010701,"zpos":0.5,"rotation":0,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Media Console - White","item_type":1,"model_url":"models/js/cb-clapboard_baked.js","xpos":633.6269631607563,"ypos":67.88999754395999,"zpos":34.37400867978181,"rotation":0,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Ganesha Poster","item_type":2,"model_url":"models/js/ganesha-poster.json","xpos":508.9844266502455,"ypos":182.18482967976246,"zpos":6.253750317500636,"rotation":0,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false},{"item_name":"Bookshelf","item_type":1,"model_url":"models/js/cb-kendallbookcasewalnut_baked.js","xpos":769.6929618879914,"ypos":92.17650034119151,"zpos":27.90474363290329,"rotation":0,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false}]}';
      blueprint3d.model.loadSerialized(presetLayout);
      blueprint3d.three.centerCamera();
    } catch (e) {
      console.warn("Failed to load default preset:", e);
    }
  }

  function initDesign() {
    if (window.BlueprintPWA && typeof BlueprintPWA.shouldPreferOfflineLastDesign === "function" &&
        BlueprintPWA.shouldPreferOfflineLastDesign() &&
        typeof BlueprintPWA.loadLastDesign === "function") {
      BlueprintPWA.loadLastDesign().then(function (data) {
        if (data) {
          try {
            blueprint3d.model.loadSerialized(data);
            blueprint3d.three.centerCamera();
            return;
          } catch (e) {
            console.warn("Failed to load offline last design:", e);
          }
        }
        loadDefaultPreset();
      });
      return;
    }
    loadDefaultPreset();
  }

  initDesign();

  if (window.BlueprintPWA) {
    if (typeof BlueprintPWA.register === "function") {
      BlueprintPWA.register();
    }
    function persistLastDesign() {
      try {
        if (typeof BlueprintPWA.saveLastDesign === "function" && blueprint3d && blueprint3d.model) {
          BlueprintPWA.saveLastDesign(blueprint3d.model.exportSerialized());
        }
      } catch (e) {
        console.warn("persistLastDesign:", e);
      }
    }
    window.addEventListener("beforeunload", persistLastDesign);
    setInterval(persistLastDesign, 60000);
  }

});

