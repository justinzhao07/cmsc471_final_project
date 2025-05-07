const margin = { top: 40, right: 40, bottom: 40, left: 60 };
const width = 1200;
const height = 800;

function createSvg(containerId) {
  return d3.select(containerId)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`);
}

const svg1 = createSvg('#vis');
const svg2 = createSvg('#vis2');
const svg3 = createSvg('#vis3');
const svg4 = createSvg('#vis4');
