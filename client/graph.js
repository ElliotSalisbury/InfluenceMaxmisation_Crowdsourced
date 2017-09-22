Template.graph.onRendered(function() {
    //run whenever a reactive var changes
    this.autorun(function() {
        if(typeof infMaxGraph !== "undefined") {
            infMaxGraph.updateGraph();
        }
    });
});

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
                $("#exitSurvey").prop("disabled", false);
            } else {
                $("#exitSurvey").prop("disabled", true);
            }

            return remaining;
        }
        return 0;
    }
});

Template.graph.events({
    'click button#exitSurvey': function () {
        if(typeof infMaxGraph !== "undefined") {
            infMaxGraph.done();
        }
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

            let spread = 0;
            if(typeof infMaxGraph !== "undefined") {
                spread = infMaxGraph.spreadOfUser(userId);
            }

            scoreboard.push({id:userId, spread:spread});
        }
        return scoreboard;
    }
});