/*
 * Find either a filled container or an energy source.
 */

module.exports = {
    /**
     * 
     * @param {Creep} creep 
     */
    findSource: function(creep, filter) {
        filter = filter === undefined ? x => true : filter;

        let extract = null;
        let source = null;

        let energy = creep.room.find(FIND_DROPPED_RESOURCES, {
           fliter: x => x.resourceType == RESOURCE_ENERGY
        });
        let tombStones = creep.room.find(FIND_TOMBSTONES, {
            filter: x => x.store[RESOURCE_ENERGY] > 0
        });
        let structures = creep.room.find(FIND_STRUCTURES, {
            filter: x => (x.structureType == STRUCTURE_CONTAINER
                        || x.structureType == STRUCTURE_STORAGE)
                && x.store[RESOURCE_ENERGY] > 0
                    && filter(x)
        });
        let sources = creep.room.find(FIND_SOURCES, {
            filter: x => x.energy > 0
        });

        let energyObjs = _.map(energy, x => {
            return {
                obj: x,
                range: x.pos.getRangeTo(creep.pos),
                extract: () => {
                    return creep.pickup(x);
                },
                energy: x.amount,
                priority: 6
            };
        });
        let tombStoneObjs = _.map(tombStones, x => {
            return {
                obj: x,
                range: x.pos.getRangeTo(creep.pos),
                extract: () => {
                    return creep.withdraw(x, RESOURCE_ENERGY);
                },
                energy: x.store[RESOURCE_ENERGY],
                priority: 4
            };
        });
        let structureObjs = _.map(structures, x => {
            return {
                obj: x,
                range: x.pos.getRangeTo(creep.pos),
                extract: () => {
                    return creep.withdraw(x, RESOURCE_ENERGY);
                },
                energy: x.store[RESOURCE_ENERGY],
                priority: 3
            };
        });
        let sourceObjs = _.map(sources, x => {
            return {
                obj: x,
                range: x.pos.getRangeTo(creep.pos),
                extract: () => {
                    return creep.harvest(x);
                },
                energy: x.energy,
                priority: 0
            };
        });
        
        let all = [].concat(energyObjs, tombStoneObjs, structureObjs, sourceObjs)
            .sort((a, b) => {
                //Lowest score wins
                let aScore = a.range - a.priority - Math.min(2, a.energy / creep.store.getCapacity(RESOURCE_ENERGY));
                let bScore = b.range - b.priority - Math.min(2, b.energy / creep.store.getCapacity(RESOURCE_ENERGY));
                if (aScore < bScore)
                    return -1;
                else if (bScore > aScore)
                    return 1;
                else
                    return 0
            });


        if (all.length > 0) {
            source = all[0].obj;
            extract = all[0].extract;
        }

        return {
            source: source,
            extract: extract
        };
    }
};