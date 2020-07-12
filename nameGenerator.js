/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('nameGenerator');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    nameCreep: function(name) {
        //return name + Math.floor((Math.random() * 100) + 1);
        let number = 1;
        let generatedName = "";
        do {
            generatedName = name + number;
            number++;
        } while (Game.creeps[generatedName] !== undefined);
        return generatedName;
    }
};