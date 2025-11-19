// Create map
var map = L.map('map').setView([1.3, 32.3], 7);

// Tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
}).addTo(map);

// Load district info
let districtInfo;

async function loadDistrictInfo() {
    const res = await fetch("district-data.json");
    districtInfo = await res.json();
}
loadDistrictInfo();

let districtLayer;
let selectedDistrict = null; // <-- track clicked district

// Load Uganda districts
fetch("district_boundaries_2014.geojson")
  .then(res => res.json())
  .then(data => {

      districtLayer = L.geoJSON(data, {

        style: function(feature) {
          return {
            color: "#0056b3",
            weight: 1.4,
            fillColor: "#dceeff",
            fillOpacity: 0.7
          };
        },

        onEachFeature: function(feature, layer) {

          // HOVER effects (only if not selected)
          layer.on("mouseover", function(e) {
              if (selectedDistrict !== layer) {
                e.target.setStyle({
                    weight: 3,
                    fillColor: "#a8d1ff"
                });
              }
          });

          layer.on("mouseout", function(e) {
              if (selectedDistrict !== layer) {
                districtLayer.resetStyle(e.target);
              }
          });

          // CLICK event with pop-out highlight
          layer.on("click", function(e) {
              
              const name = feature.properties.DNAME2014;
              const info = districtInfo[name];

              // Update info panel
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

              // Reset previous selection
              if (selectedDistrict) {
                  districtLayer.resetStyle(selectedDistrict);
              }

              // Fade all districts slightly
              districtLayer.setStyle({
                  fillOpacity: 0.3,
                  color: "#888"
              });

              // Highlight the selected district strongly
              layer.setStyle({
                  color: "#003d99",
                  weight: 4,
                  fillColor: "#66aaff",
                  fillOpacity: 0.8
              });

              selectedDistrict = layer;

              // Bring the selected district to front visually
              layer.bringToFront();

              // Zoom into the clicked district
              map.fitBounds(e.target.getBounds());
          });

        }
      }).addTo(map);
  });


