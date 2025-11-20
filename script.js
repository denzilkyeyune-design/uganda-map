// Initialize map centered on Uganda
var map = L.map("map").setView([1.2, 32.3], 7);

// Basemap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18
}).addTo(map);

// Load Uganda regional boundaries
fetch("Uganda Regional Boundaries.json")
    .then(res => res.json())
    .then(data => {
        console.log("Loaded Regional Boundaries:", data);

        L.geoJSON(data, {
            style: {
                color: "blue",
                weight: 2,
                fillColor: "lightblue",
                fillOpacity: 0.2
            },
            onEachFeature: function (feature, layer) {
                const region = feature.properties.ADM1_EN || "Unknown Region";
                layer.bindPopup(`<b>${region}</b>`);
            }
        }).addTo(map);
    })
    .catch(err => console.error("FAILED TO LOAD GEOJSON:", err));


