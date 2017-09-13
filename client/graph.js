var cytoscape = require('cytoscape');

Template.experiment.onRendered(function() {
    //initialize the graph
    cy = cytoscape({
        container: document.getElementById('cy'),

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
                    'background-color': function(ele){return InstanceData.findOne().experiment.turnColors[ele.data('selectedBy')];}
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': function( ele ){return 2+((ele.data('weight')-0.5)/(0.8-0.5))*5; },
                    'line-color': '#eca41a'
                }
            }
        ],

        userZoomingEnabled: false,
        userPanningEnabled:false,
        autoungrabify:true
    });
});

//run whenever a reactive var changes
Tracker.autorun(function() {
    //check that we have instanceData
    var instanceData = InstanceData.findOne();
    if (instanceData) {
        //update the graph and check if the number of elements have changed
        var numElesStart = cy.elements().size();
        cy.json({ elements: instanceData.graphElementsData });
        var numElesEnd = cy.elements().size();

        //if we have new elements, we need to relayout the graph, and initialize the event listeners
        if (numElesStart != numElesEnd) {

            cy.layout({
                name:"cose",
                animate: false
            }).run();

            //when we click on a node, we are infecting it
            cy.nodes().removeListener('click');
            cy.nodes().on("click", nodeOnClick);
        }
    }
});

function nodeOnClick(e) {
    console.log("clicked");
    var node = e.target;

    if (isMyTurn() && seedsRemaining()) {
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

function mySpread() {
    var instanceData = InstanceData.findOne();

    if (instanceData) {
        var totalSeeds = instanceData.experiment.seedsRequired;
        var seedsChosen = instanceData.experiment.seedsChosen;

        return totalSeeds - seedsChosen;
    }

    return cy.nodes('[selectedBy="'+Meteor.user()+'"]').size();
}

Template.experiment.helpers({
    whose_turn:function() {
        var instanceData = InstanceData.findOne();

        if (instanceData) {
            var turnId = instanceData.experiment.turnOrder[instanceData.experiment.turnIndex];

            if (isMyTurn()) {
                turnId = "Yours";
            }
            return turnId;
        }
        return "undefined";
    },
    seeds_remaining:function() {
        return seedsRemaining();
    },
    spread:function() {
        return mySpread();
    }
});

Template.experiment.events({
    'click button#exitSurvey': function () {
        // go to the exit survey
        Meteor.call('goToExitSurvey');
    }
});