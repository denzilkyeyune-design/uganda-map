// =====================
// MUKONO DISTRICT INFO
// =====================

const mukonoInfo = {
    district: "MUKONO DISTRICT",
    totalVillages: 607,
    totalParishes: 55,
    totalSubcounties: 11,
    totalTownCouncils: 5,

    // All subcounties and their parishes & villages
    structure: {
        "KASAWO": {
            "KAKUKUULU": ["BUGABO", "KAKUKULU", "KIKUBE", "KIWERE", "KIZANYIRIZI", "NAKASWA", "NAKIDUDUMA", "NKOKO"],
            "KASANA": ["BUTEYONGERA", "KAKIRA", "KASALA", "KASANA", "KITWE", "KIYAGI", "NDIBA"],
            "KIGOGOLA": ["BUYUKI", "KATEETE", "KIBAMBA", "KIGOGOLA", "KISONZI", "NNONGO", "NSANVU"],
            "NAMALIRI": ["GAVU", "KAWUTUTU", "KIGULU", "NAMALIRI", "NDESE"]
        },

        "KIMENYEDDE": {
            "BUKASA": ["BUKASA", "KAWUKU", "KISOGA", "NAJJA-KIREKU", "NAMAKOMO"],
            "KAWONGO": ["KAMIRA-BUKONERO", "KAWONGO", "MAYANGAYANGA", "NAKIBANO", "WABUSANKE", "WANJEYO-KALAGALA-KITO", "KISAMBA-KIRINYABIGO"],
            "KIWAFU": ["JUMBA-GENDA", "KIMENYEDDE", "KIWAFU", "MAGONGA-ZIRANSO", "NABUKUKU-LUBANJA", "NABULOOTO", "ZIGULU"],
            "NANGA": ["GALIGATYA", "GIRINYA", "KAKAKALA", "KIBIRIBIRI", "KITUBA-NABIBUGGA", "KIYIRIBWA", "NANGA", "NDWADDEMUTWE"]
        },

        // … You can add more here if needed …
    }
};

// ----------------------------------------
// MAP INITIALIZATION
// ----------------------------------------
var map = L.map("map").setView([1.3, 32.3], 8);

var basemap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);

// ----------------------------------------
// LAYER GROUPS
// ----------------------------------------
function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({ weight: 3, color: "yellow" });
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
        mouseout: resetHighlight,
        click: () => {
            document.getElementById("selectedName").innerHTML = feature.properties.NAME || "Unknown";
            document.getElementById("selectedDetails").innerHTML = JSON.stringify(feature.properties, null, 2);
        }
    });
}

var regionsGroup = L.geoJSON(null, {
    style: { color: "purple", weight: 2, fillOpacity: 0.1 },
    onEachFeature
});

var districtsGroup = L.geoJSON(null, {
    style: { color: "blue", weight: 1, fillOpacity: 0.1 },
    onEachFeature
});

var kampalaGroup = L.geoJSON(null, {
    style: { color: "orange", weight: 2, fillOpacity: 0.1 },
    onEachFeature
});

var villagesGroup = L.geoJSON(null, {
    style: { color: "green", weight: 0.3, fillOpacity: 0.3 },
    onEachFeature
});

// ----------------------------------------
// LOAD ALL DATA FILES (CORRECT FILENAMES)
// ----------------------------------------
loadLayer("Uganda Regional Boundaries.json", regionsGroup, "Regions");
loadLayer("Uganda District Boundaries 2014.geojson", districtsGroup, "Districts");
loadLayer("Kampala District.json", kampalaGroup, "Kampala");
loadLayer("Uganda Villages 2009.json", villagesGroup, "Villages");

function loadLayer(file, group, label) {
    fetch(file)
        .then(r => r.json())
        .then(data => {
            group.addData(data);
            console.log(label + " loaded");
        })
        .catch(err => console.error("Failed: " + file, err));
}

// ----------------------------------------
// TOGGLE CONTROLS
// ----------------------------------------
document.getElementById("basemapToggle").onchange = e =>
    e.target.checked ? map.addLayer(basemap) : map.removeLayer(basemap);

document.getElementById("regionsLayer").onchange = e =>
    toggleLayer(e, regionsGroup);

document.getElementById("districtsLayer").onchange = e =>
    toggleLayer(e, districtsGroup);

document.getElementById("kampalaLayer").onchange = e =>
    toggleLayer(e, kampalaGroup);

document.getElementById("villagesLayer").onchange = e =>
    toggleLayer(e, villagesGroup);

function toggleLayer(e, group) {
    if (e.target.checked) map.addLayer(group);
    else map.removeLayer(group);
}

// ----------------------------------------
// SEARCH BOX
// ----------------------------------------
document.getElementById("searchBox").addEventListener("input", function () {
    let q = this.value.toLowerCase();

    [regionsGroup, districtsGroup, kampalaGroup, villagesGroup].forEach(group => {
        group.eachLayer(layer => {
            let name = JSON.stringify(layer.feature.properties).toLowerCase();
            if (name.includes(q)) layer.setStyle({ fillOpacity: 0.6 });
            else layer.setStyle({ fillOpacity: 0.1 });
        });
    });
});
