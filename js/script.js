const margin = { top: 40, right: 40, bottom: 40, left: 60 };
const width = 1200;
const height = 800;
const sliderHeight = 600;
const defaultYear = 1990;

// Pesticide data extent: 1990 - 2022

function createSvg(containerId) {
  return d3.select(containerId)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`);
}

function createSlider() {
    let slider = d3
        .sliderRight()
        .min(1990) // setup the range
        .max(2022) // setup the range
        .step(1)
        .height(sliderHeight * 0.75)  // Widen the slider if needed
        .tickFormat(d3.format('d'))
        .displayValue(false)
        .default(defaultYear)
        .on('onchange', function(val) {
            window.dispatchEvent(new CustomEvent("yearUpdate", { detail: val }))
            d3.select("#slider-year").text(`Year: ${val}`);
            // updateCountries() // Refresh the chart
        });

    d3.select("#slider-year")
        .text(`Year: ${defaultYear}`)

    d3.select('#master_slider')
        .append('svg')
        .attr('width', 300)  // Adjust width if needed
        .attr('height', sliderHeight)
        .append('g')
        .attr('transform', 'translate(30,30)')
        .call(slider);
}

window.addEventListener('load', createSlider);
// const svg1 = createSvg('#vis');
// const svg2 = createSvg('#vis2');
//const svg3 = createSvg('#vis3');
const svg4 = createSvg('#vis4');
