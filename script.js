let map = L.map("map").setView([0.35, 32.58], 12);

// Basemap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);

// Layers
let currentLayer = null;

// Load Kampala JSON once
let kampalaData = null;

fetch("Kampala District.json")
    .then(res => res.json())
    .then(json => {
        kampalaData = json;
        loadLevel("division"); // Default view
    });

// FILTER BY ADMIN LEVEL
function loadLevel(level) {

    // Remove previous layer
    if (currentLayer) map.removeLayer(currentLayer);

    // Choose which property to use
    let field = {
        "division": "CNAME2014",
        "subcounty": "SNAME2014",
        "parish": "PNAME2014",
        "village": "VNAME2014"
    }[level];

    // Colour per level
    let color = {
        "division": "#0047ab",
        "subcounty": "#009688",
        "parish": "#ff9800",
        "village": "#f44336"
    }[level];

    // Create filtered features
    currentLayer = L.geoJSON(kampalaData, {
        style: {
            color: color,
            weight: 1,
            fillOpacity: 0.2
        },
        filter: f => f.properties[field] && f.properties[field] !== "",
        onEachFeature: (feature, layer) => {

            // Hover highlight
            layer.on("mouseover", function () {
                this.setStyle({ weight: 3, fillOpacity: 0.4 });
            });
            layer.on("mouseout", function () {
                this.setStyle({ weight: 1, fillOpacity: 0.2 });
            });

            // Click - show info
            layer.on("click", function () {
                let name = feature.properties[field];
                document.getElementById("unit-title").innerHTML = name.toUpperCase();
                document.getElementById("unit-info").innerHTML =
                    `Admin level: ${level}<br>` +
                    `District: ${feature.properties.DNAME2014}<br>` +
                    `Division: ${feature.properties.CNAME2014}<br>` +
                    `Subcounty: ${feature.properties.SNAME2014}<br>` +
                    `Parish: ${feature.properties.PNAME2014}<br>` +
                    `Village: ${feature.properties.VNAME2014}`;
            });
        }
    }).addTo(map);
}

// Radio buttons — switch level
document.querySelectorAll("input[name='level']").forEach(r => {
    r.addEventListener("change", e => {
        loadLevel(e.target.value);
    });
});


