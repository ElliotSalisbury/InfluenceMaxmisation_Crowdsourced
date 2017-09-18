var cytoscape = require('cytoscape');

class AbstractGenerator {
    constructor(size, lower, upper) {
        this.size = size;
        this.lower = lower;
        this.upper = upper;
    }

    createInitialGraph() {
        let cy = cytoscape({});

        //create the nodes in the graph
        for (var i = 0; i < this.size; i++) {
            cy.add({
                group:"nodes",
                data: {id: "n"+i}
            });
        }

        return cy;
    }

    //uniform weight between the upper and lower bounds
    getWeight() {
        return (Math.random() * (this.upper-this.lower)) + this.lower;
    };

    //we're not building a directed graph, so add both edges
    addInOutNeightbour(cy, source, target, weight) {
        //add edges between these nodes in both directions
        cy.add([
            {
                group: "edges",
                data: {
                    id: "e" + source.id() + "_" + target.id(),
                    source: source.id(),
                    target: target.id(),
                    weight: weight
                }
            },
            {
                group: "edges",
                data: {
                    id: "e" + target.id() + "_" + source.id(),
                    source: target.id(),
                    target: source.id(),
                    weight: weight
                }
            }
        ]);
    };
}

export class BarabasiAlbertGenerator extends AbstractGenerator {
    constructor(initialSize, size, stepSize, lower, upper) {
        super(size, lower, upper);
        this.initialSize = initialSize;
        this.stepSize = stepSize;
    }

    generate() {
        var cy = this.createInitialGraph();

        //link up the initial nodes
        for (var i = 0; i < this.initialSize; i++) {
            for (var j = i+1; j < this.initialSize; j++) {
                var nodeI = cy.$id("n"+i);
                var nodeJ = cy.$id("n"+j);

                var weight = this.getWeight();
                this.addInOutNeightbour(cy, nodeI, nodeJ, weight);
            }
        }

        // Adding stepSize number of edges to the rest of the nodes
        for (var i = this.initialSize; i < this.size; i++) {
            var nodeI = cy.$id("n"+i);

            var sum = 0;  // sum of all nodes degrees
            for (var j = 0; j < i; j++) {
                var nodeJ = cy.$id("n"+j);
                sum += nodeJ.degree();
            }

            var s = 0;
            for (var step = 0; step < this.stepSize; step++) {
                r = Math.random();
                p = 0;
                for (var j = 0; j < i; j++) {
                    var nodeJ = cy.$id("n"+j);

                    if (nodeI.outgoers().contains(nodeJ)) {
                        continue;
                    }
                    if (i == 1) {
                        p = 1;
                    } else {
                        p += nodeJ.degree() / sum + s / (i - step);
                    }

                    if (r <= p) {
                        s += nodeJ.degree() / sum;

                        var weight = this.getWeight();
                        this.addInOutNeightbour(cy, nodeI, nodeJ, weight);
                        break;
                    }
                }
            }
        }

        return cy;
    };
}

export class ErdosRenyiGenerator extends AbstractGenerator {
    constructor(size, probability, lower, upper) {
        super(size, lower, upper);
        this.probability = probability;
    }

    generate() {
        let cy = this.createInitialGraph();

        //create the links
        for (let a = 0; a < this.size; a++) {
            let sNode = cy.$id("n"+a);

            for (let b = a + 1; b < this.size; b++) {
                if (Math.random() <= this.probability) {
                    let tNode = cy.$id("n"+b);
                    let weight = this.getWeight();
                    this.addInOutNeightbour(cy, sNode, tNode, weight);
                }
            }
        }

        return cy;
    };
}