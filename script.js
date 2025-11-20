// script.js -- Replace your existing file with this entire script

// --- Basic map + basemap ---
var map = L.map("map", { preferCanvas: true }).setView([1.3, 32.3], 7);
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// helper - attempt multiple filenames (some uploads use .json or .geojson)
function tryFetchMultiple(candidates) {
  // returns a promise that resolves to the (json data, usedFilename) or rejects
  return new Promise((resolve, reject) => {
    let tried = 0;
    function tryOne(idx) {
      if (idx >= candidates.length) {
        reject(new Error("All fetch attempts failed: " + candidates.join(", ")));
        return;
      }
      const url = candidates[idx];
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error("Not found: " + url);
          return res.text();
        })
        .then(txt => {
          // some files accidentally uploaded as JS/HTML; validate JSON
          try {
            const json = JSON.parse(txt);
            resolve({ json, used: url });
          } catch (e) {
            // not valid JSON - log and try next
            console.warn("Invalid JSON at", url, e.message);
            tryOne(idx + 1);
          }
        })
        .catch(err => {
          console.warn("Fetch failed for", url, err.message);
          tryOne(idx + 1);
        });
    }
    tryOne(0);
  });
}

// --- Layers and style configuration ---
function baseStyleFactory(color, weight, fillOpacity, dashArray) {
  return function(feature) {
    return {
      color: color,
      weight: weight,
      fillOpacity: typeof fillOpacity === "number" ? fillOpacity : 0.05,
      dashArray: dashArray || null
    };
  };
}

function highlightStyleFactory() {
  return {
    color: "#00a65a",
    weight: 3,
    fillOpacity: 0.15
  };
}

// groups
var regionsGroup = L.geoJSON(null, { style: baseStyleFactory("#6a0dad", 2, 0.08) });
var districtsGroup = L.geoJSON(null, { style: baseStyleFactory("#0066cc", 1, 0.08) });
var kampalaGroup = L.geoJSON(null, { style: baseStyleFactory("#009933", 2.5, 0.12) }); // distinct
var villagesGroup = L.geoJSON(null, { style: baseStyleFactory("#cc0000", 0.6, 0.06) });

// store references to latest highlighted layer so we can reset it
var currentHighlight = { layer: null, originalStyle: null };

// generic onEachFeature for hover/click
function enhanceLayerInteractions(layerGroup, labelFields) {
  layerGroup.eachLayer(function(layer) {
    // if this is created from addData multiple times, ensure only run once
    if (!layer._enhanced) {
      layer._enhanced = true;

      layer.on("mouseover", function(e) {
        // highlight
        this.setStyle({ fillOpacity: 0.25 });
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          this.bringToFront();
        }
        // show tooltip with primary name
        var name = getFeatureDisplayName(this.feature, labelFields);
        if (name) this.bindTooltip(name, { direction: "auto", sticky: true }).openTooltip();
      });

      layer.on("mouseout", function(e) {
        // remove highlight
        this.setStyle({ fillOpacity: layerGroup.options.style && layerGroup.options.style(this.feature).fillOpacity || 0.06 });
        if (this.closeTooltip) this.closeTooltip();
      });

      layer.on("click", function(e) {
        // reset previous highlight
        if (currentHighlight.layer && currentHighlight.layer !== this) {
          try { currentHighlight.layer.setStyle(currentHighlight.originalStyle); } catch (err) {}
        }
        currentHighlight.layer = this;
        // store original style
        currentHighlight.originalStyle = {
          color: this.options.color || this.feature.properties._orig_color || "#3388ff",
          weight: this.options.weight || 1,
          fillOpacity: this.options.fillOpacity || 0.06
        };
        // apply pop-out style
        this.setStyle({ color: "#007f3a", weight: 4, fillOpacity: 0.25 });
        this.bringToFront();

        // fill the sidebar info (id="info-content")
        var infoDiv = document.getElementById("info-content");
        if (infoDiv) {
          var name = getFeatureDisplayName(this.feature, labelFields) || "Unknown";
          var html = "<strong>" + escapeHtml(name) + "</strong><br/><br/>";
          // show useful properties in a readable way
          var props = this.feature.properties || {};
          for (var k in props) {
            if (!props.hasOwnProperty(k)) continue;
            // skip geometry / empty
            if (k === "geometry" || props[k] === null || props[k] === "") continue;
            html += "<b>" + escapeHtml(k) + ":</b> " + escapeHtml(String(props[k])) + "<br/>";
          }
          infoDiv.innerHTML = html;
        }

        // optionally do not auto-zoom; just fit bounds lightly
        // map.fitBounds(this.getBounds(), { maxZoom: 13, padding: [50, 50] });
      });
    }
  });
}

function getFeatureDisplayName(feature, labelFields) {
  var props = feature && feature.properties ? feature.properties : {};
  for (var i = 0; i < labelFields.length; i++) {
    var f = labelFields[i];
    if (props[f]) return props[f];
  }
  // fallback common names
  return props["VNAME2014"] || props["PNAME2014"] || props["DNAME2014"] || props["NAME"] || props["name"] || props["NAME_1"];
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// --- File loading with fallbacks ---
// You can edit these candidate filenames to match what you uploaded.
const regionsCandidates = [
  "Uganda Regional Boundaries.json",
  "Uganda Regional Boundaries.geojson",
  "uganda_regional_boundaries.json"
];
const districtsCandidates = [
  "Uganda District Boundaries 2014.json",
  "Uganda District Boundaries 2014.geojson",
  "Uganda_District_Boundaries_2014.geojson",
  "district_boundaries_2014.geojson",
  "uganda_districts.geojson"
];
const kampalaCandidates = [
  "Kampala District.json",
  "Kampala District.geojson",
  "KAMPALA DISTRICT 2014.json",
  "Kampala_District.json",
  "kampala_district.geojson"
];
const villagesCandidates = [
  "Uganda Villages 2009.json",
  "Uganda Villages 2009.geojson",
  "uganda_villages_2009.geojson",
  "villages.geojson"
];

function loadAndAdd(candidates, group, labelFields) {
  tryFetchMultiple(candidates)
    .then(result => {
      group.addData(result.json);
      enhanceLayerInteractions(group, labelFields || ["VNAME2014", "PNAME2014", "DNAME2014", "NAME"]);
      console.log("Loaded", result.used);
    })
    .catch(err => {
      console.error("Could not load any of:", candidates, err.message);
    });
}

// load layers
loadAndAdd(regionsCandidates, regionsGroup, ["NAME_1", "ADM1_EN", "DNAME2014"]);
loadAndAdd(districtsCandidates, districtsGroup, ["DNAME2014", "NAME_2", "DISTRICT", "NAME"]);
loadAndAdd(kampalaCandidates, kampalaGroup, ["VNAME2014", "PNAME2014", "DNAME2014"]);
loadAndAdd(villagesCandidates, villagesGroup, ["VNAME2014", "EACODE2014", "NAME", "name"]);

// --- layer toggles (checkbox-driven) ---
function safeEl(id) { return document.getElementById(id); }

// Basemap toggle
var basemapBox = safeEl("basemapToggle");
if (basemapBox) {
  basemapBox.addEventListener("change", function() {
    if (this.checked) map.addLayer(osm);
    else map.removeLayer(osm);
  });
}

// Regions
var regionsBox = safeEl("regionsLayer");
if (regionsBox) {
  regionsBox.addEventListener("change", function() {
    if (this.checked) {
      if (!map.hasLayer(regionsGroup)) map.addLayer(regionsGroup);
    } else {
      if (map.hasLayer(regionsGroup)) map.removeLayer(regionsGroup);
    }
  });
}

// Districts (all)
var districtsBox = safeEl("districtsLayer");
if (districtsBox) {
  districtsBox.addEventListener("change", function() {
    if (this.checked) {
      if (!map.hasLayer(districtsGroup)) map.addLayer(districtsGroup);
    } else {
      if (map.hasLayer(districtsGroup)) map.removeLayer(districtsGroup);
    }
  });
}

// Kampala (subset) - independent toggle
var kampalaBox = safeEl("kampalaToggle");
if (kampalaBox) {
  kampalaBox.addEventListener("change", function() {
    if (this.checked) {
      if (!map.hasLayer(kampalaGroup)) map.addLayer(kampalaGroup);
      // make sure districts base is visible too
      if (districtsBox && !districtsBox.checked) {
        // optional: do not auto-check district; user choice. Comment out if undesired.
        // districtsBox.checked = true; map.addLayer(districtsGroup);
      }
    } else {
      if (map.hasLayer(kampalaGroup)) map.removeLayer(kampalaGroup);
    }
  });
}

// Villages
var villagesBox = safeEl("villagesLayer");
if (villagesBox) {
  villagesBox.addEventListener("change", function() {
    if (this.checked) map.addLayer(villagesGroup);
    else map.removeLayer(villagesGroup);
  });
}

// center initial visibility if checkboxes already checked
function applyInitialCheckboxState() {
  if (regionsBox && regionsBox.checked) map.addLayer(regionsGroup);
  if (districtsBox && districtsBox.checked) map.addLayer(districtsGroup);
  if (kampalaBox && kampalaBox.checked) map.addLayer(kampalaGroup);
  if (villagesBox && villagesBox.checked) map.addLayer(villagesGroup);
  if (basemapBox && !basemapBox.checked) map.removeLayer(osm); // if basemapbox exists and unchecked
}
setTimeout(applyInitialCheckboxState, 400); // small delay to allow loads

// --- search box (id = searchInput) ---
var searchInput = safeEl("searchInput");
if (searchInput) {
  searchInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      var q = this.value.trim().toLowerCase();
      if (!q) return;
      // search across layers in priority order
      var found = searchInLayer(kampalaGroup, q) || searchInLayer(districtsGroup, q) || searchInLayer(regionsGroup, q) || searchInLayer(villagesGroup, q);
      if (found) {
        // open info and fit bounds lightly
        map.fitBounds(found.getBounds(), { maxZoom: 13, padding: [50, 50] });
        found.fire("click"); // open info in sidebar
      } else {
        alert("No match found for: " + this.value);
      }
    }
  });
}
function searchInLayer(layerGroup, q) {
  var foundLayer = null;
  layerGroup.eachLayer(function(l) {
    if (foundLayer) return;
    var name = getFeatureDisplayName(l.feature, ["VNAME2014","PNAME2014","DNAME2014","NAME","name","ADM1_EN"]);
    if (name && String(name).toLowerCase().indexOf(q) !== -1) {
      foundLayer = l;
    }
  });
  return foundLayer;
}

// --- utility: bring only selected admin-level boundaries to top / show demarcations only for selected level ---
// NOTE: if you have separate files per admin level use that; for your single file with all units, we must rely on properties.
// Example function (not automatically used) to show only features of a given admin type:
function showOnlyAdminLevel(levelKey, desiredValue, group) {
  // levelKey: property name e.g. "PNAME2014" or "VNAME2014" etc. desiredValue: value to match or "all"
  group.eachLayer(function(l) {
    var props = l.feature.properties || {};
    if (desiredValue === "all" || props[levelKey] === desiredValue) {
      map.addLayer(l);
    } else {
      if (map.hasLayer(l)) map.removeLayer(l);
    }
  });
}

// --- small helper to ensure layers are interactive if data arrives late ---
function periodicallyEnhance() {
  enhanceLayerInteractions(regionsGroup, ["NAME_1", "ADM1_EN", "DNAME2014"]);
  enhanceLayerInteractions(districtsGroup, ["DNAME2014", "NAME_2", "DISTRICT", "NAME"]);
  enhanceLayerInteractions(kampalaGroup, ["VNAME2014", "PNAME2014", "DNAME2014"]);
  enhanceLayerInteractions(villagesGroup, ["VNAME2014", "EACODE2014", "NAME", "name"]);
}
setInterval(periodicallyEnhance, 2000); // harmless repeated enhancer if data was added after initial load

// --- final console hint ---
console.log("Map script loaded. If layers do not appear, please check that your GeoJSON filenames match one of the filename candidates in the top of script.js");

