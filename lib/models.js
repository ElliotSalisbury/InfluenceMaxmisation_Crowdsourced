//stores the graph data and experiment data, partitioned by the experiment (i.e., 1 instance per an experiment, other experiments won't be able to see this data)
InstanceData = new Meteor.Collection('instancedata');
TurkServer.partitionCollection(InstanceData);