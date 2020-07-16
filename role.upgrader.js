/*
 * Harvest energy and take it to the room controller.
 */

const role = require("./role.enum");
const nameGenerator = require("./nameGenerator");
const sourceFinder = require("./sourceFinder");

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
            //Look for container
            let source = sourceFinder.findSource(creep);
            if (source.source) {
                let harvestResult = source.extract();
                if (harvestResult == ERR_NOT_IN_RANGE) {
                    let moveResult = creep.moveTo(source.source);

                        //Move down south towards the controller even when the source is busy
                        //TODO get this working
                    if (moveResult == ERR_INVALID_TARGET && creep.pos.getRangeTo(controller) > 10) {
                        console.log("moving upgrader to controller because full up");
                        creep.moveTo(controller);
                    }
                    else {
                        //console.log("upgrader move result: " + moveResult);
                    }
                }//End if not in range of source
            }//End if source exists
            
        }//End if working
    },
    spawn: function(spawn) {
        let name = spawn.createCreep([WORK, CARRY, WORK, MOVE, WORK, CARRY, MOVE], nameGenerator.nameCreep('upgrader'), {
            role: role.upgrader,
            working: false
        });
        if (isNaN(name)) {
            console.log("Spawning upgrader " + name);
        }
    },
    cost: 300
};