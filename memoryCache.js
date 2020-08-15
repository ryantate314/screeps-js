module.exports = {
    /**
     * 
     * @param {Creep | Room | StructureSpawn} object 
     * @param {string} key
     * @param {() => {value: string, duration: number}} lookup Function to set the value.
     */
    getOrLookup: function(object, key, lookup) {
        if (object.memory[key] === undefined
            || Game.time > object.memory[key].added + object.memory[key].duration)
        {
            let data = lookup();
            object.memory[key] = {
                value: data.value,
                added: Game.time,
                duration: data.duration
            };
        }

        return object.memory[key].value;
    }
};