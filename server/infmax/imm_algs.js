var cytoscape = require('cytoscape');

export function highestDegree(graph, nLeftToPick) {
    var availableNodes = graph.nodes("[!selectedBy]");

    var maxNode = availableNodes.max(function(ele, i, eles){
        return ele.degree();
    });

    return maxNode.ele.id();
}

export function imm(graph, nLeftToPick) {
    //generate new graph that only has uninfected nodes
    let graphCopy = cytoscape({});
    graphCopy.json(graph.json());
    graphCopy.$('[selectedBy]').remove();

    let estimator = new InfluenceEstimator(graphCopy);

    let epsilon = 0.1;
    let OPT_prime = step1(nLeftToPick, estimator, epsilon);
    step2(nLeftToPick, estimator, OPT_prime, epsilon);

    return estimator.seedSet[0];
}

function log2(p) {
    return Math.log(p) / Math.log(2);
}

function logcnk(p, k) {
    let ans = 0;
    for (let i = p - k + 1; i <= p; i++) {
        ans += Math.log(i);
    }
    for (let i = 1; i <= k; i++) {
        ans -= Math.log(i);
    }
    return ans;
}

function step1(n, estimator, epsilon) {
    let select = Math.min(n, estimator.n);

    let epsilon_prime = epsilon * Math.sqrt(2);
    for(let x = 1; x<10; x++) {


        // how to get from x to how many runs are needed (number of runs
        // grow exponentiually if condition unmet)

        //avoids infinite loop
        if(n === 1) {
            n = 2;
        }

        let part1 = (2 + 2.0 / 3 * epsilon_prime) * (Math.log(n) + logcnk(n, select) + (Math.log(log2(n))) * Math.pow(2.0, x));

        let result = part1 / (epsilon_prime * epsilon_prime);

        estimator.build_hypergraph_r(Math.floor(result));
        estimator.build_seedset(select);
        let ept = estimator.estimateInfluence();

        if (ept > 1 / Math.pow(2.0, x)) {
            let OPT_prime = ept / (1 + epsilon_prime);
            return OPT_prime;
        }
    }
}

function step2(n, estimator, OPT_prime, epsilon) {
    let select = Math.min(n, estimator.n);

    let e = Math.exp(1);
    let alpha = Math.sqrt(Math.log(n) + Math.log(2));
    let beta = Math.sqrt((1 - 1 / e) * (logcnk(n, select) + Math.log(n) + Math.log(2)));
    let R = (2.0 * n * ((1 - 1 / e) * alpha + beta) * ((1 - 1 / e) * alpha + beta)) / OPT_prime / epsilon / epsilon; // using calculated OPT_prime to calculate optimal
    // number of runs - could have been done in step 1
    estimator.build_hypergraph_r(Math.floor(R));
    estimator.build_seedset(select);
    let opt = estimator.estimateInfluence();
    return opt;
}

class InfluenceEstimator {
    constructor(graph) {
        this.graph = graph;

        this.hyperG = {};
        this.hyperGT = [];

        this.seedSet = [];

        this.n = this.graph.nodes().size();

        this.runs = 0;

        this.init_hypergraph();
    }

    init_hypergraph() {
        this.hyperG = {};

        let self = this;
        this.graph.nodes().forEach(function(ele, i, eles) {
            self.hyperG[ele.id()] = [];
        });

        this.hyperGT = [];
        this.runs = 0;
    }

    build_hypergraph_r(runs) {
        this.runs = Math.max(this.runs, runs);
        let prevSize = this.hyperGT.length;
        while (this.hyperGT.length < this.runs) {
            this.hyperGT.push([]);
        }

        let nodeIds = [];
        this.graph.nodes().forEach(function(ele,i,eles){nodeIds.push(ele.id());});

        for (let k = prevSize; k < this.runs; k++) {
            let nodeId = _.sample(nodeIds, 1)[0];
            this.buildHypergraphNode(nodeId, k);
        }

        for (let i = prevSize; i < this.runs; i++) {
            for (let j = 0; j < this.hyperGT[i].length; j++) {
                let t = this.hyperGT[i][j];
                this.hyperG[t].push(i);
            }
        }
    }


    buildHypergraphNode(nodeId, hyperEdgeNum) {
        let n_visit_edge = 1;
        let q = [];

        this.hyperGT[hyperEdgeNum].push(nodeId); // Start the hyperedge

        q.push(nodeId);
        let visit_mark = [];
        visit_mark.push(nodeId);

        let visited = new Set();
        visited.add(nodeId);

        while (q.length > 0) {
            let id = q.shift();
            let testedNode = this.graph.$id(id);

            let weightedInEdges = testedNode.incomers("edge");
            // int inDegree = (int) weightedInEdges.size();
            let self = this;
            weightedInEdges.forEach(function(neighbourEdge, i, eles) {
                let v = neighbourEdge.source().id(); // get j-th neighbor
                let weight = neighbourEdge.data("weight"); // what is the weight of the edge?

                n_visit_edge++;
                if (Math.random() > weight) {
                    return;
                }
                if (visited.has(v)) {
                    return;
                }

                visited.add(v);
                q.push(v);
                self.hyperGT[hyperEdgeNum].push(v); // add new node to hyperedge
            });
        }
        return n_visit_edge;
    }

    build_seedset(nMost) {
        let degree = {};
        let visitLocal = [];
        this.seedSet = [];
        for (let i = 0; i < this.runs; i++) {
            visitLocal.push(false);
        }

        for (let nId in this.hyperG) {
            if (this.hyperG.hasOwnProperty(nId)) {
                degree[nId] = this.hyperG[nId].length; // for size of influence set
            }
        }

        let toSelect = Math.min(this.n, nMost);

        for (let i = 0; i < toSelect; i++) {
            let id = this.findMaxIndex(degree);
            if (id !== -1) {
                this.seedSet.push(id);
                degree[id] = 0;
                for (let j=0; j<this.hyperG[id].length; j++) {
                    let t = this.hyperG[id][j];
                    if (!visitLocal[t]) {
                        visitLocal[t] = true; // hyperedge has not been visited/is new

                        for (let k=0; k<this.hyperGT[t].length; k++) { // importance of those who touch that hyperedge goes down
                            let node = this.hyperGT[t][k];
                            degree[node] -= 1;
                        }
                    }
                }
            }
        }
    }

    estimateInfluence() {
        let seen = new Set(); // has this node been influenced?
        for (let i=0; i<this.seedSet.length; i++) {
            let node = this.seedSet[i];
            for (let j=0; j<this.hyperG[node].length; j++) {
                let influenced = this.hyperG[node][j];
                seen.add(influenced);
            }
        }
        let inf = this.n * seen.size / this.runs;// unbiased estimator for what is E[I(S)]?
        return inf;
    }

    findMaxIndex(dict) {
        let max = -1;
        let maxKey = -1;
        for (let key in dict) {
            if (dict.hasOwnProperty(key)) {
                if (dict[key] >= max) {
                    maxKey = key;
                    max = dict[key];
                }
            }
        }

        return maxKey;
    }
}