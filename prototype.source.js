module.exports = function() {

    Source.prototype.addContainer = function() {
        let source = this;

        let spawn = source.pos.findClosestByPath(FIND_MY_SPAWNS);

        let path = source.room.findPath(spawn.pos, source.pos, {
            ignoreCreeps: true,
            range: 1
        });

        let position = path[path.length - 1];

        console.log("Placing container at " + position.x + "," + position.y);
        source.room.createConstructionSite(position.x, position.y, STRUCTURE_CONTAINER);

    };

};