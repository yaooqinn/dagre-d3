"use strict";

var util = require("./util");
var d3 = require("./d3");

module.exports = positionClusters;

function positionClusters(selection, g) {
  var created = selection.filter(function() { return !d3.select(this).classed("update"); });

  function translate(v) {
    var node = g.node(v);
    return "translate(" + node.x + "," + node.y + ")";
  }

  created.attr("transform", translate);

  util.applyTransition(selection, g)
    .style("opacity", 1)
    .attr("transform", translate);

  util.applyTransition(created.selectAll("rect"), g)
    .attr("width", function(v) {
      var node = g.node(v);
      return node.width + node.paddingLeft + node.paddingRight;
    })
    .attr("height", function(v) {
      var node = g.node(v);
      return node.height + node.paddingTop + node.paddingBottom;
    })
    .attr("x", function(v) {
      var node = g.node(v);
      return -node.width / 2 - node.paddingLeft;
    })
    .attr("y", function(v) {
      var node = g.node(v);
      return -node.height / 2 - node.paddingTop;
    });
}
