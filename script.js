// Initialize map
var map = L.map('map').setView([0.33, 32.58], 11);

// Basemap
var basemap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
basemap.addTo(map);

// Storage for layers
var divisionLayer, parishLayer, villageLayer;

// Load Kampala GeoJSON
fetch("kampala_admin.geojson")   // <-- rename your final file here
  .then(res => res.json())
  .then(data => {

    // --- FILTER LEVELS ---
    const divisions = data.features.filter(f => f.properties.CNAME2014);
    const parishes = data.features.filter(f => f.properties.PNAME2014);
    const villages = data.features.filter(f => f.properties.VNAME2014);

    // --- STYLE FUNCTIONS ---
    function styleDivision() {
      return { color: "#ff9900", weight: 1, fillOpacity: 0.1 };
    }
    function styleParish() {
      return { color: "#005ce6", weight: 1, fillOpacity: 0.1 };
    }
    function styleVillage() {
      return { color: "#00b300", weight: 1, fillOpacity: 0.3 };
    }

    // --- CLICK HANDLER: ALWAYS SHOW VILLAGE NAME ---
    function clickHandler(e, props) {
      let name = props.VNAME2014 || props.PNAME2014 || props.CNAME2014 || "Unknown";

      L.popup()
        .setLatLng(e.latlng)
        .setContent(`<b>${name}</b>`)
        .openOn(map);
    }

    // --- CREATE LAYERS ---
    divisionLayer = L.geoJSON(divisions, {
      style: styleDivision,
      onEachFeature: function (f, layer) {
        layer.on("click", e => clickHandler(e, f.properties));
      }
    });

    parishLayer = L.geoJSON(parishes, {
      style: styleParish,
      onEachFeature: function (f, layer) {
        layer.on("click", e => clickHandler(e, f.properties));
      }
    });

    villageLayer = L.geoJSON(villages, {
      style: styleVillage,
      onEachFeature: function (f, layer) {
        layer.on("click", e => clickHandler(e, f.properties));
      }
    });

    // Add default visible layer
    villageLayer.addTo(map);

    // --- LAYER SWITCHER ICON ---
    L.control.layers(
      { "Basemap": basemap },
      {
        "Village Level": villageLayer,
        "Parish Level": parishLayer,
        "Division Level": divisionLayer
      },
      { collapsed: false }
    ).addTo(map);

  });
