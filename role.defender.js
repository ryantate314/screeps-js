/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.defender');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    /**
     * 
     * @param {Creep} creep 
     */
    run: function(creep) {
        let hostiles = creep.room.find(FIND_HOSTILE_CREEPS);
        
    }
};