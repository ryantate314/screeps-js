/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.builder');
 * mod.thing == 'a thing'; // true
 */

let roleUpgrader = require('role.upgrader');
const roleHarvester = require('./role.harvester');
const role = require('./role.enum');
const nameGenerator = require('./nameGenerator');
const sourceFinder = require('./sourceFinder');

module.exports = {
    /**
     * 
     * @param {Creep} creep 
     */
    run: function(creep) {
        let controller = creep.room.controller;

        if (creep.memory.working == true && creep.carry.energy == 0) {
            //Finished emptying
            creep.memory.working = false;
        }
        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            creep.memory.working = true;
        }
    
        if (creep.memory.working == true) {
            let site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
                filter: x => true
            });
            if (site != null) {
                if (creep.build(site) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(site);
                }
            }
            else {
                //fall-back to an upgrader
                roleUpgrader.run(creep);
            }
            
        }
        else {
            //Try and find storage first, if not, go to source
            // let source = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            //    filter: x => x.structureType == STRUCTURE_CONTAINER && x.energy > 0
            // });
            // if (source != undefined) {
                
            // }
            
            let source = sourceFinder.findSource(creep);
            let harvestResult = source.extract();
            if (harvestResult == ERR_NOT_IN_RANGE) {
                creep.moveTo(source.source);
            }
        }
    },
    spawn: function(spawn) {
        let name = spawn.createCreep([WORK, WORK, CARRY, CARRY, MOVE, MOVE], nameGenerator.nameCreep('builder'), {
            role: role.builder,
            working: false
        });
        if (isNaN(name)) {
            console.log("Spawning builder " + name);
        }
    },
    cost: 300
};