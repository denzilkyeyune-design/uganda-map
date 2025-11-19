// -----------------------------
// CONFIG & FILE NAMES
// -----------------------------
const COUNTRY_FILE = "district_boundaries_2014.geojson"; // country districts
const KAMPALA_FILE = "Kampala District.json";             // your Kampala feature file
const DISTRICT_INFO_FILE = "district-data.json";         // optional metadata

// -----------------------------
// MAP & BASEMAP
// -----------------------------
const map = L.map('map').setView([0.3136, 32.5811], 7);

const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

let basemapOn = true;
document.getElementById("btn-toggle-basemap").addEventListener("click", () => {
  if (basemapOn) { map.removeLayer(osm); document.getElementById("btn-toggle-basemap").innerText = "Basemap: OFF"; }
  else { map.addLayer(osm); document.getElementById("btn-toggle-basemap").innerText = "Basemap: ON"; }
  basemapOn = !basemapOn;
});

// reset button
document.getElementById("btn-reset").addEventListener("click", () => {
  map.setView([1.3, 32.3], 7);
  if (selectedDistrictLayer) districtsLayer.resetStyle(selectedDistrictLayer);
  hideKampalaLayers();
  document.getElementById("info-content").innerHTML = "Click any district (click Kampala to load admin units).";
});

// -----------------------------
// UI toggles (initial state: divisions ON)
 // -----------------------------
const chkDivisions = document.getElementById("chk-divisions");
const chkSubcounties = document.getElementById("chk-subcounties");
const chkParishes = document.getElementById("chk-parishes");
const chkVillages = document.getElementById("chk-villages");

// -----------------------------
// GLOBAL LAYER HOLDERS
// -----------------------------
let districtsLayer = null;
let selectedDistrictLayer = null;

// Kampala source + derived layers
let kampalaGeo = null;         // raw features (loaded once)
let layerDivisions = null;
let layerSubcounties = null;
let layerParishes = null;
let layerVillages = null;

// optional metadata
let districtInfo = {};
fetch(DISTRICT_INFO_FILE).then(r=>r.json()).then(j=>districtInfo=j).catch(()=>{ districtInfo = {}; });

// -----------------------------
// STYLE FUNCTIONS
// -----------------------------
function styleDivision(feat){ return { color:"#cc0000", weight:1.8, fillOpacity:0.05 }; }     // red outlines
function styleSubcounty(feat){ return { color:"#005ce6", weight:1.4, fillOpacity:0.06 }; }   // blue
function styleParish(feat){ return { color:"#0b8a43", weight:1.2, fillOpacity:0.08 }; }      // green
function styleVillage(feat){ return { color:"#ffaa00", weight:0.6, fillOpacity:0.35 }; }     // orange/yellow fill

function highlightTemp(layer, options) {
  layer.setStyle(Object.assign({ weight:2.6, fillOpacity: Math.max(options.fillOpacity || 0.4, 0.4) }, { color: options.color }));
}

// -----------------------------
// HELPER: click shows village-first name
// -----------------------------
function getHierarchyName(props) {
  // return village if exists, else parish, else subcounty, else division
  if (props && props.VNAME2014 && String(props.VNAME2014).trim() !== "") return { level:"Village", name: props.VNAME2014 };
  if (props && props.PNAME2014 && String(props.PNAME2014).trim() !== "") return { level:"Parish", name: props.PNAME2014 };
  if (props && props.SNAME2014 && String(props.SNAME2014).trim() !== "") return { level:"Subcounty", name: props.SNAME2014 };
  if (props && props.CNAME2014 && String(props.CNAME2014).trim() !== "") return { level:"Division", name: props.CNAME2014 };
  return { level:"Unknown", name: "Unknown" };
}

// -----------------------------
// LOAD COUNTRY DISTRICTS (first layer)
// -----------------------------
fetch(COUNTRY_FILE)
  .then(r=>r.json())
  .then(geojson => {
    districtsLayer = L.geoJSON(geojson, {
      style: { color:"#333", weight:1, fillColor:"#cce5ff", fillOpacity:0.6 },
      onEachFeature: function(feat, lyr) {
        lyr.on("mouseover", function(){ this.setStyle({ fillColor:"#99ccff" }); });
        lyr.on("mouseout", function(){ if (selectedDistrictLayer !== lyr) districtsLayer.resetStyle(lyr); });
        lyr.on("click", function(e){
          // highlight district
          if (selectedDistrictLayer) districtsLayer.resetStyle(selectedDistrictLayer);
          selectedDistrictLayer = lyr;
          lyr.setStyle({ weight:3, color:"#00aa00", fillColor:"#ccffcc", fillOpacity:0.7 });

          const dname = (feat.properties.DNAME2014 || feat.properties.NAME_1 || feat.properties.NAME_2 || "Unknown").toUpperCase();
          const info = districtInfo[dname] || districtInfo[dname.toUpperCase()] || null;
          document.getElementById("info-content").innerHTML = info ? `<h3>${dname}</h3>` + (info.summary || "") : `<h3>${dname}</h3><div>No metadata available</div>`;

          // only load Kampala layers when Kampala clicked
          if (dname.includes("KAMPALA")) {
            loadKampalaIfNeeded();
          } else {
            hideKampalaLayers();
          }
        });
      }
    }).addTo(map);
  })
  .catch(err => {
    console.error("Failed loading country districts:", err);
    document.getElementById("info-content").innerText = "Failed to load districts.";
  });

// -----------------------------
// LOAD KAMPALA RAW GEOJSON (only once)
// -----------------------------
async function loadKampalaIfNeeded(){
  if (kampalaGeo) {
    // ensure layers match toggles
    ensureKampalaLayersFromSource();
    return;
  }

  try {
    const res = await fetch(KAMPALA_FILE);
    kampalaGeo = await res.json();
    ensureKampalaLayersFromSource();
  } catch(err) {
    console.error("Failed to load Kampala file:", err);
    document.getElementById("info-content").innerText = "Failed to load Kampala data.";
  }
}

// -----------------------------
// CREATE / UPDATE KAMPALA LAYERS BASED ON TOGGLES
// -----------------------------
function ensureKampalaLayersFromSource() {
  // remove any existing layers first
  hideKampalaLayers(false);

  // Prepare feature collections by filtering the single source (kampalaGeo)
  const feats = kampalaGeo.features || kampalaGeo; // defensive
  const divisionsFC = { type:"FeatureCollection", features: feats.filter(f => f.properties && f.properties.CNAME2014) };
  const subcountiesFC = { type:"FeatureCollection", features: feats.filter(f => f.properties && f.properties.SNAME2014) };
  const parishesFC = { type:"FeatureCollection", features: feats.filter(f => f.properties && f.properties.PNAME2014) };
  const villagesFC = { type:"FeatureCollection", features: feats.filter(f => f.properties && f.properties.VNAME2014) };

  // Divisions (default ON)
  if (chkDivisions.checked) {
    layerDivisions = L.geoJSON(divisionsFC, {
      style: styleDivision,
      onEachFeature: function(f, l){
        l.on("click", function(e){
          const h = getHierarchyName(f.properties);
          // highlight this feature briefly
          highlightTemp(l, { color:"#cc0000", fillOpacity:0.12 });
          // show village-first name if available
          const hv = getHierarchyName(f.properties);
          L.popup().setLatLng(e.latlng).setContent(`<b>${hv.level}:</b> ${hv.name}`).openOn(map);
          document.getElementById("info-content").innerHTML = `<h3>${hv.name}</h3><div>Level: ${hv.level}</div>`;
        });
        l.on("mouseover", ()=> l.setStyle({ weight:2.8 }));
        l.on("mouseout", ()=> layerDivisions.resetStyle(l));
      }
    }).addTo(map);
  }

  // Subcounties
  if (chkSubcounties.checked) {
    layerSubcounties = L.geoJSON(subcountiesFC, {
      style: styleSubcounty,
      onEachFeature: function(f, l){
        l.on("click", function(e){
          const hv = getHierarchyName(f.properties);
          L.popup().setLatLng(e.latlng).setContent(`<b>${hv.level}:</b> ${hv.name}`).openOn(map);
          document.getElementById("info-content").innerHTML = `<h3>${hv.name}</h3><div>Level: ${hv.level}</div>`;
        });
        l.on("mouseover", ()=> l.setStyle({ weight:2.4 }));
        l.on("mouseout", ()=> layerSubcounties.resetStyle(l));
      }
    }).addTo(map);
  }

  // Parishes
  if (chkParishes.checked) {
    layerParishes = L.geoJSON(parishesFC, {
      style: styleParish,
      onEachFeature: function(f, l){
        l.on("click", function(e){
          const hv = getHierarchyName(f.properties);
          L.popup().setLatLng(e.latlng).setContent(`<b>${hv.level}:</b> ${hv.name}`).openOn(map);
          document.getElementById("info-content").innerHTML = `<h3>${hv.name}</h3><div>Level: ${hv.level}</div>`;
        });
        l.on("mouseover", ()=> l.setStyle({ weight:2.2 }));
        l.on("mouseout", ()=> layerParishes.resetStyle(l));
      }
    }).addTo(map);
  }

  // Villages
  if (chkVillages.checked) {
    layerVillages = L.geoJSON(villagesFC, {
      style: styleVillage,
      onEachFeature: function(f, l){
        l.on("click", function(e){
          const hv = getHierarchyName(f.properties); // village-first
          L.popup().setLatLng(e.latlng).setContent(`<b>${hv.level}:</b> ${hv.name}`).openOn(map);
          document.getElementById("info-content").innerHTML = `<h3>${hv.name}</h3><div>Level: ${hv.level}</div>`;
        });
        l.on("mouseover", ()=> l.setStyle({ weight:1.8 }));
        l.on("mouseout", ()=> layerVillages.resetStyle(l));
      }
    }).addTo(map);
  }
}

// -----------------------------
// HIDE / REMOVE KAMPALA LAYERS
// -----------------------------
function hideKampalaLayers(removeSource=true){
  if (layerDivisions) { try{ map.removeLayer(layerDivisions);}catch(e){} layerDivisions=null; }
  if (layerSubcounties) { try{ map.removeLayer(layerSubcounties);}catch(e){} layerSubcounties=null; }
  if (layerParishes) { try{ map.removeLayer(layerParishes);}catch(e){} layerParishes=null; }
  if (layerVillages) { try{ map.removeLayer(layerVillages);}catch(e){} layerVillages=null; }

  if (removeSource) {
    kampalaGeo = kampalaGeo || null; // keep source in memory (do not delete to allow re-toggle)
  }
}

// -----------------------------
// TOGGLE CHECKBOX LISTENERS
// -----------------------------
chkDivisions.addEventListener("change", () => {
  // if toggles change while active layer shown, recreate layers
  if (kampalaGeo) { ensureKampalaLayersFromSource(); }
});

chkSubcounties.addEventListener("change", () => { if (kampalaGeo) ensureKampalaLayersFromSource(); });
chkParishes.addEventListener("change", () => { if (kampalaGeo) ensureKampalaLayersFromSource(); });
chkVillages.addEventListener("change", () => { if (kampalaGeo) ensureKampalaLayersFromSource(); });

// -----------------------------
// End of script
// -----------------------------
