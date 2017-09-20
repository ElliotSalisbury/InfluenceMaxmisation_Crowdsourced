let cytoscape = require('cytoscape');
let bilkent = require('cytoscape-cose-bilkent');
cytoscape.use( bilkent );

Template.graph.onRendered(function() {
    var dotted_thresh = 0.2;
    var thick_thresh = 0.3;

    //initialize the graph
    let cycontainer = document.getElementById('cy');
    cy = cytoscape({
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
                    'background-image': 'url("/img/virus.png")',
                    'background-fit': 'contain',
                    'width': "50%",
                    'height': "50%",
                    'background-color': function(ele){return InstanceData.findOne().experiment.turnColors[ele.data('selectedBy')];}
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': function( ele ){
                            if (ele.data('weight') < thick_thresh) {
                                return 2;
                            } else {
                                return 6;
                            }
                        },
                    'line-color': '#eca41a',
                    'line-style': function( ele ){return ele.data('weight') < dotted_thresh ? 'dashed' : 'solid'; },
                }
            }
        ],

        userZoomingEnabled: false,
        userPanningEnabled:false,
        autoungrabify:true
    });

    //fill the graph with data
    updateGraph();

    //we need to tell cy to update incase the dom has changed, this is fairly hacky
    let updated = false;
    cycontainer.addEventListener("mouseleave", function(){
        console.log("resize");
        cy.resize();
        updated = false;
    });
    cycontainer.addEventListener("mousemove", function(){
        if(!updated) {
            console.log("resize");
            cy.resize();
            updated = true;
        }
    });
    cycontainer.addEventListener("click", function(){
        cy.resize();
    });
});

//run whenever a reactive var changes
Tracker.autorun(function() {
    updateGraph();
});

function updateGraph() {
    //check that we have instanceData
    var instanceData = InstanceData.findOne();
    if (instanceData && typeof cy !== 'undefined') {
        //update the graph and check if the number of elements have changed
        var numElesStart = cy.elements().size();
        cy.json({ elements: instanceData.graphElementsData });
        var numElesEnd = cy.elements().size();

        //if we have new elements, we need to relayout the graph, and initialize the event listeners
        if (numElesStart != numElesEnd) {

            cy.layout({
                name:"cose-bilkent",
                animate: false,
                nodeRepulsion: 8000,
                nestingFactor: 0.001,
                gravity: 0.0,
                edgeElasticity: 0.05,
                randomize: true,
            }).run();

            //when we click on a node, we are infecting it
            cy.nodes().removeListener('click');
            cy.nodes().on("click", nodeOnClick);
        }
    }
}

function nodeOnClick(e) {
    console.log("clicked");
    var node = e.target;

    if (isMyTurn() && seedsRemaining() && !node.data("selectedBy")) {
        Meteor.call("progressTurn", node.id());
    }
}

function isMyTurn() {
    var instanceData = InstanceData.findOne();

    if (instanceData) {
        var turnId = instanceData.experiment.turnOrder[instanceData.experiment.turnIndex];
        return Meteor.userId() === turnId;
    }
    return false;
}

function seedsRemaining() {
    var instanceData = InstanceData.findOne();

    if (instanceData) {
        var totalSeeds = instanceData.experiment.seedsRequired;
        var seedsChosen = instanceData.experiment.seedsChosen;

        return totalSeeds - seedsChosen;
    }

    return 0;
}

function spread(userId) {
    return cy.nodes('[selectedBy="' + userId + '"]').size();
}

Template.graph.helpers({
    whose_turn:function() {
        let instanceData = InstanceData.findOne();

        if (instanceData) {
            if (seedsRemaining() <= 0) {
                return "Game Over";
            }

            let turnId = instanceData.experiment.turnOrder[instanceData.experiment.turnIndex];
            if (isMyTurn()) {
                turnId = "Yours";
            }
            return turnId;
        }
        return "undefined";
    },
    seeds_remaining:function() {
        return seedsRemaining();
    }
});

Template.graph.events({
    'click button#exitSurvey': function () {
        // go to the exit survey
        Meteor.call('goToExitSurvey');
    }
});

Template.scoreboard.helpers({
    scoreboard:function() {
        var instanceData = InstanceData.findOne();

        if (!instanceData) return [];

        var scoreboard = [];
        for (var i in instanceData.experiment.turnOrder) {
            var userId = instanceData.experiment.turnOrder[i];
            scoreboard.push({id:userId, spread:spread(userId)});
        }
        return scoreboard;
    }
});