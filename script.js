/* --------------------------------------------------
   INITIALIZE MAP
-------------------------------------------------- */

var map = L.map("map").setView([1.3, 32.3], 7);

// Basemap
var basemap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);

/* --------------------------------------------------
   LOAD REGIONS
-------------------------------------------------- */

var regionStyle = {
    color: "blue",
    weight: 2,
    fillOpacity: 0.2
};

var highlightStyle = {
    color: "orange",
    weight: 3,
    fillOpacity: 0.4
};

var regionsLayer = L.geoJSON(null, {
    style: regionStyle,

    onEachFeature: function(feature, layer) {

        // Hover
        layer.on("mouseover", function () {
            layer.setStyle(highlightStyle);
        });
        layer.on("mouseout", function () {
            regionsLayer.resetStyle(layer);
        });

        // CLICK → load HTML file
        layer.on("click", function () {
            let region = feature.properties.ADM1_EN;   // Central, Northern, etc.

            let file = "Regional Information/" + region.toUpperCase() + ".html";
            loadRegionInfo(file);

            map.fitBounds(layer.getBounds());
        });
    }
}).addTo(map);

// Load GeoJSON
fetch("Uganda Regional Boundaries.json")
    .then(r => r.json())
    .then(json => {
        regionsLayer.addData(json);
    });

/* --------------------------------------------------
   TOGGLES
-------------------------------------------------- */

document.getElementById("toggleBasemap").onchange = function () {
    if (this.checked) map.addLayer(basemap);
    else map.removeLayer(basemap);
};

document.getElementById("toggleRegions").onchange = function () {
    if (this.checked) map.addLayer(regionsLayer);
    else map.removeLayer(regionsLayer);
};

/* --------------------------------------------------
   LOAD REGION INFO HTML
-------------------------------------------------- */

function loadRegionInfo(path) {
    fetch(path)
        .then(resp => resp.ok ? resp.text() : "<p>No info file found.</p>")
        .then(html => {
            document.getElementById("region-details").innerHTML = html;
        });
}

/* --------------------------------------------------
   TAB SYSTEM
-------------------------------------------------- */

let tabs = document.querySelectorAll(".tab");
let panes = document.querySelectorAll(".tab-pane");

tabs.forEach(tab => {
    tab.addEventListener("click", function () {

        // Remove active from all
        tabs.forEach(t => t.classList.remove("active"));
        panes.forEach(p => p.classList.remove("active"));

        // Activate clicked tab + pane
        let pane = document.getElementById(this.dataset.tab);
        this.classList.add("active");
        pane.classList.add("active");
    });
});
