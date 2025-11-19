// Create map
var map = L.map('map').setView([1.3, 32.3], 7);

// Tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
}).addTo(map);

// Load district info file
let districtInfo;

async function loadDistrictInfo() {
    const response = await fetch("district-data.json");
    districtInfo = await response.json();
}

loadDistrictInfo(); // load data first

// Load Uganda district GeoJSON
let districtLayer;

fetch("district_boundaries_2014.geojson")
  .then(res => res.json())
  .then(data => {

      districtLayer = L.geoJSON(data, {
        style: {
          color: "#333",
          weight: 1,
          fillColor: "#cce5ff",
          fillOpacity: 0.6
        },

        onEachFeature: function(feature, layer) {

          // CLICK EVENT
          layer.on("click", function() {
              const name = feature.properties.DNAME2014;

              const info = districtInfo[name];

              if (info) {
                document.getElementById("info-content").innerHTML = `
                  <strong>${name}</strong><br><br>
                  Population: ${info.population || "N/A"}<br>
                  Households: ${info.households || "N/A"}<br>
                  Literacy: ${info.literacy || "N/A"}<br>
                `;
              } else {
                document.getElementById("info-content").innerHTML = `
                  <strong>${name}</strong><br>
                  No data added yet.
                `;
              }
          });

          // HOVER EVENTS
          layer.on("mouseover", function(e) {
              e.target.setStyle({
                  fillColor: "#99ccff",
                  weight: 2
              });
          });

          layer.on("mouseout", function(e) {
              districtLayer.resetStyle(e.target);
          });

        }

      }).addTo(map);
  });
