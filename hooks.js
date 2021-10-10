const EventEmitter = require('events');
const AsyncFunction = (async function() {}).constructor;
const ERROR_EVENTNAME = 'error';
const eventEmitters = {};

/**
 * Creates a hook with the given hookName that will have the given array of events.
 * @param {string} hookName 
 * @param {[string]} events 
 * @returns Object that contains the event emitter and allowed event names
 */
const createHook = (hookName, events) => {
    if (events && !Array.isArray(events)) {
        throw Error('Events argument must be an array of event names');
    }
    eventEmitters[hookName] = {
        name: hookName,
        emitter: new EventEmitter(), // EventEmitter instance
        allowedEventNames: [...events, ERROR_EVENTNAME], // Array of event names
        emit: function(eventName, ...args) {
            this.emitter.emit(eventName, ...args);
        }
    }
    return eventEmitters[hookName];
}

/**
 * Adds a listener function for the given hookName and event name
 * @param {string} hookName 
 * @param {string} eventName 
 * @param {function} func 
 */
const listenHook = (hookName, eventName, func) => {
    if (eventEmitters[hookName]) {
        const ee = eventEmitters[hookName];
        if (ee.allowedEventNames.includes(eventName)) {
            // If it is async, wrap around, so an error can be emitted if it has an exception
            if (func instanceof AsyncFunction) {
                // Doing this might make difficult to remove the listener
                ee.emitter.on(eventName, async function(...args) {
                    try {
                        await func(...args)
                    } catch (error) {
                        // Emit an error
                        ee.emitter.emit(ERROR_EVENTNAME, error);
                    }
                });
            } else {
                ee.emitter.on(eventName, function(...args) {
                    try {
                        func(...args);
                    } catch (error) {
                        ee.emitter.emit(ERROR_EVENTNAME, error);
                    }
                });
            }
        } else {
            throw Error(`Event name ${eventName} not part of allowed event names on hook: ${hookName}`);
        }
    } else {
        throw Error(`Hook with name ${hookName} does not exist`);
    }
}

const getHook = (hookName) => {
    if (eventEmitters[hookName]) {
        return eventEmitters[hookName];
    }
    throw Error(`Hook with name ${hookName} does not exist`);
}

/**
 * Calls the hooks that are listening for the given event
 * @param {string} hookName 
 * @param {string} eventName 
 * @param  {...any} args 
 */
const callHook = (hookName, eventName, ...args) => {
    const hook = getHook(hookName);
    hook.emit(eventName, ...args);
}

module.exports = {
    createHook,
    listenHook,
    callHook
}
