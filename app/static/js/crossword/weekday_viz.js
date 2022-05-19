import defaultImport, { people, cwdata } from "./crossword_data.js"

var margin = { top: 80, right: 20, bottom: 50, left: 20 },
    width = 1236 - margin.left - margin.right,
    height = 336 - margin.top - margin.bottom;

var svg;

svg = d3.select(".weekgraph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

svg.append("g")
    .attr("transform", "translate(" + margin.left +
        "," + margin.top + ")")
    .attr("width", width)
    .attr("height", height)