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

    //subscribe to instance data
    var group = TurkServer.group();
    if (group == null) return;

    // Force meteor to re-subscribe with a different group
    Meteor.subscribe("instanceData", group);
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
    infMaxGraph = new InfMax.InfluenceMaximisationGraph("cy");

    Tracker.autorun(function() {
        let instanceData = InstanceData.findOne();
        if (instanceData) {
            infMaxGraph.updateGraph(instanceData);
        }
    })
});

Template.survey.events({
    'submit .survey': function (e) {
        e.preventDefault();
        var results = {confusing: e.target.confusing.value,
            feedback: e.target.feedback.value}
        TurkServer.submitExitSurvey(results);
    }
});