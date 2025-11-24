// Initialize map
var map = L.map("map").setView([1.3, 32.3], 7);

// Basemap
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);

// Toggle basemap
document.getElementById("basemapToggle").addEventListener("change", (e) => {
    if (e.target.checked) map.addLayer(osm);
    else map.removeLayer(osm);
});

// --- REGION LAYER GROUP ---
var regionLayer = L.geoJSON(null, {
    style: {
        color: "#0033cc",
        weight: 2,
        fillOpacity: 0.2
    },

    onEachFeature: function (feature, layer) {
        layer.on("mouseover", function () {
            this.setStyle({ weight: 4, color: "#ff8800" });
        });

        layer.on("mouseout", function () {
            regionLayer.resetStyle(this);
        });

        function onEachRegion(feature, layer) {
    layer.on({
        mouseover: highlightRegion,
        mouseout: resetRegionHighlight,
        click: loadRegionInfo
    });
}

// Fetch and display region info
function loadRegionInfo(e) {
    let regionName = e.target.feature.properties.ADM1_EN;  // Example property name
    let cleanName = regionName.toLowerCase().replace(/\s+/g, "");
    let filePath = `region-info/${cleanName}.html`;

    fetch(filePath)
        .then(res => {
            if (!res.ok) {
                document.getElementById("regionDetails").innerHTML =
                    `<h2>${regionName}</h2><p>No file found for this region.</p>`;
                throw new Error("Missing file");
            }
            return res.text();
        })
        .then(html => {
            document.getElementById("regionDetails").innerHTML = html;
        })
        .catch(err => console.log(err));
}

            document.getElementById("infoBox").innerHTML = `
                <h3>${feature.properties.ADM1_EN}</h3>
                <p><strong>Region Code:</strong> ${feature.properties.ADM1_PCODE}</p>
            `;
        });
    }
});

// Load regions
fetch("Uganda Regional Boundaries.json")
    .then(res => res.json())
    .then(data => {
        regionLayer.addData(data);
        console.log("Regions loaded");
    });

// Toggle regions visibility
document.getElementById("regionsToggle").addEventListener("change", (e) => {
    if (e.target.checked) map.addLayer(regionLayer);
    else map.removeLayer(regionLayer);
});

// SEARCH FUNCTION
document.getElementById("searchBtn").addEventListener("click", () => {
    let searchValue = document.getElementById("searchBox").value.toLowerCase();

    regionLayer.eachLayer(function (layer) {
        let regionName = layer.feature.properties.ADM1_EN.toLowerCase();

        if (regionName.includes(searchValue)) {
            map.fitBounds(layer.getBounds());
            layer.fire("click");
        }
    });
});

