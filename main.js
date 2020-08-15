require('./prototype.room')();
require('./prototype.source')();
const roleHarvester = require('role.harvester');
const roleUpgrader = require('role.upgrader');
const roleBuilder = require('./role.builder');
const roleRepairer = require('./role.repairer');
const role = require('./role.enum');
const roleMiner = require('./role.miner');
const roleWallWart = require('./role.wallWart');
const roleLongDistanceHarvester = require('./role.longDistanceHarvester');
const roleDefender = require('./role.defender');
const { random } = require('lodash');

module.exports.loop = function() {

    //Clean up memory
    for (let name in Memory.creeps) {
        if (Game.creeps[name] === undefined) {
            console.log(name + " the " + Memory.creeps[name].role + " has died.");
            delete Memory.creeps[name];
        }
    }

    let spawn = Game.spawns.Spawn1;

    try {
        defendRoom(spawn.room.name);
    }
    catch (err) {
        console.log("main.defendRoom(): " + err);
    }
    setStorageLevel(spawn.room);

    const minNumberOfHarvesters = 3;
    const minNumberOfUpgraders = 3;
    const minNumberOfRepairers = 2;
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

    let invaders = spawn.room.find(FIND_HOSTILE_CREEPS);
    let defenders = spawn.room.find(FIND_MY_CREEPS, {
        filter: x => x.memory.role == role.defender
    });

    let numberOfCreeps = Object.keys(Game.creeps).length;

    try {
        if (invaders.length > defenders.length) {
            roleDefender.spawn(spawn, false);
        }
        else if (numberOfHarvestors < minNumberOfHarvesters) {
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
        else if (numberOfWallWarts < minNumberOfWallWarts && (spawn.room.energyCapacityAvailable > 400 || spawn.room.controller.level > 3)) {
            roleWallWart.spawn(spawn);
        }
        else {
            //Determine if long distance harvesters are spawned
            /*
             * To configure a long distance harverster, use Room.addLongDistanceSource(...)
             */
            if (spawn.room.memory.foreignEnergySources !== undefined) {
                for (let source of spawn.room.memory.foreignEnergySources) {
                    let harvesters = _.filter(Game.creeps, x => x.memory.role == role.longDistanceHarvester
                                                                && x.memory.targetRoom == source.name
                                                                && x.memory.sourceIndex == source.sourceIndex);
                    if (harvesters.length < source.numHarvesters) {
                        roleLongDistanceHarvester.spawn(spawn, source.distanceFactor, source.name, source.sourceIndex);
                    }
                }
            }
        }
    }
    catch (err) {
        console.log("main.js - Error spawning: " + err);
    }
    

    for (let name in Game.creeps) {
        try {
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
                case role.defender:
                    roleDefender.run(creep);
                    break;
                case "deadCreepWalking":
                    if (creep.memory.homeRoom && creep.memory.homeRoom !== creep.room.name) {
                        let exit = creep.room.findExitTo(creep.memory.homeRoom);
                        creep.moveTo(creep.pos.findClosestByPath(exit));
                        break;
                    }

                    let spawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS);      
                    if (creep.pos.isNearTo(spawn)) {
                        spawn.recycleCreep(creep);
                    }
                    else {
                        creep.moveTo(spawn);
                    }
                    break;
            }
        }
        catch (ex) {
            console.log("Error executing run");
            console.log(ex);
        }
    }//End foreach creep

    function defendRoom(roomName) {
        var hostiles = Game.rooms[roomName].find(FIND_HOSTILE_CREEPS);
        var injuredCreeps = Game.rooms[roomName].find(FIND_MY_CREEPS, {
            filter: x => x.hits < x.hitsMax
        });

        let towers = Game.rooms[roomName].find(FIND_MY_STRUCTURES, {
            filter: x => x.structureType == STRUCTURE_TOWER
        });
        for (let tower of towers) {

            //Use probability to determine if we are going to attack or heal
            let attackRatio = 0.3;
            let attack = _.random(1, 1 / attackRatio) == 1;

            if ((hostiles.length > 0 && injuredCreeps.length > 0 && attack)
                || (hostiles.length > 0 && injuredCreeps.length == 0))
            {
                //Attack
                //var username = hostiles[0].owner.username;
                //Game.notify(`User ${username} spotted in room ${roomName}`);
                tower.attack(tower.pos.findClosestByRange(hostiles));
            }
            else if (injuredCreeps.length > 0) {

                //Sort injured creeps by priority
                injuredCreeps = injuredCreeps.sort((a, b) => {
                    let aPriority = 0;
                    let bPriority = 0;
        
                    //Prioritize defenders
                    if (a.memory.role == role.defender) {
                        aPriority++;
                    }
                    if (b.memory.role == role.defender) {
                        bPriority++;
                    }
        
                    //Prioritize the bigger creep
                    aPriority += _.map(_.filter(a.body, x => x == ATTACK || x == RANGED_ATTACK || x == HEAL), x => x.length);
                    bPriority += _.map(_.filter(b.body, x => x == ATTACK || x == RANGED_ATTACK || x == HEAL), x => x.length);
        
                    //Give more wounded creep priority to keep them alive
                    let aHealthRatio = a.hits / a.hitsMax;
                    let bHealthRatio = b.hits / b.hitsMax;
                    if (aHealthRatio < bHealthRatio)
                        aPriority++;
                    else if (bHealthRatio < aHealthRatio)
                        bPriority++;
        
                    if (aPriority > bPriority)
                        return -1;
                    else if (aPriority < bPriority)
                        return 1;
                    else
                        return 0;
                });

                tower.heal(injuredCreeps[0]);
            }
        }//End foreach tower
    }//End defendRoom()

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