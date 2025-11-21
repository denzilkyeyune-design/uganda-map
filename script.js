// ----------------------------
// MAP INITIALIZATION
// ----------------------------
var map = L.map("map").setView([1.3, 32.3], 8);

// Base layer
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);


// ----------------------------
// GENERIC HIGHLIGHT HANDLERS
// ----------------------------
function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({ weight: 3, color: "yellow", fillOpacity: 0.4 });
}

function resetHighlight(e) {
    var layer = e.target;
    layer.setStyle(layer.defaultOptions.style);
}

function onFeatureClick(feature, layer) {
    document.getElementById("infoTitle").innerHTML = feature.properties.NAME || "Unknown";
    document.getElementById("infoText").innerHTML =
        `<b>Details:</b><br>${JSON.stringify(feature.properties, null, 2)}`;
}


// ----------------------------
// CREATE LAYER GROUPS
// ----------------------------
function createLayer(styleColor) {
    return L.geoJSON(null, {
        style: { color: styleColor, weight: 1, fillOpacity: 0.1 },
        onEachFeature: function (feature, layer) {
            layer.defaultOptions = { style: { color: styleColor, weight: 1, fillOpacity: 0.1 } };
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: function () { onFeatureClick(feature, layer); }
            });
        }
    });
}

var regionsGroup      = createLayer("purple");
var districtsGroup    = createLayer("blue");
var kampalaGroup      = createLayer("green");
var divisionsGroup    = createLayer("orange");
var subcountiesGroup  = createLayer("brown");
var parishesGroup     = createLayer("darkred");
var villagesGroup     = createLayer("black");


// ----------------------------
// FILE LOADING HELPERS
// ----------------------------
function loadLayer(filename, group, label) {
    fetch(filename)
        .then(r => r.json())
        .then(json => {
            group.addData(json);
            console.log(label + " loaded");
        })
        .catch(err => console.warn("Error loading " + filename, err));
}


// ----------------------------
// LOAD ALL FILES
// (FILENAMES MUST MATCH EXACTLY AS IN YOUR REPO)
// ----------------------------
loadLayer("Uganda Regional Boundaries.json", regionsGroup, "Regions");
loadLayer("Uganda District Boundaries 2014.json", districtsGroup, "Districts");
loadLayer("Kampala District.json", kampalaGroup, "Kampala");
loadLayer("Uganda Villages 2009.json", villagesGroup, "Villages");


// ----------------------------
// LAYER TOGGLES
// ----------------------------
document.getElementById("basemapToggle").onchange = e =>
    e.target.checked ? map.addLayer(osm) : map.removeLayer(osm);

document.getElementById("regionsLayer").onchange = e =>
    e.target.checked ? map.addLayer(regionsGroup) : map.removeLayer(regionsGroup);

document.getElementById("districtsLayer").onchange = e =>
    e.target.checked ? map.addLayer(districtsGroup) : map.removeLayer(districtsGroup);

document.getElementById("kampalaLayer").onchange = e =>
    e.target.checked ? map.addLayer(kampalaGroup) : map.removeLayer(kampalaGroup);

document.getElementById("divisionsLayer").onchange = e =>
    e.target.checked ? map.addLayer(divisionsGroup) : map.removeLayer(divisionsGroup);

document.getElementById("subcountiesLayer").onchange = e =>
    e.target.checked ? map.addLayer(subcountiesGroup) : map.removeLayer(subcountiesGroup);

document.getElementById("parishesLayer").onchange = e =>
    e.target.checked ? map.addLayer(parishesGroup) : map.removeLayer(parishesGroup);

document.getElementById("villagesLayer").onchange = e =>
    e.target.checked ? map.addLayer(villagesGroup) : map.removeLayer(villagesGroup);



// ----------------------------
// SEARCH FUNCTIONALITY
// ----------------------------
document.getElementById("searchBox").addEventListener("input", function () {
    var q = this.value.toLowerCase();

    if (!q) return;

    var hit = null;

    [
        regionsGroup,
        districtsGroup,
        kampalaGroup,
        divisionsGroup,
        subcountiesGroup,
        parishesGroup,
        villagesGroup
    ].forEach(group => {
        group.eachLayer(layer => {
            if (!hit && layer.feature.properties.NAME &&
                layer.feature.properties.NAME.toLowerCase().includes(q)) {
                hit = layer;
            }
        });
    });

    if (hit) map.fitBounds(hit.getBounds());
});

