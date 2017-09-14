function notificationsCheck() {
    if (true || Notification.permission === "granted") {
        $("#desktopnotifications").removeClass("btn-primary").addClass("btn-success");
        $("#desktopnotifications").text("Great! You have accepted notifications.");
        $("#lobbyready").prop("disabled", false);
    }else if(Notification.permission === "denied") {
        $("#desktopnotifications").removeClass("btn-primary").addClass("btn-danger");
        $("#desktopnotifications").text("You have rejected notifications. DO NOT ACCEPT THE HIT.");
    }
}

Template.accept_qualifications.onRendered(function() {
    //does this browser have desktop notifications
    if (!("Notification" in window)) {
        $("#desktopnotifications").removeClass("btn-primary").addClass("btn-danger");
        $("#desktopnotifications").text("This browser does not support notifications. DO NOT ACCEPT THE HIT.");
    }

    //Maybe we already have permission
    notificationsCheck();
});
Template.accept_qualifications.events = ({
    'click button#desktopnotifications' : function (event, tmpl) {
        event.preventDefault();

        if (Notification.permission !== 'denied' || Notification.permission === "default") {
            Notification.requestPermission().then(function (permission) {
                notificationsCheck();
            });
        }
    }
});


Template.lobby.helpers({
    ready_template: function () {
        var myLobbyStatus = LobbyStatus.findOne(Meteor.userId());
        if (myLobbyStatus && myLobbyStatus.status) {
            return "lobby_ready";
        } else {
            return "lobby_notready";
        }
    }
});

Template.lobby_notready.events({
    'click button#lobbyready': function (e) {
        Meteor.call("toggleStatus");
        $("#collapse1").collapse('hide');
    }
});

Template.lobby_ready.helpers({
    count: function () {
        return LobbyStatus.find({status:true}).count();
    }
});

if (Meteor.settings.public.turkserver.autoLobby == false) {
    Meteor.startup(function () {
        Meteor.defer(function() {
            //Subscribe to lobby if we are in it (auto unsubscribe if we aren't)
            Deps.autorun(function() {
                if (TurkServer.inLobby()) {
                    if (TurkServer.batch()) {
                        Meteor.subscribe("lobby", TurkServer.batch()._id);
                        Router.go("/lobby");
                    }
                }
            });
        });
    });
}
