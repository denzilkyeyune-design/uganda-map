// ---------- Configuration ----------
const COUNTRY_GEOJSON = "district_boundaries_2014.geojson"; // country layer (already in your project)
const KAMPALA_FILE = "Kampala District.json";                // EXACT filename you gave
const DISTRICT_INFO_FILE = "district-data.json";            // stats/metadata file

// ---------- Map & basemap ----------
const map = L.map('map').setView([0.3136, 32.5811], 7); // Uganda center
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
osm.addTo(map);

let basemapVisible = true;
document.getElementById("toggleBasemap").addEventListener("click", function(){
  if (basemapVisible) { map.removeLayer(osm); basemapVisible = false; this.textContent = "🗺️ Basemap: OFF"; }
  else { map.addLayer(osm); basemapVisible = true; this.textContent = "🗺️ Basemap: ON"; }
});

// ---------- Global state ----------
let districtInfo = {};
fetch(DISTRICT_INFO_FILE).then(r => r.json()).then(j => districtInfo = j).catch(()=>{ districtInfo = {}; });

let countryLayer;            // full country layer
let kampalaAllLayer = null;   // all features from Kampala file (villages with attributes)
let currentLayer = null;      // active visible layer for current drill level
let selectedFeatureLayer = null;
let currentLevel = "country"; // country | kampala-all | division | parish | village

// helper: color map generator (by name)
function colorForName(name){
  // simple deterministic hash to few colours
  const palette = ["#cce5ff","#ffd6a5","#e6e6fa","#d9f2e6","#ffe5cc","#e5ccff","#fce2e2","#e8f8ff","#f0ead6"];
  let h = 0;
  for (let i=0;i<name.length;i++){ h = (h*31 + name.charCodeAt(i)) >>> 0; }
  return palette[h % palette.length];
}

// ---------- Utility: reset selected and styles ----------
function clearSelection(){
  if (selectedFeatureLayer) {
    // reset style of selected to default depending on current layer type
    if (currentLayer) currentLayer.resetStyle(selectedFeatureLayer);
    selectedFeatureLayer = null;
  }
}

// ---------- Load country (district) layer first ----------
fetch(COUNTRY_GEOJSON)
  .then(r => r.json())
  .then(geojson => {
    countryLayer = L.geoJSON(geojson, {
      style: { color:"#333", weight:1, fillColor:"#cce5ff", fillOpacity:0.6 },
      onEachFeature: function(feature, layer){
        layer.on("click", function(e){
          const name = feature.properties.DNAME2014 || feature.properties.NAME_1 || feature.properties.DISTRICT || "Unknown";
          // If Kampala clicked -> load Kampala features
          if ((name+"").toUpperCase() === "KAMPALA" || (name+"").toUpperCase().includes("KAMPALA")) {
            loadKampala();
            document.getElementById("title").innerText = name;
            document.getElementById("info-content").innerHTML = `<div class="feature-label">${name}</div><div class="small">Loading Kampala admin features...</div>`;
          } else {
            // show basic info for non-Kampala district
            document.getElementById("title").innerText = name;
            const info = districtInfo[name] || districtInfo[name.toUpperCase()] || null;
            document.getElementById("info-content").innerHTML = info ? formatDistrictInfo(name, info) : `<div class="feature-label">${name}</div><div class="small">No data available.</div>`;
          }
        });
      }
    }).addTo(map);
  });

// ---------- Format info HTML ----------
function formatDistrictInfo(name, info){
  return `
    <div class="feature-label">${name}</div>
    <div><b>Population:</b> ${info.population || "N/A"}</div>
    <div><b>Households:</b> ${info.households || "N/A"}</div>
    <div><b>Notes:</b> ${info.notes || "—"}</div>
  `;
}

// ---------- Load Kampala full file (villages + attributes) ----------
async function loadKampala(){
  // if already loaded, show kampalaAllLayer (coloured by SNAME2014)
  if (!kampalaAllLayer) {
    try {
      const res = await fetch(encodeURI(KAMPALA_FILE));
      const geo = await res.json();

      // create a layer but style by division (SNAME2014)
      kampalaAllLayer = L.geoJSON(geo, {
        style: function(feat){
          const s = (feat.properties.SNAME2014 || "Unknown").toString();
          return { color:"#004d26", weight:0.8, fillColor: colorForName(s), fillOpacity: 0.6 };
        },
        onEachFeature: function(feat, lyr){
          lyr.on("click", function(e){
            // determine the division (SNAME2014) of clicked feature
            const division = feat.properties.SNAME2014 || feat.properties.SUBREGION || feat.properties.SNAME || "Unknown Division";
            // move to division view
            showDivision(division);
          });

          lyr.on("mouseover", function(e){
            if (selectedFeatureLayer !== lyr) lyr.setStyle({ weight:2.5, fillOpacity:0.8 });
          });
          lyr.on("mouseout", function(e){
            if (selectedFeatureLayer !== lyr) kampalaAllLayer.resetStyle(lyr);
          });
        }
      });
    } catch(err){
      console.error("Failed to load Kampala file:", err);
      document.getElementById("info-content").innerText = "Failed to load Kampala data.";
      return;
    }
  }

  // hide country layer, show Kampala all features
  if (countryLayer) map.removeLayer(countryLayer);
  if (currentLayer) map.removeLayer(currentLayer);

  kampalaAllLayer.addTo(map);
  currentLayer = kampalaAllLayer;
  currentLevel = "kampala-all";
  document.getElementById("btn-back").style.display = "inline-block";
}

// ---------- Show division view (filter by SNAME2014) ----------
let divisionLayer = null;
function showDivision(divisionName){
  clearSelection();

  // ensure kampalaAllLayer exists
  if (!kampalaAllLayer) { loadKampala(); return; }

  // remove existing division/village layers
  if (divisionLayer) { map.removeLayer(divisionLayer); divisionLayer = null; }
  if (currentLayer && currentLayer !== kampalaAllLayer) map.removeLayer(currentLayer);

  // build filtered feature collection for all features where SNAME2014 == divisionName
  kampalaAllLayer.eachLayer(function(layer){
    // nothing — we will create a new filtered layer instead
  });

  // fetch file and filter
  fetch(encodeURI(KAMPALA_FILE)).then(r=>r.json()).then(data=>{
    const features = data.features.filter(f => (f.properties.SNAME2014||"").toString() === divisionName.toString());
    // If no direct match (maybe case difference), try case-insensitive match
    if (features.length === 0) {
      const alt = data.features.filter(f => ((f.properties.SNAME2014||"")+"").toUpperCase() === divisionName.toString().toUpperCase());
      if (alt.length) features.push(...alt);
    }
    // division layer: show all features but styled strongly
    divisionLayer = L.geoJSON({ type:"FeatureCollection", features: features }, {
      style: function(feat){
        return { color:"#0b8a43", weight:1.6, fillColor:"#bfead1", fillOpacity:0.8 };
      },
      onEachFeature: function(feat, lyr){
        lyr.on("click", function(e){
          // click parish (PNAME2014)
          const parish = feat.properties.PNAME2014 || feat.properties.PNAME || "Unknown Parish";
          showParish(parish, divisionName);
        });
        lyr.on("mouseover", function(e){
          if (selectedFeatureLayer !== lyr) lyr.setStyle({ weight:3, fillOpacity:0.95 });
        });
        lyr.on("mouseout", function(e){
          if (selectedFeatureLayer !== lyr) divisionLayer.resetStyle(lyr);
        });
      }
    }).addTo(map);

    // fade other kampala features to background for emphasis
    kampalaAllLayer.setStyle({ fillOpacity:0.18, color:"#888" });

    currentLayer = divisionLayer;
    currentLevel = "division";
    document.getElementById("title").innerText = divisionName;
    document.getElementById("info-content").innerHTML = `<div class="feature-label">${divisionName}</div><div class="small">Click a parish in this division to view villages.</div>`;
    document.getElementById("btn-back").style.display = "inline-block";
  });
}

// ---------- Show parish view (filter by PNAME2014 within division) ----------
let parishLayer = null;
function showParish(parishName, divisionName){
  clearSelection();

  // remove existing parish/village layers
  if (parishLayer) { map.removeLayer(parishLayer); parishLayer = null; }
  if (currentLayer && currentLayer !== kampalaAllLayer) map.removeLayer(currentLayer);

  fetch(encodeURI(KAMPALA_FILE)).then(r => r.json()).then(data => {
    // filter features that match both division and parish (if division provided)
    const features = data.features.filter(f => {
      const s = (f.properties.SNAME2014||"").toString();
      const p = (f.properties.PNAME2014||"").toString();
      if (divisionName) {
        return s === divisionName && p === parishName;
      }
      return p === parishName;
    });

    // if exact match fails, try case-insensitive
    if (features.length === 0) {
      const alt = data.features.filter(f => {
        const s = (f.properties.SNAME2014||"").toString().toUpperCase();
        const p = (f.properties.PNAME2014||"").toString().toUpperCase();
        return (!divisionName || s === divisionName.toString().toUpperCase()) && p === parishName.toString().toUpperCase();
      });
      if (alt.length) features.push(...alt);
    }

    parishLayer = L.geoJSON({ type:"FeatureCollection", features: features }, {
      style: function(feat){ return { color:"#0056b3", weight:1.6, fillColor:"#d6e8ff", fillOpacity:0.9 }; },
      onEachFeature: function(feat, lyr){
        lyr.on("click", function(e){
          const village = feat.properties.VNAME2014 || feat.properties.VNAME || "Unknown Village";
          showVillages(village, parishName);
        });
        lyr.on("mouseover", function(e){
          if (selectedFeatureLayer !== lyr) lyr.setStyle({ weight:3, fillOpacity:1.0 });
        });
        lyr.on("mouseout", function(e){
          if (selectedFeatureLayer !== lyr) parishLayer.resetStyle(lyr);
        });
      }
    }).addTo(map);

    // de-emphasize division layer
    if (divisionLayer) divisionLayer.setStyle({ fillOpacity:0.3, color:"#999" });

    currentLayer = parishLayer;
    currentLevel = "parish";
    document.getElementById("title").innerText = parishName;
    document.getElementById("info-content").innerHTML = `<div class="feature-label">${parishName}</div><div class="small">Click a village to view details.</div>`;
    document.getElementById("btn-back").style.display = "inline-block";
  });
}

// ---------- Show villages (filter all features matching parish) ----------
let villageLayer = null;
function showVillages(villageName, parishName){
  clearSelection();

  if (villageLayer) { map.removeLayer(villageLayer); villageLayer = null; }
  if (currentLayer && currentLayer !== kampalaAllLayer) map.removeLayer(currentLayer);

  fetch(encodeURI(KAMPALA_FILE)).then(r=>r.json()).then(data=>{
    // if we have parishName, filter villages under it; otherwise find matching village
    let features = data.features.filter(f => {
      const v = (f.properties.VNAME2014||"").toString();
      const p = (f.properties.PNAME2014||"").toString();
      if (parishName) return p === parishName && v === villageName;
      return v === villageName;
    });

    if (features.length === 0) {
      // fallback case-insensitive match
      features = data.features.filter(f => ((f.properties.VNAME2014||"")+"").toUpperCase() === villageName.toString().toUpperCase());
    }

    villageLayer = L.geoJSON({ type:"FeatureCollection", features }, {
      style: { color:"#0b8a43", weight:2.5, fillColor:"#c8f0d0", fillOpacity:1.0 },
      onEachFeature: function(feat, lyr){
        lyr.on("click", function(e){
          // show village info in sidebar
          const v = feat.properties.VNAME2014 || feat.properties.VNAME || "Village";
          const p = feat.properties.PNAME2014 || feat.properties.PNAME || "";
          const s = feat.properties.SNAME2014 || feat.properties.SUBREGION || "";
          const meta = {
            village: v,
            parish: p,
            division: s,
            population: feat.properties.POP_2014 || feat.properties.POP2014 || "N/A",
            households: feat.properties.HH2014 || feat.properties.HH2010 || "N/A"
          };
          document.getElementById("title").innerText = v;
          document.getElementById("info-content").innerHTML = `
            <div class="feature-label">${meta.village}</div>
            <div><b>Parish:</b> ${meta.parish}</div>
            <div><b>Division:</b> ${meta.division}</div>
            <div><b>Population (2014):</b> ${meta.population}</div>
            <div><b>Households (2014):</b> ${meta.households}</div>
          `;
        });
      }
    }).addTo(map);

    // de-emphasize parish
    if (parishLayer) parishLayer.setStyle({ fillOpacity:0.25, color:"#999" });

    currentLayer = villageLayer;
    currentLevel = "village";
    document.getElementById("title").innerText = villageName || "Village";
    document.getElementById("info-content").innerHTML = `<div class="feature-label">${villageName}</div><div class="small">Village selected — click geometry for details.</div>`;
    document.getElementById("btn-back").style.display = "inline-block";
  });
}

// ---------- Back and Reset controls ----------
document.getElementById("btn-reset").addEventListener("click", function(){
  // Remove any kampala-derived layers and restore country layer
  if (kampalaAllLayer) { try{ map.removeLayer(kampalaAllLayer);}catch(e){} }
  if (divisionLayer) { try{ map.removeLayer(divisionLayer); }catch(e){} divisionLayer=null; }
  if (parishLayer) { try{ map.removeLayer(parishLayer); }catch(e){} parishLayer=null; }
  if (villageLayer) { try{ map.removeLayer(villageLayer); }catch(e){} villageLayer=null; }

  if (countryLayer) countryLayer.addTo(map);
  currentLayer = countryLayer;
  currentLevel = "country";
  document.getElementById("title").innerText = "District Information";
  document.getElementById("info-content").innerHTML = "Click a district to begin (click Kampala to load its layers).";
  document.getElementById("btn-back").style.display = "none";
});

document.getElementById("btn-back").addEventListener("click", function(){
  // Move one level up
  if (currentLevel === "village") {
    // go back to parish
    if (parishLayer) { map.addLayer(parishLayer); currentLayer = parishLayer; currentLevel = "parish"; document.getElementById("title").innerText = "Parish"; document.getElementById("info-content").innerHTML = "Click a parish to view villages."; }
    if (villageLayer) { map.removeLayer(villageLayer); villageLayer = null; }
  } else if (currentLevel === "parish") {
    // go back to division
    if (divisionLayer) { map.addLayer(divisionLayer); currentLayer = divisionLayer; currentLevel = "division"; document.getElementById("title").innerText = "Division"; document.getElementById("info-content").innerHTML = "Click a division to view parishes."; }
    if (parishLayer) { map.removeLayer(parishLayer); parishLayer = null; }
  } else if (currentLevel === "division") {
    // go back to kampala overview
    if (kampalaAllLayer) { kampalaAllLayer.addTo(map); currentLayer = kampalaAllLayer; currentLevel = "kampala-all"; document.getElementById("title").innerText = "Kampala"; document.getElementById("info-content").innerHTML = "Kampala overview. Click a division to continue."; }
    if (divisionLayer) { map.removeLayer(divisionLayer); divisionLayer = null; }
  } else {
    // else reset
    document.getElementById("btn-reset").click();
  }

  // hide back if at top
  if (currentLevel === "country") document.getElementById("btn-back").style.display = "none";
});

// End of script.js
