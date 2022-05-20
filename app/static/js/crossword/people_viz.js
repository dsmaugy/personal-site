import defaultImport, { people, cwdata, getPersonColor } from "./crossword_data.js"

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
    var totalPlays = cwdata.filter(d => d.name == selectedPerson).length;

    d3.select(".personstats-name")
        .text(selectedPerson)
        .style("color", getPersonColor(selectedPerson));
    d3.select(".personstats-played").text(totalPlays);
}

d3.select('#input-person').on('change', updateStats);
updateStats()