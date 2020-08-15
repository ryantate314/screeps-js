const nameGenerator = require("./nameGenerator");

module.exports = {
    /**
     * 
     * @param {Creep} creep 
     */
    run: function(creep) {
        let targetRoom = Game.rooms[creep.memory.targetRoom];

        if (creep.room.name != targetRoom.name) {
            creep.moveTo(targetRoom.controller, {
                reusePath: 25
            });
        }
        else {
            let result = creep.claimController(targetRoom.controller);
            if (result == ERR_NOT_IN_RANGE) {
                creep.moveTo(targetRoom.controller);
            }
        }
    },
    /**
     * 
     * @param {StructureSpawn} spawn 
     */
    spawn: function(spawn, targetRoom) {
        let body = [CLAIM, MOVE];

        let result = spawn.spawnCreep(body, nameGenerator.nameCreep(targetRoom + "-claimer"), {
            memory: {
                spawnRoom: spawn.room.name,
                targetRoom: targetRoom
            }
        });
    }
};