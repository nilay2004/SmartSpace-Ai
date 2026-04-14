// Blueprint3D - Furniture Catalog
// Populates the "Add Items" grid with item cards

$(document).ready(function() {
  var items = [
    {
      "name" : "Ganesha Poster",
      "image" : "models/thumbnails/ganesha-poster.jpg",
      "model" : "models/js/ganesha-poster.json",
      "type" : "2",
      "category" : "Decor"
    },
    {
      "name" : "Mirror",
      "image" : "models/thumbnails/ganesha-poster.jpg",
      "model" : "models/js/mirror.json",
      "type" : "2",
      "category" : "Decor"
    },
    {
      "name" : "User (3D)",
      "image" : "models/thumbnails/thumbnail_Church-Chair-oak-white_1024x1024.jpg",
      "model" : "models/js/user.json",
      "type" : "1",
      "category" : "People"
    },
    {
      "name" : "Closed Door",
      "image" : "models/thumbnails/thumbnail_Screen_Shot_2014-10-27_at_8.04.12_PM.png",
      "model" : "models/js/closed-door28x80_baked.js",
      "type" : "7",
      "category" : "Doors"
    }, 
    {
      "name" : "Open Door",
      "image" : "models/thumbnails/thumbnail_Screen_Shot_2014-10-27_at_8.22.46_PM.png",
      "model" : "models/js/open_door.js",
      "type" : "7",
      "category" : "Doors"
    }, 
    {
      "name" : "Window",
      "image" : "models/thumbnails/thumbnail_window.png",
      "model" : "models/js/whitewindow.js",
      "type" : "3",
      "category" : "Windows"
    }, 
    {
      "name" : "Chair",
      "image" : "models/thumbnails/thumbnail_Church-Chair-oak-white_1024x1024.jpg",
      "model" : "models/js/gus-churchchair-whiteoak.js",
      "type" : "1",
      "category" : "Seating"
    }, 
    {
      "name" : "Red Chair",
      "image" : "models/thumbnails/thumbnail_tn-orange.png",
      "model" : "models/js/ik-ekero-orange_baked.js",
      "type" : "1",
      "category" : "Seating"
    },
    {
      "name" : "Blue Chair",
      "image" : "models/thumbnails/thumbnail_ekero-blue3.png",
      "model" : "models/js/ik-ekero-blue_baked.js",
      "type" : "1",
      "category" : "Seating"
    },
    {
      "name" : "Dresser - Dark",
      "image" : "models/thumbnails/thumbnail_matera_dresser_5.png",
      "model" : "models/js/DWR_MATERA_DRESSER2.js",
      "type" : "1",
      "category" : "Storage"
    }, 
    {
      "name" : "Dresser - White",
      "image" : "models/thumbnails/thumbnail_img25o.jpg",
      "model" : "models/js/we-narrow6white_baked.js",
      "type" : "1",
      "category" : "Storage"
    },  
    {
      "name" : "Bedside Table",
      "image" : "models/thumbnails/thumbnail_Blu-Dot-Shale-Bedside-Table.jpg",
      "model" : "models/js/bd-shalebedside-smoke_baked.js",
      "type" : "1",
      "category" : "Tables"
    }, 
    {
      "name" : "Nightstand",
      "image" : "models/thumbnails/thumbnail_arch-white-oval-nightstand.jpg",
      "model" : "models/js/cb-archnight-white_baked.js",
      "type" : "1",
      "category" : "Tables"
    }, 
    {
      "name" : "Wardrobe",
      "image" : "models/thumbnails/thumbnail_TN-ikea-kvikine.png",
      "model" : "models/js/ik-kivine_baked.js",
      "type" : "1",
      "category" : "Storage"
    }, 
    {
      "name" : "Full Bed",
      "image" : "models/thumbnails/thumbnail_nordli-bed-frame__0159270_PE315708_S4.JPG",
      "model" : "models/js/ik_nordli_full.js",
      "type" : "1",
      "category" : "Beds"
    }, 
    {
      "name" : "Bookshelf",
      "image" : "models/thumbnails/thumbnail_kendall-walnut-bookcase.jpg",
      "model" : "models/js/cb-kendallbookcasewalnut_baked.js",
      "type" : "1",
      "category" : "Storage"
    }, 
    {
      "name" : "Media Console",
      "image" : "models/thumbnails/thumbnail_clapboard-white-60-media-console-1.jpg",
      "model" : "models/js/cb-clapboard_baked.js",
      "type" : "1",
      "category" : "Storage"
    }, 
    {
      "name" : "Media Console - Black",
      "image" : "models/thumbnails/thumbnail_moore-60-media-console-1.jpg",
      "model" : "models/js/cb-moore_baked.js",
      "type" : "1",
      "category" : "Storage"
    }, 
    {
      "name" : "Sectional - Olive",
      "image" : "models/thumbnails/thumbnail_img21o.jpg",
      "model" : "models/js/we-crosby2piece-greenbaked.json",
      "type" : "1",
      "category" : "Seating"
    }, 
    {
      "name" : "Sofa - Grey",
      "image" : "models/thumbnails/thumbnail_rochelle-sofa-3.jpg",
      "model" : "models/js/cb-rochelle-gray_baked.js",
      "type" : "1",
      "category" : "Seating"
    }, 
    {
      "name" : "Wooden Trunk",
      "image" : "models/thumbnails/thumbnail_teca-storage-trunk.jpg",
      "model" : "models/js/cb-tecs_baked.js",
      "type" : "1",
      "category" : "Storage"
    }, 
    {
      "name" : "Floor Lamp",
      "image" : "models/thumbnails/thumbnail_ore-white.png",
      "model" : "models/js/ore-3legged-white_baked.js",
      "type" : "1",
      "category" : "Lighting"
    },
    {
      "name" : "Coffee Table",
      "image" : "models/thumbnails/thumbnail_stockholm-coffee-table__0181245_PE332924_S4.JPG",
      "model" : "models/js/ik-stockholmcoffee-brown.js",
      "type" : "1",
      "category" : "Tables"
    }, 
    {
      "name" : "Side Table",
      "image" : "models/thumbnails/thumbnail_Screen_Shot_2014-02-21_at_1.24.58_PM.png",
      "model" : "models/js/GUSossingtonendtable.js",
      "type" : "1",
      "category" : "Tables"
    }, 
    {
      "name" : "Dining Table",
      "image" : "models/thumbnails/thumbnail_scholar-dining-table.jpg",
      "model" : "models/js/cb-scholartable_baked.js",
      "type" : "1",
      "category" : "Tables"
    }, 
    {
      "name" : "Dining Table 2",
      "image" : "models/thumbnails/thumbnail_Screen_Shot_2014-01-28_at_6.49.33_PM.png",
      "model" : "models/js/BlakeAvenuejoshuatreecheftable.js",
      "type" : "1",
      "category" : "Tables"
    },
    {
      "name" : "Toilet Seat",
      "image" : "models/thumbnails/toilet-seat.jpg",
      "model" : "models/js/toilet-seat.json",
      "type" : "1",
      "category" : "Bathroom"
    },
    {
      "name" : "NYC Poster",
      "image" : "models/thumbnails/thumbnail_nyc2.jpg",
      "model" : "models/js/nyc-poster2.js",
      "type" : "2",
      "category" : "Decor"
    },
    {
      "name" : "Blue Rug",
      "image" : "models/thumbnails/thumbnail_cb-blue-block60x96.png",
      "model" : "models/js/cb-blue-block-60x96.js",
      "type" : "8",
      "category" : "Rugs"
    },
    {
      "name" : "Guest Chair",
      "image" : "models/thumbnails/thumbnail_Church-Chair-oak-white_1024x1024.jpg",
      "model" : "models/js/gus-churchchair-whiteoak.js",
      "type" : "1",
      "category" : "Seating"
    },
    {
      "name" : "Staircase",
      "image" : "models/thumbnails/thumbnail_Church-Chair-oak-white_1024x1024.jpg",
      "model" : null,
      "type" : "10",
      "category" : "Architecture"
    }
  ];

  var itemsDiv = $("#items-wrapper");
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var modelUrl = item.model ? item.model : null;
    var html = '<a class="add-item" model-name="' +
                item.name +
                '" model-url="' +
                modelUrl +
                '" model-type="' +
                item.type +
                '">' +
                '<img src="' +
                item.image +
                '" alt="' + item.name + '" loading="lazy"> ' +
                '<span class="item-name">' + item.name + '</span>' +
                '</a>';
    itemsDiv.append(html);
  }
});
