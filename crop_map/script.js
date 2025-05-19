(() => {
const width = 960, height = 600;
const svg = d3.select("#crop_map").append("svg")
                .attr("width", width).attr("height", height)
                .attr("style", "max-width: 100%; height: auto;")
                .attr("viewBox", [-50, -50, width + 50, height + 50])
const g = svg.append("g");
const subchart = svg.append("g").style("pointer-events", "none").style("opacity", "0%")
let subchart_title, yieldChangeHeader, nitroChangeHeader, phosphorusChangeHeader, potassiumChangeHeader, tempChangeHeader, pestChangeHeader;
const zoom = d3.zoom()
            .scaleExtent([0.5, 30])
            .on("zoom", zoomed);
const tooltip = d3.select("#crop_tooltip")

const projection = d3.geoNaturalEarth1().scale(160).translate([width / 2, height / 2]);
const path = d3.geoPath().projection(projection);

let currentYear = 1990;
let currentCountry = null;
let subcharted = false;

let cropData, world, changeData;

function zoomed(event) {
  const {transform} = event;
  g.attr("transform", transform);
  g.attr("stroke-width", 1 / transform.k);
}

// Load data
Promise.all([
    d3.json("pesticide/data/world.geojson"),
    d3.csv("crop_map/data.csv", d => ({
        area: d.area,
        item: d.item,
        year: +d.year,
        production: +d.production
      })),
    d3.csv("pesticide/data/changes.csv", d => ({
      country: d.area,
      item: d.item,
      year: +d.year,
      tempChange: +d.tempChange,
      nitroChange: +d.nitroChange,
      phosphorusChange: +d.phosphorusChange,
      potassiumChange: +d.potassiumChange,
      pestChange: +d.pestChange,
      yieldChange: +d.yieldChange
    }))
]).then(([worldData, productionData, changes]) => {
    world = worldData;
    cropData = productionData;
    changeData = changes;

    // Populate crop dropdown
    // Calculate top 10 crops by total production
    const cropTotals = d3.rollup(
        productionData,
        v => d3.sum(v, d => d.production),
        d => d.item
    );

    const top10Crops = Array.from(cropTotals.entries())
        .sort((a, b) => d3.descending(a[1], b[1]))
        .slice(0, 10)
        .map(d => d[0]);

    const cropSelect = d3.select("#crop");
    cropSelect.selectAll("option")
        .data(top10Crops)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);
    
    cropSelect.on("change", updateMap);
    // d3.select("#year").on("input", function () {
    //   d3.select("#year-label").text(this.value);
    //   updateMap();
    // });

    initSubchart();
    updateMap();
    window.addEventListener("yearUpdate", function(e) {
      currentYear = e.detail;
      updateMap(e.detail);
    })
});

function initSubchart() {
  subchart.append("rect")
        .attr("x", (width / 10))
        .attr("y", height / 20)
        .attr("width", width * 0.8)
        .attr("height", height * 0.8)
        .attr("fill", "#cccccc")
        .attr("stroke", "black")
        .attr("opacity", "70%")

  subchart_title = subchart.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height * 0.12)
        .attr("class", "labels")
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .text("Changes in Climate Indicators")

  let subchartTop = height * (3 / 16.0);
  console.log(subchartTop)
  let subchartBottom = height * (27 / 32.0);
  console.log(subchartBottom)
  let diff = (subchartBottom - subchartTop) / 6.0;
  console.log(diff)

  yieldChangeHeader = subchart.append("text")
      .attr("x", 30 + (width / 10))
      .attr("y", subchartTop + (0 * diff))
      .attr("class", "labels")
      .style("font-size", "13px")
      .style("font-weight", "bold")
      .text("Change in Crop Production from Previous Year")

  tempChangeHeader = subchart.append("text")
      .attr("x", 30 + (width / 10))
      .attr("y", subchartTop + (1 * diff))
      .attr("class", "labels")
      .style("font-size", "13px")
      .style("font-weight", "bold")
      .text("Change in Temperature from Previous Year")

  pestChangeHeader = subchart.append("text")
      .attr("x", 30 + (width / 10))
      .attr("y", subchartTop + (2 * diff))
      .attr("class", "labels")
      .style("font-size", "13px")
      .style("font-weight", "bold")
      .text("Change in Pesticide Usage from Previous Year")

  nitroChangeHeader = subchart.append("text")
      .attr("x", 30 + (width / 10))
      .attr("y", subchartTop + (3 * diff))
      .attr("class", "labels")
      .style("font-size", "13px")
      .style("font-weight", "bold")
      .text("Change in Soil Nitrogen Level from Previous Year")

  phosphorusChangeHeader = subchart.append("text")
      .attr("x", 30 + (width / 10))
      .attr("y", subchartTop + (4 * diff))
      .attr("class", "labels")
      .style("font-size", "13px")
      .style("font-weight", "bold")
      .text("Change in Soil Phosphorus Level from Previous Year")

  potassiumChangeHeader = subchart.append("text")
      .attr("x", 30 + (width / 10))
      .attr("y", subchartTop + (5 * diff))
      .attr("class", "labels")
      .style("font-size", "13px")
      .style("font-weight", "bold")
      .text("Change in Soil Potassium Level from Previous Year")
  
}

function updateSubchart(country, crop, year) {
  
  subchart_title.text(`Changes in Indicators for ${crop} in ${country}`)

  
  
}

function updateMap() {
    const selectedCrop = d3.select("#crop").property("value");
    const selectedYear = currentYear

    const filtered = cropData.filter(d => d.item === selectedCrop && d.year === selectedYear);
    const productionMap = new Map(filtered.map(d => [d.area, +d.production]));

    // const color = d3.scaleSequential(d3.interpolateYlGnBu)
    //                 .domain([0, d3.max(filtered, d => d.production) || 1]);
    //                 const minProduction = d3.min(filtered, d => d.production > 0 ? d.production : Infinity);
    //                 const maxProduction = d3.max(filtered, d => d.production);
    const minProduction = d3.min(filtered, d => d.production > 0 ? d.production : Infinity);
    const maxProduction = d3.max(filtered, d => d.production);                
    // Avoid domain issues with 0 or negative values
    const color = d3.scaleSequential(d3.interpolateYlGnBu)
                    .domain([Math.log10(minProduction || 1), Math.log10(maxProduction || 10)])
                    .interpolator(d3.interpolateYlGnBu);

    svg.call(zoom)
    svg.on("click", reset);

    g.selectAll("path").remove();

    countries = g.selectAll("path")
    .data(world.features)
    .join("path")
    .attr("d", path)
    .attr("fill", d => {
        const prod = productionMap.get(d.properties.name);
        return prod != null ? color((Math.log10(prod))) : "#eee";
    })
    .attr("stroke", "#444")
    .on("mouseover", function (event, d) {
      if (!subcharted) {
        const prod = productionMap.get(d.properties.name);
        const formatted = prod != null ? d3.format(".2s")(prod) : "N/A";
        tooltip.style("display", "block")
        .html(`<strong>${d.properties.name}</strong><br/>Production: ${formatted}`);
      }
    })
    .on("mousemove", event => {
        tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", () => tooltip.style("display", "none"))
    .on("click", clicked);

    function clicked(event, d) {
        const [[x0, y0], [x1, y1]] = path.bounds(d);
        event.stopPropagation();
        currentCountry = d.properties.name;
        // subchart.style("opacity", "0%")
        countries.transition().style("stroke-width", "0.1px");
        //svg.selectAll(".subchart_line").remove()
        d3.select(this).transition().style("stroke-width", "1.5px").style("stroke", "red");
        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(Math.min(20, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
            d3.pointer(event, svg.node())
        );
        updateSubchart(currentCountry, d3.select("#crop").property("value"), currentYear)
        if (!subcharted) {
          subchart.transition().delay(750).duration(750).style("opacity", "100%")
        }
        subcharted = true;
        tooltip.style("display", "none")
    }

    function reset() {
        console.log("SVG click")
        countries.transition().style("stroke-width", "0.1px");
        subchart.transition().duration(750).style("opacity", "0%")
        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity,
            d3.zoomTransform(svg.node()).invert([width / 2, height / 2]),
        );
        subcharted = false
        currentCountry = null;
    }

    if (currentCountry != null) {
      updateSubchart(currentCountry, d3.select("#crop").property("value"), currentYear);
    }

    svg.selectAll(".legend").remove();

    const legendWidth = 200, legendHeight = 10;
    const legendMargin = {top: 20, left: 30};
    const defs = svg.append("defs");
    const formatProduction = d => {
        if (d >= 1e9) return (d / 1e9).toFixed(1) + "B";
        if (d >= 1e6) return (d / 1e6).toFixed(1) + "M";
        if (d >= 1e3) return (d / 1e3).toFixed(1) + "K";
        return d;
      };
    
    const gradient = defs.append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%")
      .attr("x2", "100%");
    
    gradient.selectAll("stop")
      .data([
        {offset: "0%", color: color.range()[0]},
        {offset: "100%", color: color.range()[1]}
      ])
      .enter().append("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);
    
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${legendMargin.left}, ${height - 40})`);
    
    legend.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)")
      .style("stroke", "#000");
    
    // const legendScale = d3.scaleLinear()
    //   .domain(color.domain())
    //   .range([0, legendWidth]);

    const legendScale = d3.scaleLog()
      .domain([minProduction || 1, maxProduction || 10])
      .range([0, legendWidth]);
    
    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5, "~s")
      .tickFormat(formatProduction);
    
    legend.append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(legendAxis);
}
})();