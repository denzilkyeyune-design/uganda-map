// script.js - full file. Replace filenames below if your filenames differ.

// --- Basic map + base layer ---
var map = L.map('map', { zoomControl: true }).setView([0.31, 32.58], 12);

var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Basemap toggle state
var basemapOn = true;

// Layer groups to hold GeoJSON layers
var layerDistrict = L.layerGroup().addTo(map);
var layerDivisions = L.layerGroup();
var layerSubcounties = L.layerGroup();
var layerParishes = L.layerGroup();
var layerVillages = L.layerGroup();

// For keeping track of selected polygon
var lastSelectedLayer = null;
var lastSelectedFeatureId = null;

// Optional info JSON (extra metadata keyed by name or id)
var districtInfo = {}; // loaded later if available

// Utility: default styles for layers (distinct colour per admin level)
var styles = {
  district: { color: "#1a7f37", weight: 3, fillOpacity: 0.05 },
  divisions: { color: "#ff4d4f", weight: 2, fillOpacity: 0.0 },     // red lines
  subcounties: { color: "#1f77b4", weight: 2, fillOpacity: 0.0 },  // blue lines
  parishes: { color: "#d62728", weight: 1.5, fillOpacity: 0.0 },   // darker red
  villages: { color: "#666666", weight: 1, fillOpacity: 0.2 }     // villages filled lightly
};

// Style function factory
function styleFor(level) {
  return function(feature) {
    var base = styles[level] || { color: "#888", weight: 1, fillOpacity: 0.1 };
    return Object.assign({}, base);
  };
}

// Hover / highlight style
function highlightStyle(level) {
  return {
    color: "#0a8a0a",
    weight: 3,
    fillOpacity: (level === 'villages') ? 0.35 : 0.05
  };
}

// Reset style to original (for a layer)
function resetStyle(layer, level) {
  if (!layer) return;
  try {
    layer.setStyle && layer.setStyle(styleFor(level));
  } catch(e){ /* some features may be simple markers */ }
}

// --- Sidebar helpers ---
function showSidebarTitle(title) {
  var el = document.getElementById('info-content');
  if (!el) return;
  el.innerHTML = "<h3 style='margin-top:0;'>" + (title || "No title") + "</h3>";
}

function showFeatureInfo(name, props) {
  var el = document.getElementById('info-content');
  if (!el) return;
  var html = "<h3 style='margin:0;color:#0a7f3a;'>" + (name || "Unknown") + "</h3>";
  html += "<p style='margin-top:.5rem;'>" + (props.description || '') + "</p>";

  // Append key stats if present
  if (props.population) html += "<div><strong>Population:</strong> " + props.population + "</div>";
  if (props.households) html += "<div><strong>Households:</strong> " + props.households + "</div>";

  // Optional image logic
  var imageUrl = null;
  if (props.image) imageUrl = props.image; // direct link or filename
  else if (props.EACODE2014) imageUrl = "images/" + props.EACODE2014 + ".jpg";
  else if (props.VCODE2014) imageUrl = "images/" + props.VCODE2014 + ".jpg";
  else if (props.id) imageUrl = "images/" + props.id + ".jpg";

  if (imageUrl) {
    // small protective test — we attach an <img> and let it fail gracefully if 404
    html += "<div style='margin-top:8px;'><img src='" + imageUrl + "' alt='photo' style='width:100%;max-width:260px;border-radius:4px;'></div>";
  } else {
    html += "<div style='margin-top:8px;color:#666;'>No image available.</div>";
  }

  el.innerHTML = html;
}

// --- Click handler for features ---
function onFeatureClick(e, feature, layer, level) {
  // Deselect previous
  if (lastSelectedLayer && lastSelectedLayer !== layer) {
    // restore style for last layer
    if (lastSelectedLayer.resetStyle) {
      lastSelectedLayer.resetStyle();
    } else {
      try { lastSelectedLayer.setStyle(styleFor(level)); } catch(e) {}
    }
  }

  // Highlight current (style depends on level)
  var s = highlightStyle(level);
  try {
    layer.setStyle(s);
    if (layer.bringToFront) layer.bringToFront();
  } catch(e) {}

  lastSelectedLayer = layer;
  lastSelectedFeatureId = feature.id || (feature.properties && (feature.properties.EACODE2014 || feature.properties.VCODE2014 || feature.properties.VNAME2014)) || null;

  // Find a friendly name for the clicked polygon (try common fields)
  var name = feature.properties && (feature.properties.VNAME2014 || feature.properties.PNAME2014 || feature.properties.SNAME2014 || feature.properties.CNAME2014 || feature.properties.DNAME2014 || feature.properties.name) || "Unnamed";

  // show info from properties first; then supplement with districtInfo JSON if available
  var props = Object.assign({}, feature.properties || {});
  var extra = null;
  if (districtInfo) {
    // Try a few keys to match districtInfo entries
    var keys = [feature.properties && feature.properties.EACODE2014, feature.properties && feature.properties.VCODE2014, feature.properties && feature.properties.VNAME2014, name];
    for (var i=0;i<keys.length;i++){
      if (!keys[i]) continue;
      if (districtInfo[keys[i]]) { extra = districtInfo[keys[i]]; break; }
    }
    if (!extra && districtInfo[name]) extra = districtInfo[name];
  }
  if (extra) Object.assign(props, extra);

  showFeatureInfo(name, props);
}

// --- Load GeoJSON helper that wires hover + click ---
function loadGeoJSONToGroup(url, group, level, onLoaded) {
  fetch(url).then(function(r){
    if (!r.ok) throw new Error("Failed to load " + url + " (" + r.status + ")");
    return r.json();
  }).then(function(geojson){
    // create geojson layer
    var gj = L.geoJSON(geojson, {
      style: styleFor(level),
      // Increase clickable area for tiny polygons by giving weight or fillOpacity as needed
      onEachFeature: function(feature, layer) {
        // store resetStyle for convenience
        layer.resetStyle = function(){ gj.resetStyle(layer); };

        // default mouse events
        layer.on({
          mouseover: function(e){
            try { e.target.setStyle({weight: Math.max((styles[level].weight||1)+1, 3)}); } catch(e){}
            layer.bringToFront && layer.bringToFront();
          },
          mouseout: function(e){
            try {
              // only reset if this isn't the selected feature
              var thisId = feature.id || (feature.properties && (feature.properties.EACODE2014 || feature.properties.VCODE2014 || feature.properties.VNAME2014));
              if (thisId !== lastSelectedFeatureId) {
                gj.resetStyle(e.target);
              }
            } catch(err){}
          },
          click: function(e){
            onFeatureClick(e, feature, layer, level);
          }
        });
      }
    });

    group.clearLayers();
    group.addLayer(gj);
    if (onLoaded) onLoaded(gj);
  }).catch(function(err){
    console.error("Could not load GeoJSON ["+url+"]:", err);
  });
}

// --- Load district info JSON (optional) ---
fetch("district-info.json").then(r=> r.ok ? r.json() : null).then(function(data){
  if (data) districtInfo = data;
}).catch(function(){ /* no district-info available */ });

// --- Load all GeoJSON files ---
loadGeoJSONToGroup("kampala_district.geojson", layerDistrict, 'district', function(){ /* district ready */ });
loadGeoJSONToGroup("divisions.geojson", layerDivisions, 'divisions');
loadGeoJSONToGroup("subcounties.geojson", layerSubcounties, 'subcounties');
loadGeoJSONToGroup("parishes.geojson", layerParishes, 'parishes');
loadGeoJSONToGroup("villages.geojson", layerVillages, 'villages');

// --- UI controls: assume these elements exist in HTML ---
function id(el){ return document.getElementById(el); }

function showOnlyLayer(level) {
  // remove all admin groups first
  [layerDivisions, layerSubcounties, layerParishes, layerVillages].forEach(function(g){
    if (map.hasLayer(g)) map.removeLayer(g);
  });

  // Add the requested group
  if (level === 'divisions') {
    if (!map.hasLayer(layerDivisions)) map.addLayer(layerDivisions);
  } else if (level === 'subcounties') {
    if (!map.hasLayer(layerSubcounties)) map.addLayer(layerSubcounties);
  } else if (level === 'parishes') {
    if (!map.hasLayer(layerParishes)) map.addLayer(layerParishes);
  } else if (level === 'villages') {
    if (!map.hasLayer(layerVillages)) map.addLayer(layerVillages);
  } else {
    // none -> show nothing (but keep district)
  }
  // Deselect previous selection
  lastSelectedFeatureId = null;
}

// Wire checkboxes (these IDs must exist in your HTML)
if (id('cbDivisions')) {
  id('cbDivisions').addEventListener('change', function(e){
    if (e.target.checked) {
      // uncheck others
      ['cbSubcounties','cbParishes','cbVillages'].forEach(function(x){ if (id(x)) id(x).checked = false; });
      showOnlyLayer('divisions');
    } else {
      if (map.hasLayer(layerDivisions)) map.removeLayer(layerDivisions);
    }
  });
}
if (id('cbSubcounties')) {
  id('cbSubcounties').addEventListener('change', function(e){
    if (e.target.checked) {
      ['cbDivisions','cbParishes','cbVillages'].forEach(function(x){ if (id(x)) id(x).checked = false; });
      showOnlyLayer('subcounties');
    } else { if (map.hasLayer(layerSubcounties)) map.removeLayer(layerSubcounties); }
  });
}
if (id('cbParishes')) {
  id('cbParishes').addEventListener('change', function(e){
    if (e.target.checked) {
      ['cbDivisions','cbSubcounties','cbVillages'].forEach(function(x){ if (id(x)) id(x).checked = false; });
      showOnlyLayer('parishes');
    } else { if (map.hasLayer(layerParishes)) map.removeLayer(layerParishes); }
  });
}
if (id('cbVillages')) {
  id('cbVillages').addEventListener('change', function(e){
    if (e.target.checked) {
      ['cbDivisions','cbSubcounties','cbParishes'].forEach(function(x){ if (id(x)) id(x).checked = false; });
      showOnlyLayer('villages');
    } else { if (map.hasLayer(layerVillages)) map.removeLayer(layerVillages); }
  });
}

// Basemap toggle button
if (id('basemapToggle')) {
  id('basemapToggle').addEventListener('click', function(){
    if (basemapOn) {
      map.removeLayer(osm);
      id('basemapToggle').innerText = "Basemap: OFF";
      basemapOn = false;
    } else {
      osm.addTo(map);
      id('basemapToggle').innerText = "Basemap: ON";
      basemapOn = true;
    }
  });
}

// Reset button to clear selection and show only district
if (id('resetBtn')) {
  id('resetBtn').addEventListener('click', function(){
    // Remove all admin layers and uncheck boxes
    ['cbDivisions','cbSubcounties','cbParishes','cbVillages'].forEach(function(x){ if (id(x)) id(x).checked = false; });
    [layerDivisions, layerSubcounties, layerParishes, layerVillages].forEach(function(g){ if (map.hasLayer(g)) map.removeLayer(g); });
    lastSelectedFeatureId = null;
    // Reset sidebar
    showSidebarTitle("District selected.");
  });
}

// Ensure district boundary is visible always
// Add the district boundary layer (if not added earlier)
if (!map.hasLayer(layerDistrict)) map.addLayer(layerDistrict);

// When the district geojson finishes loading, we may want to fit bounds (optional)
// but user asked not to auto-zoom; so we keep general center/zoom as set above.

// --- Helpful console message ---
console.log("Map script loaded. Make sure the following files exist: kampala_district.geojson, divisions.geojson, subcounties.geojson, parishes.geojson, villages.geojson. Optional: district-info.json and images/ folder.");

/* End of script.js */

