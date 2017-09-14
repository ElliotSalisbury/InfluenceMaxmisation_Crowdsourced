/**
 * Assigns everyone who joins in a separate group
 * Anyone who is done with their instance goes into the exit survey
 * @type {{}}
 */
TurkServer.Assigners.GraphPairAssigner = class extends TurkServer.Assigner {

    // This function gets run when the user enters the lobby
    userJoined(asst) {
        //have they already perfomed an instance(experiment)?
        if (asst.getInstances().length > 0) {
            // Take user out of lobby, send user to exit survey
            this.lobby.pluckUsers([asst.userId]);
            asst.showExitSurvey();
        }else if (Meteor.settings.public.turkserver.autoLobby == true) {
            //singleplayer, instantly assign to experiment, make sure autoLobby = true in settings.json
            const treatments = this.batch.getTreatments() || [];
            var inst = this.assignToNewInstance([asst], treatments);
        }
    }

    //multiplayer, take users from the lobby, make sure autoLobby = false in settings.json
    userStatusChanged() {
        usersInLobby = this.lobby.getAssignments({status:true});
        if (usersInLobby.length < 2) {
            console.log(usersInLobby.length + " users in the lobby");
            return;
        }

        // filter out the users who already performed an experiment, they're going to be routed to the exit survey anyway
        usersToAdd = _.filter(usersInLobby, function(asst) {
            return asst.getInstances().length === 0;
        });

        //randomly take 2 users
        usersToAdd = _.take(usersToAdd, 2);

        const treatments = this.batch.getTreatments() || [];
        var inst = this.assignToNewInstance(usersToAdd, treatments);
    }
};