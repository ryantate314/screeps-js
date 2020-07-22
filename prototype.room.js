const roleLongDistanceHarvester = require("./role.longDistanceHarvester");

module.exports = function() {

    /**
     * Configure the current room to begin spawning long-distance harvesters to the provided location.
     * @param {string} roomName 
     * @param {number} sourceIndex 
     * @param {number} distanceFactor 
     * @param {number} numHarvesters 
     */
    Room.prototype.addLongDistanceSource = function(roomName, sourceIndex, distanceFactor, numHarvesters) {

        distanceFactor = distanceFactor === undefined ? 0 : distanceFactor;
        numHarvesters = numHarvesters === undefined ? 1 : numHarvesters;

        this.memory.foreignEnergySources = {
            name: roomName,
            source: sourceIndex,
            minCapacity: null,
            distanceFactor: distanceFactor,
            numHarvesters: numHarvesters
        };
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
};