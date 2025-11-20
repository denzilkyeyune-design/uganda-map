// ============================
// 1. CREATE MAP
// ============================
var map = L.map("map").setView([1.3, 32.3], 8);

// --- Basemap Layer ---
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);


// ============================
// 2. LAYER GROUPS
// ============================

// Hover highlight style
function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({
        weight: 3,
        color: "#ffcc00",
        fillOpacity: 0.3
    });
}

function resetHighlight(e) {
    regionsGroup.resetStyle(e.target);
    districtsGroup.resetStyle(e.target);
    kampalaGroup.resetStyle(e.target);
    villagesGroup.resetStyle(e.target);
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight
    });

    if (feature.properties) {
        layer.bindTooltip(JSON.stringify(feature.properties), {
            sticky: true,
            className: "feature-label"
        });
    }
}

// ---- REGIONS ----
var regionsGroup = L.geoJSON(null, {
    style: { color: "purple", weight: 1.5, fillOpacity: 0.05 },
    onEachFeature: onEachFeature
});

// ---- DISTRICTS ----
var districtsGroup = L.geoJSON(null, {
    style: { color: "blue", weight: 1, fillOpacity: 0.05 },
    onEachFeature: onEachFeature
});

// ---- KAMPALA (subset of Districts) ----
var kampalaGroup = L.geoJSON(null, {
    style: { color: "green", weight: 2, fillOpacity: 0.1 },
    onEachFeature: onEachFeature
});

// ---- VILLAGES ----
var villagesGroup = L.geoJSON(null, {
    style: { color: "red", weight: 0.3, fillOpacity: 0.05 },
    onEachFeature: onEachFeature
});


// ============================
// 3. LOAD GEOJSON FILES
// ============================

// --- Regions ---
fetch("Uganda Regional Boundaries.json")
    .then(r => r.json())
    .then(data => {
        regionsGroup.addData(data);
        console.log("Regions loaded");
    });

// --- Districts ---
fetch("Uganda District Boundaries 2014.json")
    .then(r => r.json())
    .then(data => {
        districtsGroup.addData(data);
        console.log("Districts loaded");
    });

// --- Kampala District (subset layer) ---
fetch("Kampala District.json")
    .then(r => r.json())
    .then(data => {
        kampalaGroup.addData(data);
        console.log("Kampala loaded");
    });

// --- Villages ---
fetch("Uganda Villages 2009.json")
    .then(r => r.json())
    .then(data => {
        villagesGroup.addData(data);
        console.log("Villages loaded");
    });


// ============================
// 4. TOGGLE LAYERS
// ============================

// Regions
document.getElementById("regionsLayer").addEventListener("change", function () {
    this.checked ? map.addLayer(regionsGroup) : map.removeLayer(regionsGroup);
});

// Districts
document.getElementById("districtsLayer").addEventListener("change", function () {

    if (this.checked) {
        map.addLayer(districtsGroup);
    } else {
        map.removeLayer(districtsGroup);
        map.removeLayer(kampalaGroup);  // hide Kampala if Districts off
        document.getElementById("kampalaLayer").checked = false;
    }
});

// Kampala (subset)
document.getElementById("kampalaLayer").addEventListener("change", function () {
    this.checked ? map.addLayer(kampalaGroup) : map.removeLayer(kampalaGroup);
});

// Villages
document.getElementById("villagesLayer").addEventListener("change", function () {
    this.checked ? map.addLayer(villagesGroup) : map.removeLayer(villagesGroup);
});

// ============================
// 5. BASEMAP TOGGLE
// ============================
document.getElementById("basemapToggle").addEventListener("change", function () {
    if (this.checked) {
        map.addLayer(osm);
    } else {
        map.removeLayer(osm);
    }
});





