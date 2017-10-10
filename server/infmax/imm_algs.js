export function highestDegree(graph, nLeftToPick) {
    var availableNodes = graph.nodes("[!selectedBy]");

    var maxNode = availableNodes.max(function(ele, i, eles){
        return ele.degree();
    });

    return maxNode.ele.id();
}

export function imm(graph, nLeftToPick) {
    // let availableNodes = graph.nodes("[!selectedBy]");

    //maybe need special cases so if we have less than 1 node, etc...
    let estimator = new InfluenceEstimator(graph);


    let epsilon = 0.1;
    let OPT_prime = step1(nLeftToPick, estimator, epsilon);
    step2(nLeftToPick, estimator, OPT_prime, epsilon);

    return "n"+estimator.seedSet[0];
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
    for(let x = 1;; x++) {

        // how to get from x to how many runs are needed (number of runs
        // grow exponentiually if condition unmet)

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

        this.hyperG = [];
        this.hyperGT = [];

        this.seedSet = [];

        this.runs = 0;
        this.n = graph.nodes().size();
        this.visit_mark = [];
        this.visit = [];

        this.init_hypergraph();


    }

    init_hypergraph() {
        this.hyperG = [];
        for (let i = 0; i < this.n; i++) {
            this.hyperG.push([]);

            this.visit_mark.push(0);
            this.visit.push(false);
        }
        this.hyperGT = [];
        this.runs = 0;
    }

    build_hypergraph_r(runs) {
        this.runs = runs;
        let prevSize = this.hyperGT.length;
        while (this.hyperGT.length <= this.runs) {
            this.hyperGT.push([]);
        }

        for (let k = prevSize; k < this.runs; k++) {
            this.buildHypergraphNode(Math.floor(Math.random() * this.n), k);
        }

        for (let i = prevSize; i < this.runs; i++) {
            for (let j = 0; j < this.hyperGT[i].length; j++) {
                let t = this.hyperGT[i][j];
                this.hyperG[t].push(i);
            }
        }
    }


    buildHypergraphNode(nodeIndex, hyperEdgeNum) {
        let n_visit_edge = 1; // number of edges traversed
        let n_visit_mark = 0; // order of visitation
        let q = [];

        this.hyperGT[hyperEdgeNum].push(nodeIndex); // Start the hyperedge

        q.push(nodeIndex);
        this.visit_mark[n_visit_mark++] = nodeIndex;
        this.visit[nodeIndex] = true;

        while (q.length > 0) {
            let i = q.shift();
            let testedNode = this.graph.$id("n"+i);

            let weightedInEdges = testedNode.incomers("edge");
            // int inDegree = (int) weightedInEdges.size();
            let self = this;
            weightedInEdges.forEach(function(neighbourEdge, i, eles) {
                let v = neighbourEdge.source().id(); // get j-th neighbor
                v = parseInt(v.substr(1)); // remove leading 'n'
                let weight = neighbourEdge.data("weight"); // what is the weight of the edge?

                n_visit_edge++;
                if (Math.random() > weight) {
                    return;
                }
                if (self.visit[v]) {
                    return;
                }
                if (!self.visit[v]) {
                    self.visit_mark[n_visit_mark++] = v;
                    self.visit[v] = true;
                }
                q.push(v);
                self.hyperGT[hyperEdgeNum].push(v); // add new node to hyperedge
            });
        }

        // reset visit check marks
        for (let l = 0; l < n_visit_mark; l++) {
            this.visit[this.visit_mark[l]] = false;
        }
        return n_visit_edge;
    }

    build_seedset(nMost) {
        let degree = [];
        let visitLocal = [];
        this.seedSet = [];
        for (let i = 0; i < this.n; i++) {
            degree.push(0);
        }
        for (let i = 0; i < this.runs; i++) {
            visitLocal.push(false);
        }


        for (let i = 0; i < this.n; i++) {
            degree[i] = this.hyperG[i].length; // for size of influence set
        }

        let toSelect = Math.min(this.n, nMost);

        for (let i = 0; i < toSelect; i++) {
            let id = this.findMaxIndex(degree);
            if (id > -1) {
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

    findMaxIndex(array) {
        let max = -1;
        let maxIndex = -1;
        for (let i = 0; i < array.length; i++) {
            if (array[i] >= max) {
                maxIndex = i;
                max = array[i];
            }
        }
        return maxIndex;
    }
}