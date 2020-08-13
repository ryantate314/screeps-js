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

        //Find dropped resources along the path.
        let energy = creep.room.find(FIND_DROPPED_RESOURCES, {
           fliter: x => x.resourceType == RESOURCE_ENERGY
                && x.pos.isNearTo(creep.pos)
        });
        let tombStones = creep.room.find(FIND_TOMBSTONES, {
            filter: x => x.store[RESOURCE_ENERGY] > 0
                    && x.pos.isNearTo(creep.pos)
        });
        if (energy.length > 0) {
            source = energy[0];
            extract = () => {
                return creep.pickup(source);
            };
        }
        else if (tombStones.length > 0) {
            source = tombStones[0];
            extract = () => {
                creep.withdraw(source, RESOURCE_ENERGY);
            };
        }
        else {
            //No dropped resources nearby

            let container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: x => (x.structureType == STRUCTURE_CONTAINER
                            || x.structureType == STRUCTURE_STORAGE)
                    && x.store[RESOURCE_ENERGY] > 0
                        && filter(x)
            });
            source = creep.pos.findClosestByPath(FIND_SOURCES, {
                filter: x => x.energy > 0 && filter(x)
            });
            let sourceDistance = creep.pos.getRangeTo(source);
    
            extract = () => {
                return creep.harvest(source);
            };
            
            if (container) {
                let containerDistance = creep.pos.getRangeTo(container);
                //Choose the container if it's closer, as the crow files. Would like to do this by path length
                //Handle the case where there are no flowing energy sources by checking for nan
                if (isNaN(sourceDistance) || containerDistance < (sourceDistance + 2)) {
                    //console.log(creep.name + " found a container");
                    source = container;
                    extract = () => {
                        return creep.withdraw(container, RESOURCE_ENERGY);
                    };
                }
            }
        }

        return {
            source: source,
            extract: extract
        };
    }
};