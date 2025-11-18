// Create map
var map = L.map('map').setView([1.3, 32.3], 7);

// Add OSM tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map);

// Load Uganda GeoJSON
fetch("uganda.json")
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: {
        color: "#333",
        weight: 1,
        fillColor: "#cce5ff",
        fillOpacity: 0.6
      },
      onEachFeature: function (feature, layer) {
        layer.on("click", function () {
          const districtName = feature.properties.NAME_1; // matches your file

          document.getElementById("info-content").innerHTML = `
              <strong>${districtName}</strong><br>
              Population: (add later)<br>
              Households: (add later)<br>
              Literacy: (add later)
          `;
        });

        layer.on("mouseover", function () {
          this.setStyle({ fillColor: "#99ccff" });
        });

        layer.on("mouseout", function () {
          this.setStyle({ fillColor: "#cce5ff" });
        });
      }
    }).addTo(map);
  });
