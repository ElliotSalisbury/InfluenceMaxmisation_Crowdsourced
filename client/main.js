import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

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

Template.survey.events({
    'submit .survey': function (e) {
        e.preventDefault();
        var results = {confusing: e.target.confusing.value,
            feedback: e.target.feedback.value}
        TurkServer.submitExitSurvey(results);
    }
});