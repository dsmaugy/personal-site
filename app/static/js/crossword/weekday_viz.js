import defaultImport, { people, cwdata, getPersonColor } from "./crossword_data.js"

// const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const WEEKDAYS = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"]

// time formatters
const formatTime = d3.timeFormat("%M:%S");
const formatDate = d3.timeFormat("%m/%d/%y");

// time parsers
const parseTime = d3.timeParse("%M:%S");

const MEDIAN_STATE = 0;
const MIN_STATE = 1;
const MAX_STATE = 2;

// graph size vars
// var margin = { top: 85, right: 20, bottom: 20, left: 70 },
//     width = 1036 - margin.left - margin.right,
//     height = 636 - margin.top - margin.bottom;
var margin = { top: 5, right: 0, bottom: 20, left: 70 },
    width = window.outerWidth * 0.69 - margin.left - margin.right,
    height = window.outerHeight * 0.56 - margin.top - margin.bottom;

// global graph vars
var svg, xScale, yScale, xAxis, yAxis, xg, yg;

var buttonState;

svg = d3.select(".weekgraph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left +
        "," + margin.top + ")")
    .attr("width", width)
    .attr("height", height)

// X Axis Stuff
xScale = d3.scaleBand()
    .domain(WEEKDAYS)
    .range([0, width])
    .padding(0.3)

xAxis = d3.axisBottom(xScale);

xg = svg.append("g")
    .attr("transform", "translate(0, " + parseInt(height) + ")")
xg.call(xAxis)


// Y Axis Stuff
yScale = d3.scaleLinear()
    .range([height, 0])

yAxis = d3.axisLeft(yScale)
    .tickFormat(formatTime)

yg = svg.append("g")
yg.append("text")
    .attr("class", "wglabel wg-ylabel")
    .attr("x", height / -2)
    .attr("y", -50)
    .text("Completion Time")

function updateGraph(data) {
    const T = d3.transition().duration(750);

    yScale.domain([d3.timeSecond.offset(d3.extent(data, d => d.value)[0], -10), d3.timeSecond.offset(d3.extent(data, d => d.value)[1], 10)])
    yg.transition(T)
        .call(yAxis)

    svg.selectAll("rect")
        .data(data)
        .join("rect")
        .on("mouseover", onHighlightData)
        .on("mouseleave", onUnhighlightData)
        .transition(T)
        .attr("x", d => xScale(d.day))
        .attr("y", d => yScale(d.value))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.value))
        .attr("fill", d => d.color)

}

function updateDataMode() {
    if (this.id == "median-button") {
        var dataByDay = d3.rollup(cwdata, v => d3.median(v, d => (d.time.getMinutes() * 60) + (d.time.getHours() * 3600) + d.time.getSeconds()), d => d.date.getDay());
        var data = Array.from(dataByDay).map(d => {
            var mins = Math.floor(d[1] / 60);
            var sec = d[1] % 60;
            return { "day": WEEKDAYS[d[0]], "value": parseTime(mins + ":" + parseInt(sec)), "name": "All Of Us :)", "date": "temp", "color": "#59EF95" }
        })

        d3.select("#button-label").text("median");
        buttonState = MEDIAN_STATE;
        updateGraph(data);
    } else if (this.id == "min-button") {
        var dataByDay = d3.rollup(cwdata, v => d3.least(v, d => d.time), d => d.date.getDay());
        var data = Array.from(dataByDay).map(d => {
            return { "day": WEEKDAYS[d[0]], "value": d[1].time, "name": d[1].name, "date": d[1].date, "color": getPersonColor(d[1].name) }
        })

        d3.select("#button-label").text("minimum");
        buttonState = MIN_STATE;
        updateGraph(data);

    } else if (this.id == "max-button") {
        var dataByDay = d3.rollup(cwdata, v => d3.greatest(v, d => d.time), d => d.date.getDay());
        var data = Array.from(dataByDay).map(d => {
            return { "day": WEEKDAYS[d[0]], "value": d[1].time, "name": d[1].name, "date": d[1].date, "color": getPersonColor(d[1].name) }
        })

        d3.select("#button-label").text("maximum");
        buttonState = MAX_STATE;
        updateGraph(data);
    }
}


function onHighlightData(event, d) {
    this.setAttribute("stroke", "black");

    var tooltip = d3.select("#week-tooltip");

    tooltip.style("opacity", 0.9)
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px")

    if (buttonState == MEDIAN_STATE) {
        tooltip.html("<b>" + d.day + "<br />" + formatTime(d.value) + "</b>")
    } else {
        tooltip.html("<b>" + formatDate(d.date) + "</b>" + "<br />" + d.name + ": " + "<b>" + formatTime(d.value) + "</b>");
    }
}

function onUnhighlightData() {
    this.setAttribute("stroke", "none");

    d3.select("#week-tooltip")
        .style("opacity", 0)
}



d3.selectAll('.weekbtn').on('click', updateDataMode);
document.getElementById("median-button").click();

d3.select(".weekgraph-container").style("display", "block")