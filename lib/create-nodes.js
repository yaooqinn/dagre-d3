"use strict";

var _ = require("./lodash");
var addLabel = require("./label/add-label");
var util = require("./util");
var d3 = require("./d3");

module.exports = createNodes;

function createNodes(selection, g, shapes) {
  var simpleNodes = g.nodes().filter(function(v) { return !util.isSubgraph(g, v); });
  var svgNodes = selection.selectAll("g.node")
    .data(simpleNodes, function(v) { return v; })
    .classed("update", true);

  svgNodes.exit().remove();

  svgNodes.enter().append("g")
    .attr("class", function(v) { return "node_" + v; })
    .attr("name", function(v) { return g.node(v).label; })
    .classed("node", true)
    .style("opacity", 0);

  svgNodes = selection.selectAll("g.node"); 

  svgNodes.each(function(v) {
    var node = g.node(v);
    var thisGroup = d3.select(this);
    util.applyClass(thisGroup, node["class"],
      (thisGroup.classed("update") ? "update " : "") + "node");

    thisGroup.select("g.label").remove();
    var labelGroup = thisGroup.append("g").attr("class", "label");
    var labelDom = addLabel(labelGroup, node);
    var shape = shapes[node.shape];
    var bbox = _.pick(labelDom.node().getBBox(), "width", "height");

    node.elem = this;

    if (node.id) { thisGroup.attr("id", node.id); }
    if (node.labelId) { labelGroup.attr("id", node.labelId); }

    if (_.has(node, "width")) { bbox.width = node.width; }
    if (_.has(node, "height")) { bbox.height = node.height; }

    bbox.width += node.paddingLeft + node.paddingRight;
    bbox.height += node.paddingTop + node.paddingBottom;
    labelGroup.attr("transform", "translate(" +
      ((node.paddingLeft - node.paddingRight) / 2) + "," +
      ((node.paddingTop - node.paddingBottom) / 2) + ")");

    var root = d3.select(this);
    root.select(".label-container").remove();
    var shapeSvg = shape(root, bbox, node).classed("label-container", true);
    util.applyStyle(shapeSvg, node.style);

    // Stretch this node horizontally a little to account for ancestor cluster
    // labels. We must do this here because by the time we create the clusters,
    // we have already positioned all the nodes.
    var requiredWidth = 0,
        requiredHeight = 0;
    var nextNode = g.node(g.parent(v));
    while (nextNode) {
      var tempGroup = thisGroup.append("g");
      var tempLabel = addLabel(tempGroup, nextNode);
      var tempBBox = tempLabel.node().getBBox();
      // WARNING: this uses a hard-coded value of nodesep
      tempBBox.width -= 50;
      requiredWidth = Math.max(requiredWidth, tempBBox.width);
      requiredHeight = Math.max(requiredHeight, tempBBox.height);
      tempLabel.remove();
      nextNode = g.node(g.parent(nextNode.label));
    }

    var shapeBBox = shapeSvg.node().getBBox();
    shapeBBox.width = Math.max(shapeBBox.width, requiredWidth);
    shapeBBox.height = Math.max(shapeBBox.height, requiredHeight);
    node.width = shapeBBox.width;
    node.height = shapeBBox.height;
  });

  var exitSelection;

  if (svgNodes.exit) {
    exitSelection = svgNodes.exit();
  } else {
    exitSelection = svgNodes.selectAll(null); // empty selection
  }

  util.applyTransition(exitSelection, g)
    .style("opacity", 0)
    .remove();

  return svgNodes;
}
