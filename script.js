// Create map
var map = L.map('map').setView([1.3, 32.3], 7);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map);

// Variable to store district data from JSON file
let districtData = {};

// Load district data
fetch("district-data.json")
  .then(res => res.json())
  .then(json => {
    districtData = json;
  });

// Load GeoJSON
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

          let districtName = feature.properties.NAME_1;

          let info = districtData[districtName];

          if (info) {
            document.getElementById("info-content").innerHTML = `
              <strong>${districtName}</strong><br><br>
              <b>Population:</b> ${info.population}<br>
              <b>Households:</b> ${info.households}<br>
              <b>Literacy:</b> ${info.literacy}<br>
            `;
          } else {
            document.getElementById("info-content").innerHTML = `
              <strong>${districtName}</strong><br>
              <b>No data added yet.</b><br>
            `;
          }

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
