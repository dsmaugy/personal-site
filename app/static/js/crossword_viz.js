var LGmargin = { top: 80, right: 140, bottom: 50, left: 50 },
    LGwidth = 636 - LGmargin.left - LGmargin.right,
    LGheight = 436 - LGmargin.top - LGmargin.bottom;

const parseTime = d3.timeParse("%M:%S");
const parseDate = d3.timeParse("%m/%d/%Y");

d3.json("/crossword_data").then(
    (data) => {
        data.forEach(
            elem => {
                elem.time = parseTime(elem.time);
                elem.date = parseDate(elem.date);

                console.log(elem)
            }
        );

        // set the line graph SVG
        var LGsvg = d3.select(".linegraph").append("svg")
            .attr("width", LGwidth + LGmargin.left + LGmargin.right)
            .attr("height", LGheight + LGmargin.top + LGmargin.bottom)
            .append("g")
            .attr("transform", "translate(" + LGmargin.left +
                "," + LGmargin.top + ")");

        var LGxScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([0, 555]);
        var LGxAxis = d3.axisBottom(LGxScale)
            .tickFormat(d3.timeFormat("%m/%d/%y"));

        LGsvg.append("g")
            .attr("transform", "translate(0, 60)")
            .call(LGxAxis.ticks(d3.timeDay));
    }
)