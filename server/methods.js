// var cytoscape = require('cytoscape');
var InfMax = require("./infmax/infmax");

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
            var graph = InfMax.dataToGraph(instanceData.graphElementsData);
            var chosenId = InfMax.imm_algs.highestDegree(graph);

            Meteor.call("progressTurn", chosenId);
        }
    },

    runSpread: function() {
        var instanceData = InstanceData.findOne();

        //check if we need to run the spread algorithm
        if(instanceData.experiment.seedsChosen === instanceData.experiment.seedsRequired) {
            var graph = InfMax.dataToGraph(instanceData.graphElementsData);

            var spread = new InfMax.spread.IndependentCascadeModel(graph);
            spread.spread();

            var graphData = InfMax.graphToData(graph);
            InstanceData.upsert({_id: instanceData._id},
                {
                    $set: {"graphElementsData":graphData}
                });
        }
    },
});