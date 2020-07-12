/*
 * Harvest energy and take it to the room controller.
 */

const role = require("./role.enum");
const nameGenerator = require("./nameGenerator");

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
            let transferResult = creep.upgradeController(controller);
            if (transferResult == ERR_NOT_IN_RANGE) {
                creep.moveTo(controller);
            }
        }
        else {
            var source = creep.pos.findClosestByPath(FIND_SOURCES, {
                filter: x => x.pos.x != 18//Ignore source next to spawn
            });
            if (source != undefined) {
                let harvestResult = creep.harvest(source);
                if (harvestResult == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source);
                }
            }
        }
    },
    spawn: function(spawn) {
        let name = spawn.createCreep([WORK, WORK, CARRY, MOVE], nameGenerator.nameCreep('upgrader'), {
            role: role.upgrader,
            working: false
        });
        if (isNaN(name)) {
            console.log("Spawning upgrader " + name);
        }
    },
    cost: 300
};