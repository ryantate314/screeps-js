/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.builder');
 * mod.thing == 'a thing'; // true
 */

const role = require('./role.enum');
const nameGenerator = require('./nameGenerator');
const roleRepairer = require('./role.repairer');
const sourceFinder = require('./sourceFinder');
const bodyCosts = require('./bodyCosts');

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
            let walls = creep.room.find(FIND_STRUCTURES, {
                filter: x => x.structureType == STRUCTURE_WALL
                            || x.structureType == STRUCTURE_RAMPART
            });

            let target = null;

            //Repair all walls up to a certain percentage before upgrading to full health
            let resolution = 0.0001;
            for (let percentage = resolution; percentage <= 1; percentage += resolution) {
                target = creep.pos.findClosestByPath(walls, {
                    filter: x => x.hits / x.hitsMax < percentage
                });
                if (target) {
                    break;
                }
            }

            if (target) {
                if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            }
            else {
                roleRepairer.run(creep);
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
    spawn: function(spawn) {
        let name = spawn.createCreep(bodyCosts.generateBalancedCreep(spawn.room.energyCapacityAvailable), nameGenerator.nameCreep('wallWart'), {
            role: role.wallWart,
            working: false
        });
        if (isNaN(name)) {
            console.log("Spawning wall wart " + name);
        }
    },
    cost: 300
};