const svg = d3.select("svg");
    const tooltip = d3.select("#tooltip");
    const yearLabel = d3.select("#yearLabel");

    const projection = d3.geoNaturalEarth1();
    const path = d3.geoPath().projection(projection);
    const color = d3.scaleSequential(d3.interpolateRdBu).domain([2, -2]);

    // Load GeoJSON and temperature data
    Promise.all([
      d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
      d3.json("temp_change_by_country.json")
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
      }

      // Initial render
      updateMap(1961);

      // Update on slider change
      d3.select("#yearSlider").on("input", function () {
        const year = this.value;
        yearLabel.text(year);
        updateMap(year);
      });
    });