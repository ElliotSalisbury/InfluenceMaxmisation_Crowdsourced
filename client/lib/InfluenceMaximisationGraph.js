let cytoscape = require('cytoscape');
let bilkent = require('cytoscape-cose-bilkent');
cytoscape.use( bilkent );

let introJs = require('./intro.js').introJs;

export class InfluenceMaximisationGraph {
    constructor(elementId) {
        this.ID = Date.now();
        let self = this;
        this.dotted_thresh = 0.2;
        this.thick_thresh = 0.3;

        let cycontainer = document.getElementById(elementId);
        this.cy = cytoscape({
            container: cycontainer,

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
        let updated = false;
        cycontainer.addEventListener("mouseleave", function(){
            self.cy.resize();
            updated = false;
        });
        cycontainer.addEventListener("mousemove", function(){
            if(!updated) {
                self.cy.resize();
                updated = true;
            }
        });
        cycontainer.addEventListener("click", function(){
            self.cy.resize();
        });

        //fill the graph with data
        this.updateGraph();
    }

    updateGraph() {
        //check that we have instanceData
        let instanceData = InstanceData.findOne();
        if (instanceData) {
            //update the graph and check if the number of elements have changed
            let numElesStart = this.cy.elements().size();
            this.cy.json({ elements: instanceData.graphElementsData });
            let numElesEnd = this.cy.elements().size();

            //if we have new elements, we need to relayout the graph, and initialize the event listeners
            if (numElesStart != numElesEnd) {

                this.cy.layout({
                    name:"cose-bilkent",
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

                return true;
            }
        }
        return false;
    }

    nodeOnClick(e) {
        console.log("clicked");
        var node = e.target;

        if (this.isMyTurn() && this.seedsRemaining() && !node.data("selectedBy")) {
            Meteor.call("progressTurn", node.id());
            return true;
        }
        return false;
    }

    done() {

    }

    spreadOfUser(userId) {
        this.updateGraph();
        return this.cy.nodes('[selectedBy="' + userId + '"]').size();
    }

    isMyTurn() {
        let instanceData = InstanceData.findOne();

        if (instanceData) {
            let turnId = instanceData.experiment.turnOrder[instanceData.experiment.turnIndex];
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
    constructor(elementId, options) {
        super(elementId);

        this.intro = introJs();
        this.options = options;
        this.intro.setOptions(this.options);
        $('.introjs-bullets').hide();
        $('.introjs-skipbutton').hide();
        $('.introjs-prevbutton').hide();

        this.intro.infMax = this;
        this.intro.onafterchange(function(){
            console.log("intro change");
            console.log(this.infMax.ID);

            //for each step, lets see if there's things we need to toggle
            let curr_step = this._introItems[this._currentStep];
            if(curr_step.disableNext) {
                this.infMax.setNextButtonDisabled(true);
            } else {
                this.infMax.setNextButtonDisabled(false);
            }

            if(curr_step.waitOnClick) {
                this.infMax.waitOnClick=true;
            } else {
                this.infMax.waitOnClick=false;
            }
        });

        let instanceData = InstanceData.findOne();

        if (instanceData) {
            $('.introjs-bullets').hide();
            $('.introjs-skipbutton').hide();
            $('.introjs-prevbutton').hide();
            this.intro.start();
        }
    }

    nodeOnClick(e) {
        let allowed = super.nodeOnClick(e);

        console.log("node clicked");
        console.log(this.ID);
        if(this.waitOnClick && allowed && this.intro._currentStep) {
            this.intro.nextStep();
        }
    }

    done() {
        this.intro.exit(true);
    }

    setNextButtonDisabled(disabled) {
        if(disabled)
            $('.introjs-nextbutton').hide();
        else
            $('.introjs-nextbutton').show();
    }

    updateGraph() {
        let updated = super.updateGraph();

        if(updated && typeof this.intro !== "undefined") {
            $('.introjs-bullets').hide();
            $('.introjs-skipbutton').hide();
            $('.introjs-prevbutton').hide();
            this.intro.start();
        }
    }
}