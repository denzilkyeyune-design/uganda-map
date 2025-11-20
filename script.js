// ---------------------------
//  MAP + BASEMAP
// ---------------------------
var map = L.map("map").setView([1.3, 32.3], 8);

var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);

// Toggle basemap
document.getElementById("basemapToggle").addEventListener("change", function () {
    if (this.checked) map.addLayer(osm);
    else map.removeLayer(osm);
});

// ---------------------------
//  GENERIC HOVER HANDLER
// ---------------------------
function hoverStyle(e) {
    var layer = e.target;
    layer.setStyle({
        weight: 3,
        color: "#00FFFF",
        fillOpacity: 0.3
    });
}

function resetHover(e) {
    regionsGroup.resetStyle(e.target);
    districtsGroup.resetStyle(e.target);
    kampalaGroup.resetStyle(e.target);
    villagesGroup.resetStyle(e.target);
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: hoverStyle,
        mouseout: resetHover
    });

    // Popup showing NAME
    let name =
        feature.properties.ADM1_EN ||  // regions
        feature.properties.DNAME2014 || // districts
        feature.properties.PNAME2014 || // parishes/villages
        feature.properties.NAME ||
        "No name available";

    layer.bindPopup("<b>" + name + "</b>");
}

// ---------------------------
//  LAYER GROUPS
// ---------------------------
var regionsGroup = L.geoJSON(null, {
    style: { color: "purple", weight: 2, fillOpacity: 0.1 },
    onEachFeature: onEachFeature
});

var districtsGroup = L.geoJSON(null, {
    style: { color: "blue", weight: 1.2, fillOpacity: 0.1 },
    onEachFeature: onEachFeature
});

var kampalaGroup = L.geoJSON(null, {
    style: { color: "darkgreen", weight: 2, fillOpacity: 0.15 },
    onEachFeature: onEachFeature
});

var villagesGroup = L.geoJSON(null, {
    style: { color: "red", weight: 0.3, fillOpacity: 0.05 },
    onEachFeature: onEachFeature
});

// ---------------------------
//  LOAD DATA FILES
// ---------------------------
fetch("Uganda Regional Boundaries.json")
    .then(res => res.json())
    .then(data => {
        regionsGroup.addData(data);
        console.log("Regions loaded");
    });

fetch("Uganda District Boundaries 2014.json")
    .then(res => res.json())
    .then(data => {
        districtsGroup.addData(data);
        console.log("Districts loaded");
    });

fetch("Kampala District.json")
    .then(res => res.json())
    .then(data => {
        kampalaGroup.addData(data);
        console.log("Kampala loaded");
    });

fetch("Uganda Villages 2009.json")
    .then(res => res.json())
    .then(data => {
        villagesGroup.addData(data);
        console.log("Villages loaded");
    });

// ---------------------------
//  TOGGLE LAYERS
// ---------------------------
document.getElementById("regionsLayer").addEventListener("change", function () {
    if (this.checked) map.addLayer(regionsGroup);
    else map.removeLayer(regionsGroup);
});

document.getElementById("districtsLayer").addEventListener("change", function () {
    if (this.checked) {
        map.addLayer(districtsGroup);
        map.addLayer(kampalaGroup); // Kampala is part of districts
    } else {
        map.removeLayer(districtsGroup);
        map.removeLayer(kampalaGroup);
    }
});

document.getElementById("villagesLayer").addEventListener("change", function () {
    if (this.checked) map.addLayer(villagesGroup);
    else map.removeLayer(villagesGroup);
});

// ---------------------------
//  SEARCH BAR
// ---------------------------
var geocoder = L.Control.geocoder({
    placeholder: "Search for a place…",
    defaultMarkGeocode: true
}).addTo(map);





