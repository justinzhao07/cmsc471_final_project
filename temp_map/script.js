const svg = d3.select("#temp_svg");
const tooltip = d3.select("#temp_tooltip");
// const yearLabel = d3.select("#yearLabel");

const projection = d3.geoNaturalEarth1();
const path = d3.geoPath().projection(projection);
const color = d3.scaleSequential(d3.interpolateRdBu).domain([3, -3]);

// Load GeoJSON and temperature data
Promise.all([
  d3.json("pesticide/data/world.geojson"),
  d3.json("temp_map/temp_change_by_country.json")
  // d3.json("temp_change_by_country.json")
]).then(([world, tempData]) => {
  function updateMap(year) {
    svg.selectAll("path")
      .data(world.features)
      .join("path")
      .attr("d", path)
      .attr("class", "country")
      .attr("fill", d => {
        const temp = tempData[d.properties.name]?.["Y" + year];
        return temp !== null ? color(temp) : "#A9A9A9";
      })
      .on("mouseover", function (event, d) {
        const temp = tempData[d.properties.name]?.["Y" + year];
        if (temp !== null) {
          tooltip.style("display", "block")
            .html(`<strong>${d.properties.name}</strong><br>Year: ${year}<br>Temp Change: ${temp.toFixed(2)}°C`);
        }
      })
      .on("mousemove", function (event) {
        tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function () {
        tooltip.style("display", "none");
      });
        // Legend setup
  const legendWidth = 200;
  const legendHeight = 10;

  const defs = svg.append("defs");

  const gradient = defs.append("linearGradient")
    .attr("id", "temp-legend-gradient")
    .attr("x1", "0%")
    .attr("x2", "100%");

  gradient.selectAll("stop")
    .data([
      { offset: "0%", color: color(3) },
      { offset: "50%", color: color(0) },
      { offset: "100%", color: color(-3) }
    ])
    .enter()
    .append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(20, 300)");

  legend.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#temp-legend-gradient)")
    .style("stroke", "#000");

  const legendScale = d3.scaleLinear()
    .domain([3, -3])  // Note: descending domain since the color scale is RdBu
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d => `${d}°C`);

  legend.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);
  }

  // Initial render
  updateMap(2000);

  // Update on slider change
  // d3.select("#yearSlider").on("input", function () {
  //   const year = this.value;
  //   yearLabel.text(year);
  //   updateMap(year);
  // });
  window.addEventListener("yearUpdate", function(e) {
    const year = e.detail;
    // yearLabel.text(year)
    updateMap(year);
  });
});