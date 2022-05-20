// time parsers
const parseTime = d3.timeParse("%M:%S");
const parseDate = d3.timeParse("%m/%d/%Y");

const COLORS = ["#388EA6", "#F2AD6B", "#7796F2", "#F29983", "#F283A7", "#96967E", "#6E280D", "#99ED34", "#0B2FA1", "#5211ED"];


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

export { people, cwdata, COLORS }