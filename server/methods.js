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
        //if we don't have a valid selectedId, then we cannot continue
        if (!selectedId) {
            return;
        }

        let instanceData = InstanceData.findOne();

        //get the current turn and the current user
        let currentTurn = instanceData.experiment.turn;
        let currentTurnIndex = currentTurn % instanceData.experiment.turnOrder.length;
        let currentUser = instanceData.experiment.turnOrder[currentTurnIndex];

        //loop through the nodes and find the selected one
        let graphElementsData = instanceData.graphElementsData;
        let nodeFound = false;
        for(let i=0; i<graphElementsData.length; i++) {
            let id = graphElementsData[i].data.id;
            if(id === selectedId) {
                //this node has already been selected, invalid move, we cannot continue
                if(graphElementsData[i].data.selectedBy) {
                    return;
                }

                graphElementsData[i].data.selectedBy = currentUser;
                graphElementsData[i].data.eventIndex = instanceData.events.length;
                nodeFound = true;
                break;
            }
        }
        if (!nodeFound) {
            return; //we didnt find the selectedId in our graph, invalid move, we cannot continue
        }

        //create an event for selecting this node
        let turnEvents = [];
        let event = {
            "event":"selected",
            "nodeId":selectedId,
            "turn":currentTurn,
            "userId":currentUser,
            "datetime":Date.now()
        };
        turnEvents.push(event);

        //after selecting a node, run the influence spread
        let graph = InfMax.dataToGraph(graphElementsData);

        //get the node selected node, and infect it
        let nodesLastInfected = instanceData.nodesLastInfected || [];
        let newNodesInfected = [];
        for(let i=0; i<nodesLastInfected.length; i++) {
            //create a model that spreads influence, and populate it with the already infected nodes (those already influenced from the previous turns)
            let epidemicModel = new InfMax.spread.IndependentCascadeModel(graph);
            let infected = graph.nodes("[selectedBy]").toArray();
            epidemicModel.setInfectedNodes(infected);

            let infectedNode = graph.$id(nodesLastInfected[i]);
            let infectorUserId = infectedNode.data("selectedBy");

            epidemicModel.infectNode(infectedNode);
            let newNodes = epidemicModel.runStep();

            for(let i=0; i<newNodes.length; i++) {
                newNodesInfected.push(newNodes[i].id());

                newNodes[i].data("selectedBy", infectorUserId);
                newNodes[i].data("eventIndex", instanceData.events.length + turnEvents.length);
                let event = {
                    "event":"infected",
                    "nodeId":newNodes[i].id(),
                    "turn":currentTurn,
                    "userId":infectorUserId,
                    "datetime":Date.now()
                };
                turnEvents.push(event);
            }
        }
        //add our selected node to the end of the queue
        newNodesInfected.push(selectedId);

        graphElementsData = InfMax.graphToData(graph);

        //construct the object we're going to use to update the DB
        let dbUpdateObj = {
            $set:{
                "graphElementsData":graphElementsData, // we're setting the whole graphdata object to the new one
                "nodesLastInfected":newNodesInfected,
            },
            $inc:{
                "experiment.turn":1, // increment the turn by 1
                "experiment.seedsChosen":1 // increment seeds chosen by 1 (how is this diff to turn?)
            },
            $push:{
                "events" : {
                    $each : turnEvents //push each of the turnEvents into the instanceData events array
                }
            }
        };

        //store the data into this experiment's InstanceData instance
        InstanceData.upsert({_id: instanceData._id}, dbUpdateObj);

        Meteor.call("checkComputersTurn");
        // Meteor.call("runSpread");
    },

    checkComputersTurn: function() {
        let instanceData = InstanceData.findOne();

        //are we allowed to play? check whose turn it is, and whether we have seeds remaining
        let seedsRemaining = instanceData.experiment.seedsRequired - instanceData.experiment.seedsChosen;

        //whose turn is it
        let currentTurn = instanceData.experiment.turn;
        let currentTurnIndex = currentTurn % instanceData.experiment.turnOrder.length;
        let currentUser = instanceData.experiment.turnOrder[currentTurnIndex];

        if (currentUser.indexOf("COMPUTER") !== -1 && seedsRemaining > 0) {
            let graph = InfMax.dataToGraph(instanceData.graphElementsData);
            // let chosenId = InfMax.imm_algs.highestDegree(graph);
            let chosenId = InfMax.imm_algs.imm(graph, seedsRemaining);

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