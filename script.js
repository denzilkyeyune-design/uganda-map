//----------------------------------------------------
// INITIAL MAP
//----------------------------------------------------
var map = L.map('map').setView([0.3476, 32.5825], 12);

var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
osm.addTo(map);

let basemapOn = true;
document.getElementById("basemapBtn").onclick = () => {
  if (basemapOn) {
    map.removeLayer(osm);
    basemapOn = false;
    basemapBtn.innerText = "Basemap: OFF";
  } else {
    map.addLayer(osm);
    basemapOn = true;
    basemapBtn.innerText = "Basemap: ON";
  }
};

// Layers
let layerDivisions, layerSubcounties, layerParishes, layerVillages;
let kampalaFeatures = null;


//----------------------------------------------------
// GROUPING + DISSOLVING FUNCTIONS
//----------------------------------------------------
function groupBy(features, key) {
  const groups = {};
  features.forEach(f => {
    const name = f.properties[key];
    if (!name) return;
    if (!groups[name]) groups[name] = [];
    groups[name].push(f);
  });
  return groups;
}

function dissolve(parts) {
  let merged = parts[0];
  for (let i = 1; i < parts.length; i++) {
    merged = turf.union(merged, parts[i]);
  }
  return merged;
}


//----------------------------------------------------
// CLEAR LAYERS
//----------------------------------------------------
function clearLayers() {
  if (layerDivisions) map.removeLayer(layerDivisions);
  if (layerSubcounties) map.removeLayer(layerSubcounties);
  if (layerParishes) map.removeLayer(layerParishes);
  if (layerVillages) map.removeLayer(layerVillages);
}


//----------------------------------------------------
// RENDER ADMIN LAYERS
//----------------------------------------------------
function renderLayers() {
  if (!kampalaFeatures) return;

  clearLayers();

  const feats = kampalaFeatures.features;

  // Group
  const gDiv = groupBy(feats, "CNAME2014");
  const gSub = groupBy(feats, "SNAME2014");
  const gPar = groupBy(feats, "PNAME2014");

  // Dissolve
  const divisions = Object.keys(gDiv).map(name => {
    let d = dissolve(gDiv[name]);
    d.properties = { NAME: name };
    return d;
  });

  const subcounties = Object.keys(gSub).map(name => {
    let d = dissolve(gSub[name]);
    d.properties = { NAME: name };
    return d;
  });

  const parishes = Object.keys(gPar).map(name => {
    let d = dissolve(gPar[name]);
    d.properties = { NAME: name };
    return d;
  });

  const villages = feats.map(f => ({
    type: "Feature",
    geometry: f.geometry,
    properties: { NAME: f.properties.VNAME2014 }
  }));

  // Draw based on checkboxes
  if (chkDivisions.checked) {
    layerDivisions = L.geoJSON(divisions, {
      style: { color: "red", weight: 3, fillOpacity: 0 },
      onEachFeature: (f, l) => l.bindTooltip(f.properties.NAME)
    }).addTo(map);
  }

  if (chkSubcounties.checked) {
    layerSubcounties = L.geoJSON(subcounties, {
      style: { color: "blue", weight: 2.5, fillOpacity: 0 },
      onEachFeature: (f, l) => l.bindTooltip(f.properties.NAME)
    }).addTo(map);
  }

  if (chkParishes.checked) {
    layerParishes = L.geoJSON(parishes, {
      style: { color: "green", weight: 2, fillOpacity: 0 },
      onEachFeature: (f, l) => l.bindTooltip(f.properties.NAME)
    }).addTo(map);
  }

  if (chkVillages.checked) {
    layerVillages = L.geoJSON(villages, {
      style: { color: "#ff8800", weight: 0.7, fillOpacity: 0.25 },
      onEachFeature: (f, l) => {
        l.bindTooltip(f.properties.NAME);
        l.on("click", () => {
          document.getElementById("infoBox").innerHTML =
            "<strong>Village:</strong> " + f.properties.NAME;
        });
      }
    }).addTo(map);
  }
}


//----------------------------------------------------
// LOAD KAMPALA GEOJSON
//----------------------------------------------------
fetch("Kampala District.json")
  .then(res => res.json())
  .then(data => {
    kampalaFeatures = data;
    renderLayers();
  });


//----------------------------------------------------
// CHECKBOX LISTENERS
//----------------------------------------------------
chkDivisions.onchange =
chkSubcounties.onchange =
chkParishes.onchange =
chkVillages.onchange =
  () => renderLayers();
