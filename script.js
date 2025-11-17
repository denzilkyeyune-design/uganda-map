
var map = L.map('map').setView([1.3733, 32.2903], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

fetch('uganda.json')
    .then(res => res.json())
    .then(data => {
        L.geoJSON(data, {
            onEachFeature: function (feature, layer) {
                layer.on('click', function () {
                    document.getElementById('info-box').innerHTML =
                        "<b>Region:</b> " + (feature.properties.NAME_1 || "Unknown") +
                        "<br><b>Village data:</b> Coming soon";
                });
            }
        }).addTo(map);
    });
