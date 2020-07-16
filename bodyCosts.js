module.exports = {
    _getCost: function(part) {
        let cost = 50;
        switch (part) {
            case WORK:
                cost = 100;
                break;
            case ATTACK:
                cost = 80;
                break;
            case RANGED_ATTACK:
                cost = 150;
                break;
            case HEAL:
                cost = 250;
                break;
            case CLAIM:
                cost = 600;
                break;
            case TOUGH:
                cost = 10;
                break;
        }
        return cost;
    },
    /**
     * 
     * @param {array} parts 
     */
    getCost: function(parts) {
        let total = 0;
        for (let part of parts) {
            total += this._getCost(part);
        }
        return total;
    },
    /**
     * Returns a body for a balanced creep with the available energy.
     * @param {int} availableEnergy 
     */
    generateBalancedCreep: function(availableEnergy) {
        let parts = [];
        let numSegments = Math.floor(availableEnergy / this.getCost([WORK, CARRY, MOVE]));
        for (let i = 0; i < numSegments; i++) {
            parts.push(WORK);
            parts.push(CARRY);
            parts.push(MOVE);
        }
        return parts;
    }
};