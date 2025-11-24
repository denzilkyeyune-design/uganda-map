//-----------------------------------------------------
// INITIALIZE MAP
//-----------------------------------------------------
var map = L.map("map").setView([1.3, 32.3], 7);

// Basemap
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);

// Basemap toggle
document.getElementById("toggleBasemap").onchange = function () {
    if (this.checked) map.addLayer(osm);
    else map.removeLayer(osm);
};

//-----------------------------------------------------
// LOAD REGIONS
//-----------------------------------------------------
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

        // Hover highlight
        layer.on("mouseover", function () {
            layer.setStyle(highlightStyle);
        });

        layer.on("mouseout", function () {
            regionsLayer.resetStyle(layer);
        });

        // CLICK = load region info + zoom
        layer.on("click", function () {
            let regionName = feature.properties.ADM1_EN;
            let filePath = "Regional Information/" + regionName + ".html";

            loadRegionInfo(filePath);
            map.fitBounds(layer.getBounds());
        });
    }
}).addTo(map);

// Load GeoJSON
fetch("Uganda Regional Boundaries.json")
    .then(res => res.json())
    .then(data => {
        regionsLayer.addData(data);
        console.log("Regions loaded");
    });

// Region Toggle
document.getElementById("toggleRegions").onchange = function () {
    if (this.checked) map.addLayer(regionsLayer);
    else map.removeLayer(regionsLayer);
};

//-----------------------------------------------------
// LOAD REGION INFO FROM HTML FILE
//-----------------------------------------------------
function loadRegionInfo(filePath) {
    fetch(filePath)
        .then(response => {
            if (!response.ok) return "<p><b>No info available.</b></p>";
            return response.text();
        })
        .then(html => {
            document.getElementById("region-details").innerHTML = html;
        })
        .catch(err => {
            document.getElementById("region-details").innerHTML =
                "<p><b>Error loading info.</b></p>";
        });
}



