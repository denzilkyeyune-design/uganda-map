//-----------------------------------------------------------
// INITIALIZE MAP
//-----------------------------------------------------------
var map = L.map("map").setView([1.3, 32.3], 7);

// Basemap layer
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);

// Toggle basemap (LEFT SIDEBAR CHECKBOX)
document.getElementById("toggleBasemap").onchange = function () {
    if (this.checked) map.addLayer(osm);
    else map.removeLayer(osm);
};

//-----------------------------------------------------------
// LOAD REGIONS
//-----------------------------------------------------------
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

// IMPORTANT: this must match HTML checkbox id="toggleRegions"
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

        // CLICK → load region HTML info
        layer.on("click", function () {
            let regionName = feature.properties.ADM1_EN;   // CENTRAL, EASTERN, etc.
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
        console.log("Regions loaded successfully.");
    })
    .catch(err => console.error("Failed loading region GeoJSON:", err));


// SHOW / HIDE REGIONS (LEFT SIDEBAR CHECKBOX)
document.getElementById("toggleRegions").onchange = function () {
    if (this.checked) map.addLayer(regionsLayer);
    else map.removeLayer(regionsLayer);
};

//-----------------------------------------------------------
// LOAD REGION INFORMATION FILE (RIGHT SIDEBAR)
//-----------------------------------------------------------
function loadRegionInfo(filePath) {
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                return "<p><b>No info available for this region.</b></p>";
            }
            return response.text();
        })
        .then(html => {
            document.getElementById("region-details").innerHTML = html;
        })
        .catch(err => {
            document.getElementById("region-details").innerHTML =
                "<p><b>Error loading region info.</b></p>";
        });
}
