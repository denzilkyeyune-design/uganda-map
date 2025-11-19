let map = L.map("map").setView([0.35, 32.58], 12);

// ----- Basemap Layer -----
let basemap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);

document.getElementById("basemapToggle").addEventListener("change", function () {
    if (this.checked) basemap.addTo(map);
    else basemap.remove();
});

// ----- Layer Storage -----
let currentLayer = null;
let kampalaData = null;

// Load the Kampala GeoJSON
fetch("Kampala District.json")
    .then(res => res.json())
    .then(json => {
        kampalaData = json;
        loadLevel("division");
    });


// ========================================
//  LOAD A SPECIFIC ADMIN LEVEL
// ========================================
function loadLevel(level) {

    if (!kampalaData) return;

    // Remove previous layer
    if (currentLayer) map.removeLayer(currentLayer);

    // Field mappings
    const fieldMap = {
        division: "CNAME2014",
        subcounty: "SNAME2014",
        parish: "PNAME2014",
        village: "VNAME2014"
    };

    const colorMap = {
        division: "#0047ab",
        subcounty: "#009688",
        parish: "#ff9800",
        village: "#e91e63"
    };

    const field = fieldMap[level];
    const color = colorMap[level];

    // Add new layer
    currentLayer = L.geoJSON(kampalaData, {
        filter: f => f.properties[field] && f.properties[field] !== "",
        style: {
            color: color,
            weight: 1.2,
            fillOpacity: 0.20
        },

        onEachFeature: (feature, layer) => {

            // Hover highlight
            layer.on("mouseover", function () {
                this.setStyle({ weight: 3, fillOpacity: 0.35 });
            });
            layer.on("mouseout", function () {
                this.setStyle({ weight: 1.2, fillOpacity: 0.20 });
            });

            // Click handler
            layer.on("click", function () {
                const props = feature.properties;

                const name = props[field];
                document.getElementById("unit-title").innerHTML = name.toUpperCase();

                // Sidebar info
                document.getElementById("unit-info").innerHTML =
                    `<strong>District:</strong> ${props.DNAME2014}<br>` +
                    `<strong>Division:</strong> ${props.CNAME2014}<br>` +
                    `<strong>Subcounty:</strong> ${props.SNAME2014}<br>` +
                    `<strong>Parish:</strong> ${props.PNAME2014}<br>` +
                    `<strong>Village:</strong> ${props.VNAME2014 ?? "—"}`;

                // Breadcrumb
                document.getElementById("breadcrumb").innerHTML =
                    `${props.DNAME2014} → ${props.CNAME2014} → ${props.SNAME2014} → ${props.PNAME2014} → ${props.VNAME2014}`;

                // Auto zoom to polygon
                map.fitBounds(layer.getBounds(), { maxZoom: 16 });
            });
        }

    }).addTo(map);
}


// ========================================
//  RADIO BUTTONS: SWITCH ADMIN LEVEL
// ========================================
document.querySelectorAll("input[name='level']").forEach(radio => {
    radio.addEventListener("change", e => {
        loadLevel(e.target.value);
    });
});

