// Create map
var map = L.map('map').setView([1.3, 32.3], 7);

// Base map layer
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
});
osm.addTo(map);

// Basemap toggle
let basemapVisible = true;
document.getElementById("toggleBasemap").addEventListener("click", function () {
    if (basemapVisible) {
        map.removeLayer(osm);
        basemapVisible = false;
        this.textContent = "🗺️ Basemap: OFF";
    } else {
        map.addLayer(osm);
        basemapVisible = true;
        this.textContent = "🗺️ Basemap: ON";
    }
});

// Load district info JSON
let districtInfo = {};
fetch("district-data.json")
    .then(res => res.json())
    .then(data => districtInfo = data);

// Click highlight storage
let selectedLayer = null;

// Load Uganda district boundaries
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

            onEachFeature: function (feature, layer) {

                // Mouse hover effect
                layer.on("mouseover", function () {
                    if (layer !== selectedLayer) {
                        layer.setStyle({ fillColor: "#99ccff" });
                    }
                });

                layer.on("mouseout", function () {
                    if (layer !== selectedLayer) {
                        layer.setStyle({ fillColor: "#cce5ff" });
                    }
                });

                // Click event → Highlight + sidebar update
                layer.on("click", function () {

                    // Reset previous selection
                    if (selectedLayer) {
                        selectedLayer.setStyle({
                            fillColor: "#cce5ff",
                            color: "#333",
                            weight: 1
                        });
                    }

                    // Apply new highlight
                    layer.setStyle({
                        fillColor: "green",
                        color: "black",
                        weight: 3
                    });

                    selectedLayer = layer;

                    // District Name
                    const name =
                        feature.properties.DNAME2014 ||
                        feature.properties.NAME_1 ||
                        feature.properties.DISTRICT ||
                        "Unknown District";

                    // Info data
                    const info = districtInfo[name];

                    if (info) {
                        document.getElementById("info-content").innerHTML = `
                            <h3>${name}</h3>
                            <p><strong>Population:</strong> ${info.population}</p>
                            <p><strong>Households:</strong> ${info.households}</p>
                            <p><strong>Literacy Rate:</strong> ${info.literacy}</p>
                            <p><strong>Notes:</strong> ${info.notes || "None"}</p>
                        `;
                    } else {
                        document.getElementById("info-content").innerHTML = `
                            <h3>${name}</h3>
                            <p>No data added yet.</p>
                        `;
                    }
                });

            }
        }).addTo(map);
    });
