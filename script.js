// Load the map JSON file
fetch("uganda.json")
  .then(response => response.json())
  .then(data => {
    const svg = d3.select("svg");

    // Draw each district
    svg.append("g")
      .selectAll("path")
      .data(data.features)
      .enter()
      .append("path")
      .attr("d", d3.geoPath())
      .attr("fill", "#cce5ff")
      .attr("stroke", "#333")
      .attr("stroke-width", 0.5)
      .on("mouseover", function () {
        d3.select(this).attr("fill", "#99ccff");
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill", "#cce5ff");
      })
      .on("click", function (event, d) {
        showDistrictInfo(d.properties.DNAME_2014);
      });
  });

// Function to show info when clicking a district
function showDistrictInfo(districtName) {
  // Temporary message — we will add real stats later
  const panel = document.getElementById("info-panel");
  panel.innerHTML = `
      <h2>${districtName}</h2>
      <p>Population: (add data)</p>
      <p>Literacy rate: (add data)</p>
      <p>Households: (add data)</p>
  `;
  panel.style.display = "block";
}
