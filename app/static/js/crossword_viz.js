const COLORS = ["#388EA6", "#F2AD6B", "#7796F2", "#F29983", "#F283A7", "#96967E"];
const POINT_STROKE = "1.5";
const POINT_STROKE_HIGHLIGHT = "5";
const LINE_STROKE = "0.5";
const LINE_STROKE_HIGHLIGHT = "1.5";
const LINE_STROKE_LEG = "2";
const LINE_STROKE_HIGHLIGHT_LEG = "5";
const POINT_SIZE = 100;
const POINT_SIZE_LEG = 80;


const parseTime = d3.timeParse("%M:%S");
const parseDate = d3.timeParse("%m/%d/%Y");

var minTime;

// global var to hold data
var cwdata;
var people = [];
var selectedPeople = [];

// global graph vars
var LGsvg;
var LGxg;
var LGxy;
var LGdataG;
var LGlegend;

var LGmargin = { top: 80, right: 340, bottom: 50, left: 50 },
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

function highlightData() {
    var person = this.className.baseVal.split(" ")[0];
    var allLines = d3.selectAll("." + person + ".data-line.data");
    var allPoints = d3.selectAll("." + person + ".data-point.data");

    allLines.attr("stroke-width", LINE_STROKE_HIGHLIGHT);
    allPoints.attr("stroke-width", POINT_STROKE_HIGHLIGHT);
}

function unhighlightData() {
    var person = this.className.baseVal.split(" ")[0];
    var allLines = d3.selectAll("." + person + ".data-line.data");
    var allPoints = d3.selectAll("." + person + ".data-point.data");


    allLines.attr("stroke-width", LINE_STROKE);
    allPoints.attr("stroke-width", POINT_STROKE);
}

function highlightDataLegend(event, d) {
    var person = this.className.baseVal.split(" ")[0];
    var allLines = d3.selectAll("." + person + ".data-line.legend");
    var allPoints = d3.selectAll("." + person + ".data-point.legend");
    var choosenLabel = d3.selectAll("." + person + ".legend-lable");

    allLines.attr("stroke-width", LINE_STROKE_HIGHLIGHT_LEG);
    allPoints.attr("stroke-width", POINT_STROKE_HIGHLIGHT);
    choosenLabel.attr("font-weight", "bold");
}

function unhighlightDataLegend(event, d) {
    var person = this.className.baseVal.split(" ")[0];
    var allLines = d3.selectAll("." + person + ".data-line.legend");
    var allPoints = d3.selectAll("." + person + ".data-point.legend");
    var choosenLabel = d3.selectAll("." + person + ".legend-lable");


    allLines.attr("stroke-width", LINE_STROKE_LEG);
    allPoints.attr("stroke-width", POINT_STROKE);
    choosenLabel.attr("font-weight", "normal");

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
    LGyScale.domain(d3.extent(data, d => d.time));

    LGxg.transition(T)
        .call(LGxAxis.ticks(d3.timeDay));

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
            .attr("stroke-width", "0")
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

    filteredData = cwdata.filter(d => d.date >= minTime && selectedPeople.indexOf(d.name) >= 0);
    updateLG(filteredData);
}

d3.json("/crossword_data").then(
    (data) => {
        data.forEach(
            elem => {
                elem.time = parseTime(elem.time);
                elem.date = parseDate(elem.date);

                if (!people.includes(elem.name)) {
                    people.push(elem.name);
                    selectedPeople.push(elem.name);
                }
            }
        );

        // set the line graph SVG
        LGsvg = d3.select(".linegraph").append("svg")
            .attr("width", LGwidth + LGmargin.left + LGmargin.right)
            .attr("height", LGheight + LGmargin.top + LGmargin.bottom)
            .append("g")
            .attr("transform", "translate(" + LGmargin.left +
                "," + LGmargin.top + ")");

        // set up axes
        LGxg = LGsvg.append("g")
            .attr("transform", "translate(0," + LGheight + ")")
        LGyg = LGsvg.append("g")
        LGxg.append("text")
            .text("Date")
            .attr("x", LGmargin.left + (LGwidth - LGmargin.left - LGmargin.right) / 2)
            .attr("y", "50")
            .attr("fill", "black"); // TODO: make fill a CSS attribute

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
            .attr("height", LGheight - (LGheight * 0.55))

        people.forEach(
            (elem, i) => {
                LGlegend.append("text")
                    .on("mouseover.hl", highlightData)
                    .on("mouseleave.hl", unhighlightData)
                    .on("mouseover.leg", highlightDataLegend)
                    .on("mouseleave.leg", unhighlightDataLegend)
                    .attr("transform", "translate(" + ((LGmargin.right - 104) / 2) + ", " + ((i * 25) + 25) + ")")
                    .attr("class", elem + " " + "legend-lable")
                    .text(elem)

                LGlegend.append("path")
                    .on("mouseover.hl", highlightData)
                    .on("mouseleave.hl", unhighlightData)
                    .on("mouseover.leg", highlightDataLegend)
                    .on("mouseleave.leg", unhighlightDataLegend)
                    .attr("d", d3.symbol()
                        .type(d3.symbols[people.indexOf(elem) % d3.symbols.length])
                        .size(POINT_SIZE)()
                    )
                    .attr("stroke", COLORS[people.indexOf(elem) % COLORS.length])
                    .attr("stroke-width", POINT_STROKE)
                    .attr("fill", COLORS[people.indexOf(elem) % COLORS.length])
                    .attr("transform", "translate(" + ((LGmargin.right - 156) / 2) + ", " + ((i * 25) + 20.5) + ")")
                    .attr("class", elem + " data-point legend")


                LGlegend.append("line")
                    .on("mouseover.hl", highlightData)
                    .on("mouseleave.hl", unhighlightData)
                    .on("mouseover.leg", highlightDataLegend)
                    .on("mouseleave.leg", unhighlightDataLegend)
                    .attr("stroke", COLORS[people.indexOf(elem) % COLORS.length])
                    .attr("stroke-width", 2)
                    .attr("x1", 40)
                    .attr("x2", 50)
                    .attr("y1", (i * 25) + 20.5)
                    .attr("y2", (i * 25) + 20.5)
                    .attr("class", elem + " data-line legend")
                    // TODO: rectangle thing here
            })




        cwdata = data;
        timeRange =
            updateLG(cwdata);
    }
)