const roleHarvester = require('role.harvester');
const roleUpgrader = require('role.upgrader');
const roleBuilder = require('./role.builder');
const roleRepairer = require('./role.repairer');
const role = require('./role.enum');

module.exports.loop = function() {

    //Clean up memory
    for (let name in Memory.creeps) {
        if (Game.creeps[name] === undefined) {
            console.log(name + " the " + Memory.creeps[name].role + " has died.");
            delete Memory.creeps[name];
        }
    }

    let spawn = Game.spawns.Spawn1;

    const minNumberOfHarvesters = 4;
    const minNumberOfUpgraders = 4;
    const minNumberOfRepairers = 2;
    const minNumberOfBuilders = 5;
    const maxUnits = minNumberOfHarvesters + minNumberOfUpgraders + minNumberOfRepairers + minNumberOfRepairers;

    let numberOfHarvestors = _.sum(Game.creeps, x => x.memory.role == role.harvester);
    let numberOfUpgraders = _.sum(Game.creeps, x => x.memory.role == role.upgrader);
    let numberOfBuilders = _.sum(Game.creeps, x => x.memory.role == role.builder);
    var numberOfRepairers = _.sum(Game.creeps, x => x.memory.role == role.repairer)
    var numberOfCreeps = _.sum(Game.creeps);

    if (numberOfHarvestors < minNumberOfHarvesters) {
        if (numberOfHarvestors > 2) {
            roleHarvester.spawn(spawn);
        }
        else {
            roleHarvester.spawnBasic(spawn);
        }
    }
    else if (numberOfUpgraders < minNumberOfUpgraders) {
        roleUpgrader.spawn(spawn);
    }
    else if (numberOfRepairers < minNumberOfRepairers) {
        roleRepairer.spawn(spawn);
    }
    //numberOfBuilders < minNumberOfBuilders && 
    else if (numberOfCreeps < maxUnits) {
        roleBuilder.spawn(spawn);
    }

    for (let name in Game.creeps) {
        let creep = Game.creeps[name];
        if (creep.memory.role == role.harvester) {
            roleHarvester.run(spawn, Game.creeps[name]);
        }
        else if (creep.memory.role == role.upgrader) {
            roleUpgrader.run(creep)
        }
        else if (creep.memory.role == role.builder) {
            roleBuilder.run(creep);
        }
        else if (creep.memory.role == role.repairer) {
            roleRepairer.run(creep);
        }
    }
    
}