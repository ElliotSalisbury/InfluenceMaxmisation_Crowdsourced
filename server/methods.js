var cytoscape = require('cytoscape');

Meteor.methods({
    goToExitSurvey: function() {
        var exp = TurkServer.Instance.currentInstance();
        exp.teardown();
    },

    progressTurn: function(selectedId) {
        var instanceData = InstanceData.findOne();

        //update the turn
        var currentTurnIndex = instanceData.experiment.turnIndex;
        var currentUser = instanceData.experiment.turnOrder[currentTurnIndex];

        var nextIndex = (currentTurnIndex + 1) % instanceData.experiment.turnOrder.length;

        var dbUpdateObj = {
            "experiment.turnIndex": nextIndex,
        };

        //if we have a selectedId, we need to change that nodes data
        if (selectedId) {
            var graphElementsData = instanceData.graphElementsData;
            for(var i=0; i<graphElementsData.length; i++) {
                var id = graphElementsData[i].data.id;
                if(id === selectedId && !graphElementsData[i].data.selected) {
                    graphElementsData[i].data.selectedBy = currentUser;

                    dbUpdateObj["graphElementsData"] = graphElementsData;

                    //update the number of chosen seeds
                    dbUpdateObj["experiment.seedsChosen"] = instanceData.experiment.seedsChosen + 1;

                    break;
                }
            }

        }

        //store the data into this experiment's InstanceData instance
        InstanceData.upsert({_id: instanceData._id},
            {
                $set: dbUpdateObj
            });

        Meteor.call("checkComputersTurn");
        Meteor.call("runSpread");
    },

    checkComputersTurn: function() {
        var instanceData = InstanceData.findOne();

        //update the turn
        var turnIndex = instanceData.experiment.turnIndex;
        var usersTurn = instanceData.experiment.turnOrder[turnIndex];

        if (usersTurn === "COMPUTER") {
            var graphElementsData = instanceData.graphElementsData;
            var chooseFrom = [];
            for(var i=0; i<graphElementsData.length; i++) {
                if (graphElementsData[i].group==="nodes" && !graphElementsData[i].data.selectedBy) {
                    chooseFrom.push(i);
                }
            }

            if (chooseFrom.length > 0) {
                var randomId = Math.floor(Math.random() * chooseFrom.length);
                var id = graphElementsData[chooseFrom[randomId]].data.id;
                Meteor.call("progressTurn", id);
            }
        }
    },

    runSpread: function() {
        var instanceData = InstanceData.findOne();

        //check if we need to run the spread algorithm
        if(instanceData.experiment.seedsChosen === instanceData.experiment.seedsRequired) {
            var cy = cytoscape({
                elements: instanceData.graphElementsData
            });

            var infected = cy.nodes("[selectedBy]").toArray();
            while (infected.length > 0) {
                var node = infected.shift();
                var selectedBy = node.data("selectedBy");

                var edges = node.outgoers("edge");
                edges.forEach(function(edge, i, eles) {
                    var weight = edge.data("weight");
                    var target = edge.target();

                    if (!target.data("selectedBy") && Math.random() < weight) {
                        target.data("selectedBy", selectedBy);
                        infected.push(target);
                    }
                });
            }

            var graphData = [];
            cy.elements().jsons().forEach(function(ele, i, eles){
                graphData.push({
                    group:ele.group,
                    data: ele.data
                });
            });

            InstanceData.upsert({_id: instanceData._id},
                {
                    $set: {"graphElementsData":graphData}
                });
        }
    },
});