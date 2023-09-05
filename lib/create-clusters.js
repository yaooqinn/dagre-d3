var util = require("./util");
var d3 = require("./d3");
var addLabel = require("./label/add-label");
var pick = require("lodash/pick")

module.exports = createClusters;

function createClusters(selection, g) {
  var clusters = g.nodes().filter(function(v) { return util.isSubgraph(g, v); });
  var svgClusters = selection.selectAll("g.cluster")
    .data(clusters, function(v) { return v; });

  // Clusters created from DOT subgraphs are prefixed with "cluster"
  // strip this prefix if it exists and use our own (i.e. "cluster_")
  var makeClusterIdentifier = function(v) {
    return "cluster_" + v.replace(/^cluster/, "");
  };

  svgClusters.selectAll("*").remove();
  svgClusters.enter().append("g")
    // clusters created from DOT subgraphs are prefixed with "cluster"
    // strip this prefix if it exists and use our own (i.e. "cluster_")
    .attr("class", makeClusterIdentifier )
    .attr("name", function(v) { return g.node(v).label; })
    .classed("cluster", true)
    .attr("id", function(v){
      var node = g.node(v);
      return node.id;
    })
    .style("opacity", 0)
    .append("rect");
  
  svgClusters = selection.selectAll("g.cluster");

  // Draw the label for each cluster and adjust the padding for it.
  // We position the labels later because the dimensions and the positions
  // of the enclosing rectangles are still subject to change. Note that
  // the ordering here is important because we build the parents' padding
  // based on the children's.
  var sortedClusters = util.orderByRank(g, svgClusters.data());
  for (var i = 0; i < sortedClusters.length; i++) {
    var v = sortedClusters[i];
    var node = g.node(v);
    if (node.label) {
      var thisGroup = selection.select("g.cluster." + makeClusterIdentifier(v));
          labelGroup = thisGroup.append("g").attr("class", "label"),
          labelDom = addLabel(labelGroup, node),
          bbox = pick(labelDom.node().getBBox(), "width", "height");
      // Add some padding for the label
      // Do this recursively to account for our descendants' labels.
      // To avoid double counting, we must start from the leaves.
      node.paddingTop += bbox.height;
      node.paddingTop += util.getMaxChildPaddingTop(g, v);
      // move the label to the right-top of the cluster
      var x = (node.width / 2 - 5) // move right to edge of cluster
      var y = (-node.height / 2 - node.paddingTop + 5) // move up to top of cluster
      labelDom
        .attr("text-anchor", "end")
        .attr("transform", "translate(" + x + "," + y + ")");
    }
  }

  util.applyTransition(svgClusters, g)
    .style("opacity", 1);

  svgClusters.selectAll("rect").each(function(c) {
    var node = g.node(c);
    var domCluster = d3.select(this);
    util.applyStyle(domCluster, node.style);
  });

  var exitSelection;

  if (svgClusters.exit) {
    exitSelection = svgClusters.exit();
  } else {
    exitSelection = svgClusters.selectAll(null); // empty selection
  }

  util.applyTransition(exitSelection, g)
    .style("opacity", 0)
    .remove();

  return svgClusters;
}
