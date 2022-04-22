const COLORS = ["#388EA6", "#F2AD6B", "#7796F2", "#F29983", "#F283A7"];
const SYMBOLS = ["circle", "diamond", "square", "triangle-up", "triangle-down", "cross"];

// global var to hold data
var cwdata;

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


const parseTime = d3.timeParse("%M:%S");
const parseDate = d3.timeParse("%m/%d/%Y");

function updateLG(people, timeRange) {
    const t = LGsvg.transition().duration(750);

    // we update the scale every time update is called
    LGxScale.domain(timeRange);
    LGyScale.domain(d3.extent(cwdata, d => d.time));

    LGxg.transition(t)
        .call(LGxAxis.ticks(d3.timeDay));

    LGyg.transition(t)
        .call(LGyAxis);

    // we also update the data range
    var LGline = d3.line()
        .x(d => LGxScale(d.date))
        .y(d => LGyScale(d.time));


    // add the lines for each person
    people.forEach(
        (person, i) => {
            console.log(person);
            filteredData = cwdata.filter(d => d.name == person);

            LGdataG
                .select("#data-" + person)
                .select(".points")
                .selectAll("path")
                .data(filteredData, d => d.date)
                .join(
                    enter => enter.append("path")
                    .attr("d",
                        d3.symbol()
                        .type(d3.symbols[i % d3.symbols.length])
                        .size(100))
                    .attr("stroke", COLORS[i % COLORS.length])
                    .attr("stroke-width", "1.5")
                    .attr("fill", COLORS[i % COLORS.length])
                    .attr("transform", d => "translate(" +
                        LGxScale(d.date) +
                        ", " +
                        LGyScale(d.time) + ")"),
                    update => update,
                    exit => exit.remove()
                )

            // LGdataG
            //     .select("#data-" + person)
            //     .select(".line")
            //     .selectAll("path")
            //     .data([filteredData])
            //     .join("path")
            //     .attr("d", LGline)
            //     .attr("stroke", COLORS[i % COLORS.length])
            //     .attr("stroke-width", "1.5")
            //     .attr("fill", "none");
        }
    )
}

d3.json("/crossword_data").then(
    (data) => {
        var people = [];
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

        // 
        LGxg = LGsvg.append("g")
            .attr("transform", "translate(0," + LGheight + ")")
        LGyg = LGsvg.append("g")

        // initially set up lines
        LGdataG
            = LGsvg.append("g");
        people.forEach(
            person => {
                var personG = LGdataG
                    .append("g")
                    .attr("id", "data-" + person)

                personG.append("g")
                    .attr("class", "line")

                personG.append("g")
                    .attr("class", "points")
            }
        )

        cwdata = data;
        updateLG(people, d3.extent(cwdata, d => d.date));
    }
)