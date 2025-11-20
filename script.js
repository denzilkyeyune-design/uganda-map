/***********************
 * 1. INITIALIZE MAP
 ***********************/
var map = L.map("map").setView([1.3, 32.3], 8);

// Basemap layer
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);


/***********************
 * 2. LAYER GROUPS
 ***********************/
var regionsGroup = L.geoJSON(null, {
    style: { color: "purple", weight: 2, fillOpacity: 0.05 }
});

var districtsGroup = L.geoJSON(null, {
    style: { color: "blue", weight: 1.2, fillOpacity: 0.05 }
});

var kampalaDistrictGroup = L.geoJSON(null, {
    style: { color: "darkblue", weight: 2, fillOpacity: 0.05 }
});

var villagesGroup = L.geoJSON(null, {
    style: { color: "red", weight: 0.5, fillOpacity: 0.05 }
});


/***********************
 * 3. UNIVERSAL HOVER EFFECT
 ***********************/
function addHover(layer) {
    layer.on("mouseover", function () {
        this.setStyle({
            weight: 3,
            fillOpacity: 0.2
        });
    });

    layer.on("mouseout", function () {
        this.setStyle({
            weight: layer.options.originalWeight || 1,
            fillOpacity: 0.05
        });
    });
}


/***********************
 * 4. LOAD REGIONS
 ***********************/
fetch("Uganda Regional Boundaries.json")
    .then(res => res.json())
    .then(data => {
        regionsGroup.addData(data);
        regionsGroup.eachLayer(addHover);
        console.log("Regions loaded");
    });


/***********************
 * 5. LOAD DISTRICTS
 ***********************/
fetch("Uganda District Boundaries 2014.json")
    .then(res => res.json())
    .then(data => {
        districtsGroup.addData(data);
        districtsGroup.eachLayer(addHover);
        console.log("Districts loaded");
    });


/***********************
 * 6. LOAD KAMPALA DISTRICT (SUBSET UNDER DISTRICTS)
 ***********************/
fetch("Kampala District.json")
    .then(res => res.json())
    .then(data => {
        kampalaDistrictGroup.addData(data);
        kampalaDistrictGroup.eachLayer(addHover);
        console.log("Kampala District loaded");
    });


/***********************
 * 7. LOAD VILLAGES
 ***********************/
fetch("Uganda Villages 2009.json")
    .then(res => res.json())
    .then(data => {
        villagesGroup.addData(data);
        villagesGroup.eachLayer(addHover);
        console.log("Villages loaded");
    });


/***********************
 * 8. LAYER TOGGLES
 ***********************/
document.getElementById("regionsLayer").addEventListener("change", function () {
    this.checked ? map.addLayer(regionsGroup) : map.removeLayer(regionsGroup);
});

document.getElementById("districtsLayer").addEventListener("change", function () {
    this.checked ? map.addLayer(districtsGroup) : map.removeLayer(districtsGroup);
});

document.getElementById("kampalaDistrict").addEventListener("change", function () {
    this.checked ? map.addLayer(kampalaDistrictGroup) : map.removeLayer(kampalaDistrictGroup);
});

document.getElementById("villagesLayer").addEventListener("change", function () {
    this.checked ? map.addLayer(villagesGroup) : map.removeLayer(villagesGroup);
});


/***********************
 * 9. BASEMAP TOGGLE
 ***********************/
document.getElementById("basemapToggle").addEventListener("change", function () {
    if (this.checked) map.addLayer(osm);
    else map.removeLayer(osm);
});




