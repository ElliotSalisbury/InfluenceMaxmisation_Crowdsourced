let cytoscape = require('cytoscape');
let bilkent = require('cytoscape-cose-bilkent');
cytoscape.use( bilkent );

let introJs = require('./intro.js').introJs;

const _singleton = Symbol();

let STYLE_NODE_SELECTED_IM = {
    'background-image': function (ele) {
        return "url(\"" + InstanceData.findOne().experiment.turnLogos[ele.data('selectedBy')] + "\")";
    },
    'background-fit': 'contain',
};
let STYLE_NODE_SELECTED = {
    'width': "50%",
    'height': "50%",
    'background-color': function(ele){
        if (ele.data('eventIndex') > self.eventIndex) {
            return '#2a9ee0';
        }
        return InstanceData.findOne().experiment.turnColors[ele.data('selectedBy')];
    },
    'border-width': "5px",
    "border-color": "#fbf80a",//function(ele) {
    //     let instanceData = InstanceData.findOne();
    //     let lastInfected = instanceData.nodesLastInfected;
    //
    //     if (instanceData.experiment.seedsRequired - instanceData.experiment.turn <= 0 && lastInfected.length === 0) {
    //         //if the game has ended, calculate who won
    //         let maxSpread = 0;
    //         let winnerIds = [];
    //         for(let i=0; i<instanceData.experiment.turnOrder.length; i++) {
    //             let userId = instanceData.experiment.turnOrder[i];
    //             let spread = self.spreadOfUser(userId);
    //             if (spread > maxSpread) {
    //                 maxSpread = spread;
    //                 winnerIds = [userId,];
    //             }else if (spread === maxSpread) {
    //                 winnerIds.push(userId);
    //             }
    //         }
    //
    //         //change the winners color
    //         if (winnerIds.indexOf(ele.data('selectedBy')) !== -1) {
    //             return "#fbf80a";
    //         } else {
    //             return "#969696";
    //         }
    //     }else {
    //         //if the node has no more connections it can make
    //         let availableConnections = ele.outgoers("node[!selectedBy]");
    //         if (availableConnections.size() === 0) {
    //             return "#969696";
    //         }
    //
    //
    //         let index = lastInfected.indexOf(ele.id());
    //         if (index === lastInfected.length - 1) {
    //             //if the node was the last one selected, highlight it
    //             return '#fbf80a';
    //         } else if (index !== -1) {
    //             //if the node could still infect more
    //             return '#ec0300';
    //         }
    //         //this node is inactive now
    //         return "#000000";
    //     }
    // }
};

let STYLE_NODE_INFECTED = $.extend($.extend({},STYLE_NODE_SELECTED), {
    "border-color": '#ec0300',
});

let STYLE_NODE_DISABLED = $.extend($.extend({},STYLE_NODE_SELECTED), {
    'border-color': "#969696",
});

let STYLE_EDGE_DEFAULT = {
    'width': function (ele) {
        if (ele.data('weight') < self.thick_thresh) {
            return 2;
        } else {
            return 6;
        }
    },
    'line-color': '#eca41a',
    'line-style': function (ele) {
        return ele.data('weight') < self.dotted_thresh ? 'dashed' : 'solid';
    },
};

let STYLE_EDGE_INFECTED = {
    'width': 10,
    'line-color': '#58ec00',
};

let STYLE_EDGE_ATRISK = {
    'line-color': '#ec0300',
};

let STYLE_EDGE_DISABLED = {
    'line-color': "#969696",
    'width': 2,
    'line-style': 'solid'
};



export class InfluenceMaximisationGraph {
    constructor(singletonToken, containerId) {
        if(singletonToken !== _singleton) {
            throw "Cannot construct singleton";
        }

        this.ID = Date.now();
        let self = this;
        this.dotted_thresh = 0.2;
        this.thick_thresh = 0.3;


        //animate events as they happen
        this.animateDuration = 1000;
        this.eventIndex = 0;

        this.containerId = containerId;

        console.log("constructor", this.ID);
    }

    static getInstance(containerId) {
        if(!InfluenceMaximisationGraph[_singleton]) {
            InfluenceMaximisationGraph[_singleton] = new InfluenceMaximisationGraph(_singleton, containerId);
        }
        return InfluenceMaximisationGraph[_singleton];
    }

    updateGraph(instanceData) {
        console.log("updateGraph", this.ID);

        //if we havent created the cygraph, or the dom has changed and we need to create a new one
        if(typeof this.cycontainer === "undefined" || !document.body.contains(this.cycontainer)) {
            console.log("--creating cy", this.ID);
            let containerElement = document.getElementById(this.containerId);
            if(containerElement == null) {
                return;
            }

            this.cycontainer = containerElement;
            this.cy = cytoscape({
                container: this.cycontainer,

                style: [
                    {
                        selector: 'node',
                        style: {
                            'background-color': '#2a9ee0'
                        }
                    },
                    {
                        selector: 'edge',
                        style: STYLE_EDGE_DEFAULT
                    },
                    {
                        selector: '.withIm',
                        style: STYLE_NODE_SELECTED_IM
                    }
                ],

                userZoomingEnabled: false,
                userPanningEnabled:false,
                autoungrabify:true
            });

            //we need to tell cy to update incase the dom has changed, this is fairly hacky
            this.cycontainer.updated = false;
            this.cycontainer.infMax = this;
            this.cycontainer.addEventListener("mouseleave", function(){
                this.infMax.cy.resize();
                this.updated = false;
            });
            this.cycontainer.addEventListener("mousemove", function(){
                if(!this.updated) {
                    this.infMax.cy.resize();
                    this.updated = true;
                }
            });
            this.cycontainer.addEventListener("click", function(){
                this.infMax.cy.resize();
            });
        }

        //fill the graph with data
        console.log("--update elements", this.ID);
        //update the graph and check if the number of elements have changed
        let numElesStart = this.cy.elements().size();
        this.cy.json({elements: instanceData.graphElementsData});
        let numElesEnd = this.cy.elements().size();

        //if we have new elements, we need to relayout the graph, and initialize the event listeners
        if (numElesStart != numElesEnd) {
            console.log("--relayout", this.ID);
            this.cy.layout({
                name: "cose-bilkent",
                // name:"cose",
                animate: false,
                nodeRepulsion: 8000,
                nestingFactor: 0.001,
                gravity: 0.0,
                edgeElasticity: 0.05,
                randomize: true,
            }).run();

            //when we click on a node, we are infecting it
            this.cy.nodes().removeListener('click');
            this.cy.nodes().on("click", e => this.nodeOnClick(e));
        }
        this.animateEvents();
    }

    animateEvents() {
        let instanceData = InstanceData.findOne();

        let animQueue = [];
        let nodesToDisable = new Set();

        let currentTurn = instanceData.experiment.turn;

        let events = instanceData.events;
        let lastInfected = instanceData.nodesLastInfected;

        //for each node and edge in the graph, figure out what it should currently look like.
        let self = this;
        let nodes = this.cy.$("node");
        nodes.forEach(function(node, i, eles) {
            if(node.data("selectedBy")) {
                let ei = node.data("eventIndex");
                let event = events[ei];

                let turnId = event.turn;

                //make the nodes+edges disabled if they've already been animated
                if (turnId !== currentTurn-1) {
                    if(turnId < currentTurn) {
                        if(lastInfected.indexOf(node.id()) !== -1) {
                            // self._animateNodeInfected(node);
                        } else {
                            let hasInfectedOthers = false;
                            node.outgoers("node").forEach(function(node, i, eles) {
                                if(node.data("selectedBy")) {
                                    let ei = node.data("eventIndex");
                                    let event = events[ei];
                                    if(event.event === "infected" && event.turn === currentTurn-1) {
                                        hasInfectedOthers = true;
                                    }
                                }
                            });
                            if(!hasInfectedOthers) {
                                nodesToDisable.add(node.id());
                                // animQueue.push(self._animateNodeDisabled("cleanup", node));
                            }
                        }
                    }
                    return;
                }

                if (event.event === "selected") {
                    animQueue.push(self._animateNodeInfected(event.event, node, STYLE_NODE_SELECTED));
                }
                else if (event.event === "infected") {
                    //create an empty treenode to contain this infection event, this node gets animated further down the tree
                    let animTree = {
                        "type": event.event,
                        "id": node.id(),
                        "infectedById": event.infectedById,
                        "animFunc":undefined,
                        "children": [],
                        };



                    let infectionSource = self.cy.$id(event.infectedById);
                    let infectedEdges = node.edgesWith("#"+event.infectedById);
                    infectedEdges.forEach(function(edge, i, eles) {
                        let type = event.event+":EDGE_INFECTED";
                        let addedBefore = _.find(animTree["children"], (e)=>{
                            let nids = e.id.substring(1).split("_");
                            return edge.id() === "e"+nids[1]+"_"+nids[0]
                        }) !== undefined;

                        let children = [];
                        if(addedBefore) {
                            children = [
                                self._animateNodeInfected(type, node, STYLE_NODE_INFECTED, infectionSource),
                            ];
                        }
                        let treeNode = {
                            "type": type,
                            "id": edge.id(),
                            "infectedById": event.infectedById,
                            "animFunc":(delay=0, completed) => {
                                edge.delay(delay).animate({
                                    style: STYLE_EDGE_INFECTED,
                                    duration: self.animateDuration,
                                    easing: "ease-out-circ",
                                    complete: completed
                                });
                            },
                            "children": children
                        };

                        animTree["children"].push(treeNode);
                    });
                    nodesToDisable.add(infectionSource.id());
                    animQueue.push(animTree);
                }
            }
        });

        let graph = this.cy;
        nodesToDisable.forEach(function(nid) {
            animQueue.push(self._animateNodeDisabled("cleanup", graph.$id(nid)));
        });

        this._animateTreeDFS(animQueue);
    }

    _animateNodeInfected(type, node, style = STYLE_NODE_INFECTED, infectionSource = undefined) {
        let self=this;

        let animTree = {
            "type": type+":NODE_INFECTED",
            "id":node.id(),
            "animFunc":(delay=0, completed) => {
                node.delay(delay, () => {
                    node.addClass("withIm");
                }).animate({
                    style: style,
                    duration: self.animateDuration,
                    easing: "ease-out-circ",
                    complete: completed
                });
            },
            "children": []};

        let disabledSelector = "[selectedBy][infectedBy != '"+node.id()+"']";
        if (infectionSource) {
            disabledSelector += "[id != '"+infectionSource.id()+"']";
        }
        let edgesDisabled = node.edgesWith(disabledSelector);
        edgesDisabled.forEach(function(edge, i, eles) {
            let treeNode = {
                "type": type+":EDGE_DISABLED",
                "id":edge.id(),
                "animFunc":(delay=0, completed) => {
                    edge.delay(delay).animate({
                        style: STYLE_EDGE_DISABLED,
                        duration: self.animateDuration,
                        easing: "ease-out-circ",
                        complete: completed
                    });
                },
                "children": []};

            animTree["children"].push(treeNode);
        });

        let atRiskSelector = "[!selectedBy],[infectedBy = '"+node.id()+"']";
        let edgesAtRisk = node.edgesWith(atRiskSelector);
        edgesAtRisk.forEach(function(edge, i, eles) {
            let treeNode = {
                "type": type+":EDGE_ATRISK",
                "id":edge.id(),
                "animFunc":(delay=0, completed) => {
                    edge.delay(delay).animate({
                        style: STYLE_EDGE_ATRISK,
                        duration: self.animateDuration,
                        easing: "ease-out-circ",
                        complete: completed
                    });
                },
                "children": []};

            animTree["children"].push(treeNode);
        });

        return animTree;
    }
    _animateNodeDisabled(type, node) {
        let self = this;

        let animTree = {
            "type": type+":NODE_DISABLED",
            "id":node.id(),
            "animFunc":(delay=0, completed) => {
                node.delay(delay).animate({
                    style: STYLE_NODE_DISABLED,
                    duration: self.animateDuration,
                    easing: "ease-out-circ",
                    complete: completed
                });
            },
            "children": []};

        let edgesDisabled = node.edgesWith("");
        edgesDisabled.forEach(function(edge, i, eles) {
            let treeNode = {
                "type": type+":EDGE_DISABLED",
                "id":edge.id(),
                "animFunc":(delay=0, completed) => {
                    edge.delay(delay).animate({
                        style: STYLE_EDGE_DISABLED,
                        duration: self.animateDuration,
                        easing: "ease-out-circ",
                        complete: completed
                    });
                },
                "children": []};

            animTree["children"].push(treeNode);
        });

        return animTree;
    }

    _animateTreeDFS(animQueue) {
        animQueue = this._flattenTreeDFS(animQueue);

        let delay = 0;
        let timeline = {};
        let inInfectionMode = false;
        let lastId = "";

        for(let i=0; i<animQueue.length; i++) {
            let treeNode = animQueue[i];
            if (!treeNode.animFunc) {
                continue;
            }

            let types = treeNode.type.split(":");
            let root_type = types[0];

            if (i !== 0 && root_type === "selected" && types[1] === "NODE_INFECTED") {
                delay += this.animateDuration+500;
            }else if (root_type === "infected" && !inInfectionMode) {
                inInfectionMode = true;

                if(i !== 0) {
                    delay += this.animateDuration*3;
                    timeline[lastId][timeline[lastId].length-1].completed = () => {
                        $("#cy").css("backgroundColor","#c5dfcb");
                    };
                }

            }else if (root_type === "infected" && types[1] === "NODE_INFECTED") {
                delay += this.animateDuration;
            }

            if(!(treeNode.id in timeline)) {
                timeline[treeNode.id] = [{
                    time:delay,
                    treeNode:treeNode,
                    completed:undefined,
                },];
            }else {
                timeline[treeNode.id].push({
                    time:delay,
                    treeNode:treeNode,
                    completed:undefined,
                });
            }

            if(treeNode.id.startsWith("e")) {
                let nids = treeNode.id.substring(1).split("_");
                let nid = "e"+nids[1]+"_"+nids[0];
                if (nid === lastId) {
                    // delay -= this.animateDuration;
                }
                delay += 0;
            }else{
                delay += this.animateDuration;
            }
            lastId = treeNode.id;
        }

        timeline[lastId][timeline[lastId].length-1].completed = () => {
            $("#cy").css("backgroundColor","#FFF");
        };

        //use the timeline to calculate the correct delay to add to the nodes animation
        for(let id in timeline) {
            let animTimes = timeline[id];

            let lastTime = 0;
            for (let i=0; i<animTimes.length; i++) {
                let animTime = animTimes[i];
                let newDelay = animTime.time - lastTime;
                newDelay = Math.max(newDelay - this.animateDuration, 0);
                animTime.treeNode.animFunc(newDelay, animTime.completed);
                lastTime = animTime.time;
            }
            let newDelay = delay - lastTime;
            this.cy.$id(id).delay(newDelay);
        }

        let allElements = this.cy.elements();
        allElements.forEach(function(e) {
            if (!(e.id() in timeline)) {
                e.delay(delay);
            }
        });


        // this.cy.animate({
        //     style: {'background-color':"#FFFFFF"},
        //     duration: self.animateDuration,
        //     easing: "ease-out-circ",
        // });
        return delay;
    }

    _flattenTreeDFS(animQueue) {
        let ORDER = {
            "selected":0,
            "infected":1,
            "cleanup":2
        };

        sortFunc = function(o) {
            let types = o.type.split(":");
            let root_type = types[0];
            return ORDER[root_type];
        };

        animQueue = _.sortBy(animQueue, sortFunc);

        let nodes = [];

        for(let i=0; i<animQueue.length; i++) {
            let rootNode = animQueue[i];
            nodes.push(rootNode);

            let childStack = [];
            if (rootNode.children) {
                childStack.push.apply(childStack, rootNode.children);
            }

            while (childStack.length > 0) {
                let childNode = childStack.shift();
                nodes.push(childNode);

                let children = childNode.children;
                if (children.length > 0) {
                    //let sortedChildren = _.sortBy(childNode.children, sortFunc);

                    childStack.unshift.apply(childStack, childNode.children);
                }
            }
        }

        return nodes;
    }


    nodeOnClick(e) {
        console.log("node clicked", this.ID);
        let node = e.target;

        if (this.isMyTurn() && this.seedsRemaining() && !node.data("selectedBy")) {
            Meteor.call("progressTurn", node.id());
            return true;
        }
        return false;
    }

    _destroy() {
        console.log("_destroy", this.ID);
        if(typeof this.cy !== "undefined") {
            this.cy.destroy();
            delete this.cy;
            delete this.cycontainer;
        }
    }

    static destroy() {
        console.log("static destroy");
        if(InfluenceMaximisationGraph[_singleton]) {
            InfluenceMaximisationGraph[_singleton]._destroy();
            delete InfluenceMaximisationGraph[_singleton];
        }
    }

    spreadOfUser(userId) {
        return this.cy.nodes('[selectedBy="' + userId + '"]').size();
    }

    isMyTurn() {
        let instanceData = InstanceData.findOne();

        if (instanceData) {
            let turnIndex = instanceData.experiment.turn % instanceData.experiment.turnOrder.length;
            let turnId = instanceData.experiment.turnOrder[turnIndex];
            return Meteor.userId() === turnId;
        }
        return false;
    }


    seedsRemaining() {
        let instanceData = InstanceData.findOne();

        if (instanceData) {
            let totalSeeds = instanceData.experiment.seedsRequired;
            let turnCount = instanceData.experiment.turn;

            return Math.max(totalSeeds - turnCount, 0);
        }

        return 0;
    }
}

export class TutorialInfluenceMaximisationGraph extends InfluenceMaximisationGraph {
    constructor(singletonToken, elementId, options) {
        super(singletonToken, elementId);

        this.options = options;

        console.log("tut constructor", this.ID);
    }

    static getInstance(containerId, options) {
        if(!InfluenceMaximisationGraph[_singleton]) {
            InfluenceMaximisationGraph[_singleton] = new TutorialInfluenceMaximisationGraph(_singleton, containerId, options);
        }
        return InfluenceMaximisationGraph[_singleton];
    }

    nodeOnClick(e) {
        let allowed = super.nodeOnClick(e);

        console.log("tut node clicked", this.ID);
        if(this.waitOnClick && allowed && this.intro._currentStep) {
            this.intro.nextStep();
        }
    }

    _destroy() {
        super._destroy();
        if(typeof this.intro !== "undefined") {
            this.intro.exit(true);
            delete this.intro;
        }
        console.log("tut _destroy", this.ID);
    }

    setNextButtonDisabled(disabled) {
        if(disabled)
            $('.introjs-nextbutton').hide();
        else
            $('.introjs-nextbutton').show();
    }

    updateGraph(instanceData) {
        super.updateGraph(instanceData);

        //now that we have instance data, lets create and start the tutorial
        if(typeof this.intro === "undefined") {
            this.intro = introJs();
            this.intro.setOptions(this.options);

            this.intro.infMax = this;
            this.intro.onafterchange(function(){
                console.log("tut intro change", this.infMax.ID);

                //for each step, lets see if there's things we need to toggle
                let curr_step = this._introItems[this._currentStep];
                if(curr_step.disableNext) {
                    this.infMax.setNextButtonDisabled(true);
                } else {
                    this.infMax.setNextButtonDisabled(false);
                }

                this.infMax.waitOnClick=curr_step.waitOnClick;
            });

            this.intro.start();
        }
    }
}