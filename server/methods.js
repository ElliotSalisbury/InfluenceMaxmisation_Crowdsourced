// var cytoscape = require('cytoscape');
var InfMax = require("./infmax/infmax");

Meteor.methods({
    goToNext: function() {
        var exp = TurkServer.Instance.currentInstance();
        exp.teardown();
    },
    goToExitSurvey: function() {
        let ast = TurkServer.Assignment.currentAssignment();
        ast.setWorkerData({"goToExitSurvey": true});
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
                if(id === selectedId && !graphElementsData[i].data.selectedBy) {
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

        if(selectedId) {
            instanceData = InstanceData.findOne();
            let graph = InfMax.dataToGraph(instanceData.graphElementsData);

            let epidemicModel = new InfMax.spread.IndependentCascadeModel(graph);
            let infected = graph.nodes("[selectedBy]").toArray();
            epidemicModel.setInfectedNodes(infected);

            let selectedNode = graph.$id(selectedId);
            epidemicModel.infectNode(selectedNode);

            let done = false;
            while (!done) {
                let newNodes = epidemicModel.runStep();
                if (newNodes.length === 0) {
                    done = true;
                }

                for(let i=0; i<newNodes.length; i++) {
                    newNodes[i].data("selectedBy", currentUser);
                }
            }
            let graphData = InfMax.graphToData(graph);
            InstanceData.upsert({_id: instanceData._id},
                {
                    $set: {"graphElementsData":graphData}
                });
        }


        Meteor.call("checkComputersTurn");
        // Meteor.call("runSpread");
    },

    checkComputersTurn: function() {
        var instanceData = InstanceData.findOne();

        //are we allowed to play? check whose turn it is, and whether we have seeds remaining
        let seedsRemaining = instanceData.experiment.seedsRequired - instanceData.experiment.seedsChosen;

        //whose turn is it
        var turnIndex = instanceData.experiment.turnIndex;
        var usersTurn = instanceData.experiment.turnOrder[turnIndex];

        if (usersTurn === "COMPUTER" && seedsRemaining > 0) {
            var graph = InfMax.dataToGraph(instanceData.graphElementsData);
            var chosenId = InfMax.imm_algs.highestDegree(graph);

            Meteor.call("progressTurn", chosenId);
        }
    },

    runSpread: function() {
        var instanceData = InstanceData.findOne();

        //check if we need to run the spread algorithm
        if(instanceData.experiment.seedsChosen === instanceData.experiment.seedsRequired) {
            let graph = InfMax.dataToGraph(instanceData.graphElementsData);

            let infected = graph.nodes("[selectedBy]").toArray();

            let epidemicModel = new InfMax.spread.IndependentCascadeModel(graph);
            epidemicModel.infectNodes(infected);

            let done = false;
            while (!done) {
                let newNodes = epidemicModel.runStep();
                if (newNodes.length === 0) {
                    done = true;
                }
            }

            let graphData = InfMax.graphToData(graph);
            InstanceData.upsert({_id: instanceData._id},
                {
                    $set: {"graphElementsData":graphData}
                });
        }

        //TODO: add the bonus payment based on spread
        // var assts = TurkServer.Instance.users();
        // var asst = TurkServer.Assignment.currentAssignment();
        // asst.addPayment(0.1);
    },
});