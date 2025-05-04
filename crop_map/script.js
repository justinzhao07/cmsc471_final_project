const width = 960, height = 600;
const svg = d3.select("#map").append("svg")
                .attr("width", width).attr("height", height);
const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("display", "none");

const projection = d3.geoNaturalEarth1().scale(160).translate([width / 2, height / 2]);
const path = d3.geoPath().projection(projection);

let cropData, world;

// Load data
Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
    d3.csv("data.csv", d => ({
        area: d.area,
        item: d.item,
        year: +d.year,
        production: +d.production
      }))
]).then(([worldData, productionData]) => {
    world = worldData;
    cropData = productionData;

    // Populate crop dropdown
    const crops = Array.from(new Set(cropData.map(d => d.item))).sort();
    const cropSelect = d3.select("#crop");
    cropSelect.selectAll("option")
    .data(crops)
    .enter()
    .append("option")
    .text(d => d)
    .attr("value", d => d);
    
    cropSelect.on("change", updateMap);
    d3.select("#year").on("input", function () {
    d3.select("#year-label").text(this.value);
    updateMap();
    });

    updateMap();
});

function updateMap() {
    const selectedCrop = d3.select("#crop").property("value");
    const selectedYear = +d3.select("#year").property("value");

    const filtered = cropData.filter(d => d.item === selectedCrop && d.year === selectedYear);
    const productionMap = new Map(filtered.map(d => [d.area, +d.production]));

    const color = d3.scaleSequential(d3.interpolateYlGnBu)
                    .domain([0, d3.max(filtered, d => d.production) || 1]);

    svg.selectAll("path").remove();

    svg.selectAll("path")
    .data(world.features)
    .join("path")
    .attr("d", path)
    .attr("fill", d => {
        const prod = productionMap.get(d.properties.name);
        return prod != null ? color(prod) : "#eee";
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
}