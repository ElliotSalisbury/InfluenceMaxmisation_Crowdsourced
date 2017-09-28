let cytoscape = require('cytoscape');
let bilkent = require('cytoscape-cose-bilkent');
cytoscape.use( bilkent );

let introJs = require('./intro.js').introJs;

const _singleton = Symbol();

export class InfluenceMaximisationGraph {
    constructor(singletonToken, containerId) {
        if(singletonToken !== _singleton) {
            throw "Cannot construct singleton";
        }

        this.ID = Date.now();
        let self = this;
        this.dotted_thresh = 0.2;
        this.thick_thresh = 0.3;

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

            let self = this; //TODO i dont like this, remove it somehow
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
                        selector: 'node[selectedBy]',
                        style: {
                            'background-image': function(ele) {
                                return "url(\""+InstanceData.findOne().experiment.turnLogos[ele.data('selectedBy')]+"\")";
                            },
                            'background-fit': 'contain',
                            'width': "50%",
                            'height': "50%",
                            'background-color': function(ele){
                                return InstanceData.findOne().experiment.turnColors[ele.data('selectedBy')];
                            }
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': function( ele ){
                                if (ele.data('weight') < self.thick_thresh) {
                                    return 2;
                                } else {
                                    return 6;
                                }
                            },
                            'line-color': '#eca41a',
                            'line-style': function( ele ){return ele.data('weight') < self.dotted_thresh ? 'dashed' : 'solid'; },
                        }
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
        this.cy.json({ elements: instanceData.graphElementsData });
        let numElesEnd = this.cy.elements().size();

        //if we have new elements, we need to relayout the graph, and initialize the event listeners
        if (numElesStart != numElesEnd) {
            console.log("--relayout", this.ID);
            this.cy.layout({
                name:"cose-bilkent",
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
            let seedsChosen = instanceData.experiment.seedsChosen;

            return totalSeeds - seedsChosen;
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