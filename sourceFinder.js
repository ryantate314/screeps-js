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

        let container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: x => x.structureType == STRUCTURE_CONTAINER
                && x.store[RESOURCE_ENERGY] > 0
                    && filter(x)
        });
        let source = creep.pos.findClosestByPath(FIND_SOURCES, {
            filter: x => filter(x)
        });
        let sourceDistance = creep.pos.getRangeTo(source);

        let extract = () => {
            return creep.harvest(source);
        };
        
        if (container) {
            let containerDistance = creep.pos.getRangeTo(container);
            //Choose the container if it's closer, as the crow files. Would like to do this by path length
            if (containerDistance < sourceDistance) {
                console.log(creep.name + " found a container");
                source = container;
                extract = () => {
                    return creep.withdraw(container, RESOURCE_ENERGY);
                };
            }
        }

        return {
            source: source,
            extract: extract
        };
    }
};