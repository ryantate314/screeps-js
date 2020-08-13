/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.builder');
 * mod.thing == 'a thing'; // true
 */

const role = require('./role.enum');
const roleBuilder = require('./role.builder');
const nameGenerator = require('./nameGenerator');
const sourceFinder = require('./sourceFinder');
const bodyCosts = require('./bodyCosts');
const roleHarvester = require('./role.harvester');

module.exports = {
    /**
     * 
     * @param {Creep} creep 
     */
    run: function(creep) {

        let self = this;

        let underAttack = creep.room.find(FIND_HOSTILE_CREEPS).length > 0;

        if (creep.memory.working == true && creep.carry.energy == 0) {
            //Finished emptying
            creep.memory.working = false;
        }
        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            creep.memory.working = true;
        }
    
        if (creep.memory.working == true) {

            //If a creep wanders outside its spawn room, send it back
            if (creep.memory.spawnRoom && creep.room.name != creep.memory.spawnRoom) {
                creep.moveTo(new RoomPosition(25, 25, creep.memory.spawnRoom));
                return;
            }

            //If no harvesters in room, default to a harvester
            // if (creep.room.find(FIND_MY_CREEPS, {
            //     filter: x => x.memory.role == role.harvester
            // }).length == 0) {
            //     roleHarvester.run(creep);
            //     return;
            // }

            //Prioritize Ramparts
            let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: x => x.structureType == STRUCTURE_RAMPART
                            && x.hits < x.hitsMax * 0.001     //Repair ramparts up to 0.1%
            });
            if (target === null) {

                if (creep.memory.target) {
                    target = Game.getObjectById(creep.memory.target);
                }

                let doneRepairing = target !== null
                                    && target.hits >= self.getRepairWindow(target, underAttack).max;

                if (target === null || doneRepairing) {
                    //console.log(creep.name + " is searching for something to repair.");
                    //Find new target
                    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                        filter: x => x.structureType != STRUCTURE_WALL
                                    && x.structureType != STRUCTURE_CONTROLLER
                                    && x.hits < self.getRepairWindow(x, underAttack).min //Needs repair
                    });

                    creep.memory.target = target !== null ? target.id : null;
                }
                
            }

            if (target !== null) {
                if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            }
            else {
                roleBuilder.run(creep);
            }
        }
        else {
            var source = sourceFinder.findSource(creep);
            let harvestResult = source.extract();
            if (harvestResult == ERR_NOT_IN_RANGE) {
                creep.moveTo(source.source);
            }
        }
    },

    /**
     * 
     * @param {Structure} structure
     * @param {boolean} underAttack 
     */
    getRepairWindow: function(structure, underAttack) {
        let window = {
            min: structure.hitsMax * 0.8,
            max: structure.hitsMax
        };

        if (underAttack === true) {
            switch (structure.structureType) {
                case STRUCTURE_ROAD:
                    window.min = structure.hitsMax * 0.1;
                    window.max = structure.hitsMax * 0.5;
                    break;
            }
        }
        else {
            switch (structure.structureType) {
                case STRUCTURE_RAMPART:
                    window.min = structure.hitsMax * 0.1;
                    window.max = structure.hitsMax * 0.15;
                    break;
            }
        }

        //console.log("Repair window for " + structure.structureType + ": " + window.min + " - " + window.max);

        return window;
    },
    /**
     * 
     * @param {StructureSpawn} spawn 
     * @param {*} repairWalls 
     */
    spawn: function(spawn, repairWalls) {
        let energy = Math.min(600, spawn.room.energyCapacityAvailable);
        let name = spawn.createCreep(bodyCosts.generateBalancedCreep(energy), nameGenerator.nameCreep('repairer'), {
            role: role.repairer,
            working: false,
            spawnRoom: spawn.room.name
        });
        if (isNaN(name)) {
            console.log("Spawning repairer " + name);
        }
    },
    cost: 300
};