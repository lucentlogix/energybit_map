let countries = require("./world_countries.json")
let population = require("./world_population.json")
let topojson = require("topojson")

import "../css/energy_bit.css"

var d3 = require("d3")

import d3Tip from "d3-tip"
d3.tip = d3Tip
;(function() {
  const format = d3.format(",")

  // Set tooltips
  const tip = d3
    .tip()
    .attr("class", "d3-tip")
    .offset([-10, 0])
    .html(function(d) {
      return (
        "<strong>Country: </strong><span class='details'>" +
        d.properties.name +
        "<br></span>" +
        "<strong>Population: </strong><span class='details'>" +
        format(d.population) +
        "</span>"
      )
    })

  const projectTip = d3
    .tip()
    .attr("class", "d3-tip")
    .offset([-10, 0])
    .html(function(d) {
      const details = d.fields.map(
        field => `<strong>${field.label}: </strong><span class='details'>${field.value}</span></br>`
      )
      return `<strong>${d.title}</strong></br>${details.join("")}`
    })

  const color = d3
    .scaleThreshold()
    .domain([10000, 100000, 500000, 1000000, 5000000, 10000000, 50000000, 100000000, 500000000, 1500000000])
    .range([
      "rgb(247,251,255)",
      "rgb(222,235,247)",
      "rgb(198,219,239)",
      "rgb(158,202,225)",
      "rgb(107,174,214)",
      "rgb(66,146,198)",
      "rgb(33,113,181)",
      "rgb(8,81,156)",
      "rgb(8,48,107)",
      "rgb(3,19,43)",
    ])

  const margin = { top: 0, right: 0, bottom: 0, left: 0 },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    projection = d3
      .geoMercator()
      .scale(130)
      .translate([width / 2, height / 1.5]),
    svg = d3
      .select("#energybit-map-container")
      .append("svg")
      .attr("width", width)
      .attr("height", height),
    path = d3.geoPath().projection(projection),
    g = svg.append("g").attr("class", "map")

  const zoom = d3
    .zoom()
    .scaleExtent([1, 50])
    .on("zoom", () => {
      const k = d3.event.transform.k
      g.attr("transform", d3.event.transform) // updated for d3 v4
      svg.selectAll("circle").attr("r", 5 / k)
      svg.selectAll("path").attr("stroke-width", 5 / k)
    })

  svg.call(tip)
  svg.call(projectTip)
  svg.call(zoom)
  svg.call(responsivefy)

  var populationById = {}

  population.forEach(function(d) {
    populationById[d.id] = +d.population
  })
  countries.features.forEach(function(d) {
    d.population = populationById[d.id]
  })

  g.append("g")
    .attr("class", "countries")
    .selectAll("path")
    .data(countries.features)
    .enter()
    .append("path")
    .attr("d", path)
    .style("fill", function(d) {
      return color(populationById[d.id])
    })
    .style("stroke", "white")
    .style("stroke-width", 1.5)
    .style("opacity", 0.8)
    // tooltips
    .style("stroke", "white")
    .style("stroke-width", 0.3)
    .on("mouseover", function(d) {
      tip.show(d, this)

      d3.select(this)
        .style("opacity", 1)
        .style("stroke", "white")
    })
    .on("mouseout", function(d) {
      tip.hide(d)

      d3.select(this)
        .style("opacity", 0.8)
        .style("stroke", "white")
        .style("stroke-width", 0.3)
    })

  g.selectAll("circle")
    .data(projects)
    .enter()
    .append("a")
    .attr("xlink:href", function(d) {
      return d.link
    })
    .append("circle")
    .attr("cx", function(d) {
      return projection([d.lon, d.lat])[0]
    })
    .attr("cy", function(d) {
      return projection([d.lon, d.lat])[1]
    })
    .attr("r", 5)
    .style("fill", "red")
    .on("mouseover", function(d) {
      projectTip.show(d, this)
    })
    .on("mouseout", function() {
      projectTip.hide()
    })

  svg
    .append("path")
    .datum(
      topojson.mesh(countries.features, function(a, b) {
        return a.id !== b.id
      })
    )
    // .datum(topojson.mesh(data.features, function(a, b) { return a !== b; }))
    .attr("class", "names")
    .attr("d", path)

  function responsivefy(svg) {
    // get container + svg aspect ratio
    var container = d3.select(svg.node().parentNode),
      width = parseInt(svg.style("width")),
      height = parseInt(svg.style("height")),
      aspect = width / height

    // add viewBox and preserveAspectRatio properties,
    // and call resize so that svg resizes on inital page load
    svg
      .attr("viewBox", "0 0 " + width + " " + height)
      .attr("perserveAspectRatio", "xMinYMid")
      .call(resize)

    // to register multiple listeners for same event type,
    // you need to add namespace, i.e., 'click.foo'
    // necessary if you call invoke this function for multiple svgs
    // api docs: https://github.com/mbostock/d3/wiki/Selections#on
    d3.select(window).on("resize." + container.attr("id"), resize)

    // get width of container and resize svg to fit it
    function resize() {
      var targetWidth = parseInt(container.style("width"))
      svg.attr("width", targetWidth)
      svg.attr("height", Math.round(targetWidth / aspect))
    }
  }
})()
