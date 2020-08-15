const role = require('./role.enum');
const nameGenerator = require('./nameGenerator');
const sourceFinder = require('./sourceFinder');
const bodyCosts = require('./bodyCosts');
const { max } = require('lodash');

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
            //Finished emptying. Need to harvest.
            creep.memory.working = false;

            //Determine minimum carrying capacity needed to be worth it
            if (creep.memory.tripStart !== undefined) {
                let tripTime = Game.time - creep.memory.tripStart;

                const lifeTime = 1500;
                let numTrips = Math.floor(lifeTime / tripTime); //Number of trips the creep will make in its lifetime
                let costPerTrip = Math.ceil(creep.memory.cost / numTrips); //The cost of the creep which it must make back over each trip
                //console.log(creep.name + " must have a carrying capacity of " + costPerTrip + " or more.");

                creep.memory.isWorthIt = creep.store.getCapacity(RESOURCE_ENERGY) > costPerTrip;
                this._setCapacityRequired(Game.rooms[creep.memory.homeRoom], creep.memory.targetRoom, creep.memory.sourceIndex, costPerTrip);
                
                creep.memory.trips.push(tripTime);

                //If the creep won't make it there and back, go ahead and die.
                let averageTripTime = _.sum(creep.memory.trips) / creep.memory.trips.length;
                if (creep.ticksToLive < averageTripTime) {
                    creep.memory.role = role.deathMarch;
                }
            }
            creep.memory.tripStart = Game.time;
        }
        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            creep.memory.working = true;
        }
    
        if (creep.memory.working == true) {
            if (creep.room.name == creep.memory.homeRoom) {
                //Back in the home room. Do work

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
                    filter: x => (x.structureType == STRUCTURE_STORAGE
                                    || x.structureType == STRUCTURE_CONTAINER)
                                && x.store[RESOURCE_ENERGY] < x.store.getCapacity(RESOURCE_ENERGY)
                });
                //By default, prioritize closest structure
                let structures = spawning.concat(towers);

                //Prioritize spawning if energy is at half capacity
                if (creep.room.energyAvailable < creep.room.energyCapacityAvailable / 2) {
                    structures = spawning;
                }
                //If spawning and towers are full, fill up storage
                else if (spawning.length == 0 && towers.length == 0 && storage.length > 0) {
                    structures = storage;
                }
                let structure = creep.pos.findClosestByPath(structures);
                if (structure != null) {
                    if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(structure);
                    }
                }
                else {
                    //All storage is full. Hang out near spawn.
                    creep.moveTo(creep.pos.findClosestByRange(FIND_MY_SPAWNS));
                }
            }
            else {
                //Creep is not in the home room. Navigate there.
                let spawn = Game.rooms[creep.memory.homeRoom].find(FIND_MY_SPAWNS)[0];
                creep.moveTo(spawn, {
                    reusePath: 25
                });
            }
        }
        else {
            //Creep is empty. Find energy to harvest

            let stats = this._getStats(Game.rooms[creep.memory.homeRoom], creep.memory.targetRoom, creep.memory.sourceIndex);

            if (creep.room.name == creep.memory.targetRoom) {
                //Creep is in the target room
                
                //Sort by position, because find() results are non-deterministic
                let source = creep.room.find(FIND_SOURCES).sort((a, b) => {
                    if (a.pos.x > b.pos.x)
                        return -1;
                    else if (a.pos.x < b.pos.x)
                        return 1;
                    else if (a.pos.y > b.pos.y)
                        return -1;
                    else if (a.pos.y < b.pos.y)
                        return 1;
                    else
                        return 0;
                })[creep.memory.sourceIndex];
                if (source) {
                    //Found source
                    
                    //Cache position to better optimize path out of spawn room
                    if (!stats.pos) {
                        stats.pos = {
                            x: source.pos.x,
                            y: source.pos.y
                        };
                    }

                    let result = creep.harvest(source);
                    if (result == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source);
                    }
                }
                else {
                    console.log("Creep could not find source " + creep.memory.sourceIndex);
                }
            }
            else {
                //Creep is not in the target room. Navigate there
                //console.log("Moving creep to room " + creep.memory.targetRoom + " from " + creep.room.name);

                let target = null;
                if (stats.pos) {
                    //Moved to cached location to better improve pathfinding
                    target = new RoomPosition(stats.pos.x, stats.pos.y, creep.memory.targetRoom);
                }
                else {
                    //Blindly move to exit
                    let exit = creep.room.findExitTo(creep.memory.targetRoom);
                    target = creep.pos.findClosestByRange(exit);
                }
                creep.moveTo(target);
                
            }
            
        }//End if working
    },
    /**
     * 
     * @param {StructureSpawn} spawn 
     * @param {number} distanceFactor Integer describing the distance to the provided source. Affects the work/carry ratio
     * @param {number} energy
     * @param {string} targetRoomName
     * @param {string} sourceIndex Which source in the room to target.
     */
    spawn: function(spawn, distanceFactor, targetRoomName, sourceIndex) {
        
        let energy = spawn.room.energyCapacityAvailable;

        let body = [];
        let numWorkUnits = 5 - Math.min(distanceFactor, 3);
        for (let i = 0; i < numWorkUnits; i++) {
            body.push(WORK);
            body.push(MOVE);
        }

        let remainingEnergy = energy - bodyCosts.getCost(body);
        let numSegments = Math.floor(remainingEnergy / bodyCosts.getCost([MOVE, CARRY]));
        if (numSegments == 0) {
            console.log("Add energy or increase distance factor to spawn long distance harvester to " + targetRoomName + "[" + sourceIndex + "]");
            return;
        }
        for (let i = 0; i < numSegments; i++) {
            body.push(CARRY);
            body.push(MOVE);
        }

        let stats = this._getStats(spawn.room, targetRoomName, sourceIndex);

        const capacityPerSegment = 50;
        let estimatedCapacity = numSegments * capacityPerSegment;
        if (stats.minCapacity != null && estimatedCapacity < stats.minCapacity) {
            console.log("Spawning a long distance harvester to " + targetRoomName + "[" + sourceIndex + "] wouldn't have been worth it.");
            return;
        }
        
        let name = spawn.createCreep(body, nameGenerator.nameCreep(targetRoomName + '-harvester'), {
            role: role.longDistanceHarvester,
            working: false,
            homeRoom: spawn.room.name,
            targetRoom: targetRoomName,
            sourceIndex: sourceIndex,
            //Indicates the time taken for each trip
            trips: [],
            cost: bodyCosts.getCost(body)
        });
        if (isNaN(name)) {
            console.log("Spawning harvester " + name);
        }
    },
    /**
     * Retrieve the long distance stats for the provided source.
     * @param {Room} sourceRoom The spawn room.
     * @param {string} targetRoomName The name of the room containing the source.
     * @param {number} sourceIndex The source inside the room.
     */
    _getStats: function(sourceRoom, targetRoomName, sourceIndex) {
        let source = _.find(sourceRoom.memory.foreignEnergySources, x => x.name == targetRoomName
            && x.sourceIndex == sourceIndex);
        return source;
    },
    /**
     * Save the calculated energy cost to ensure future creeps are big enough to warrant long
     * distance harvesting.
     * @param {Room} sourceRoom 
     * @param {*} targetRoomName 
     * @param {*} sourceIndex 
     * @param {*} capacity 
     */
    _setCapacityRequired: function(sourceRoom, targetRoomName, sourceIndex, capacity) {
        let source = this._getStats(sourceRoom, targetRoomName, sourceIndex);
        if (source) {
            source.minCapacity = Math.ceil((source.minCapacity + capacity) / 2);
        }
    }

};