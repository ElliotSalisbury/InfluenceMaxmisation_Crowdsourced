import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
let InfMax = require("./lib/InfluenceMaximisationGraph");

// import './main.html';

//redirects the client to appropriate page depending on the clients TurkServer state
Tracker.autorun(function() {
    if (TurkServer.inExperiment()) {
        Router.go('/experiment');
    } else if (TurkServer.inExitSurvey()) {
        Router.go('/survey');
    }
});
Tracker.autorun(function() {
    //subscribe to instance data
    var group = TurkServer.group();
    if (group == null) return;

    // Force meteor to re-subscribe with a different group
    let instanceDataHandle = Meteor.subscribe("instanceData", group, () => {
        console.log("subscribed to instance Data");
        Tracker.autorun(() => {
            console.log("autorun");
            let instanceData = InstanceData.findOne();
            if (instanceData && typeof infMaxGraph !== "undefined") {
                infMaxGraph.updateGraph(instanceData);
            }
        });
    });
});


// #############################################
// code below handles the template logic
// #############################################

Template.experiment.helpers({
    currentTemplate: function () {
        var treatments = TurkServer.treatment().treatments;


        if(treatments.indexOf("tutorial_1") >= 0) {
            return "tutorial_1";
        }else if(treatments.indexOf("tutorial_2") >= 0) {
            return "tutorial_2";
        }else if(treatments.indexOf("tutorial_3") >= 0) {
            return "tutorial_3";
        }
        return "main_game";
    }
});

Template.main_game.onRendered(function() {
    infMaxGraph = InfMax.InfluenceMaximisationGraph.getInstance("cy");
});
Template.main_game.onDestroyed(function() {
    InfMax.InfluenceMaximisationGraph.destroy();
});

Template.survey.events({
    'submit .survey': function (e) {
        e.preventDefault();
        var results = {confusing: e.target.confusing.value,
            feedback: e.target.feedback.value}
        TurkServer.submitExitSurvey(results);
    }
});