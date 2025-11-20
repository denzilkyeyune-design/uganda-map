// Initialize map
var map = L.map('map').setView([1.3, 32.3], 7);

// Basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
}).addTo(map);

// Load Uganda Regional Boundaries
fetch("Uganda%20Regional%20Boundaries.json")
  .then(res => res.json())
  .then(data => {
      L.geoJSON(data, {
          style: {
              color: "#0000ff",
              weight: 2,
              fillColor: "#99ccff",
              fillOpacity: 0.4
          },
          onEachFeature: function (feature, layer) {
              layer.bindPopup(`
                  <strong>${feature.properties.ADM1_EN}</strong><br>
                  Code: ${feature.properties.ADM1_PCODE}
              `);
          }
      }).addTo(map);
  })
  .catch(err => console.error("Failed to load Regional Boundaries:", err));


