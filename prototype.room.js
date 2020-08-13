const roleLongDistanceHarvester = require("./role.longDistanceHarvester");
const memoryCache = require("./memoryCache");
const roleDefender = require("./role.defender");

module.exports = function() {

    /**
     * Configure the current room to begin spawning long-distance harvesters to the provided location.
     * @param {string} roomName 
     * @param {number} sourceIndex 
     * @param {number} distanceFactor 
     * @param {number} numHarvesters 
     */
    Room.prototype.addLongDistanceSource = function(roomName, sourceIndex, distanceFactor, numHarvesters) {
        let room = this;

        if (room.memory.foreignEnergySources === undefined) {
            room.memory.foreignEnergySources = [];
        }

        //Delete duplicates and overwrite
        room.memory.foreignEnergySources = _.filter(room.memory.foreignEnergySources, x => x.name !== roomName
                                                                                        && x.sourceIndex !== sourceIndex);
        
        distanceFactor = distanceFactor === undefined ? 0 : distanceFactor;
        numHarvesters = numHarvesters === undefined ? 1 : numHarvesters;

        let source = {
            name: roomName,
            sourceIndex: sourceIndex,
            minCapacity: null,
            distanceFactor: distanceFactor,
            numHarvesters: numHarvesters
        };

       
        room.memory.foreignEnergySources.push(source);
    };

    Room.prototype.sumStorage = function() {
        let room = this;

        let storageStructures = room.find(FIND_STRUCTURES, {
            filter: x => x.structureType == STRUCTURE_STORAGE
        });
        return _.sum(_.map(storageStructures, x => x.store[RESOURCE_ENERGY]));
    }

    /**
     * Display the change in available energy storage for the current room.
     */
    Room.prototype.showStorageStats = function() {
        let room = this;

        let stats = room.memory.storageStats;
        let storage = room.sumStorage();

        let hundred = (storage - stats[100]) / stats[100];
        let thousand = (storage - stats[1000]) / stats[1000];
        let tenThousand = (storage - stats[10000]) / stats[10000];

        return hundred.toFixed(3) + " " + thousand.toFixed(3) + " " + tenThousand.toFixed(3);
    };

    Room.prototype.smartLookForAt = function() {
        //TODO implement cached version of lookForAt()
    };

    //Determine if the room is unsecured
    Room.prototype.isBreached = function() {
        let room = this;

        return memoryCache.getOrLookup(room, "breached", () => {
            let breached = false;

            //Mark ramparts as walkable
            let costMatrix = new PathFinder.CostMatrix();
            room.find(FIND_STRUCTURES).forEach(x => {
                //Contains are the only walkable structure
                if (x.structureType !== STRUCTURE_CONTAINER) {
                    costMatrix.set(x.pos.x, x.pos.y, 255);
                }
            });
            room.find(FIND_CREEPS).forEach(x => {
                costMatrix.set(x.pos.x, x.pos.y, 255);
            });

            let hostiles = room.find(FIND_HOSTILE_CREEPS);
            if (hostiles.length > 0) {

                let spawns = room.find(FIND_MY_STRUCTURES, {
                    filter: x => x.structureType == STRUCTURE_SPAWN
                });
                for (let spawn of spawns) {
                    if (breached)
                        break;

                    for (let hostile of hostiles) {
                        let path = room.findPath(spawn, hostile, {
                            ignoreCreeps: true,
                            costCallback: (roomName, costMatrix) => {
                                if (roomName === room.name) {
                                    return costMatrix;
                                }
                            }
                        });

                        if (!path.incomplete) {
                            breached = true;
                            break;
                        }
                    }//foreach hostile
                }//foreach spawn
            }//If there are hostiles present

            return {
                value: breached,
                duration: 5
            };
        });
    };

    Room.prototype.spawnDefender = function() {
        let room = this;
        
        roleDefender.spawn(room.find(FIND_MY_SPAWNS)[0], false);
    };

};