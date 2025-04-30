function createVis(world, master_data) {
    const width = 975;
    const height = 610;

    const zoom = d3.zoom()
        .scaleExtent([0, 30])
        .on("zoom", zoomed);

    const svg = d3.select("#vis").append("svg")
        .attr("viewBox", [-50, -50, width + 50, height + 50])
        .attr("width", width)
        .attr("height", height)
        .attr("style", "max-width: 100%; height: auto;")
        .on("click", reset);

    const highest_pest = d3.extent(master_data, d => +d.pesticides_per_cropland)
    console.log(highest_pest)

    const year_extent = d3.extent(master_data, d => +d.year)

    const projection = d3.geoNaturalEarth1();
    const path = d3.geoPath().projection(projection);
    const color = d3.scaleSequential(d3.interpolateOranges)
        .domain([0, highest_pest[1]])

    filtered_data = master_data.filter(row => row.year == 2022)
    console.log(filtered_data)
    
    const csvLookup = new Map();
    filtered_data.forEach(row => {
        csvLookup.set(row.country, row);  // Use first column as key
    });

    const g = svg.append("g");

    countries = g.selectAll("path")
        .data(world.features)
        .join("path")
        .attr("d", path)
        .attr("class", "country")
        .attr("country", d => d.properties.name)
        .attr("fill", d => {
            const pesticide = csvLookup.get(d.properties.name);
            return pesticide ? color(pesticide.pesticides_per_cropland) : "#eee";
        })
        .attr("stroke-linejoin", "round")
        .attr("stroke", "black")
        .attr("stroke-width", "0.1px")
        .on("click", clicked)

    const subchart = svg.append("g").style("pointer-events", "none").style("opacity", "0%")

    subchart.append("rect")
        .attr("x", width / 10)
        .attr("y", height / 20)
        .attr("width", width * 0.8)
        .attr("height", height * 0.8)
        .attr("fill", "#cccccc")
        .attr("stroke", "black")
        .attr("opacity", "70%")
    
    subchart_xScale = d3.scaleLinear()
        .domain(year_extent)
        .range([width / 5, width * 0.8])
    subchart_xAxis = d3.axisBottom(subchart_xScale).tickFormat(d => d.toString());

    subchart_yScale = d3.scaleLinear()
        .domain([highest_pest[1], highest_pest[0]])
        .range([height / 10, height * 0.7])
    subchart_yAxis = d3.axisLeft(subchart_yScale)

    subchart.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height * 0.7})`) // Position at the bottom
        .call(subchart_xAxis)
    
    subchart.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${width / 5}, 0)`)
        .call(subchart_yAxis);

    // X-axis label
    subchart.append("text")
        .attr("x", width / 2)
        .attr("y", height * 0.78)
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold")
        .text("Year") // Displays the current x-axis variable
        .attr('class', 'labels')

    // Y-axis label (rotated)
    subchart.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2 + 40)
        .attr("y", width * 0.15)
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold")
        .text("Pesticide Usage per Unit of Cropland") // Displays the current y-axis variable
        .attr('class', 'labels')
    
    subchart_title = subchart.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height * 0.12)
        .attr("class", "labels")
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .text("Pesticide Data")

    const subchart_line = d3.line()
        .x(d => subchart_xScale(d.year))
        .y(d => subchart_yScale(d.pesticides_per_cropland))

    function clicked(event, d) {
        const [[x0, y0], [x1, y1]] = path.bounds(d);
        event.stopPropagation();
        subchart.style("opacity", "0%")
        countries.transition().style("stroke-width", "0.1px");
        svg.selectAll(".subchart_line").remove()
        d3.select(this).transition().style("stroke-width", "1.5px").style("stroke", "steelblue");
        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(Math.min(20, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
            d3.pointer(event, svg.node())
        );
        subchart_title.text(`Pesticide Usage over Time for ${d3.select(this).attr("country")}`)
        subchart.transition().delay(750).duration(750).style("opacity", "100%")
        makeSubchart(d3.select(this).attr("country"))
    }

    function reset() {
        countries.transition().style("stroke-width", "0.1px");
        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity,
            d3.zoomTransform(svg.node()).invert([width / 2, height / 2]),
        );
        subchart.transition().duration(750).style("opacity", "0%")
    }

    function makeSubchart(country) {
        let country_data = master_data.filter(d => d.country == country)

        if (country_data.length === 0) {
            subchart.append("text")
                .text("No Data")
                .attr("fill", "#444444")
                .attr("font-size", "42px")
                .attr("font-weight", "bold")
                .attr("text-anchor", "middle")
                .attr("x", width / 2)
                .attr("y", height * 0.45)
                .attr("class", "subchart_line")

        } else {
            subchart.append("path")
                .datum(country_data)
                .attr("fill", "none")
                .attr("stroke", "#3f3902")
                .attr("stroke-width", "2px")
                .attr("d", subchart_line)
                .attr("class", "subchart_line")
        }
    }

    svg.call(zoom)
    
    function zoomed(event) {
        const {transform} = event;
        g.attr("transform", transform);
        g.attr("stroke-width", 1 / transform.k);
    }

}

// Asynchronous initialization function
async function init() {
    try {
        // Load geographic (map) data
        let world = await d3.json("./data/world.geojson");
        
        // Load election results data
        let pesticides_data = await d3.csv("./data/pesticides_clean.csv");
        
        // Verify the loaded data in the console
        console.log('Map data:', world);
        console.log('Attribute data:', pesticides_data);
        
        // Pass loaded data to visualization function
        createVis(world, pesticides_data);
    } catch (error) {
        // Catch and report errors clearly
        console.error('Error loading data:', error);
    }
}

// Trigger data loading and visualization when the window loads
window.addEventListener('load', init);