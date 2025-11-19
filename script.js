// Create map
var map = L.map('map').setView([1.3, 32.3], 7);

// Basemap
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

// Layers
let districtsLayer;
let kampalaLayer;

// Highlight style
function highlightStyle() {
    return {
        weight: 3,
        color: "#00aa00",
        fillColor: "#ccffcc",
        fillOpacity: 0.7
    };
}

// Normal style
function defaultStyle() {
    return {
        weight: 1,
        color: "#333",
        fillColor: "#cce5ff",
        fillOpacity: 0.6
    };
}

// Click highlight
let selectedLayer = null;

// Load Uganda districts
fetch("district_boundaries_2014.geojson")
    .then(res => res.json())
    .then(data => {
        districtsLayer = L.geoJSON(data, {
            style: defaultStyle,
            onEachFeature: function (feature, layer) {

                layer.on("mouseover", function () {
                    this.setStyle({ fillColor: "#99ccff" });
                });

                layer.on("mouseout", function () {
                    this.setStyle(defaultStyle());
                });

                layer.on("click", function () {
                    const districtName =
                        feature.properties.DNAME2014 ||
                        feature.properties.NAME_2 ||
                        feature.properties.NAME_1 ||
                        "Unknown District";

                    // Sidebar update
                    document.getElementById("info-content").innerHTML =
                        `<h2>${districtName}</h2>Loading admin data...`;

                    // Highlight clicked district
                    if (selectedLayer) districtsLayer.resetStyle(selectedLayer);
                    selectedLayer = layer;
                    layer.setStyle(highlightStyle());

                    // Load Kampala only if selected
                    if (districtName.toUpperCase() === "KAMPALA") {
                        loadKampala();
                    } else {
                        if (kampalaLayer) {
                            map.removeLayer(kampalaLayer);
                            kampalaLayer = null;
                        }
                    }
                });
            }
        }).addTo(map);
    });

// Load Kampala admin units (parish/village polygons)
function loadKampala() {
    fetch("Kampala District.json")
        .then(res => res.json())
        .then(data => {

            // Remove previous layer if exists
            if (kampalaLayer) map.removeLayer(kampalaLayer);

            kampalaLayer = L.geoJSON(data, {
                style: {
                    color: "#0066cc",
                    weight: 1,
                    fillColor: "#99ddff",
                    fillOpacity: 0.5
                },

                onEachFeature: function (feature, layer) {

                    layer.on("mouseover", function () {
                        this.setStyle({ fillColor: "#55ccff" });
                    });

                    layer.on("mouseout", function () {
                        this.setStyle({ fillColor: "#99ddff" });
                    });

                    layer.on("click", function () {
                        const parish =
                            feature.properties.PNAME2014 ||
                            feature.properties.SNAME2014 ||
                            feature.properties.VNAME2014 ||
                            "Unknown";

                        const village =
                            feature.properties.VNAME2014 ||
                            "No village name";

                        document.getElementById("info-content").innerHTML = `
                            <h2>KAMPALA</h2>
                            <strong>Parish:</strong> ${parish}<br>
                            <strong>Village:</strong> ${village}<br>
                        `;
                    });
                }
            }).addTo(map);
        });
}
