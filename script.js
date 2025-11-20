// -------------------------------------------------------
// SIMPLE CLEAN MAP THAT LOADS UGANDA REGIONAL BOUNDARIES
// -------------------------------------------------------

// Create map
var map = L.map("map").setView([1.5, 32.5], 7);

// Basemap ON by default
var basemap = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  { maxZoom: 18 }
).addTo(map);

// Load regional boundaries GeoJSON
fetch("Uganda Regional Boundaries.geojson")
  .then(res => res.json())
  .then(data => {

    // Add to map
    var regionLayer = L.geoJSON(data, {
      style: {
        color: "#003366",
        weight: 2,
        fillColor: "#66b2ff",
        fillOpacity: 0.3
      },
      onEachFeature: function (feature, layer) {
        // Show region name on click
        layer.bindPopup(`<b>${feature.properties.NAME || "Region"}</b>`);
      }
    }).addTo(map);

    // Fit map to layer bounds
    map.fitBounds(regionLayer.getBounds());
  })
  .catch(err => console.error("Failed to load GeoJSON:", err));


