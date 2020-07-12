/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.miner');
 * mod.thing == 'a thing'; // true
 */

const roleHarvester = require("./role.harvester");
const nameGenerator = require("./nameGenerator");
const role = require("./role.enum");

module.exports = {
    /**
     * 
     * @param {Creep} creep 
     */
    run: function(creep) {
        let container = null;

        if (creep.memory.containerId === undefined) {
            container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: x => x.structureType == STRUCTURE_CONTAINER
                    && x.store[RESOURCE_ENERGY] < x.store.getCapacity(RESOURCE_ENERGY)
            });
        }
        else {
            container = Game.getObjectById(creep.memory.containerId);
        }
        
        if (container && container.store[RESOURCE_ENERGY] < container.store.getCapacity(RESOURCE_ENERGY)) {
            //If we're sitting on top of the container
            if (creep.pos.getRangeTo(container) == 0) {
                let source = creep.pos.findClosestByRange(FIND_SOURCES);
                creep.harvest(source);
            }
            else {
                creep.moveTo(container);
            }
        }
        else {
            //Fall back to harvester when no containers to find
            //WARNING this spits energy out on the ground to decay
            //Look for energy source
            // source = creep.pos.findClosestByPath(FIND_SOURCES, {
            //     filter: x => true
            // });
            // if (source) {
            //     //Found source
            //     let result = creep.harvest(source);
            //     if (result == ERR_NOT_IN_RANGE) {
            //         creep.moveTo(source);
            //     }
            // }
        }
    },
    /**
     * 
     * @param {StructureSpawn} spawn 
     * @param {*} energy 
     */
    spawn: function(spawn, energy) {
        //Assign the miner a container on spawn

        let miners = _.filter(Game.creeps, x => x.memory.role == role.miner);

        let containers = spawn.room.find(FIND_STRUCTURES, {
            filter: x => {
                let valid = false;

                if (x.structureType == STRUCTURE_CONTAINER) {

                    //Make sure this container is not claimed by another miner
                    //Doing this inside filter() because manually building up an array wouldn't work with findClosestByPath()
                    let claimed = false;
                    for (let miner of miners) {
                        if (miner.memory.container == x) {
                            claimed = true;
                            break;
                        }
                    }
                    if (!claimed) {
                        valid = true;
                    }
                }

                return valid;
            } 
        });
        
        let container = spawn.pos.findClosestByPath(containers);

        if (container) {
            let name = spawn.createCreep([WORK, WORK, WORK, WORK, WORK, MOVE], nameGenerator.nameCreep('miner'), {
                role: role.miner,
                working: false,
                containerId: container.id
            });
            if (isNaN(name)) {
                console.log("Spawning miner " + name);
            }
        }
        else {
            console.log("No containers to mine over.");
        }
       
    }
};