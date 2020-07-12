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
            let structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: x => x.hits < x.hitsMax //Needs repair
                            && (creep.memory.repairWalls    //Creep is authorized to repair walls
                                || (x.structureType != STRUCTURE_WALL
                                        && x.structureType != STRUCTURE_RAMPART
                                    )
                                )
            });

            if (structure != undefined) {
                if (creep.repair(structure) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(structure);
                }
            }
            else {
                roleBuilder.run(creep);
            }
        }
        else {
            var source = creep.pos.findClosestByPath(FIND_SOURCES);
            let harvestResult = creep.harvest(source);
            if (harvestResult == ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }
        }
    },
    spawn: function(spawn, repairWalls) {
        let name = spawn.createCreep([WORK, CARRY, CARRY, MOVE, MOVE, MOVE], nameGenerator.nameCreep('repairer'), {
            role: role.repairer,
            working: false,
            repairWalls: repairWalls === undefined ? false : repairWalls
        });
        if (isNaN(name)) {
            console.log("Spawning repairer " + name);
        }
    },
    cost: 300
};