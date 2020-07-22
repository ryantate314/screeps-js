require('./prototype.room')();
const roleHarvester = require('role.harvester');
const roleUpgrader = require('role.upgrader');
const roleBuilder = require('./role.builder');
const roleRepairer = require('./role.repairer');
const role = require('./role.enum');
const roleMiner = require('./role.miner');
const roleWallWart = require('./role.wallWart');
const roleLongDistanceHarvester = require('./role.longDistanceHarvester');

module.exports.loop = function() {

    //Clean up memory
    for (let name in Memory.creeps) {
        if (Game.creeps[name] === undefined) {
            console.log(name + " the " + Memory.creeps[name].role + " has died.");
            delete Memory.creeps[name];
        }
    }

    let spawn = Game.spawns.Spawn1;

    defendRoom(spawn.room.name);
    setStorageLevel(spawn.room);

    const minNumberOfHarvesters = 3;
    const minNumberOfUpgraders = 3;
    const minNumberOfRepairers = 3;
    let numConstructionSites = spawn.room.find(FIND_CONSTRUCTION_SITES).length;
    const minNumberOfBuilders = numConstructionSites > 0 ? Math.min(3, numConstructionSites) : 1;
    const minNumberOfWallWarts = 1;
    const numContainers = spawn.room.find(FIND_STRUCTURES, {
        filter: x => x.structureType == STRUCTURE_CONTAINER
    }).length;

    let numberOfHarvestors = _.sum(Game.creeps, x => x.memory.role == role.harvester);
    let numberOfUpgraders = _.sum(Game.creeps, x => x.memory.role == role.upgrader);
    let numberOfBuilders = _.sum(Game.creeps, x => x.memory.role == role.builder);
    let numberOfRepairers = _.sum(Game.creeps, x => x.memory.role == role.repairer);
    let numberOfWallWarts = _.sum(Game.creeps, x => x.memory.role == role.wallWart);
    let numberOfMiners = _.sum(Game.creeps, x => x.memory.role == role.miner);

    


    let numberOfCreeps = Object.keys(Game.creeps).length;

    if (numberOfHarvestors < minNumberOfHarvesters) {
        if (numberOfHarvestors >= 1) {
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
    else if (numberOfBuilders < minNumberOfBuilders) {
        roleBuilder.spawn(spawn);
    }
    else if (numberOfMiners < numContainers) {
        roleMiner.spawn(spawn);
    }
    else if (numberOfWallWarts < minNumberOfWallWarts) {
        roleWallWart.spawn(spawn);
    }
    else {
        //Determine if long distance harvesters are spawned
        /*
         * To configure a long distance harverster, create a memory element in the spawn's
         * room in the form:
         * {
         *      foreignEnergySources: [
         *          {
         *              name: "<room name>",
         *              index: <array index, depending on number of sources in the room>
         *          }
         *      ]
         * }
         */
        if (spawn.room.memory.foreignEnergySources !== undefined) {
            for (let source of spawn.room.memory.foreignEnergySources) {
                let harvesters = _.filter(Game.creeps, x => x.memory.role == role.longDistanceHarvester
                                                            && x.memory.targetRoom == source.name
                                                            && x.memory.sourceIndex == source.index);
                if (harvesters.length < source.numHarvesters) {
                    roleLongDistanceHarvester.spawn(spawn, source.distanceFactor, source.name, source.index);
                }
            }
        }
    }

    for (let name in Game.creeps) {
        let creep = Game.creeps[name];
        switch (creep.memory.role) {
            case role.harvester:
                roleHarvester.run(creep);
                break;
            case role.upgrader:
                roleUpgrader.run(creep);
                break;
            case role.builder:
                roleBuilder.run(creep);
                break;
            case role.repairer:
                roleRepairer.run(creep);
                break;
            case role.miner:
                roleMiner.run(creep);
                break;
            case role.wallWart:
                roleWallWart.run(creep);
                break;
            case role.longDistanceHarvester:
                roleLongDistanceHarvester.run(creep);
                break;
        }
    }

    function defendRoom(roomName) {
        var hostiles = Game.rooms[roomName].find(FIND_HOSTILE_CREEPS);
        if(hostiles.length > 0) {
            //var username = hostiles[0].owner.username;
            //Game.notify(`User ${username} spotted in room ${roomName}`);
            var towers = Game.rooms[roomName].find(
                FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
            towers.forEach(tower => tower.attack(hostiles[0]));
        }
    }

    /**
     * 
     * @param {Room} room 
     */
    function setStorageLevel(room) {
        if (room.memory.storageStats === undefined) {
            room.memory.storageStats = {
                100: null,
                1000: null,
                10000: null
            };
        }

        let storage = null;
        if (Game.time % 100 == 0) {
            let storageStructures = room.find(FIND_STRUCTURES, {
                filter: x => x.structureType == STRUCTURE_STORAGE
            });
            storage = _.sum(_.map(storageStructures, x => x.store[RESOURCE_ENERGY]));
        }

        if (Game.time % 10000 == 0) {
            room.memory.storageStats[10000] = storage;
        }
        if (Game.time % 1000 == 0) {
            room.memory.storageStats[1000] = storage;
        }
        if (Game.time % 100 == 0) {
            room.memory.storageStats[100] = storage;
        }
    }
    
}