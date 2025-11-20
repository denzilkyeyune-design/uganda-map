// Create map
var map = L.map("map").setView([1.3, 32.3], 8);

// Basemap
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);

// --- Layer Groups ---
var regionsGroup = L.geoJSON(null, {
    style: { color: "purple", weight: 2, fillOpacity: 0.1 }
});

var districtsGroup = L.geoJSON(null, {
    style: { color: "blue", weight: 1, fillOpacity: 0.1 }
});

var villagesGroup = L.geoJSON(null, {
    style: { color: "red", weight: 0.3, fillOpacity: 0.1 }
});

// Kampala needs its own group
var kampalaGroup = L.geoJSON(null, {
    style: { color: "green", weight: 2, fillOpacity: 0.1 }
});


// --- Load Regions ---
fetch("Uganda Regional Boundaries.json")
    .then(res => res.json())
    .then(data => {
        regionsGroup.addData(data);
        console.log("Regions loaded");
    })
    .catch(err => console.error("Regions error:", err));


// --- Load Districts ---
fetch("Uganda District Boundaries 2014.geojson")
    .then(res => res.json())
    .then(data => {
        districtsGroup.addData(data);
        console.log("Districts loaded");
    })
    .catch(err => console.error("Districts error:", err));


// --- Load Kampala (correct filename!) ---
fetch("Kampala District.json")
    .then(res => res.json())
    .then(data => {
        kampalaGroup.addData(data);
        console.log("Kampala loaded");
    })
    .catch(err => console.error("Kampala error:", err));


// --- Load Villages ---
fetch("Uganda Villages 2009.json")
    .then(res => res.json())
    .then(data => {
        villagesGroup.addData(data);
        console.log("Villages loaded");
    })
    .catch(err => console.error("Villages error:", err));


// --- Toggle Layers ---

document.getElementById("regionsLayer").addEventListener("change", function () {
    if (this.checked) map.addLayer(regionsGroup);
    else map.removeLayer(regionsGroup);
});

document.getElementById("districtsLayer").addEventListener("change", function () {
    if (this.checked) map.addLayer(districtsGroup);
    else map.removeLayer(districtsGroup);
});

// Kampala toggle (corrected)
document.getElementById("kampalaLayer").addEventListener("change", function () {
    if (this.checked) map.addLayer(kampalaGroup);
    else map.removeLayer(kampalaGroup);
});

document.getElementById("villagesLayer").addEventListener("change", function () {
    if (this.checked) map.addLayer(villagesGroup);
    else map.removeLayer(villagesGroup);
});




