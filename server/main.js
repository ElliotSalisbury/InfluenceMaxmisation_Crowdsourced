import { Meteor } from 'meteor/meteor';
var InfMax = require("./infmax/infmax");

let TUT_1 = "tutorial_1";
let TUT_2 = "tutorial_2";

Meteor.startup(() => {
    //create the tutorial treatments
    TurkServer.ensureTreatmentExists({
        name: TUT_1,
    });
    TurkServer.ensureTreatmentExists({
        name: TUT_2,
    });

    let tutorialTreatments = [TUT_1,TUT_2];

    Batches.upsert({ name: "main" }, { name: "main", active: true });
    var batch = TurkServer.Batch.getBatchByName("main");
    batch.setAssigner(new TurkServer.Assigners.GraphPairAssigner(tutorialTreatments));

    //constructor for an instance
    TurkServer.Instance.initialize(function () {
        var instanceTreatments = this.instance.getTreatmentNames();
        if(instanceTreatments.indexOf(TUT_1) != -1) {
            initialize_tutorial_1(this);
        }else if(instanceTreatments.indexOf(TUT_2) != -1) {
            initialize_tutorial_2(this);
        }else {
            initialize_experiment(this);
        }
    });
});

Meteor.publish("instanceData", function () {
    return InstanceData.find();
});

function initialize_tutorial_1(instance) {
    let gen = new InfMax.generators.BarabasiAlbertGenerator(3, 10, 1, 0.1, 0.4);
    let graph = gen.generate();
    let graphData = InfMax.graphToData(graph);

    //get the user participating in this tutorial (there'll only be one)
    let users = instance.instance.users();
    let userColors = {};
    for(let i=0; i<users.length; i++) {
        let color = '#00FF00';
        userColors[users[i]] = color;
    }

    let seedsRequired = 1;

    //create a new InstanceData for this experiment, containing the graphdata and experiment info.
    InstanceData.insert({
        graphElementsData:graphData,
        experiment:{
            seedsRequired:seedsRequired,
            seedsChosen:0,

            turnIndex:0,
            turnOrder:users,
            turnColors:userColors
        }
    });
}

function initialize_tutorial_2(instance) {
    let gen = new InfMax.generators.BarabasiAlbertGenerator(3, 10, 2, 0.1, 0.4);
    let graph = gen.generate();
    let graphData = InfMax.graphToData(graph);

    //get the user participating in this tutorial (there'll only be one)
    let users = instance.instance.users();
    let userColors = {};
    for(let i=0; i<users.length; i++) {
        let color = '#00FF00';
        userColors[users[i]] = color;
    }

    let computer_id = "COMPUTER";
    users.push(computer_id);
    userColors[computer_id] = "#596c7a";

    let seedsRequired = 2;

    //create a new InstanceData for this experiment, containing the graphdata and experiment info.
    InstanceData.insert({
        graphElementsData:graphData,
        experiment:{
            seedsRequired:seedsRequired,
            seedsChosen:0,

            turnIndex:0,
            turnOrder:users,
            turnColors:userColors
        }
    });
}

function initialize_experiment(instance) {
    //generate a graph
    let gen1 = new InfMax.generators.BarabasiAlbertGenerator(2, 10, 2, 0.1, 0.4);
    // let gen = new InfMax.generators.ErdosRenyiGenerator(50, 4./50., 0.1, 0.4);
    let gen = new InfMax.generators.ClusterGenerator(50, 5, 0.2, gen1, 0.1, 0.4);
    var graph = gen.generate();

    //from the cy graph, we only want to store the important data (not the positions and stuff)
    var graphData = InfMax.graphToData(graph);

    //get the users participating in this experiment
    var users = instance.instance.users();

    var userColors = {};
    for(var i=0; i<users.length; i++) {
        var color = '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);
        userColors[users[i]] = color;
    }

    if (users.length < 2) {
        var computer_id = "COMPUTER";
        users.push(computer_id);
        userColors[computer_id] = "#596c7a";
    }

    users = _.shuffle(users);

    //the number of seeds to infect
    var seedsRequired = 4;

    //create a new InstanceData for this experiment, containing the graphdata and experiment info.
    InstanceData.insert({
        graphElementsData:graphData,
        experiment:{
            seedsRequired:seedsRequired,
            seedsChosen:0,

            turnIndex:0,
            turnOrder:users,
            turnColors:userColors
        }
    });

    //if the computer is first, we need to run their turn
    if(users[0] === "COMPUTER") {
        Meteor.call("checkComputersTurn");
    }
}