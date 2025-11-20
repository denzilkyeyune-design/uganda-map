// Create map
var map = L.map("map").setView([1.3, 32.3], 8);

// Basemap
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);

// Layer groups
var regionsGroup = L.geoJSON(null, {
    style: { color: "purple", weight: 2, fillOpacity: 0.1 }
});

var districtsGroup = L.geoJSON(null, {
    style: { color: "blue", weight: 1, fillOpacity: 0.1 }
});

var villagesGroup = L.geoJSON(null, {
    style: { color: "red", weight: 0.3, fillOpacity: 0.1 }
});

// Load Regions
fetch("Uganda Regional Boundaries.json")
    .then(res => res.json())
    .then(data => {
        regionsGroup.addData(data);
        console.log("Regions loaded");
    });

// Load Districts
fetch("Uganda District Boundaries 2014.geojson")
    .then(res => res.json())
    .then(data => {
        districtsGroup.addData(data);
        console.log("Districts loaded");
    });

// Load Villages
fetch("Uganda Villages 2009.json")
    .then(res => res.json())
    .then(data => {
        villagesGroup.addData(data);
        console.log("Villages loaded");
    });

//---------------------------------------------
//  KAMPALA DISTRICT LAYER
//---------------------------------------------
const kampalaLayer = L.geoJSON(null, {
    style: {
        color: "#ff6600",
        weight: 2,
        fillOpacity: 0.15
    },
    onEachFeature: (feature, layer) => {
        const name =
            feature.properties.DNAME2014 ||
            feature.properties.ADM1_EN ||
            feature.properties.name ||
            "Unknown";

        layer.bindPopup(`<b>Kampala District</b><br>${name}`);
    }
}).addTo(map);

loadGeoJSON("Kampala District.json", kampalaLayer, {
    loadedMessage: "Kampala district loaded"
});

// Toggle Layers
document.getElementById("regionsLayer").addEventListener("change", function () {
    if (this.checked) map.addLayer(regionsGroup);
    else map.removeLayer(regionsGroup);
});

document.getElementById("districtsLayer").addEventListener("change", function () {
    if (this.checked) map.addLayer(districtsGroup);
    else map.removeLayer(districtsGroup);
});

document.getElementById("villagesLayer").addEventListener("change", function () {
    if (this.checked) map.addLayer(villagesGroup);
    else map.removeLayer(villagesGroup);
});

document.getElementById("kampalaToggle").addEventListener("change", (e) => {
    if (e.target.checked) map.addLayer(kampalaLayer);
    else map.removeLayer(kampalaLayer);
});

