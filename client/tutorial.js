let introJs = require('intro.js').introJs;

Template.tutorial_1.onRendered(function() {
    var intro = introJs();
    intro.setOptions({
        steps: [
            {
                element: "#cy",
                intro: "Welcome! Here you can see the network of people (blue circles). The lines connecting people represent their friendships. Our aim is to infect as many of them with a disease."
            },
            {
                element: "#cy",
                intro: "Click on a person (blue circle) to infect them. Preferrably someone with lots of connected friends.",
                disableInteraction: false,
            },
            {
                element: "#cy",
                intro: "Great job! Notice how your disease spread through the population.",
            },
            {
                element: "#cy",
                intro: "Thick lines mean that person interacts with their friend a lot, thin lines less, and dotted lines very little. The more that person interacts with their friend, the more likely the disease is too spread",
            },
        ],
        exitOnEsc: false,
        exitOnOverlayClick: false,
        showStepNumbers: false,
        keyboardNavigation: false,
        disableInteraction: true,
        skipLabel: false,
    });
    intro.start();
});

Template.tutorial_2.onRendered(function() {
    var intro = introJs();
    intro.setOptions({
        steps: [
            {
                element: "#cy",
                intro: "Now we look at multiplayer!."
            },
            {
                element: "#cy",
                intro: "As before, click on a person (blue circle) to infect them.",
                disableInteraction: false,
            },
            {
                element: "#cy",
                intro: "Great job! Now your opponent takes a turn. Their disease can spread too, but it cannot infect the people you've already infected.",
            },
            {
                element: "#scoreboard",
                intro: "Here's the scoreboard, it shows how many you infected, and how many your opponent infected.",
            },
        ],
        exitOnEsc: false,
        exitOnOverlayClick: false,
        showStepNumbers: false,
        keyboardNavigation: false,
        disableInteraction: true,
        skipLabel: false,
    });
    intro.start();
});