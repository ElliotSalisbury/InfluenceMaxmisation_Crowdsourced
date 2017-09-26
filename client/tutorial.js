let InfMax = require("./lib/InfluenceMaximisationGraph");

Template.tutorial_1.onRendered(function() {
    infMaxGraph = InfMax.TutorialInfluenceMaximisationGraph.getInstance("cy", {
        steps: [
            {
                element: "#cy",
                intro: "Welcome! Here you can see the network of people (blue circles). The lines connecting people represent the strength of their relationship. Our aim is to influence as many of them as possible."
            },
            {
                element: "#cy",
                intro: "Click on a person (blue circle) to influence them. Preferrably someone with lots of connected friends.",
                disableInteraction: false,
                disableNext:true,
                waitOnClick:true,
            },
            {
                element: "#cy",
                intro: "Great job! Notice how many people are joining your side! But not everyone got influenced - maybe they are resistant to new ideas. The chance they get influenced is represented by the thickness of the connecting lines.",
            },
            {
                element: "#cy",
                intro: "Thick lines mean those people are likely to influence each other, thin lines less so, and dotted lines very little.",
            },
            {
                element: "#continue",
                intro: "Once you're ready, click here to move onto the next tutorial",
                disableInteraction: false,
                disableNext:true,
            },
        ],
        exitOnEsc: false,
        exitOnOverlayClick: false,
        showStepNumbers: false,
        showBullets:false,
        keyboardNavigation: false,
        disableInteraction: true,
    });

    Tracker.autorun(function() {
        let instanceData = InstanceData.findOne();
        if (instanceData) {
            infMaxGraph.updateGraph(instanceData);
        }
    })
});
Template.tutorial_1.onDestroyed(function() {
    InfMax.InfluenceMaximisationGraph.destroy();
});

Template.tutorial_2.onRendered(function() {
    infMaxGraph = InfMax.TutorialInfluenceMaximisationGraph.getInstance("cy", {
        steps: [
            {
                element: "#turn_indicator",
                intro: "Now we're going to take a look at a short multiplayer game!. It's currently your turn."
            },
            {
                element: "#cy",
                intro: "As before, click on a person (blue circle) to influence them.",
                disableInteraction: false,
                disableNext:true,
                waitOnClick:true,
            },
            {
                element: "#cy",
                intro: "Great job! Now your opponent takes their turn. They can convince people to join their side against you, but they cannot influence people who you've already influenced.",
            },
            {
                element: "#scoreboard",
                intro: "Here's the scoreboard, it shows how many you and your opponent influenced.",
            },
            {
                element: "#seed_indicator",
                intro: "This was a short game, and now there are no more turns left to play.",
            },
            {
                element: "#continue",
                intro: "Once you're ready, click here to move onto the next tutorial",
                disableInteraction: false,
                disableNext:true,
            },
        ],
        exitOnEsc: false,
        exitOnOverlayClick: false,
        showStepNumbers: false,
        showBullets:false,
        keyboardNavigation: false,
        disableInteraction: true,

    });

    Tracker.autorun(function() {
        let instanceData = InstanceData.findOne();
        if (instanceData) {
            infMaxGraph.updateGraph(instanceData);
        }
    })
});
Template.tutorial_2.onDestroyed(function() {
    InfMax.InfluenceMaximisationGraph.destroy();
});

Template.tutorial_3.onRendered(function() {
    infMaxGraph = InfMax.TutorialInfluenceMaximisationGraph.getInstance("cy", {
        steps: [
            {
                element: "#seed_indicator",
                intro: "Now we're going to play a longer game! This time your opponent will go first.",
            },
            {
                element: "#turn_indicator",
                intro: "It's currently your turn. Your opponent has already taken theirs.",
            },
            {
                element: "#cy",
                intro: "Click on a person (blue circle) to influence them. You cannot re-influence your opponents targets.",
                disableInteraction: false,
                disableNext:true,
                waitOnClick:true,
            },
            {
                element: "#scoreboard",
                intro: "Great job! Try and get the highest number of influenced people, you can see your score here.",
            },
            {
                element: "#cy",
                intro: "Keep playing, until there are no more turns left. Once you're done, click the blue 'Continue' button above to move onto the next tutorial",
                disableInteraction: false,
                disableNext:true,
                waitOnClick:true,
            },
        ],
        exitOnEsc: false,
        exitOnOverlayClick: false,
        showStepNumbers: false,
        showBullets:false,
        keyboardNavigation: false,
        disableInteraction: true,
    });

    Tracker.autorun(function() {
        let instanceData = InstanceData.findOne();
        if (instanceData) {
            infMaxGraph.updateGraph(instanceData);
        }
    })
});
Template.tutorial_3.onDestroyed(function() {
    InfMax.InfluenceMaximisationGraph.destroy();
});