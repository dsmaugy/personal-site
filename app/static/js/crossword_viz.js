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

const parseTime = d3.timeParse("%M:%S");
const parseDate = d3.timeParse("%m/%d/%Y");

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

var LGmargin = { top: 80, right: 340, bottom: 50, left: 90 },
    LGwidth = 1236 - LGmargin.left - LGmargin.right,
    LGheight = 636 - LGmargin.top - LGmargin.bottom;

var LGxScale = d3.scaleTime()
    .range([0, LGwidth]);

var LGxAxis = d3.axisBottom(LGxScale)
    .tickFormat(d3.timeFormat("%m/%d/%y"));

var LGyScale = d3.scaleLinear()
    .range([LGheight, 0]);

var LGyAxis = d3.axisLeft(LGyScale)
    .tickFormat(d3.timeFormat("%M:%S"));


// all person vars are obtained from first word of class name
function highlightData() {
    var person = this.className.baseVal.split(" data")[0].replace(" ", ".");
    var allLines = d3.selectAll("." + person + ".data-line.data");
    var allPoints = d3.selectAll("." + person + ".data-point.data");

    allLines.attr("stroke-width", LINE_STROKE_HIGHLIGHT);
    allPoints.attr("stroke-width", POINT_STROKE_HIGHLIGHT);
}

function unhighlightData() {
    var person = this.className.baseVal.split(" data")[0].replace(" ", ".");
    var allLines = d3.selectAll("." + person + ".data-line.data");
    var allPoints = d3.selectAll("." + person + ".data-point.data");


    allLines.attr("stroke-width", LINE_STROKE);
    allPoints.attr("stroke-width", POINT_STROKE);
}

function highlightDataLegend(event, d) {
    var person = this.className.baseVal.split(" data")[0].replace(" ", ".");
    var allLines = d3.selectAll("." + person + ".data-line.legend");
    var allPoints = d3.selectAll("." + person + ".data-point.legend");
    var choosenLabel = d3.selectAll("." + person + ".data-data.label-txt");
    var labelBG = d3.selectAll("." + person + ".data-data.label-bg");

    allLines.attr("stroke-width", LINE_STROKE_HIGHLIGHT_LEG)
        .style("cursor", "pointer");

    allPoints.attr("stroke-width", POINT_STROKE_HIGHLIGHT);
    choosenLabel.attr("font-weight", "bold");
    labelBG.attr("opacity", LABEL_OPACITY_HIGHLIGHT);
}

function unhighlightDataLegend(event, d) {
    var person = this.className.baseVal.split(" data")[0].replace(" ", ".");
    var allLines = d3.selectAll("." + person + ".data-line.legend");
    var allPoints = d3.selectAll("." + person + ".data-point.legend");
    var choosenLabel = d3.selectAll("." + person + ".data-data.label-txt");
    var labelBG = d3.selectAll("." + person + ".data-data.label-bg");


    allLines.attr("stroke-width", LINE_STROKE_LEG);
    allPoints.attr("stroke-width", POINT_STROKE);
    choosenLabel.attr("font-weight", "normal");
    labelBG.attr("opacity", LABEL_OPACITY);
}

function toggleName(event, d) {
    var person = this.className.baseVal.split(" data")[0];
    var personClassName = person.replace(" ", ".");
    var legend = d3.select(".full_legendg");
    console.log(this.className)
    if (peopleStatus[person] == 1) {
        // person already selected
        console.log("unselecting " + person);
        legend.selectAll("." + personClassName + ".data-data.label-bg")
            .style("fill", "#DB5E4F")

        legend.selectAll("." + personClassName + ".data-data.label-txt")
            .style("fill", "grey")

        peopleStatus[person] = 0;
    } else {
        // person already deselected
        console.log("selecting " + person);
        legend.selectAll("." + personClassName + ".data-data.label-bg")
            .style("fill", "#736D55")

        legend.selectAll("." + personClassName + ".data-data.label-txt")
            .style("fill", "black")
        peopleStatus[person] = 1;
    }

    var filteredData = cwdata.filter(d => d.date >= minTime && peopleStatus[d.name] == 1);
    updateLG(filteredData);
}


function showTooltip(event, d) {
    var tooltip = d3.select("#tooltip");

    tooltip.style("opacity", 0.9)
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px")
        .html("<b>" + d3.timeFormat("%m/%d/%y")(d.date) + "</b>" + "<br />" + d.name + ": " + "<b>" + d3.timeFormat("%M:%S")(d.time) + "</b>");

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
            .attr("class", d => d.name + " data-point data"),

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
            .attr("class", ([n, ]) => n + " data-line data"),

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
function onLGForm() {
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

    filteredData = cwdata.filter(d => d.date >= minTime && peopleStatus[d.name] == 1);
    updateLG(filteredData);
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
        LGlegend = d3.select(".linegraph")
            .select("svg")
            .append("g")
            .attr("class", "full_legendg")
            .attr("width", LGmargin.right - 64)
            .attr("height", LGheight - (LGheight * 0.55))
            .attr("transform", "translate(" + (LGmargin.left + LGwidth + 64) + "," + LGmargin.top + ")")

        LGlegend.append("rect")
            .attr("class", "lg-legend")
            .attr("width", LGmargin.right - 64)
            .attr("height", LGheight - (LGheight * (4.6 / people.length)))

        people.forEach(
            (elem, i) => {
                LGlegend.append("rect")
                    .on("mouseover.hl", highlightData)
                    .on("mouseleave.hl", unhighlightData)
                    .on("mouseover.leg", highlightDataLegend)
                    .on("mouseleave.leg", unhighlightDataLegend)
                    .on("click", toggleName)
                    .attr("class", elem + " data-data label-bg")
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
                    .attr("transform", "translate(" + ((LGmargin.right - 104) / 2) + ", " + ((i * 25) + 25) + ")")
                    .attr("class", elem + " " + "data-data label-txt")
                    .style("cursor", "pointer")
                    .text(elem)

                LGlegend.append("path")
                    .on("mouseover.hl", highlightData)
                    .on("mouseleave.hl", unhighlightData)
                    .on("mouseover.leg", highlightDataLegend)
                    .on("mouseleave.leg", unhighlightDataLegend)
                    .on("click", toggleName)
                    .attr("d", d3.symbol()
                        .type(d3.symbols[people.indexOf(elem) % d3.symbols.length])
                        .size(POINT_SIZE)()
                    )
                    .attr("stroke", COLORS[people.indexOf(elem) % COLORS.length])
                    .attr("stroke-width", POINT_STROKE)
                    .attr("fill", COLORS[people.indexOf(elem) % COLORS.length])
                    .attr("transform", "translate(" + ((LGmargin.right - 156) / 2) + ", " + ((i * 25) + 20.5) + ")")
                    .attr("class", elem + " data-point legend")
                    .style("cursor", "pointer")


                LGlegend.append("line")
                    .on("mouseover.hl", highlightData)
                    .on("mouseleave.hl", unhighlightData)
                    .on("mouseover.leg", highlightDataLegend)
                    .on("mouseleave.leg", unhighlightDataLegend)
                    .on("click", toggleName)
                    .attr("stroke", COLORS[people.indexOf(elem) % COLORS.length])
                    .attr("stroke-width", 2)
                    .attr("x1", 40)
                    .attr("x2", 50)
                    .attr("y1", (i * 25) + 20.5)
                    .attr("y2", (i * 25) + 20.5)
                    .attr("class", elem + " data-line legend")
                    .style("cursor", "pointer")

            })


        // set up infobox
        infobox = d3.select(".linegraph")
            .select("svg")
            .append("g")
            .attr("class", "full_legendg")
            .attr("width", LGmargin.right - 64)
            .attr("height", LGheight - (LGheight * 0.55))
            .attr("transform", "translate(" + (LGmargin.left + LGwidth + 64) + "," + LGmargin.top + (LGheight - (LGheight * 0.55)) + ")")

        cwdata = data;
        minTime = d3.extent(cwdata, d => d.date)[0];
        updateLG(cwdata);
    }
)