/* script.js - safe dissolve + Kampala layering
   - Filters invalid polygons (LinearRing < 4 positions)
   - Attempts turf.buffer(..., 0) to repair
   - Robust union with try/catch so one bad feature won't break everything
*/

const COUNTRY_FILE = "district_boundaries_2014.geojson";
const KAMPALA_FILE = "Kampala District.json";

// Initialise map
const map = L.map('map').setView([0.3136, 32.5811], 11);
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

// Basic UI references (assumes same ids as earlier)
const chkDivisions = document.getElementById("chk-divisions");
const chkSubcounties = document.getElementById("chk-subcounties");
const chkParishes = document.getElementById("chk-parishes");
const chkVillages = document.getElementById("chk-villages");
const infoBox = document.getElementById("infoBox") || document.getElementById("info-content");

// Globals
let districtsLayer = null;
let selectedDistrict = null;
let kampalaFeatures = null;
let layerDivisions = null;
let layerSubcounties = null;
let layerParishes = null;
let layerVillages = null;

// Helper: geometry validity checks
function hasValidPolygonCoords(geom) {
  if (!geom || !geom.type || !geom.coordinates) return false;

  // Polygon: coordinates[0] is the outer ring
  if (geom.type === "Polygon") {
    const outer = geom.coordinates && geom.coordinates[0];
    return Array.isArray(outer) && outer.length >= 4;
  }

  // MultiPolygon: ensure at least one polygon outer ring has >=4
  if (geom.type === "MultiPolygon") {
    return geom.coordinates.some(poly => Array.isArray(poly[0]) && poly[0].length >= 4);
  }

  // other types (Point/Line) - treat as invalid for our dissolving
  return false;
}

// Helper: convert feature to turf feature safely
function toTurfFeature(feat) {
  return turf.feature(feat.geometry, feat.properties || {});
}

// Attempt to repair a feature by buffering 0 (common technique)
function tryRepairFeature(feat) {
  try {
    const repaired = turf.buffer(toTurfFeature(feat), 0, { units: "meters" });
    // check repaired geometry
    if (repaired && repaired.geometry && hasValidPolygonCoords(repaired.geometry)) {
      return repaired;
    }
  } catch (err) {
    // repair failed
  }
  return null;
}

// Safe dissolve/union for an array of features (turf Feature or GeoJSON Feature)
function safeDissolveFeatures(featArray) {
  if (!featArray || featArray.length === 0) return null;
  // convert to turf features
  const turfFeatures = featArray.map(f => toTurfFeature(f));

  // start from the first valid
  let merged = turfFeatures[0];
  for (let i = 1; i < turfFeatures.length; i++) {
    const next = turfFeatures[i];
    try {
      merged = turf.union(merged, next);
      // merged is now a turf feature
    } catch (err) {
      // union failed - try repairing each geometry individually and try again
      console.warn("turf.union failed on a pair; attempting to repair geometries", err);
      try {
        const a = tryRepairFeature({ geometry: merged.geometry, properties: merged.properties }) || merged;
        const b = tryRepairFeature({ geometry: next.geometry, properties: next.properties }) || next;
        merged = turf.union(a, b);
      } catch (err2) {
        // final fallback: if union still fails, skip next and keep merged as-is
        console.error("Failed to union two features even after repair. Skipping this piece.", err2);
        // we keep merged unchanged and continue (so at least we have a partial result)
      }
    }
  }
  return merged;
}

// Group village features by admin key (CNAME2014, SNAME2014, PNAME2014)
function groupByKey(features, key) {
  const groups = {};
  features.forEach(f => {
    const props = f.properties || {};
    const name = props[key];
    if (!name) return;
    if (!groups[name]) groups[name] = [];
    groups[name].push(f);
  });
  return groups;
}

// Clean the raw feature list: remove null geometry and invalid rings where repair fails
function preprocessFeatures(rawFeatures) {
  const valid = [];
  const skipped = [];
  rawFeatures.forEach((f, idx) => {
    const geom = f.geometry;
    if (!geom) {
      skipped.push({ idx, reason: "missing geometry", feat: f });
      return;
    }
    if (hasValidPolygonCoords(geom)) {
      valid.push(f);
      return;
    }
    // try to repair
    const repaired = tryRepairFeature(f);
    if (repaired) {
      // convert repaired (turf feature) back to a simple GeoJSON feature
      valid.push({ type: "Feature", geometry: repaired.geometry, properties: f.properties || {} });
    } else {
      skipped.push({ idx, reason: "invalid linear ring (<4 positions) and repair failed", feat: f });
    }
  });

  if (skipped.length) {
    console.warn("Some features were skipped during preprocessing due to invalid geometry. Check console for details.", skipped.slice(0,10));
  }
  return valid;
}

// Clear previous Kampala layers
function clearKampalaLayers() {
  [layerDivisions, layerSubcounties, layerParishes, layerVillages].forEach(l => {
    if (l && map.hasLayer(l)) map.removeLayer(l);
  });
  layerDivisions = layerSubcounties = layerParishes = layerVillages = null;
}

// Create and draw layers (dissolve villages to higher units)
function renderKampalaFromFeatures(rawFeatures) {
  clearKampalaLayers();

  // 1. Preprocess - filter out invalid geometries / try to repair
  const validFeatures = preprocessFeatures(rawFeatures);
  if (validFeatures.length === 0) {
    console.error("No valid Kampala features found after preprocessing.");
    infoBox.innerText = "Kampala data contains no valid polygons.";
    return;
  }

  // 2. Group by keys
  const divisionsGroups = groupByKey(validFeatures, "CNAME2014");
  const subcountiesGroups = groupByKey(validFeatures, "SNAME2014");
  const parishesGroups = groupByKey(validFeatures, "PNAME2014");

  // 3. Dissolve each group into a single polygon (safe)
  const divisionsGeo = [];
  for (const name of Object.keys(divisionsGroups)) {
    const group = divisionsGroups[name];
    const merged = safeDissolveFeatures(group);
    if (merged) {
      merged.properties = merged.properties || {};
      merged.properties.NAME = name;
      merged.properties.LEVEL = "Division";
      divisionsGeo.push(merged);
    } else {
      console.warn("Division could not be dissolved:", name);
    }
  }

  const subcountiesGeo = [];
  for (const name of Object.keys(subcountiesGroups)) {
    const group = subcountiesGroups[name];
    const merged = safeDissolveFeatures(group);
    if (merged) {
      merged.properties = merged.properties || {};
      merged.properties.NAME = name;
      merged.properties.LEVEL = "Subcounty";
      subcountiesGeo.push(merged);
    } else {
      console.warn("Subcounty could not be dissolved:", name);
    }
  }

  const parishesGeo = [];
  for (const name of Object.keys(parishesGroups)) {
    const group = parishesGroups[name];
    const merged = safeDissolveFeatures(group);
    if (merged) {
      merged.properties = merged.properties || {};
      merged.properties.NAME = name;
      merged.properties.LEVEL = "Parish";
      parishesGeo.push(merged);
    } else {
      console.warn("Parish could not be dissolved:", name);
    }
  }

  // 4. Villages: we will display them as-is (validFeatures already filtered)
  const villagesGeo = validFeatures.map(f => ({
    type: "Feature",
    geometry: f.geometry,
    properties: { NAME: f.properties.VNAME2014 || f.properties.EANAME2014 || "Village" }
  }));

  // 5. Add to map based on toggles - ensure only selected level(s) are shown
  if (chkDivisions.checked) {
    layerDivisions = L.geoJSON(divisionsGeo, {
      style: { color: "#d60000", weight: 3, fillOpacity: 0 },
      onEachFeature: (feat, lyr) => {
        lyr.bindTooltip(feat.properties.NAME || "Division", { sticky: true });
        lyr.on("click", e => {
          L.popup().setLatLng(e.latlng).setContent("<b>Division:</b> " + (feat.properties.NAME)).openOn(map);
          infoBox.innerHTML = `<strong>Division:</strong> ${feat.properties.NAME}`;
        });
      }
    }).addTo(map);
  }

  if (chkSubcounties.checked) {
    layerSubcounties = L.geoJSON(subcountiesGeo, {
      style: { color: "#0048ff", weight: 2.5, fillOpacity: 0 },
      onEachFeature: (feat, lyr) => {
        lyr.bindTooltip(feat.properties.NAME || "Subcounty", { sticky: true });
        lyr.on("click", e => {
          L.popup().setLatLng(e.latlng).setContent("<b>Subcounty:</b> " + (feat.properties.NAME)).openOn(map);
          infoBox.innerHTML = `<strong>Subcounty:</strong> ${feat.properties.NAME}`;
        });
      }
    }).addTo(map);
  }

  if (chkParishes.checked) {
    layerParishes = L.geoJSON(parishesGeo, {
      style: { color: "#008f39", weight: 2, fillOpacity: 0 },
      onEachFeature: (feat, lyr) => {
        lyr.bindTooltip(feat.properties.NAME || "Parish", { sticky: true });
        lyr.on("click", e => {
          L.popup().setLatLng(e.latlng).setContent("<b>Parish:</b> " + (feat.properties.NAME)).openOn(map);
          infoBox.innerHTML = `<strong>Parish:</strong> ${feat.properties.NAME}`;
        });
      }
    }).addTo(map);
  }

  if (chkVillages.checked) {
    layerVillages = L.geoJSON(villagesGeo, {
      style: { color: "#ff8800", weight: 0.6, fillOpacity: 0.25 },
      onEachFeature: (feat, lyr) => {
        lyr.bindTooltip(feat.properties.NAME || "Village", { sticky: false });
        lyr.on("click", e => {
          L.popup().setLatLng(e.latlng).setContent("<b>Village:</b> " + (feat.properties.NAME)).openOn(map);
          infoBox.innerHTML = `<strong>Village:</strong> ${feat.properties.NAME}`;
        });
      }
    }).addTo(map);
  }

  console.log("Kampala rendering complete. Divisions:", divisionsGeo.length,
              "Subcounties:", subcountiesGeo.length, "Parishes:", parishesGeo.length,
              "Villages (valid):", villagesGeo.length);
}


// ----------------------
// Load country districts (unchanged)
// ----------------------
fetch(COUNTRY_FILE)
  .then(r => r.json())
  .then(geo => {
    districtsLayer = L.geoJSON(geo, {
      style: { color: "#333", weight: 1, fillColor: "#cce5ff", fillOpacity: 0.6 },
      onEachFeature: (feat, lyr) => {
        lyr.on("mouseover", function() { this.setStyle({ fillColor: "#99ccff" }); });
        lyr.on("mouseout", function() { if (selectedDistrict !== lyr) districtsLayer.resetStyle(lyr); });
        lyr.on("click", function(e) {
          if (selectedDistrict) districtsLayer.resetStyle(selectedDistrict);
          selectedDistrict = lyr;
          lyr.setStyle({ weight: 3, color: "#00aa00", fillColor: "#ccffcc", fillOpacity: 0.7 });

          const dname = (feat.properties.DNAME2014 || feat.properties.NAME_1 || feat.properties.NAME_2 || "Unknown").toUpperCase();
          infoBox.innerHTML = `<strong>${dname}</strong><br>District selected.`;

          // Only load Kampala details for Kampala
          if (dname.includes("KAMPALA")) {
            // load the kampala file if not loaded
            if (!kampalaFeatures) {
              fetch(KAMPALA_FILE)
                .then(res => res.json())
                .then(j => {
                  kampalaFeatures = j;
                  // kampalaFeatures might be a FeatureCollection or array
                  const raw = (kampalaFeatures.type && kampalaFeatures.type === "FeatureCollection") ? kampalaFeatures.features : kampalaFeatures;
                  renderKampalaFromFeatures(raw);
                }).catch(err => {
                  console.error("Failed to load Kampala file:", err);
                  infoBox.innerText = "Failed to load Kampala geometry.";
                });
            } else {
              // already loaded - re-render according to toggles
              const raw = (kampalaFeatures.type && kampalaFeatures.type === "FeatureCollection") ? kampalaFeatures.features : kampalaFeatures;
              renderKampalaFromFeatures(raw);
            }
          } else {
            // clicked non-Kampala district - clear Kampala layers
            clearKampalaLayers();
            infoBox.innerHTML = `<strong>${dname}</strong><br>No Kampala layers showing.`;
          }
        });
      }
    }).addTo(map);
  })
  .catch(err => {
    console.error("Failed to load districts:", err);
    infoBox.innerText = "Failed to load district boundaries.";
  });

// Wire checkbox listeners to re-render (safe)
[ chkDivisions, chkSubcounties, chkParishes, chkVillages ].forEach(cb => {
  cb.addEventListener('change', () => {
    if (!kampalaFeatures) return;
    const raw = (kampalaFeatures.type && kampalaFeatures.type === "FeatureCollection") ? kampalaFeatures.features : kampalaFeatures;
    renderKampalaFromFeatures(raw);
  });
});

