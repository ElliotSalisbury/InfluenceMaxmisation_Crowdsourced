var cytoscape = require('cytoscape');

export var BarabasiAlbertGenerator = function(initialSize, size, stepSize, lower, upper){
    this.initialSize = initialSize;
    this.size = size;
    this.stepSize = stepSize;
    this.lower = lower;
    this.upper = upper;

    this.generate = function() {
        var cy = cytoscape({ });

        //create the nodes in the graph
        for (var i = 0; i < this.size; i++) {
            cy.add({
                group:"nodes",
                data: {id: "n"+i}
            });
        }

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

    //uniform weight between the upper and lower bounds
    this.getWeight = function() {
        return (Math.random() * (this.upper-this.lower)) + this.lower;
    };

    //we're not building a directed graph, so add both edges
    this.addInOutNeightbour = function(cy, source, target, weight) {
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
};