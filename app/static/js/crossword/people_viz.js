import defaultImport, { people, cwdata, getPersonColor } from "./crossword_data.js"

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

// time formatters
const formatTime = d3.timeFormat("%M:%S");
const formatDate = d3.timeFormat("%A, %B %e, %Y");

// populate the select menu with people names
var select = document.getElementById("input-person");
people.forEach(e => {
    var option = document.createElement("option");
    option.setAttribute("value", e);
    option.text = e;
    select.appendChild(option);
})

function updateStats() {
    var selectedPerson = document.getElementById("input-person").value;
    var personData = cwdata.filter(d => d.name == selectedPerson);
    var personDataSorted = personData.sort((a, b) => d3.ascending(a.time, b.time));

    var totalPlays = personData.length;
    var totalTracked = d3.timeDay.count(d3.extent(cwdata, d => d.date)[0], d3.extent(cwdata, d => d.date)[1]);

    var averageTimesByDay = d3.rollup(personData, v => d3.mean(v, d => (d.time.getMinutes() * 60) + (d.time.getHours() * 3600) + d.time.getSeconds()), d => d.date.getDay());
    var averageTimesByDayArray = Array.from(averageTimesByDay).map(d => {
        var mins = String(Math.floor(d[1] / 60)).padStart(2, '0');
        var sec = String(parseInt(d[1] % 60)).padStart(2, '0');
        return { "day": WEEKDAYS[d[0]], "time": d[1], "timeFormatted": mins + ":" + sec }
    });
    var bestDay = d3.least(averageTimesByDayArray, d => d.time)
    console.log(bestDay);

    d3.select(".personstats-name")
        .text(selectedPerson)
        .style("color", getPersonColor(selectedPerson));

    d3.select(".personstats-played").text(totalPlays);
    d3.select(".personstats-total-track").text(totalTracked);
    d3.select(".personstats-comletion-pct").text(parseFloat(totalPlays / totalTracked * 100).toFixed(0) + "%");
    if (totalPlays / totalTracked > 0.60) {
        d3.select(".personstast-completion-emoji").text("😳");
    } else {
        d3.select(".personstast-completion-emoji").text("🤡");
    }
    d3.select(".personstats-fastest-time").text(formatTime(personDataSorted[0].time));
    d3.select(".personstats-fastest-date").text(formatDate(personDataSorted[0].date));
    d3.select(".personstats-slowest-time").text(formatTime(personDataSorted[personDataSorted.length - 1].time));
    d3.select(".personstats-slowest-date").text(formatDate(personDataSorted[personDataSorted.length - 1].date));
    d3.select(".personstats-dow").text(bestDay.day);
    d3.select(".personstats-dow-time").text(bestDay.timeFormatted);



}

d3.select('#input-person').on('change', updateStats);
updateStats()

d3.select(".personstats-container").style("display", "block")