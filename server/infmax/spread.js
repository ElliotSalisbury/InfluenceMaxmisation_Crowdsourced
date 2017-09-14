var cytoscape = require('cytoscape');

export var IndependentCascadeModel = function(graph) {
    this.graph = graph;

    this.spread = function () {
        var infected = this.graph.nodes("[selectedBy]").toArray();
        while (infected.length > 0) {
            var node = infected.shift();
            var selectedBy = node.data("selectedBy");

            var edges = node.outgoers("edge");
            edges.forEach(function(edge, i, eles) {
                var weight = edge.data("weight");
                var target = edge.target();

                if (!target.data("selectedBy") && Math.random() < weight) {
                    target.data("selectedBy", selectedBy);
                    infected.push(target);
                }
            });
        }
    };
};