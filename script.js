//-----------------------------------------------------
// FILE CONFIG
//-----------------------------------------------------
const COUNTRY_FILE = "district_boundaries_2014.geojson";
const KAMPALA_FILE = "Kampala District.json";
const DISTRICT_INFO_FILE = "district-data.json"; // optional


//-----------------------------------------------------
// MAP INITIALISATION
//-----------------------------------------------------
const map = L.map('map').setView([1.3, 32.3], 7);

const basemap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19
}).addTo(map);

let basemapOn = true;

document.getElementById("btn-toggle-basemap").onclick = () => {
  if (basemapOn) {
    map.removeLayer(basemap);
    document.getElementById("btn-toggle-basemap").innerText = "Basemap: OFF";
  } else {
    map.addLayer(basemap);
    document.getElementById("btn-toggle-basemap").innerText = "Basemap: ON";
  }
  basemapOn = !basemapOn;
};

document.getElementById("btn-reset").onclick = () => {
  map.setView([1.3, 32.3], 7);
  if (selectedDistrict) districtsLayer.resetStyle(selectedDistrict);
  hideKampalaLayers();
  document.getElementById("info-content").innerHTML =
    "Click any district. Click Kampala to load detailed admin units.";
};


//-----------------------------------------------------
// LEAFLET PANES (Z-INDEX LAYERS)
//-----------------------------------------------------
map.createPane("divisionsPane");
map.getPane("divisionsPane").style.zIndex = 450;

map.createPane("subcountiesPane");
map.getPane("subcountiesPane").style.zIndex = 460;

map.createPane("parishesPane");
map.getPane("parishesPane").style.zIndex = 470;

map.createPane("villagesPane");
map.getPane("villagesPane").style.zIndex = 400;


//-----------------------------------------------------
// KAMPALA LAYER TOGGLES
//-----------------------------------------------------
const chkDivisions = document.getElementById("chk-divisions");
const chkSubcounties = document.getElementById("chk-subcounties");
const chkParishes = document.getElementById("chk-parishes");
const chkVillages = document.getElementById("chk-villages");

chkDivisions.onchange =
chkSubcounties.onchange =
chkParishes.onchange =
chkVillages.onchange = () => {
  if (kampalaFeatures) renderKampalaLayers();
};


//-----------------------------------------------------
// STYLE FUNCTIONS
//-----------------------------------------------------
function styleDivision() {
  return { color:"#d60000", weight:2.5, fillOpacity:0.05, pane:"divisionsPane" };
}

function styleSubcounty() {
  return { color:"#0048ff", weight:2, fillOpacity:0.05, pane:"subcountiesPane" };
}

function styleParish() {
  return { color:"#008f39", weight:1.8, fillOpacity:0.07, pane:"parishesPane" };
}

function styleVillage() {
  return { color:"#ffb300", weight:0.4, fillColor:"#ffe9a3",
           fillOpacity:0.25, pane:"villagesPane" };
}

function tempHighlight(layer) {
  layer.setStyle({ weight: layer.options.weight + 1.5 });
}


//-----------------------------------------------------
// HELPER: Choose best available name
//-----------------------------------------------------
function getBestName(props) {
  if (props.VNAME2014) return {level:"Village", name:props.VNAME2014};
  if (props.PNAME2014) return {level:"Parish", name:props.PNAME2014};
  if (props.SNAME2014) return {level:"Subcounty", name:props.SNAME2014};
  if (props.CNAME2014) return {level:"Division", name:props.CNAME2014};
  return {level:"Unknown", name:"Unknown"};
}


//-----------------------------------------------------
// GLOBALS FOR KAMPALA
//-----------------------------------------------------
let kampalaFeatures = null;
let layerDivisions = null;
let layerSubcounties = null;
let layerParishes = null;
let layerVillages = null;


// Remove all Kampala layers
function hideKampalaLayers() {
  [layerDivisions, layerSubcounties, layerParishes, layerVillages].forEach(l => {
    if (l) { map.removeLayer(l); }
  });
}


// Render Kampala layers according to toggles
function renderKampalaLayers() {
  hideKampalaLayers();

  // group collections by admin unit
  const feats = kampalaFeatures.features;
  const divisions = feats.filter(f => f.properties.CNAME2014);
  const subcounties = feats.filter(f => f.properties.SNAME2014);
  const parishes = feats.filter(f => f.properties.PNAME2014);
  const villages = feats.filter(f => f.properties.VNAME2014);

  // Divisions
  if (chkDivisions.checked) {
    layerDivisions = L.geoJSON(divisions, {
      style: styleDivision,
      onEachFeature: (f, l) => {
        const h = getBestName(f.properties);
        l.bindTooltip(h.name, {sticky:true, className:"hover-label"});
        l.on("mouseover", () => tempHighlight(l));
        l.on("mouseout", () => layerDivisions.resetStyle(l));
        l.on("click", e => {
          L.popup().setLatLng(e.latlng)
            .setContent(`<b>${h.level}:</b> ${h.name}`)
            .openOn(map);
          document.getElementById("info-content").innerHTML =
            `<h3>${h.name}</h3>Level: ${h.level}`;
        });
      }
    }).addTo(map);
  }

  // Subcounties
  if (chkSubcounties.checked) {
    layerSubcounties = L.geoJSON(subcounties, {
      style: styleSubcounty,
      onEachFeature: (f, l) => {
        const h = getBestName(f.properties);
        l.bindTooltip(h.name, {sticky:true, className:"hover-label"});
        l.on("mouseover", () => tempHighlight(l));
        l.on("mouseout", () => layerSubcounties.resetStyle(l));
        l.on("click", e => {
          L.popup().setLatLng(e.latlng)
            .setContent(`<b>${h.level}:</b> ${h.name}`)
            .openOn(map);
          document.getElementById("info-content").innerHTML =
            `<h3>${h.name}</h3>Level: ${h.level}`;
        });
      }
    }).addTo(map);
  }

  // Parishes
  if (chkParishes.checked) {
    layerParishes = L.geoJSON(parishes, {
      style: styleParish,
      onEachFeature: (f, l) => {
        const h = getBestName(f.properties);
        l.bindTooltip(h.name, {sticky:true, className:"hover-label"});
        l.on("mouseover", () => tempHighlight(l));
        l.on("mouseout", () => layerParishes.resetStyle(l));
        l.on("click", e => {
          L.popup().setLatLng(e.latlng)
            .setContent(`<b>${h.level}:</b> ${h.name}`)
            .openOn(map);
          document.getElementById("info-content").innerHTML =
            `<h3>${h.name}</h3>Level: ${h.level}`;
        });
      }
    }).addTo(map);
  }

  // Villages
  if (chkVillages.checked) {
    layerVillages = L.geoJSON(villages, {
      style: styleVillage,
      onEachFeature: (f, l) => {
        const h = getBestName(f.properties);
        l.bindTooltip(h.name, {sticky:true, className:"hover-label"});
        l.on("mouseover", () => tempHighlight(l));
        l.on("mouseout", () => layerVillages.resetStyle(l));
        l.on("click", e => {
          L.popup().setLatLng(e.latlng)
            .setContent(`<b>${h.level}:</b> ${h.name}`)
            .openOn(map);
          document.getElementById("info-content").innerHTML =
            `<h3>${h.name}</h3>Level: ${h.level}`;
        });
      }
    }).addTo(map);
  }
}


//-----------------------------------------------------
// COUNTRY DISTRICTS
//-----------------------------------------------------
let districtsLayer = null;
let selectedDistrict = null;

fetch(COUNTRY_FILE)
  .then(r => r.json())
  .then(geo => {
    districtsLayer = L.geoJSON(geo, {
      style: {color:"#333", weight:1, fillColor:"#cce5ff", fillOpacity:0.6},
      onEachFeature: (f, l) => {

        l.on("mouseover", () => {
          l.setStyle({fillColor:"#99ccff"});
        });

        l.on("mouseout", () => {
          if (selectedDistrict !== l) districtsLayer.resetStyle(l);
        });

        l.on("click", e => {

          // highlight district
          if (selectedDistrict) districtsLayer.resetStyle(selectedDistrict);
          selectedDistrict = l;
          l.setStyle({weight:3, color:"#00aa00", fillColor:"#ccffcc", fillOpacity:0.7});

          const dname =
            (f.properties.DNAME2014 || f.properties.NAME_1 ||
             f.properties.NAME_2 || "Unknown").toUpperCase();

          document.getElementById("info-content").innerHTML =
            `<h3>${dname}</h3>District selected.`;

          if (dname.includes("KAMPALA")) loadKampala();
          else hideKampalaLayers();
        });
      }
    }).addTo(map);
  });


//-----------------------------------------------------
// LOAD KAMPALA ONCE
//-----------------------------------------------------
function loadKampala() {
  if (kampalaFeatures) {
    renderKampalaLayers();
    return;
  }

  fetch(KAMPALA_FILE)
    .then(r => r.json())
    .then(j => {
      kampalaFeatures = j;
      renderKampalaLayers();
    });
}
