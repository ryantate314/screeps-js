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

module.exports = {
    /**
     * 
     * @param {Creep} creep 
     */
    run: function(creep) {

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

            //Prioritize Ramparts
            let structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: x => x.structureType == STRUCTURE_RAMPART
                                            && x.hits < x.hitsMax * 0.001     //Repair ramparts up to 0.1%
            });
            if (structure === null) {
                structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: x => x.hits < x.hitsMax //Needs repair
                                && x.structureType != STRUCTURE_WALL
                                && x.structureType != STRUCTURE_RAMPART
                });
            }

            if (structure != null) {
                if (creep.repair(structure) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(structure);
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
    spawn: function(spawn, repairWalls) {
        let name = spawn.createCreep([WORK, CARRY, MOVE, WORK, CARRY, MOVE], nameGenerator.nameCreep('repairer'), {
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