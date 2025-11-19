// Create map
var map = L.map('map').setView([1.3, 32.3], 7);

// Tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
}).addTo(map);

// Load district info
let districtInfo = {};

fetch("district-info.json")
  .then(res => res.json())
  .then(data => districtInfo = data);

// Load Uganda district GeoJSON
fetch("district_boundaries_2014.geojson")
  .then(res => res.json())
  .then(data => {
      L.geoJSON(data, {
        style: {
          color: "#333",
          weight: 1,
          fillColor: "#cce5ff",
          fillOpacity: 0.6
        },
        onEachFeature: function(feature, layer) {

          layer.on("click", function() {
              const name = feature.properties.DNAME2014;

              const info = districtInfo[name];

              if (info) {
                document.getElementById("info-content").innerHTML = `
                  <strong>${name}</strong><br><br>
                  Population: ${info.population}<br>
                  Households: ${info.households}<br>
                  Literacy: ${info.literacy}<br>
                `;
              } else {
                document.getElementById("info-content").innerHTML = `
                  <strong>${name}</strong><br>
                  No data added yet.
                `;
              }
          });

          layer.on("mouseover", function() {
              this.setStyle({ fillColor: "#99ccff" });
          });

          layer.on("mouseout", function() {
              this.setStyle({ fillColor: "#cce5ff" });
          });
        }
      }).addTo(map);
  });
