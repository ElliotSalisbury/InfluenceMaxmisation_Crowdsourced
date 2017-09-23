let InfMax = require("./lib/InfluenceMaximisationGraph");

Template.tutorial_1.onRendered(function() {
    infMaxGraph = new InfMax.TutorialInfluenceMaximisationGraph("cy", {
        steps: [
            {
                element: "#cy",
                intro: "Welcome! Here you can see the network of people (blue circles). The lines connecting people represent their friendships. Our aim is to infect as many of them as possible with a disease."
            },
            {
                element: "#cy",
                intro: "Click on a person (blue circle) to infect them. Preferrably someone with lots of connected friends.",
                disableInteraction: false,
                disableNext:true,
                waitOnClick:true,
            },
            {
                element: "#cy",
                intro: "Great job! Notice how your disease spread through the population. But, not everyone got infected, maybe they had a good immune system, the chance they get infect is represented by the thickness of the connecting lines.",
            },
            {
                element: "#cy",
                intro: "Thick lines mean that person is likely to catch the disease, thin lines less so, and dotted lines very little.",
            },
            {
                element: "#exitSurvey",
                intro: "Once you're ready, click here to move onto the next tutorial",
                disableInteraction: false,
                disableNext:true,
            },
        ],
        exitOnEsc: false,
        exitOnOverlayClick: false,
        showStepNumbers: false,
        keyboardNavigation: false,
        disableInteraction: true,
    });
});

Template.tutorial_2.onRendered(function() {
    infMaxGraph = new InfMax.TutorialInfluenceMaximisationGraph("cy", {
        steps: [
            {
                element: "#turn_indicator",
                intro: "Now we're going to take a look at a short multiplayer game!. It's currently your turn."
            },
            {
                element: "#cy",
                intro: "As before, click on a person (blue circle) to infect them.",
                disableInteraction: false,
                disableNext:true,
                waitOnClick:true,
            },
            {
                element: "#cy",
                intro: "Great job! Now your opponent takes their turn. Their disease can spread too, but it cannot infect the people you've already infected.",
            },
            {
                element: "#scoreboard",
                intro: "Here's the scoreboard, it shows how many you infected, and how many your opponent infected.",
            },
            {
                element: "#seed_indicator",
                intro: "This was a short game, and now there are no more turns left to play.",
            },
            {
                element: "#exitSurvey",
                intro: "Once you're ready, click here to move onto the next tutorial",
                disableInteraction: false,
                disableNext:true,
            },
        ],
        exitOnEsc: false,
        exitOnOverlayClick: false,
        showStepNumbers: false,
        keyboardNavigation: false,
        disableInteraction: true,

    });
});

Template.tutorial_3.onRendered(function() {
    infMaxGraph = new InfMax.TutorialInfluenceMaximisationGraph("cy", {
        steps: [
            {
                element: "#seed_indicator",
                intro: "Now we're going to play a longer game! This time your opponent will go first."
            },
            {
                element: "#turn_indicator",
                intro: "It's currently your turn. Your opponent has already taken theirs."
            },
            {
                element: "#cy",
                intro: "Click on a person (blue circle) to infect them. You cannot re-infect your opponents targets.",
                disableInteraction: false,
                disableNext:true,
                waitOnClick:true,
            },
            {
                element: "#scoreboard",
                intro: "Great job! Try and get the highest number of infected people, you can see your score here.",
            },
            {
                element: "#cy",
                intro: "Keep playing, until there are no more turns left. Once you're done, click the blue 'Done' button above to move onto the next tutorial",
                disableInteraction: false,
                disableNext:true,
                waitOnClick:true,
            },
        ],
        exitOnEsc: false,
        exitOnOverlayClick: false,
        showStepNumbers: false,
        keyboardNavigation: false,
        disableInteraction: true,
    });
});