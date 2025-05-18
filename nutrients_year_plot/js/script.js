function createVis3(data) {
  const margin = { top: 40, right: 80, bottom: 50, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 450 - margin.top - margin.bottom;

  const svg = d3.select("#vis3")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select("#nutrient_tooltip");

  const x = d3.scaleLinear().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain([
      "Cropland nitrogen per unit area",
      "Cropland phosphorus per unit area",
      "Cropland potassium per unit area"
    ])
    .range(["steelblue", "orange", "green"]);

  const line = d3.line()
    .x(d => x(d.Year))
    .y(d => y(d.value));

  // Prepare dropdown
  const areas = Array.from(new Set(data.map(d => d.Area))).sort();
  const select = d3.select("#area-select");

  select.selectAll("option")
    .data(areas)
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  select.on("change", function () {
    updateChart(this.value);
  });

  updateChart(areas[0]); // initial chart

  function updateChart(selectedArea) {
    const filtered = data.filter(d => d.Area === selectedArea);

    const nutrients = [
      "Cropland nitrogen per unit area",
      "Cropland phosphorus per unit area",
      "Cropland potassium per unit area"
    ];

    const nutrientData = nutrients.map(key => ({
      name: key,
      values: filtered.map(d => ({ Year: d.Year, value: d[key] }))
    }));

    x.domain(d3.extent(filtered, d => d.Year)).nice();
    y.domain([0, d3.max(nutrientData.flatMap(n => n.values.map(d => d.value)))]).nice();

    svg.selectAll(".x-axis").remove();
    svg.selectAll(".y-axis").remove();

    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y));

    svg.selectAll(".line").remove();
    svg.selectAll(".dot").remove();
    svg.selectAll(".legend").remove();

    svg.selectAll(".line")
      .data(nutrientData)
      .join("path")
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", d => color(d.name))
      .attr("stroke-width", 2)
      .attr("d", d => line(d.values));

    svg.selectAll(".dot")
      .data(nutrientData.flatMap(d => d.values.map(v => ({ ...v, name: d.name }))))
      .join("circle")
      .attr("class", "dot")
      .attr("cx", d => x(d.Year))
      .attr("cy", d => y(d.value))
      .attr("r", 3)
      .attr("fill", d => color(d.name))
      .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible")
          .html(
            `<strong>${selectedArea}</strong><br/>
             Year: ${d.Year}<br/>
             ${d.name}: ${d.value.toFixed(2)}`
          );
      })
      .on("mousemove", event => {
        tooltip
          .style("top", (event.pageY + 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", () => tooltip.style("visibility", "hidden"));

    // Legend
    const legend = svg.selectAll(".legend")
      .data(nutrients)
      .join("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
      .attr("x", width - 15)
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", d => color(d));

    legend.append("text")
      .attr("x", width - 20)
      .attr("y", 5)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .text(d => d);
  }
}

async function initVis3() {
  try {
    const data = await d3.csv("./nutrients_year_plot/data/data.csv");

    data.forEach(d => {
      d.Year = +d.Year;
      d["Cropland nitrogen per unit area"] = +d["Cropland nitrogen per unit area"];
      d["Cropland phosphorus per unit area"] = +d["Cropland phosphorus per unit area"];
      d["Cropland potassium per unit area"] = +d["Cropland potassium per unit area"];
    });

    console.log("Nutrient Data:", data);
    createVis3(data);
  } catch (error) {
    console.error("Error loading vis3 data:", error);
  }
}

// Trigger on load
window.addEventListener("load", initVis3);
