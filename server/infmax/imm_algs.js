export function highestDegree(graph) {
    var availableNodes = graph.nodes("[!selectedBy]");

    var maxNode = availableNodes.max(function(ele, i, eles){
        return ele.degree();
    });

    return maxNode.ele.id();
}

export function imm(graph) {
    // let availableNodes = graph.nodes("[!selectedBy]");

    //maybe need special cases so if we have less than 1 node, etc...
    let estimator = new InfluenceEstimator(graph);

    let nToPick = 5;

    OPT_prime = step1(nToPick, estimator, graph);
    step2(nToPick, estimator, graph);

    return estimator.getSeedSet();
}

function log2(p) {
    return Math.log((double) (p)) / Math.log(2);
}

function logcnk(p, k) {
    let ans = 0;
    for (let i = p - k + 1; i <= p; i++) {
        ans += Math.log((double) (i));
    }
    for (let i = 1; i <= k; i++) {
        ans -= Math.log((double) (i));
    }
    return ans;
}

function step1(n, estimator, graph) {
    let select = Math.min(n, graph.size());

    let epsilon = 1;
    let epsilon_prime = epsilon * Math.sqrt(2);
    for(let x = 1;; x++) {

        // how to get from x to how many runs are needed (number of runs
        // grow exponentiually if condition unmet)

        let part1 = (2 + 2.0 / 3 * epsilon_prime) * (Math.log(n) + logcnk(n, select) + (Math.log(log2(n))) * Math.pow(2.0, x));

        let result = part1 / (epsilon_prime * epsilon_prime);

        estimator.build_hypergraph_r((int) (result));
        estimator.build_seedset(select);
        let ept = estimator.estimateInfluence();
        if (ept > 1 / Math.pow(2.0, x)) {
            OPT_prime = ept / (1 + epsilon_prime);
            return OPT_prime;
        }
    }
}

function step2(n, estimator, graph) {
    let select = Math.min(n, graph.size());

    let e = Math.exp(1);
    let alpha = Math.sqrt(Math.log(n) + Math.log(2));
    let beta = Math.sqrt((1 - 1 / e) * (logcnk(n, select) + Math.log(n) + Math.log(2)));
    let R = (int) ((2.0 * n * ((1 - 1 / e) * alpha + beta) * ((1 - 1 / e) * alpha + beta)) / OPT_prime / epsilon / epsilon); // using calculated OPT_prime to calculate optimal
    // number of runs - could have been done in step 1
    estimator.build_hypergraph_r((int) (R));
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
        this.n = graph.size();
        init_hypergraph();

        this.visit_mark = [];
        this.visit = [];
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
        let prevSize = hyperGT.length;
        while (this.hyperGT.size() <= this.runs) {
            this.hyperGT.push([]);
        }

        for (let k = prevSize; k < this.runs; k++) {
            buildHypergraphNode(Math.floor(Math.random() * this.n), k);
        }

        for (let i = prevSize; i < this.runs; i++) {
            for (let t in this.hyperGT[i]) {
                this.hyperG[t].push(i);
            }
        }
    }


    buildHypergraphNode(nodeIndex, hyperEdgeNum) {
        let n_visit_edge = 1; // number of edges traversed
        let n_visit_mark = 0; // order of visitation
        let q = [];

        hyperGT[hyperEdgeNum].push(nodeIndex); // Start the hyperedge

        q.push(nodeIndex);
        this.visit_mark[n_visit_mark++] = nodeIndex;
        this.visit[nodeIndex] = true;

        while (!q.isEmpty()) {
            let i = q.shift();
            let testedNode = this.graph.$id("n"+i);

            let weightedInEdges = testedNode.incomers("edge");
            // int inDegree = (int) weightedInEdges.size();
            for (let neighbourEdge in weightedInEdges) {
                let v = neighbourEdge.source().getID(); // get j-th neighbor
                let weight = neighbourEdge.getData("weight"); // what is the weight of the edge?

                n_visit_edge++;
                if (Math.random() > weight) {
                    continue;
                }
                if (this.visit[v]) {
                    continue;
                }
                if (!this.visit[v]) {
                    this.visit_mark[n_visit_mark++] = v;
                    this.visit[v] = true;
                }
                q.push(v);
                this.hyperGT[hyperEdgeNum].push(v); // add new node to hyperedge
            }
        }

        // reset visit check marks
        for (let l = 0; l < n_visit_mark; l++) {
            this.visit[this.visit_mark[l]] = false;
        }
        return n_visit_edge;
    }

    build_seedset(nMost) {
        let n = socialNetwork[0].getSize();
        let degree = [];
        let visitLocal = [];
        this.seedSet.clear();
        for (let i = 0; i < n; i++) {
            degree.push(0);
        }
        for (let i = 0; i < this.runs; i++) {
            visitLocal.push(false);
        }


        for (let i = 0; i < n; i++) {
            degree[i] = this.hyperG[i].length; // for size of influence set
        }

        let toSelect = Math.min(this.graph.size(), nMost);

        for (let i = 0; i < toSelect; i++) {
            let id = findMaxIndex(degree);
            if (id > -1) {
                this.seedSet.push(graph.$id("n"+id));
                degree[id] = 0;
                for (let t in this.hyperG[id]) {
                    if (!visitLocal[t]) {
                        visitLocal[t] = true; // hyperedge has not been visited/is new

                        for (let node in this.hyperGT[t]) { // importance of those who touch that hyperedge goes down
                            degree[node] -= weight;
                        }
                    }
                }
            }
        }
    }

    estimateInfluence() {
        let seen = []; // has this node been influenced?
        for (let node in this.seedSet) {
            for (let influenced in this.hyperG[node.getID()]) {
                seen.push(influenced);
            }
        }
        let inf = this.n * seen.length / runs;// unbiased estimator for what is E[I(S)]?
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