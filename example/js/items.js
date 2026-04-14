// Blueprint3D - Furniture Catalog
// Populates the "Add Items" grid with categorized sections

$(document).ready(function () {
  var items = [
    {
      "name": "Ganesha Poster",
      "image": "models/thumbnails/ganesha-poster.jpg",
      "model": "models/js/ganesha-poster.json",
      "type": "2",
      "category": "Decor"
    },
    {
      "name": "Mirror",
      "image": "models/thumbnails/ganesha-poster.jpg",
      "model": "models/js/mirror.json",
      "type": "2",
      "category": "Decor"
    },
    {
      "name": "NYC Poster",
      "image": "models/thumbnails/thumbnail_nyc2.jpg",
      "model": "models/js/nyc-poster2.js",
      "type": "2",
      "category": "Decor"
    },
    {
      "name": "Chair",
      "image": "models/thumbnails/thumbnail_Church-Chair-oak-white_1024x1024.jpg",
      "model": "models/js/gus-churchchair-whiteoak.js",
      "type": "1",
      "category": "Seating"
    },
    {
      "name": "Red Chair",
      "image": "models/thumbnails/thumbnail_tn-orange.png",
      "model": "models/js/ik-ekero-orange_baked.js",
      "type": "1",
      "category": "Seating"
    },
    {
      "name": "Blue Chair",
      "image": "models/thumbnails/thumbnail_ekero-blue3.png",
      "model": "models/js/ik-ekero-blue_baked.js",
      "type": "1",
      "category": "Seating"
    },
    {
      "name": "Guest Chair",
      "image": "models/thumbnails/thumbnail_Church-Chair-oak-white_1024x1024.jpg",
      "model": "models/js/gus-churchchair-whiteoak.js",
      "type": "1",
      "category": "Seating"
    },
    {
      "name": "Sectional - Olive",
      "image": "models/thumbnails/thumbnail_img21o.jpg",
      "model": "models/js/we-crosby2piece-greenbaked.json",
      "type": "1",
      "category": "Seating"
    },
    {
      "name": "Sofa - Grey",
      "image": "models/thumbnails/thumbnail_rochelle-sofa-3.jpg",
      "model": "models/js/cb-rochelle-gray_baked.js",
      "type": "1",
      "category": "Seating"
    },
    {
      "name": "Full Bed",
      "image": "models/thumbnails/thumbnail_nordli-bed-frame__0159270_PE315708_S4.JPG",
      "model": "models/js/ik_nordli_full.js",
      "type": "1",
      "category": "Bedroom"
    },
    {
      "name": "Dresser - Dark",
      "image": "models/thumbnails/thumbnail_matera_dresser_5.png",
      "model": "models/js/DWR_MATERA_DRESSER2.js",
      "type": "1",
      "category": "Bedroom"
    },
    {
      "name": "Dresser - White",
      "image": "models/thumbnails/thumbnail_img25o.jpg",
      "model": "models/js/we-narrow6white_baked.js",
      "type": "1",
      "category": "Bedroom"
    },
    {
      "name": "Bedside Table",
      "image": "models/thumbnails/thumbnail_Blu-Dot-Shale-Bedside-Table.jpg",
      "model": "models/js/bd-shalebedside-smoke_baked.js",
      "type": "1",
      "category": "Bedroom"
    },
    {
      "name": "Nightstand",
      "image": "models/thumbnails/thumbnail_arch-white-oval-nightstand.jpg",
      "model": "models/js/cb-archnight-white_baked.js",
      "type": "1",
      "category": "Bedroom"
    },
    {
      "name": "Wardrobe",
      "image": "models/thumbnails/thumbnail_TN-ikea-kvikine.png",
      "model": "models/js/ik-kivine_baked.js",
      "type": "1",
      "category": "Bedroom"
    },
    {
      "name": "Coffee Table",
      "image": "models/thumbnails/thumbnail_stockholm-coffee-table__0181245_PE332924_S4.JPG",
      "model": "models/js/ik-stockholmcoffee-brown.js",
      "type": "1",
      "category": "Tables"
    },
    {
      "name": "Side Table",
      "image": "models/thumbnails/thumbnail_Screen_Shot_2014-02-21_at_1.24.58_PM.png",
      "model": "models/js/GUSossingtonendtable.js",
      "type": "1",
      "category": "Tables"
    },
    {
      "name": "Dining Table",
      "image": "models/thumbnails/thumbnail_scholar-dining-table.jpg",
      "model": "models/js/cb-scholartable_baked.js",
      "type": "1",
      "category": "Tables"
    },
    {
      "name": "Dining Table 2",
      "image": "models/thumbnails/thumbnail_Screen_Shot_2014-01-28_at_6.49.33_PM.png",
      "model": "models/js/BlakeAvenuejoshuatreecheftable.js",
      "type": "1",
      "category": "Tables"
    },
    {
      "name": "Bookshelf",
      "image": "models/thumbnails/thumbnail_kendall-walnut-bookcase.jpg",
      "model": "models/js/cb-kendallbookcasewalnut_baked.js",
      "type": "1",
      "category": "Storage"
    },
    {
      "name": "Media Console",
      "image": "models/thumbnails/thumbnail_clapboard-white-60-media-console-1.jpg",
      "model": "models/js/cb-clapboard_baked.js",
      "type": "1",
      "category": "Storage"
    },
    {
      "name": "Media Console - Black",
      "image": "models/thumbnails/thumbnail_moore-60-media-console-1.jpg",
      "model": "models/js/cb-moore_baked.js",
      "type": "1",
      "category": "Storage"
    },
    {
      "name": "Wooden Trunk",
      "image": "models/thumbnails/thumbnail_teca-storage-trunk.jpg",
      "model": "models/js/cb-tecs_baked.js",
      "type": "1",
      "category": "Storage"
    },
    {
      "name": "Floor Lamp",
      "image": "models/thumbnails/thumbnail_ore-white.png",
      "model": "models/js/ore-3legged-white_baked.js",
      "type": "1",
      "category": "Lighting"
    },
    {
      "name": "Closed Door",
      "image": "models/thumbnails/thumbnail_Screen_Shot_2014-10-27_at_8.04.12_PM.png",
      "model": "models/js/closed-door28x80_baked.js",
      "type": "7",
      "category": "Doors & Windows"
    },
    {
      "name": "Open Door",
      "image": "models/thumbnails/thumbnail_Screen_Shot_2014-10-27_at_8.22.46_PM.png",
      "model": "models/js/open_door.js",
      "type": "7",
      "category": "Doors & Windows"
    },
    {
      "name": "Window",
      "image": "models/thumbnails/thumbnail_window.png",
      "model": "models/js/whitewindow.js",
      "type": "3",
      "category": "Doors & Windows"
    },
    {
      "name": "Blue Rug",
      "image": "models/thumbnails/thumbnail_cb-blue-block60x96.png",
      "model": "models/js/cb-blue-block-60x96.js",
      "type": "8",
      "category": "Rugs"
    },
    {
      "name": "Toilet Seat",
      "image": "models/thumbnails/toilet-seat.jpg",
      "model": "models/js/toilet-seat.json",
      "type": "1",
      "category": "Bathroom"
    },
    {
      "name": "User (3D)",
      "image": "models/thumbnails/thumbnail_Church-Chair-oak-white_1024x1024.jpg",
      "model": "models/js/user.json",
      "type": "1",
      "category": "People"
    },
    {
      "name": "Staircase",
      "image": "models/thumbnails/thumbnail_Church-Chair-oak-white_1024x1024.jpg",
      "model": null,
      "type": "10",
      "category": "Architecture"
    },
    { "name": "Light Wood Floor", "image": "rooms/textures/light_fine_wood.jpg", "model": "rooms/textures/light_fine_wood.jpg", "type": "texture-floor", "category": "Materials" },
    { "name": "Brick Wall", "image": "rooms/textures/light_brick.jpg", "model": "rooms/textures/light_brick.jpg", "type": "texture-wall", "category": "Materials" },
    { "name": "White Wall", "image": "rooms/textures/walllightmap.png", "model": "rooms/textures/walllightmap.png", "type": "texture-wall", "category": "Materials" }

  ];

  // ── Category order + icons ──────────────────────────────────────────────────
  var categoryOrder = [
    { key: "Seating",        icon: "🪑", color: "#4a90e2" },
    { key: "Bedroom",        icon: "🛏️", color: "#9b59b6" },
    { key: "Tables",         icon: "🪵", color: "#e67e22" },
    { key: "Storage",        icon: "🗄️", color: "#27ae60" },
    { key: "Lighting",       icon: "💡", color: "#f1c40f" },
    { key: "Doors & Windows",icon: "🚪", color: "#1abc9c" },
    { key: "Decor",          icon: "🖼️", color: "#e91e63" },
    { key: "Rugs",           icon: "🟫", color: "#795548" },
    { key: "Bathroom",       icon: "🚿", color: "#00bcd4" },
    { key: "People",         icon: "🧍", color: "#607d8b" },
    { key: "Architecture",   icon: "🏗️", color: "#ff5722" },
    { key: "Materials",      icon: "🎨", color: "#673ab7" }
  ];

  // ── Group items by category ─────────────────────────────────────────────────
  var categories = {};
  for (var i = 0; i < items.length; i++) {
    var cat = items[i].category || "Other";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(items[i]);
  }

  // ── Render sections ─────────────────────────────────────────────────────────
  var itemsDiv = $("#items-wrapper");
  itemsDiv.empty();

  // Add search box at top
  itemsDiv.append(
    '<div class="catalog-search-wrap">' +
      '<input type="text" id="catalog-search" placeholder="&#128269; Search items..." class="catalog-search-input" />' +
    '</div>'
  );

  categoryOrder.forEach(function (catObj) {
    var catItems = categories[catObj.key];
    if (!catItems || catItems.length === 0) return;

    var sectionId = "cat-" + catObj.key.replace(/[^a-z0-9]/gi, "-").toLowerCase();

    // Section wrapper
    itemsDiv.append(
      '<div class="catalog-section" data-category="' + catObj.key + '">' +
        '<div class="catalog-section-header" data-target="' + sectionId + '" style="border-left-color:' + catObj.color + '">' +
          '<span class="catalog-section-icon">' + catObj.icon + '</span>' +
          '<span class="catalog-section-title">' + catObj.key + '</span>' +
          '<span class="catalog-section-count">' + catItems.length + ' items</span>' +
          '<span class="catalog-section-arrow">&#9660;</span>' +
        '</div>' +
        '<div class="catalog-section-body" id="' + sectionId + '" style="display: none;">' + // Added display: none here
        '</div>' +
      '</div>'
    );

    var bodyDiv = $("#" + sectionId);
    catItems.forEach(function (item) {
      var modelUrl = item.model ? item.model : null;
      bodyDiv.append(
        '<a class="add-item catalog-item" ' +
          'model-name="' + item.name + '" ' +
          'model-url="' + modelUrl + '" ' +
          'model-type="' + item.type + '" ' +
          'data-search="' + item.name.toLowerCase() + '">' +
          '<img src="' + item.image + '" alt="' + item.name + '" loading="lazy" />' +
          '<span class="item-name">' + item.name + '</span>' +
        '</a>'
      );
    });
  });

  // ── Collapse / expand on header click ──────────────────────────────────────
  $(document).on("click", ".catalog-section-header", function () {
    var targetId = $(this).data("target");
    var body = $("#" + targetId);
    var arrow = $(this).find(".catalog-section-arrow");
    body.slideToggle(180);
    arrow.toggleClass("collapsed");
  });

  // ── Live search ─────────────────────────────────────────────────────────────
  $(document).on("input", "#catalog-search", function () {
    var query = $(this).val().toLowerCase().trim();
    var $sections = $(".catalog-section");
    var $items = $(".catalog-item");

    if (query === "") {
        // RESET: Hide all bodies and show all category headers
        $sections.show();
        $(".catalog-section-body").hide();
        $items.show().removeClass("search-match");
        $(".catalog-section-arrow").addClass("collapsed");
        return;
    }

    // 1. Filter items globally
    $items.each(function () {
        var name = $(this).attr("model-name").toLowerCase(); // Using the attribute for accuracy
        var isMatch = name.indexOf(query) !== -1;
        $(this).toggle(isMatch);
        if (isMatch) {
            $(this).addClass("search-match");
        } else {
            $(this).removeClass("search-match");
        }
    });

    // 2. Handle Section Visibility and Auto-Expansion
    $sections.each(function () {
        var $section = $(this);
        // We use the search-match class because jQuery's :visible returns false if the parent is hidden.
        var matchingItemsInSection = $section.find(".catalog-item.search-match").length;

        if (matchingItemsInSection > 0) {
            $section.show(); 
            // AUTO-OPEN: Reveal the body so the user sees the result immediately
            $section.find(".catalog-section-body").show();
            $section.find(".catalog-section-arrow").removeClass("collapsed");
        } else {
            // Hide the whole category if nothing matches
            $section.hide();
        }
    });
  });
});