export function highestDegree(graph) {
    var availableNodes = graph.nodes("[!selectedBy]");

    var maxNode = availableNodes.max(function(ele, i, eles){
        return ele.degree();
    });

    return maxNode.ele.id();
}