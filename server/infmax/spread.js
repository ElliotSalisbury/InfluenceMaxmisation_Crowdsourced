var cytoscape = require('cytoscape');

class EpidemicNetwork {
    constructor(network) {
        this.network = network;
        this.infectedNodes = [];
    }

    infect(node) {
        this.infectedNodes.push(node);
    }

    isInfected(node) {
        return this.infectedNodes.indexOf(node) >= 0;
    }
}

class AbstractEpidemicModel {
    constructor(network) {
        this.network = network;
        this.epidemicNetwork = new EpidemicNetwork(network);
        this.lastInfected = [];
    }

    setInfectedNode(node) {
        this.epidemicNetwork.infect(node);
    }
    setInfectedNodes(nodes) {
        for (let i=0; i<nodes.length; i++) {
            let node = nodes[i];
            this.setInfectedNode(node);
        }
    }

    infectNode(node) {
        this.epidemicNetwork.infect(node);
        this.lastInfected.push(node);
    }
    infectNodes(nodes) {
        for (let i=0; i<nodes.length; i++) {
            let node = nodes[i];
            this.infectNode(node);
        }
    }

    runStep() {
        let infected = this.getNextInfectedNodes();
        this.lastInfected = [];

        this.infectNodes(infected);

        return infected;
    }

    run() {
        let allInfected = [];
        let done = false;
        while (!done) {
            let newNodes = this.runStep();
            allInfected.push(...newNodes);
            if (newNodes.length === 0) {
                done = true;
            }
        }

        return allInfected;
    }
}

export class IndependentCascadeModel extends AbstractEpidemicModel {
    constructor(network) {
        super(network);
    }

    getNextInfectedNodes() {
        let nextInfected = [];

        for (let i=0; i<this.lastInfected.length; i++) {
            let node = this.lastInfected[i];

            let edges = node.outgoers("edge");
            let self = this;
            edges.forEach(function(edge, edge_i, eles) {
                let weight = edge.data("weight");
                let target = edge.target();

                if (Math.random() < weight && !self.epidemicNetwork.isInfected(target)) {
                    nextInfected.push(target);
                }
            });
        }

        return nextInfected;
    }
}



// export var IndependentCascadeModel = function(graph) {
//     this.graph = graph;
//
//     this.spread = function () {
//         var infected = this.graph.nodes("[selectedBy]").toArray();
//         while (infected.length > 0) {
//             var node = infected.shift();
//             var selectedBy = node.data("selectedBy");
//
//             var edges = node.outgoers("edge");
//             edges.forEach(function(edge, i, eles) {
//                 var weight = edge.data("weight");
//                 var target = edge.target();
//
//                 if (!target.data("selectedBy") && Math.random() < weight) {
//                     target.data("selectedBy", selectedBy);
//                     infected.push(target);
//                 }
//             });
//         }
//     };
// };