// Create map
var map = L.map('map').setView([1.3, 32.3], 7);

// Tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
}).addTo(map);

// Load district info (history, stats, etc.)
let districtInfo;

async function loadDistrictInfo() {
    const res = await fetch("district-data.json");
    districtInfo = await res.json();
}
loadDistrictInfo();

let districtLayer;
let selectedDistrict = null;

// Load Uganda district boundaries
fetch("district_boundaries_2014.geojson")
  .then(res => res.json())
  .then(data => {

      districtLayer = L.geoJSON(data, {

        style: {
          color: "#004d26",
          weight: 1.2,
          fillColor: "#d9f2e6",
          fillOpacity: 0.6
        },

        onEachFeature: function(feature, layer) {

          // Hover effect (not when selected)
          layer.on("mouseover", function(e) {
              if (selectedDistrict !== layer) {
                e.target.setStyle({
                    weight: 3,
                    fillColor: "#bcefd6"
                });
              }
          });

          layer.on("mouseout", function(e) {
              if (selectedDistrict !== layer) {
                districtLayer.resetStyle(e.target);
              }
          });

          // CLICK — highlight in green + open sidebar
          layer.on("click", function(e) {

              const name = feature.properties.DNAME2014;
              const info = districtInfo[name];

              // Reset old selection
              if (selectedDistrict) {
                  districtLayer.resetStyle(selectedDistrict);
              }

              // Fade all districts
              districtLayer.setStyle({
                  fillOpacity: 0.2,
                  color: "#999"
              });

              // Highlight selected district (green)
              layer.setStyle({
                  color: "#0b8a43",
                  weight: 3.5,
                  fillColor: "#7fe2a1",
                  fillOpacity: 0.9
              });

              selectedDistrict = layer;
              layer.bringToFront();

              // Update sidebar
              document.getElementById("district-title").innerText = name;

              if (info) {
                document.getElementById("district-details").innerHTML = `
                    <strong>Origin & Naming:</strong><br>
                    ${info.origin || "—"}<br><br>

                    <strong>Year Created:</strong><br>
                    ${info.year_created || "—"}<br><br>

                    <strong>Population:</strong><br>
                    ${info.population || "—"}<br><br>

                    <strong>Number of Schools:</strong><br>
                    ${info.schools || "—"}<br><br>

                    <strong>Number of Hospitals:</strong><br>
                    ${info.hospitals || "—"}<br><br>

                    <strong>Other Notes:</strong><br>
                    ${info.notes || "—"}
                `;
              } else {
                document.getElementById("district-details").innerHTML =
                  "No data added yet.";
              }
          });

        }
      }).addTo(map);
  });



