const role = require('./role.enum');
const nameGenerator = require('./nameGenerator');

/*
 * Harvest energy and take it to spawn
 */
module.exports = {
    /**
     * 
     * @param {*} spawn 
     * @param {Creep} creep 
     */
    run: function(spawn, creep) {
        if (creep.memory.working == true && creep.carry.energy == 0) {
            //Finished emptying
            creep.memory.working = false;
        }
        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            creep.memory.working = true;
        }
    
        if (creep.memory.working == true) {
            let structure = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                filter: x => x.energy < x.energyCapacity
            });
            if (structure != undefined) {
                if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(structure);
                }
            }
        }
        else {
            var source = creep.pos.findClosestByPath(FIND_SOURCES, {
                filter: x => x.pos.x != 35 //Ignore energy at the bottom of the map, which is reserved for upgrading
            });
            if (source != undefined) {
                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source);
                }
            }
        }
    },
    spawn: function(spawn) {
        let name = spawn.createCreep([WORK, WORK, CARRY, CARRY, MOVE, MOVE], nameGenerator.nameCreep('harvester'), {
            role: role.harvester,
            working: false
        });
        if (isNaN(name)) {
            console.log("Spawning harvester " + name);
        }
    },
    spawnBasic: function(spawn) {
        let name = spawn.createCreep([WORK, CARRY, MOVE], undefined, {
            role: role.harvester,
            working: false
        });
        if (isNaN(name)) {
            console.log("Spawning basic harvester " + name);
        }
    },
    cost: 300
};