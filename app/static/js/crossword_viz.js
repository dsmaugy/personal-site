const COLORS = ["#388EA6", "#F2AD6B", "#7796F2", "#F29983", "#F283A7", "#96967E"];
const POINT_STROKE = "1.5";
const POINT_STROKE_HIGHLIGHT = "5";
const LINE_STROKE = "0.5";
const LINE_STROKE_HIGHLIGHT = "1.5";
const LINE_STROKE_LEG = "2";
const LINE_STROKE_HIGHLIGHT_LEG = "5";
const POINT_SIZE = 100;
const POINT_SIZE_LEG = 80;
const LABEL_OPACITY_HIGHLIGHT = 0.35;
const LABEL_OPACITY = 0.2;
const LABEL_OPACITY_DISABLED = 0.05;

// time parsers
const parseTime = d3.timeParse("%M:%S");
const parseDate = d3.timeParse("%m/%d/%Y");

// time formatters
const formatTime = d3.timeFormat("%M:%S");
const formatDate = d3.timeFormat("%m/%d/%y");


// global var to hold time range
var minTime;

// global var to hold data
var cwdata;
var people = [];
var peopleStatus = {};

// global graph vars
var LGsvg;
var LGxg;
var LGxy;
var LGdataG;
var LGlegend;
var infobox;

// graph size vars
var LGmargin = { top: 80, right: 340, bottom: 50, left: 90 },
    LGwidth = 1236 - LGmargin.left - LGmargin.right,
    LGheight = 736 - LGmargin.top - LGmargin.bottom;

var legendWidth = LGmargin.right - 64;
var legendHeight;

var LGxScale = d3.scaleTime()
    .range([0, LGwidth]);

var LGxAxis = d3.axisBottom(LGxScale)
    .tickFormat(formatDate);

var LGyScale = d3.scaleLinear()
    .range([LGheight, 0]);

var LGyAxis = d3.axisLeft(LGyScale)
    .tickFormat(formatTime);


function highlightData() {
    var person = this.getAttribute("data-name");
    var allLines = d3.selectAll(".data-line.data[data-name='" + person + "']");
    var allPoints = d3.selectAll(".data-point.data[data-name='" + person + "']");

    allLines.attr("stroke-width", LINE_STROKE_HIGHLIGHT);
    allPoints.attr("stroke-width", POINT_STROKE_HIGHLIGHT);

    // update the infobox only if we're hovering over a datapoint
    if (this.getAttribute("data-date")) {
        var dayPoints = cwdata
            .filter(d => d.date == this.getAttribute("data-date"))
            .sort((a, b) => d3.ascending(a.time, b.time));
        updateDayInfo(dayPoints);
    }
}

function unhighlightData() {
    var person = this.getAttribute("data-name");
    var allLines = d3.selectAll(".data-line.data[data-name='" + person + "']");
    var allPoints = d3.selectAll(".data-point.data[data-name='" + person + "']");


    allLines.attr("stroke-width", LINE_STROKE);
    allPoints.attr("stroke-width", POINT_STROKE);

    if (this.getAttribute("data-date")) {
        updateDayInfo([]);
    }
}

function highlightDataLegend(event, d) {
    var person = this.getAttribute("data-name");
    var allLines = d3.selectAll(".data-line.legend[data-name='" + person + "']");
    var allPoints = d3.selectAll(".data-point.legend[data-name='" + person + "']");
    var choosenLabel = d3.selectAll(".data-data.label-txt[data-name='" + person + "']");
    var labelBG = d3.selectAll(".data-data.label-bg[data-name='" + person + "']");

    allLines.attr("stroke-width", LINE_STROKE_HIGHLIGHT_LEG)
        .style("cursor", "pointer");

    allPoints.attr("stroke-width", POINT_STROKE_HIGHLIGHT);
    choosenLabel.attr("font-weight", "bold");
    labelBG.attr("opacity", LABEL_OPACITY_HIGHLIGHT);
}

function unhighlightDataLegend(event, d) {
    var person = this.getAttribute("data-name");
    var allLines = d3.selectAll(".data-line.legend[data-name='" + person + "']");
    var allPoints = d3.selectAll(".data-point.legend[data-name='" + person + "']");
    var choosenLabel = d3.selectAll(".data-data.label-txt[data-name='" + person + "']");
    var labelBG = d3.selectAll(".data-data.label-bg[data-name='" + person + "']");


    allLines.attr("stroke-width", LINE_STROKE_LEG);
    allPoints.attr("stroke-width", POINT_STROKE);
    choosenLabel.attr("font-weight", "normal");
    labelBG.attr("opacity", LABEL_OPACITY);
}

function toggleName(event, d) {
    var person = this.getAttribute("data-name");
    var legend = d3.select(".full_legendg");
    if (peopleStatus[person] == 1) {
        // person already selected
        console.log("unselecting " + person);
        legend.selectAll(".data-data.label-bg[data-name='" + person + "']")
            .style("fill", "#DB5E4F")

        legend.selectAll(".data-data.label-txt[data-name='" + person + "']")
            .style("fill", "grey")

        peopleStatus[person] = 0;
    } else {
        // person already deselected
        console.log("selecting " + person);
        legend.selectAll(".data-data.label-bg[data-name='" + person + "']")
            .style("fill", "#736D55")

        legend.selectAll(".data-data.label-txt[data-name='" + person + "']")
            .style("fill", "black")
        peopleStatus[person] = 1;
    }

    var filteredData = getFilteredData();
    updateLG(filteredData);
}

function showTooltip(event, d) {
    var tooltip = d3.select("#tooltip");

    tooltip.style("opacity", 0.9)
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px")
        .html("<b>" + formatDate(d.date) + "</b>" + "<br />" + d.name + ": " + "<b>" + formatTime(d.time) + "</b>");

}

function hideTooltip() {
    d3.select("#tooltip")
        .style("opacity", 0)
}

function updateLG(data) {
    const T = d3.transition().duration(750);

    // we update the scale every time update is called
    LGxScale.domain(d3.extent(data, d => d.date));
    LGyScale.domain([d3.timeSecond.offset(d3.extent(data, d => d.time)[0], -10), d3.timeSecond.offset(d3.extent(data, d => d.time)[1], 10)]);

    // show every tick on the x axis if the day scale is small enough (10 days)
    if (d3.timeDay.count(LGxScale.domain()[0], LGxScale.domain()[1]) < 10) {
        LGxg.transition(T)
            .call(LGxAxis.ticks(d3.timeDay));
    } else {
        LGxg.transition(T)
            .call(LGxAxis.ticks(15)); // I think this number can be arbitrary??
    }

    LGyg.transition(T)
        .call(LGyAxis);

    var LGline = d3.line()
        .x(d => LGxScale(d.date))
        .y(d => LGyScale(d.time));

    LGdataG
        .select(".points")
        .selectAll("path")
        .data(data, d => d.name + d.date)
        .join(
            enter => enter.append("path")
            .on("mouseover.hl", highlightData)
            .on("mouseover.tt", showTooltip)
            .on("mouseleave.hl", unhighlightData)
            .on("mouseleave.tt", hideTooltip)
            .on("mouseover.leg", highlightDataLegend)
            .on("mouseleave.leg", unhighlightDataLegend)
            .on("click", toggleName)
            .style("cursor", "pointer")
            .transition(T)
            .attr("d", d =>
                d3.symbol()
                .type(d3.symbols[people.indexOf(d.name) % d3.symbols.length])
                .size(POINT_SIZE)()
            )
            .attr("stroke", d => COLORS[people.indexOf(d.name) % COLORS.length])
            .attr("stroke-width", POINT_STROKE)
            .attr("fill", d => COLORS[people.indexOf(d.name) % COLORS.length])
            .attr("transform", d => "translate(" +
                LGxScale(d.date) +
                ", " +
                LGyScale(d.time) + ")")
            .attr("data-name", d => d.name)
            .attr("data-date", d => d.date)
            .attr("class", "data-point data"),

            update => update
            .transition(T)
            .attr("transform", d => "translate(" +
                LGxScale(d.date) +
                ", " +
                LGyScale(d.time) + ")"),

            exit => exit
            .transition(T)
            .attr("transform", "translate(0, 0)")
            .remove()
        )

    // this is confusing af...
    // d3.group returns a map with two args, the name of the grouping key and the corresponding array of values that match that key
    // so for the line function, we want the array which will be the data for each person
    // and for the stroke color, we want the name to calculate the color
    LGdataG
        .select(".lines")
        .selectAll("path")
        .data(d3.group(data, d => d.name), ([n, ]) => n)
        .join(
            enter => enter.append("path")
            .on("mouseover.hl", highlightData)
            .on("mouseleave.hl", unhighlightData)
            .on("mouseover.leg", highlightDataLegend)
            .on("mouseleave.leg", unhighlightDataLegend)
            .on("click", toggleName)
            .attr("stroke-width", "0")
            .style("cursor", "pointer")
            .transition(T)
            .attr("d", ([, d]) => LGline(d))
            .attr("stroke", ([n, ]) => COLORS[people.indexOf(n) % COLORS.length])
            .attr("stroke-width", LINE_STROKE)
            .attr("fill", "none")
            .attr("data-name", ([n, ]) => n)
            .attr("class", "data-line data"),

            update => update
            .transition(T)
            .attr("d", ([, d]) => LGline(d)),

            exit => exit
            .transition(T)
            .attr("stroke-width", "0")
            .remove()
        )
}

// updates the date range for the visualization
function updateTimeRange() {
    var timeSelection = document.getElementById("input-lg").value;
    if (timeSelection == "1week") {
        minTime = d3.timeWeek.offset(new Date(), -1);
    } else if (timeSelection == "2week") {
        minTime = d3.timeWeek.offset(new Date(), -2);
    } else if (timeSelection == "1month") {
        minTime = d3.timeMonth.offset(new Date(), -1);
    } else if (timeSelection == "3day") {
        minTime = d3.timeDay.offset(new Date(), -3);
    } else if (timeSelection == "all") {
        minTime = d3.extent(cwdata, d => d.date)[0];
    }

    filteredData = getFilteredData();
    updateLG(filteredData);
}

// updates the infobox below the legend that shows times for that day on hover
function updateDayInfo(data) {
    const T = d3.transition().duration(450);
    if (data.length > 0) {
        console.log("Highlighting day: " + data[0].date)
    }

    infobox.select(".infog")
        .selectAll("text")
        .data(data)
        .join(
            enter => enter
            .append("text")
            .transition(T)
            .attr("opacity", 1)
            .attr("class", "infobox-text")
            .attr("transform", (d, i) => "translate(10, " + parseFloat(i * 20 + 50) + ")")
            .text((d, i) => parseInt(i + 1) + ". " + d.name + ": " + formatTime(d.time)),

            update => update,

            exit => exit
            .transition(T)
            .attr("opacity", 0)
            .remove()
        )
}

function getFilteredData() {
    return cwdata.filter(d => d.date >= minTime && peopleStatus[d.name] == 1);
}

// load the data and initialize graph
d3.json("/crossword_data").then(
    (data) => {
        data.forEach(
            elem => {
                elem.time = parseTime(elem.time);
                elem.date = parseDate(elem.date);

                if (!people.includes(elem.name)) {
                    people.push(elem.name);
                    peopleStatus[elem.name] = 1;
                }
            }
        );

        // set the line graph SVG
        LGsvg = d3.select(".linegraph").append("svg")
            .attr("width", LGwidth + LGmargin.left + LGmargin.right)
            .attr("height", LGheight + LGmargin.top + LGmargin.bottom)
            .append("g")
            .attr("transform", "translate(" + LGmargin.left +
                "," + LGmargin.top + ")")
            .attr("width", LGwidth)
            .attr("height", LGheight)

        // set up axes
        LGxg = LGsvg.append("g")
            .attr("transform", "translate(0," + LGheight + ")")
        LGyg = LGsvg.append("g")

        LGxg.append("text")
            .attr("class", "lglabel lg-xlabel")
            .attr("x", LGwidth / 2)
            .attr("y", "50")
            .text("Date")


        LGyg.append("text")
            .attr("class", "lglabel lg-ylabel")
            .attr("x", LGheight / -2)
            .attr("y", -50)
            .text("Completion Time")


        // set up data svg group
        LGdataG
            = LGsvg.append("g");

        LGdataG.append("g")
            .attr("class", "lines")

        LGdataG.append("g")
            .attr("class", "points")

        // set up legend
        legendHeight = LGheight - (LGheight * (5.6 / people.length));
        console.log("Legend Height: " + legendHeight);
        console.log("Legend Width: " + legendWidth);

        LGlegend = d3.select(".linegraph")
            .select("svg")
            .append("g")
            .attr("class", "full_legendg")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .attr("transform", "translate(" + parseFloat(LGmargin.left + LGwidth + 64) + "," + LGmargin.top + ")")

        // background rectangle on legend
        LGlegend.append("rect")
            .attr("class", "lg-legend")
            .attr("width", legendWidth)
            .attr("height", legendHeight)

        people.forEach(
            (elem, i) => {
                LGlegend.append("rect")
                    .on("mouseover.hl", highlightData)
                    .on("mouseleave.hl", unhighlightData)
                    .on("mouseover.leg", highlightDataLegend)
                    .on("mouseleave.leg", unhighlightDataLegend)
                    .on("click", toggleName)
                    .attr("data-name", elem)
                    .attr("class", "data-data label-bg")
                    .attr("width", LGmargin.right - 94)
                    .attr("height", 13)
                    .attr("opacity", LABEL_OPACITY)
                    .attr("transform", "translate(18," + ((i * 25) + 14) + ")")
                    .style("cursor", "pointer")

                LGlegend.append("text")
                    .on("mouseover.hl", highlightData)
                    .on("mouseleave.hl", unhighlightData)
                    .on("mouseover.leg", highlightDataLegend)
                    .on("mouseleave.leg", unhighlightDataLegend)
                    .on("click", toggleName)
                    .attr("data-name", elem)
                    .attr("transform", "translate(" + ((LGmargin.right - 104) / 2) + ", " + ((i * 25) + 25) + ")")
                    .attr("class", "data-data label-txt")
                    .style("cursor", "pointer")
                    .text(elem)

                LGlegend.append("path")
                    .on("mouseover.hl", highlightData)
                    .on("mouseleave.hl", unhighlightData)
                    .on("mouseover.leg", highlightDataLegend)
                    .on("mouseleave.leg", unhighlightDataLegend)
                    .on("click", toggleName)
                    .attr("data-name", elem)
                    .attr("d", d3.symbol()
                        .type(d3.symbols[people.indexOf(elem) % d3.symbols.length])
                        .size(POINT_SIZE)()
                    )
                    .attr("stroke", COLORS[people.indexOf(elem) % COLORS.length])
                    .attr("stroke-width", POINT_STROKE)
                    .attr("fill", COLORS[people.indexOf(elem) % COLORS.length])
                    .attr("transform", "translate(" + ((LGmargin.right - 156) / 2) + ", " + ((i * 25) + 20.5) + ")")
                    .attr("class", "data-point legend")
                    .style("cursor", "pointer")


                LGlegend.append("line")
                    .on("mouseover.hl", highlightData)
                    .on("mouseleave.hl", unhighlightData)
                    .on("mouseover.leg", highlightDataLegend)
                    .on("mouseleave.leg", unhighlightDataLegend)
                    .on("click", toggleName)
                    .attr("data-name", elem)
                    .attr("stroke", COLORS[people.indexOf(elem) % COLORS.length])
                    .attr("stroke-width", 2)
                    .attr("x1", 40)
                    .attr("x2", 50)
                    .attr("y1", (i * 25) + 20.5)
                    .attr("y2", (i * 25) + 20.5)
                    .attr("class", "data-line legend")
                    .style("cursor", "pointer")

            })


        // set up infobox
        infobox = d3.select(".linegraph")
            .select("svg")
            .append("g")
            .attr("class", "infobox")
            .attr("width", legendWidth)
            .attr("height", LGheight - legendHeight)
            .attr("transform", "translate(" + parseFloat(LGmargin.left + LGwidth + 64) + "," + parseFloat(LGmargin.top + legendHeight + 20) + ")")

        infobox.append("rect")
            .attr("class", "infobox-rect")
            .attr("width", legendWidth)
            .attr("height", LGheight - legendHeight)

        infobox.append("text")
            .attr("class", "infobox-title")
            .attr("transform", "translate(" + parseFloat(legendWidth / 2) + ", 20)")
            .text("Day Stats")

        infobox.append("g")
            .attr("class", "infog")


        cwdata = data;

        // this also calls updateLG
        updateTimeRange();
    }
)