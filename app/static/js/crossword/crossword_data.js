// time parsers
const parseTime = d3.timeParse("%M:%S");
const parseDate = d3.timeParse("%m/%d/%Y");

var people;
var cwdata;

export default await d3.json("/crossword_data").then(
    (data) => {
        data.forEach(
            elem => {
                elem.time = parseTime(elem.time);
                elem.date = parseDate(elem.date);
            }
        );

        people = [...new Set(data.map(d => d.name))];
        cwdata = data;
    }
);

export { people, cwdata }