const COLORS = ["#388EA6", "#F2AD6B", "#7796F2", "#F29983", "#F283A7"];
const SYMBOLS = ["circle", "diamond", "square", "triangle-up", "triangle-down", "cross"];
const POINT_STROKE = "1.5";
const POINT_STROKE_HIGHLIGHT = "5";
const LINE_STROKE = "0.5";
const LINE_STROKE_HIGHLIGHT = "1.5";


const parseTime = d3.timeParse("%M:%S");
const parseDate = d3.timeParse("%m/%d/%Y");

// global var to hold data
var cwdata;
var people = [];

// global graph vars
var LGsvg;
var LGxg;
var LGxy;
var LGdataG;

var LGmargin = { top: 80, right: 140, bottom: 50, left: 50 },
    LGwidth = 936 - LGmargin.left - LGmargin.right,
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
    var allLines = LGsvg.selectAll("." + person + ".data-line");
    var allPoints = LGsvg.selectAll("." + person + ".data-point");

    allLines.attr("stroke-width", LINE_STROKE_HIGHLIGHT);
    allPoints.attr("stroke-width", POINT_STROKE_HIGHLIGHT);
}

function unhighlightData() {
    var person = this.className.baseVal.split(" ")[0];
    var allLines = LGsvg.selectAll("." + person + ".data-line");
    var allPoints = LGsvg.selectAll("." + person + ".data-point");

    allLines.attr("stroke-width", LINE_STROKE);
    allPoints.attr("stroke-width", POINT_STROKE);
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
            .transition(T)
            .attr("d", d =>
                d3.symbol()
                .type(d3.symbols[people.indexOf(d.name) % d3.symbols.length])
                .size(100)()
            )
            .attr("stroke", d => COLORS[people.indexOf(d.name) % COLORS.length])
            .attr("stroke-width", POINT_STROKE)
            .attr("fill", d => COLORS[people.indexOf(d.name) % COLORS.length])
            .attr("transform", d => "translate(" +
                LGxScale(d.date) +
                ", " +
                LGyScale(d.time) + ")")
            .attr("class", d => d.name + " data-point"),

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
            .on("mouseover", highlightData)
            .on("mouseleave", unhighlightData)
            .attr("stroke-width", "0")
            .transition(T)
            .attr("d", ([, d]) => LGline(d))
            .attr("stroke", ([n, ]) => COLORS[people.indexOf(n) % COLORS.length])
            .attr("stroke-width", LINE_STROKE)
            .attr("fill", "none")
            .attr("class", ([n, ]) => n + " data-line"),

            update => update
            .transition(T)
            .attr("d", ([, d]) => LGline(d)),

            exit => exit
            .transition(T)
            .attr("stroke-width", "0")
            .remove()
        )
}

d3.json("/crossword_data").then(
    (data) => {
        data.forEach(
            elem => {
                elem.time = parseTime(elem.time);
                elem.date = parseDate(elem.date);

                if (!people.includes(elem.name)) {
                    people.push(elem.name);
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


        cwdata = data;
        updateLG(cwdata);
    }
)