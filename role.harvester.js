const role = require('./role.enum');
const nameGenerator = require('./nameGenerator');
const sourceFinder = require('./sourceFinder');

/*
 * Harvest energy and take it to spawn
 */
module.exports = {
    /**
     * 
     * @param {*} spawn 
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
            //Carry power to either spawn/extensions, or towers.
            let spawning = creep.room.find(FIND_STRUCTURES, {
                filter: x => (x.structureType == STRUCTURE_SPAWN
                                || x.structureType == STRUCTURE_EXTENSION)
                            && x.energy < x.energyCapacity
            });
            let towers = creep.room.find(FIND_MY_STRUCTURES, {
                filter: x => x.structureType == STRUCTURE_TOWER
                            && x.energy < x.energyCapacity
            });
            let storage = creep.room.find(FIND_STRUCTURES, {
                filter: x => x.structureType == STRUCTURE_STORAGE
                            && x.store[RESOURCE_ENERGY] < x.store.getCapacity(RESOURCE_ENERGY)
            });
            //By default, prioritize closest structure
            let structures = spawning.concat(towers);

            //Prioritize spawning if energy is at half capacity
            if (creep.room.energyAvailable < creep.room.energyCapacityAvailable / 2) {
                structures = spawning;
            }
            else if (spawning.length == 0 && towers.length == 0 && storage.length > 0) {
                structures = storage;
            }
            let structure = creep.pos.findClosestByPath(structures);
            if (structure != undefined) {
                if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(structure);
                }
            }
        }
        else {
            //Looked for dropped energy first
            let source = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                filter: x => x.resourceType == RESOURCE_ENERGY 
                            && creep.pos.getRangeTo(x) < 10
            });
            if (source) {
                if (creep.pickup(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source);
                }
            }
            else {
                //Look for energy source
                let filter = x => true;
                //If the room is full, deposit in storage, not pull from storage. Prevents pulling out and immediately putting it back in.
                if (creep.room.energyAvailable == creep.room.energyCapacityAvailable) {
                    filter = x => x.structureType != STRUCTURE_STORAGE;
                }
                //Ignore energy at the bottom of the map, which is reserved for upgrading
                source = sourceFinder.findSource(creep, x => x.pos.x != 35 && filter(x));
                if (source) {
                    //Found source
                    let result = source.extract();
                    if (result == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source.source);
                    }
                }
            }
        }
    },
    spawn: function(spawn) {
        //Early game adds 2 work and 2 carry
        let name = spawn.createCreep([WORK, CARRY, MOVE, WORK, CARRY, MOVE], nameGenerator.nameCreep('harvester'), {
            role: role.harvester,
            working: false
        });
        if (isNaN(name)) {
            console.log("Spawning harvester " + name);
        }
    },
    spawnBasic: function(spawn) {
        let name = spawn.createCreep([WORK, CARRY, MOVE], nameGenerator.nameCreep('basicHarvester'), {
            role: role.harvester,
            working: false
        });
        if (isNaN(name)) {
            console.log("Spawning basic harvester " + name);
        }
    },
    cost: 300
};