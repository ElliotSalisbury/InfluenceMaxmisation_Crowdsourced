var cytoscape = require('cytoscape');

export var generators = require("./generators");
export var spread = require("./spread");
export var imm_algs = require("./imm_algs");

export function dataToGraph(data) {
    return cytoscape({
        elements: data
    });
}
export function graphToData(graph) {
    var graphData = [];
    graph.elements().jsons().forEach(function(ele, i, eles){
        graphData.push({
            group:ele.group,
            data: ele.data
        });
    });
    return graphData;
}