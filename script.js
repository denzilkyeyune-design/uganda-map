// =========================
// INITIAL MAP SETUP
// =========================

var map = L.map('map').setView([1.3, 32.3], 7);

var basemapVisible = true;

var basemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);


// =========================
// UI BUTTONS
// =========================

// Toggle basemap
document.getElementById("toggle-basemap").onclick = function() {
    if (basemapVisible) {
        map.removeLayer(basemap);
        this.innerText = "Basemap: OFF";
    } else {
        basemap.addTo(map);
        this.innerText = "Basemap: ON";
    }
    basemapVisible = !basemapVisible;
};

// Reset map
document.getElementById("reset-map").onclick = function() {
    map.setView([1.3, 32.3], 7);
    if (selectedLayer) districtsLayer.resetStyle(selectedLayer);
    if (kampalaLayer) map.removeLayer(kampalaLayer);
    document.getElementById("info-content").innerHTML = "Click any district to view details.";
};



// =========================
// LAYER VARIABLES
// =========================

let districtsLayer;
let kampalaLayer;
let selectedLayer = null;


// =========================
// STYLE FUNCTIONS
// =========================

function defaultStyle() {
    return {
        weight: 1,
        color: "#333",
        fillColor: "#cce5ff",
        fillOpacity: 0.6
    };
}

function hoverStyle() {
    return {
        weight: 2,
        color: "#000",
        fillColor: "#99ccff",
        fillOpacity: 0.7
    };
}

function selectedStyle() {
    return {
        weight: 3,
        color: "#00aa00",
        fillColor: "#ccffcc",
        fillOpacity: 0.7
    };
}



// =========================
// LOAD UGANDA DISTRICTS
// =========================

fetch("district_boundaries_2014.geojson")
    .then(res => res.json())
    .then(data => {
        districtsLayer = L.geoJSON(data, {
            style: defaultStyle,
            onEachFeature: function(feature, layer) {

                // Hover
                layer.on("mouseover", function() {
                    this.setStyle(hoverStyle());
                });
                layer.on("mouseout", function() {
                    if (selectedLayer !== layer)
                        this.setStyle(defaultStyle());
                });

                // Click
                layer.on("click", function() {
                    const distName = (
                        feature.properties.DNAME2014 ||
                        feature.properties.NAME_2 ||
                        feature.properties.NAME_1 ||
                        "Unknown District"
                    ).toUpperCase();

                    // Sidebar update
                    document.getElementById("info-content").innerHTML =
                        `<h3>${distName}</h3>Loading details...`;

                    // Maintain click highlight
                    if (selectedLayer) districtsLayer.resetStyle(selectedLayer);
                    selectedLayer = layer;
                    layer.setStyle(selectedStyle());

                    // Load Kampala if selected
                    if (distName === "KAMPALA") {
                        loadKampalaAdmin();
                    } else {
                        if (kampalaLayer) map.removeLayer(kampalaLayer);
                    }
                });
            }
        }).addTo(map);
    });



// =========================
// LOAD KAMPALA ADMIN LEVELS
// =========================

function loadKampalaAdmin() {

    fetch("Kampala District.json")
        .then(res => res.json())
        .then(data => {

            if (kampalaLayer) map.removeLayer(kampalaLayer);

            kampalaLayer = L.geoJSON(data, {

                style: {
                    color: "#0066cc",
                    weight: 1,
                    fillColor: "#99ddff",
                    fillOpacity: 0.5
                },

                onEachFeature: function(feature, layer) {

                    layer.on("mouseover", function() {
                        this.setStyle({ fillColor: "#55ccff" });
                    });

                    layer.on("mouseout", function() {
                        this.setStyle({ fillColor: "#99ddff" });
                    });

                    layer.on("click", function() {

                        const village =
                            feature.properties.VNAME2014 ||
                            feature.properties.VILLAGE ||
                            feature.properties.EANAME2014 ||
                            "Unknown Village";

                        const parish =
                            feature.properties.PNAME2014 ||
                            feature.properties.PARISH ||
                            "Unknown Parish";

                        const subcounty =
                            feature.properties.SNAME2014 ||
                            "Unknown Subcounty";

                        document.getElementById("info-content").innerHTML = `
                            <h3>Kampala</h3>
                            <strong>Village:</strong> ${village}<br>
                            <strong>Parish:</strong> ${parish}<br>
                            <strong>Subcounty:</strong> ${subcounty}<br>
                        `;
                    });

                }

            }).addTo(map);
        });
}
