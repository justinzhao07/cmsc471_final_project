(() => {
const width = 960, height = 600;
const svg = d3.select("#crop_map").append("svg")
                .attr("width", width).attr("height", height);
const tooltip = d3.select("#crop_tooltip")

const projection = d3.geoNaturalEarth1().scale(160).translate([width / 2, height / 2]);
const path = d3.geoPath().projection(projection);

let cropData, world;

// Load data
Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
    d3.csv("crop_map/data.csv", d => ({
        area: d.area,
        item: d.item,
        year: +d.year,
        production: +d.production
      }))
]).then(([worldData, productionData]) => {
    world = worldData;
    cropData = productionData;

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
    d3.select("#year").on("input", function () {
    d3.select("#year-label").text(this.value);
    updateMap();
    });

    updateMap(1961);
});

function updateMap() {
    const selectedCrop = d3.select("#crop").property("value");
    const selectedYear = +d3.select("#year").property("value");

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

    svg.selectAll("path").remove();

    svg.selectAll("path")
    .data(world.features)
    .join("path")
    .attr("d", path)
    .attr("fill", d => {
        const prod = productionMap.get(d.properties.name);
        return prod != null ? color((Math.log10(prod))) : "#eee";
    })
    .attr("stroke", "#444")
    .on("mouseover", function (event, d) {
        const prod = productionMap.get(d.properties.name);
        const formatted = prod != null ? d3.format(".2s")(prod) : "N/A";
        tooltip.style("display", "block")
        .html(`<strong>${d.properties.name}</strong><br/>Production: ${formatted}`);
    })
    .on("mousemove", event => {
        tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", () => tooltip.style("display", "none"));

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