let InfMax = require("./lib/InfluenceMaximisationGraph");

Template.graph.helpers({
    whose_turn:function() {
        let instanceData = InstanceData.findOne();

        if (instanceData && typeof infMaxGraph !== "undefined") {
            if (infMaxGraph.seedsRemaining() <= 0) {
                return "Game Over";
            }

            let turnId = instanceData.experiment.turnOrder[instanceData.experiment.turnIndex];
            if (infMaxGraph.isMyTurn()) {
                turnId = "Yours";
            }
            return turnId;
        }
        return "undefined";
    },
    seeds_remaining:function() {
        if(typeof infMaxGraph !== "undefined") {
            let remaining = infMaxGraph.seedsRemaining();

            if(remaining <= 0) {
                $("#continue").prop("disabled", false);
                $("#end").prop("disabled", false);
            } else {
                $("#continue").prop("disabled", true);
                $("#end").prop("disabled", true);
            }

            return remaining;
        }
        return 0;
    }
});

Template.graph.events({
    'click button#continue': function () {
        InfMax.InfluenceMaximisationGraph.destroy();
        // go to the exit survey
        Meteor.call('goToNext');
    },
    'click button#end': function () {
        InfMax.InfluenceMaximisationGraph.destroy();
        // go to the exit survey
        Meteor.call('goToExitSurvey');
    }
});

Template.scoreboard.helpers({
    scoreboard:function() {
        let instanceData = InstanceData.findOne();

        if (!instanceData) return [];

        let scoreboard = [];
        for (let i in instanceData.experiment.turnOrder) {
            let userId = instanceData.experiment.turnOrder[i];

            let spread = 0;
            instanceData.graphElementsData.forEach(function(ele) {
                if (ele.data.selectedBy === userId)
                    spread += 1;
            });

            let logoUrl = instanceData.experiment.turnLogos[userId];

            scoreboard.push({id:userId, spread:spread, logourl:logoUrl});
        }
        return scoreboard;
    }
});