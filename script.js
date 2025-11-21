// ---------------------------
// MAP INITIALISATION
// ---------------------------
var map = L.map("map", {
    center: [1.3, 32.3],
    zoom: 8
});

// Basemap layer
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);


// ---------------------------
// LAYER GROUPS
// ---------------------------
var regionsLayer = L.geoJSON(null, styleRegions, onEachFeature);
var districtsLayer = L.geoJSON(null, styleDistricts, onEachFeature);
var kampalaLayer = L.geoJSON(null, styleKampala, onEachFeature);
var villagesLayer = L.geoJSON(null, styleVillages, onEachFeature);

function styleRegions() {
    return { color: "#7b1fa2", weight: 2, fillOpacity: 0.1 };
}

function styleDistricts() {
    return { color: "#1565c0", weight: 1.2, fillOpacity: 0.08 };
}

function styleKampala() {
    return { color: "#ff9800", weight: 2, fillOpacity: 0.15 };
}

function styleVillages() {
    return { color: "#e53935", weight: 0.5, fillOpacity: 0.05 };
}


// ---------------------------
// HOVER + CLICK INTERACTION
// ---------------------------
function onEachFeature(feature, layer) {

    layer.on("mouseover", function () {
        this.setStyle({ weight: 3, fillOpacity: 0.3 });
    });

    layer.on("mouseout", function () {
        this.setStyle({ weight: 1, fillOpacity: 0.1 });
    });

    layer.on("click", function () {
        let name =
            feature.properties.NAME_1 ||
            feature.properties.DNAME2014 ||
            feature.properties.ADM1_EN ||
            feature.properties.VNAME2014 ||
            "Unknown";

        document.getElementById("selectedInfo").innerHTML =
            `<b>Selected:</b> ${name}`;
    });
}


// ---------------------------
// LOAD ALL LAYERS
// ---------------------------
loadGeoJSON("Uganda Regional Boundaries.json", regionsLayer, "Regions loaded");
loadGeoJSON("Uganda District Boundaries 2014.json", districtsLayer, "Districts loaded");
loadGeoJSON("Kampala District.json", kampalaLayer, "Kampala subset loaded");
loadGeoJSON("Uganda Villages 2009.json", villagesLayer, "Villages loaded");

function loadGeoJSON(url, layerGroup, message) {
    fetch(url)
        .then(res => res.json())
        .then(data => {
            layerGroup.addData(data);
            console.log(message);
        })
        .catch(err => console.error("Failed loading:", url, err));
}


// ---------------------------
// LAYER TOGGLES
// ---------------------------
document.getElementById("toggleRegions").addEventListener("change", e => {
    e.target.checked ? map.addLayer(regionsLayer) : map.removeLayer(regionsLayer);
});

document.getElementById("toggleDistricts").addEventListener("change", e => {
    e.target.checked ? map.addLayer(districtsLayer) : map.removeLayer(districtsLayer);
});

document.getElementById("toggleKampala").addEventListener("change", e => {
    e.target.checked ? map.addLayer(kampalaLayer) : map.removeLayer(kampalaLayer);
});

document.getElementById("toggleVillages").addEventListener("change", e => {
    e.target.checked ? map.addLayer(villagesLayer) : map.removeLayer(villagesLayer);
});

document.getElementById("toggleBasemap").addEventListener("change", e => {
    e.target.checked ? map.addLayer(osm) : map.removeLayer(osm);
});


// ---------------------------
// SEARCH FUNCTION
// ---------------------------
document.getElementById("searchBox").addEventListener("keyup", function () {
    let query = this.value.toLowerCase();

    let allLayers = [
        regionsLayer,
        districtsLayer,
        kampalaLayer,
        villagesLayer
    ];

    allLayers.forEach(group => {
        group.eachLayer(layer => {
            let name =
                layer.feature.properties.NAME_1 ||
                layer.feature.properties.DNAME2014 ||
                layer.feature.properties.ADM1_EN ||
                layer.feature.properties.VNAME2014 ||
                "";

            if (name.toLowerCase().includes(query)) {
                map.fitBounds(layer.getBounds());
            }
        });
    });
});

