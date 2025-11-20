//-----------------------------------------------------
// INITIALIZE MAP
//-----------------------------------------------------
var map = L.map("map").setView([1.3, 32.3], 8);

// Basemap (toggleable)
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 });
osm.addTo(map);

//-----------------------------------------------------
// LAYER GROUPS
//-----------------------------------------------------
var regionsGroup = L.geoJSON(null, {
    style: { color: "#7b1fa2", weight: 2, fillOpacity: 0.05 },
    onEachFeature: hoverFeature
});

var districtsGroup = L.geoJSON(null, {
    style: { color: "#1565c0", weight: 1, fillOpacity: 0.05 },
    onEachFeature: hoverFeature
});

var kampalaGroup = L.geoJSON(null, {
    style: { color: "#0d47a1", weight: 2, fillOpacity: 0.05 },
    onEachFeature: hoverFeature
});

var villagesGroup = L.geoJSON(null, {
    style: { color: "green", weight: 0.3, fillOpacity: 0.05 },
    onEachFeature: hoverFeature
});

// Hover highlight function
function hoverFeature(feature, layer) {
    layer.on("mouseover", function () {
        this.setStyle({ weight: 3, fillOpacity: 0.2 });
    });
    layer.on("mouseout", function () {
        this.setStyle({ weight: 1, fillOpacity: 0.05 });
    });
}

//-----------------------------------------------------
// LOAD GEOJSON FILES
//-----------------------------------------------------

// 1. Load Regions
fetch("Uganda Regional Boundaries.json")
    .then(res => res.json())
    .then(data => {
        regionsGroup.addData(data);
        console.log("Regions loaded");
    });

// 2. Load All Districts
fetch("Uganda District Boundaries 2014.geojson")
    .then(res => res.json())
    .then(data => {
        districtsGroup.addData(data);
        console.log("Districts loaded");
    });

// 3. Load Kampala as a sub-layer
fetch("Kampala District.json")
    .then(res => res.json())
    .then(data => {
        kampalaGroup.addData(data);
        console.log("Kampala loaded");
    });

// 4. Load Villages
fetch("Uganda Villages 2009.json")
    .then(res => res.json())
    .then(data => {
        villagesGroup.addData(data);
        console.log("Villages loaded");
    });

//-----------------------------------------------------
// LAYER TOGGLES
//-----------------------------------------------------

// Basemap toggle
document.getElementById("basemapToggle").addEventListener("change", function () {
    if (this.checked) map.addLayer(osm);
    else map.removeLayer(osm);
});

// Regions
document.getElementById("regionsLayer").addEventListener("change", function () {
    if (this.checked) map.addLayer(regionsGroup);
    else map.removeLayer(regionsGroup);
});

// Districts
document.getElementById("districtsLayer").addEventListener("change", function () {
    if (this.checked) map.addLayer(districtsGroup);
    else map.removeLayer(districtsGroup);
});

// Kampala (subset of districts)
document.getElementById("kampalaLayer").addEventListener("change", function () {
    if (this.checked) map.addLayer(kampalaGroup);
    else map.removeLayer(kampalaGroup);
});

// Villages
document.getElementById("villagesLayer").addEventListener("change", function () {
    if (this.checked) map.addLayer(villagesGroup);
    else map.removeLayer(villagesGroup);
});




