/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.defender');
 * mod.thing == 'a thing'; // true
 */

const bodyCosts = require("./bodyCosts");
const nameGenerator = require("./nameGenerator");
const role = require("./role.enum");

module.exports = {
    /**
     * 
     * @param {Creep} creep 
     */
    run: function(creep) {
        //Determine if we are capable of melee attack
        let canMelee = _.filter(creep.body, x => x.type == ATTACK && x.hits > 0).length > 0;

        //Determine if we have any ranged body parts (left)
        let ranged = _.filter(creep.body, x => x.type == RANGED_ATTACK && x.hits > 0).length > 0;

        let canHeal = _.filter(creep.body, x => x.type == HEAL && x.hits > 0).length > 0;

        let room = Game.rooms[creep.memory.homeRoom];

        if (creep.room.name !== creep.memory.homeRoom) {
            let exit = creep.room.findExitTo(creep.memory.homeRoom);
            creep.moveTo(creep.pos.findClosestByPath(exit));
        }

        let moveTarget = null;

        //If hostiles present, and can attack
        let hostiles = creep.room.find(FIND_HOSTILE_CREEPS)
            .concat(creep.room.find(FIND_HOSTILE_STRUCTURES));
        if (hostiles.length > 0 && (canMelee || ranged)) {

            let closestHostile = creep.pos.findClosestByPath(hostiles);
           
            if (canMelee && creep.pos.isNearTo(closestHostile)) {
                creep.attack(closestHostile);
            }
            else {
                
                if (ranged) {
                    let creepsInRange = creep.pos.findInRange(hostiles, 3);
                    if (creepsInRange.length > 2) {
                        creep.rangedMassAttack();
                    }
                    else if (creepsInRange.length == 2) {
                        creep.rangedAttack(creep.pos.findClosestByRange(creepsInRange));
                    }
                    else if (creepsInRange.length == 1) {
                        creep.rangedAttack(creepsInRange[0]);
                    }
                }

                //Shelter in a rampart if one is available, and the room is not breached
                let closestRampart = closestHostile.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: x => x.structureType == STRUCTURE_RAMPART
                });
                if (closestRampart !== null
                    && creep.pos.getRangeTo(closestRampart) <= 3)
                {
                    moveTarget = closestRampart;
                }
                else {
                    moveTarget = closestHostile;
                }
            }//End if melee
        }//End if hostiles in the room
        else if (canHeal) {
            //heal nearest wounded creep
            let woundedCreep = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
                filter: x => x.hits < x.hitsMax
                            && x.id != creep.id
            });
            if (woundedCreep != null) {
                moveTarget = woundedCreep;

                if(creep.pos.isNearTo(woundedCreep)) {
                    creep.heal(woundedCreep);
                }
                else {
                    creep.rangedHeal(woundedCreep);
                }
            }
        }
        else if (creep.hits < creep.hitsMax) {
            //Find nearest healer and move towards them
            let healer = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
                filter: x => _.filter(x.body, y => y.type == HEAL && y.hits > 0).length > 0
            });
            if (healer != null) {
                moveTarget = healer;
            }
            else if (hostiles.length > 0) {
                //As a last resort, charge the hostile creep to act as cannon fodder
                moveTarget = creep.pos.findClosestByPath(hostiles);
            }
        }

        if (moveTarget !== null) {
            creep.moveTo(moveTarget);
        }
    },//run()

    /**
     * 
     * @param {StructureSpawn} spawn 
     */
    spawn: function(spawn, desperate) {
        //Attack - 80
        //Ranged Attack - 150

        let energyAvailable = desperate ? spawn.room.energyAvailable : Math.ceil((spawn.room.energyCapacityAvailable + spawn.room.energyAvailable) / 2);

        let head = [MOVE, ATTACK];

        let attackSegment = [TOUGH, MOVE, RANGED_ATTACK, MOVE];

        let healSegment = [MOVE, HEAL];

        let body = [];
        body = body.concat(head);

        let attack = true;
        let nextSegment = attackSegment;

        while (bodyCosts.getCost(body) + bodyCosts.getCost(nextSegment) < energyAvailable) {
            body = body.concat(nextSegment);
            if (attack) {
                nextSegment = healSegment;
            }
            else {
                nextSegment = attackSegment;
            }
            attack = !attack;
        }

        body = body.sort((a, b) => {
            if (a == TOUGH && b != TOUGH) {
                return -1;
            }
            else if (b == TOUGH && a != TOUGH) {
                return 1;
            }
            return 0;
        })

        let spawnResult = spawn.spawnCreep(body, nameGenerator.nameCreep("defender"), {
            memory: {
                homeRoom: spawn.room.name,
                working: false,
                role: role.defender
            }
        });
        if (spawnResult == 0) {
            console.log("Spawning defender");
        }
    }
};