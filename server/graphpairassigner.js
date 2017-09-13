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
        }else {
            const treatments = this.batch.getTreatments() || [];
            var inst = this.assignToNewInstance([asst], treatments);
        }
    }
};