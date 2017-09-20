/**
 * Assigns everyone who joins in a separate group
 * Anyone who is done with their instance goes into the exit survey
 * @type {{}}
 */
TurkServer.Assigners.GraphPairAssigner = class extends TurkServer.Assigner {
    constructor(tutorialStages) {
        super();
        this.tutorialStages = tutorialStages;
    }

    // This function gets run when the user enters the lobby
    userJoined(asst) {

        //lets check what the user has completed so far (#tutorials, #experiments)
        let instances = asst.getInstances();
        let tutorialsCompleted = 0;
        let experimentsCompleted = 0;
        instances.forEach(function (inst) {
            //get the treatments applied to each instance this worker has participated in
            let instance = TurkServer.Instance.getInstance(inst.id);
            let inst_treatments = instance.getTreatmentNames();

            //instances can have multiple treatments, so loop through them, if one of them says tutorial, then we know this instance was a tutorial
            let is_tutorial_inst = false;
            for (let i=0; i<inst_treatments.length; i++) {
                let treatment_name = inst_treatments[i];
                if (treatment_name.indexOf("tutorial") >= 0) {
                    is_tutorial_inst = true;
                    break;
                }
            }

            //if its a tutorial add up, otherwise it mustve been an experiment
            if(is_tutorial_inst) {
                tutorialsCompleted += 1;
            } else {
                experimentsCompleted += 1;
            }
        });

        //do they still have tutorials to complete? send them to the next tutorial treatment
        if (tutorialsCompleted < this.tutorialStages.length) {
            this.assignToNewInstance([asst], [this.tutorialStages[tutorialsCompleted]]);
        //have they already perfomed an experiment, then let them quit
        } else if (experimentsCompleted > 0) {
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
