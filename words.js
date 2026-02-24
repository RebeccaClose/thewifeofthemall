
const assetsUrlPrefix = 'img/';
const imageCount = 44;
// Load state from local storage; if that doesn't work, start over
const state = loadState() || {
"assisted reproduction of race": 0,
  "science & fiction": 0,
  "queer reproductive work": 0,
  "life & animation": 0,
  cost: 0,
  useStorage: false
};


let useStorage = state["useStorage"] || false;

if (!useStorage) {
  d3.select("#banner").style("display", null);
  d3.select("#ok-button").on("click", (e) => {
    useStorage = true;
    state["useStorage"] = true;
    saveState();
    d3.select("#banner").style("display", "none");
    d3.select("#container").style("pointer-events", "auto");
  });
  d3.select("#cancel-button").on("click", (e) => {
    d3.select("#banner").style("display", "none");
    d3.select("#container").style("pointer-events", "auto");
  });
} else {
  d3.select("#container").style("pointer-events", "auto");
}

d3.csv("ALGORITHM.csv", (row) => ({
  word: row["word"],
  "assisted reproduction of race": +row["assisted reproduction of race"],
  "science & fiction": +row["science & fiction"],
  "queer reproductive work": +row["queer reproductive work"],
  "life & animation": +row["life & animation"],
  cost: +row["cost in €"],
})).then(renderWords);

displayData();

function renderWords(csv) {
  d3.shuffle(csv);
  const imageIDs = d3.shuffle(d3.range(1, imageCount + 1));
  const lookup = new Map(csv.map((d) => [d.word, d]));
  const tile = d3
    .select("#container")
    .selectAll(".word")
    .data(csv)
    .join("div")
    .attr("class", "tile")
    .attr("data-word", (d) => d.word);

  tile
    .append("div")
    .attr("class", "photo")
    .style(
      "background",
      (d, i) =>
        `center / cover no-repeat url("${assetsUrlPrefix}${imageIDs[i]}.jpg")`
    )
    .append("div")
    .attr("class", "word")
    .text((d) => d.word);

  tile.on("mouseenter", function () {
    d3.select(this).classed("hovered", true);
  });

  tile.on("click", function () {
    d3.select(this).classed("clicked", true);
    const word = d3.select(this).attr("data-word");
    const outcome = lookup.get(word);
    if (outcome) {
      for (category in outcome) {
        if (category === "word") continue;
        if (category in state) {
          state[category] += outcome[category];
        } else {
          state[category] = outcome[category];
        }
      }
      displayData();
      if (useStorage) saveState(state);
    }
  });

  tile.on("animationend", function () {
    if (d3.event.animationName === "zoom") {
      d3.select(this).classed("clicked", false);
    } else {
      d3.select(this).classed("hovered", false);
    }
  });
}

function displayData() {
  const cost = state["cost"] || 0;
  d3.select("#cost").text("€" + Number(cost).toLocaleString());
  const scores = Object.keys(state)
    .filter((d) => d !== "cost" && d !== "useStorage")
    .map((d) => ({ category: d, value: state[d] }));
  const width = 100;
  const height = 600;
  const maxScore = 200;
  const y = d3
    .scaleLinear()
    .domain([0, maxScore])
    .range([height, 0])
    .clamp(true);

  const gaugeUpdate = d3
    .select("#gauges")
    .selectAll(".gauge")
    .data(scores, (d) => d.category);

  const gaugeEnter = gaugeUpdate.enter().append("div").attr("class", "gauge");

  gaugeEnter
    .append("svg")
    .attr("width", width)
    .attr("height", height + 20);

  gaugeEnter
    .append("div")
    .attr("class", "label")
    .text((d) => d.category);

  const gaugeEnterUpdate = gaugeEnter.merge(gaugeUpdate);

  gaugeEnterUpdate
    .select("svg")
    .selectAll("rect")
    .data((d) => {
      console.log(d);
      return d3.range(d.value);
    })
    .join("rect")
    .attr("x", width / 2 - 10)
    .attr("y", (d) => y(d))
    .attr("fill", "#30D5C8")
    .attr("width", 30)
    .attr("height", 10);
}

document.querySelector("#reset").addEventListener("click", (e) => {
  Object.keys(state).forEach((key) => {
    if (key !== "useStorage") state[key] = 0;
  });
  displayData();
  if (useStorage) saveState(state);
});
