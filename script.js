// -----------------------------------------------------------
// INITIALIZE MAP
// -----------------------------------------------------------
var map = L.map("map").setView([1.3, 32.3], 7);

// Basemap layer
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);

// Toggle basemap on/off
document.getElementById("basemapToggle").onchange = function () {
    if (this.checked) map.addLayer(osm);
    else map.removeLayer(osm);
};

// -----------------------------------------------------------
// LOAD REGIONS
// -----------------------------------------------------------
var regionStyle = {
    color: "blue",
    weight: 2,
    fillOpacity: 0.15
};

var highlightStyle = {
    color: "orange",
    weight: 3,
    fillOpacity: 0.3
};

var regionsLayer = L.geoJSON(null, {
    style: regionStyle,

    onEachFeature: function (feature, layer) {

        // Hover effect
        layer.on("mouseover", function () {
            layer.setStyle(highlightStyle);
        });

        layer.on("mouseout", function () {
            regionsLayer.resetStyle(layer);
        });

        // CLICK event — load region info file
        layer.on("click", function () {
            let regionName = feature.properties.ADM1_EN;   // Example: "CENTRAL"

            let filePath = "Regional Information/" + regionName + ".html";

            loadRegionInfo(filePath);

            // Zoom to region
            map.fitBounds(layer.getBounds());
        });
    }
}).addTo(map);

// Load Region GeoJSON
fetch("Uganda Regional Boundaries.json")
    .then(res => res.json())
    .then(data => {
        regionsLayer.addData(data);
        console.log("Regions loaded");
    });

// Show/hide regions
document.getElementById("regionsToggle").onchange = function () {
    if (this.checked) map.addLayer(regionsLayer);
    else map.removeLayer(regionsLayer);
};

// -----------------------------------------------------------
// LOAD REGION INFO HTML FILE
// -----------------------------------------------------------
function loadRegionInfo(filePath) {
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                return "<p><b>No info file found.</b></p>";
            }
            return response.text();
        })
        .then(html => {
            document.getElementById("regionInfoBox").innerHTML = html;
        })
        .catch(err => {
            document.getElementById("regionInfoBox").innerHTML =
                "<p><b>Error loading region info.</b></p>";
        });
}



