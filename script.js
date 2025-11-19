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

// Load Uganda districts
fetch("district_boundaries_2014.geojson")
  .then(res => res.json())
  .then(data => {

      districtLayer = L.geoJSON(data, {

        style: {
          color: "#0056b3",
          weight: 1.4,
          fillColor: "#dceeff",
          fillOpacity: 0.7
        },

        onEachFeature: function(feature, layer) {
          
          layer.on("mouseover", function(e) {
              e.target.setStyle({
                  weight: 3,
                  fillColor: "#a8d1ff"
              });
          });

          layer.on("mouseout", function(e) {
              districtLayer.resetStyle(e.target);
          });

          layer.on("click", function(e) {
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

              // Center map on district when clicked
              map.fitBounds(e.target.getBounds());
          });

        }
      }).addTo(map);
  });

