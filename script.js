// ---------------------------
// MAP INITIALIZATION
// ---------------------------
var map = L.map('map').setView([1.5, 32.5], 7);

var basemap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);

// Regions group
var regionsLayer = L.geoJSON(null, {
    style: {
        color: "#0057e7",
        weight: 2,
        fillOpacity: 0.15
    },
    onEachFeature: function (feature, layer) {

        // Hover highlight
        layer.on("mouseover", function () {
            this.setStyle({
                weight: 4,
                color: "#ff6600"
            });
        });

        layer.on("mouseout", function () {
            regionsLayer.resetStyle(this);
        });

        // Click event – load HTML file
        layer.on("click", function () {
            var regionName = feature.properties.ADM1_EN;  // e.g., CENTRAL
            loadRegionInfo(regionName);
        });
    }
}).addTo(map);

// ---------------------------
// LOAD REGIONS JSON
// ---------------------------
fetch("Uganda Regional Boundaries.json")
    .then(res => res.json())
    .then(data => regionsLayer.addData(data));


// ---------------------------
// LOAD INFORMATION HTML FILE
// ---------------------------
function loadRegionInfo(regionName) {
    let filename = "";

    // map name to correct file
    switch (regionName.toUpperCase()) {
        case "CENTRAL": filename = "Regional Information/CENTRAL.html"; break;
        case "EASTERN": filename = "Regional Information/Eastern.html"; break;
        case "NORTHERN": filename = "Regional Information/Northern.html"; break;
        case "WESTERN": filename = "Regional Information/Western.html"; break;
        default:
            document.getElementById("region-info").innerHTML = "<b>No info available</b>";
            return;
    }

    fetch(filename)
        .then(res => res.text())
        .then(html => {
            document.getElementById("region-info").innerHTML = html;
        })
        .catch(() => {
            document.getElementById("region-info").innerHTML = "<b>Unable to load info file.</b>";
        });
}


// ---------------------------
// TOGGLES
// ---------------------------
document.getElementById("toggleBasemap").addEventListener("change", function () {
    if (this.checked) map.addLayer(basemap);
    else map.removeLayer(basemap);
});

document.getElementById("toggleRegions").addEventListener("change", function () {
    if (this.checked) map.addLayer(regionsLayer);
    else map.removeLayer(regionsLayer);
});


