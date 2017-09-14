Router.route('/', function() {
    this.render('home');
});

Router.route('/experiment', function() {
    this.render('experiment');
});

Router.route('/survey', function() {
    this.render('survey');
});

//only define the lobby if were in multiplayer
if (Meteor.settings.public.turkserver.autoLobby == false) {
    Router.route('/lobby', function () {
        this.render('lobby');
    });
}