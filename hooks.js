const EventEmitter = require('events');
const AsyncFunction = (async function() {}).constructor;
const ERROR_EVENTNAME = 'error';
const eventEmitters = {};
const listeners = {};

/** Creates a tracking object that stores the original listener and the wrapped one */
const createListenerObject = (wrappedFunction, listenerFunction) => {
    return {
        wrappedFunction: wrappedFunction,
        originalListener: listenerFunction
    }
}

const getTrackedListener = (hookName, eventName, listener) => {
    if (!listeners[hookName]) {
        throw Error(`No hook with name of ${hookName}.`);
    }
    if (!listeners[hookName][eventName]) {
        throw Error(`No event name ${eventName} for hook ${hookName}. Cannot remove the given look listener`);
    }
    return listeners[hookName][eventName].find(to => to.originalListener === listener);
}

/** Adds the wrapped listener reference to tracking object */
const trackListener = (hookName, eventName, listenerObject) => {
    if (!listeners[hookName]) {
        listeners[hookName] = {}
    }
    if (!listeners[hookName][eventName]) {
        listeners[hookName][eventName] = []
    }
    listeners[hookName][eventName].push(listenerObject);
}

/** Removes listener reference from tracking object */
const untrackListener = (hookName, eventName, listenerObject) => {
    if (!listeners[hookName]) {
        throw Error(`No hook with name of ${hookName}. Cannot untrack the given hook listener`);
    }
    if (!listeners[hookName][eventName]) {
        throw Error(`No event name ${eventName} for hook ${hookName}. Cannot untrack the given hook listener`);
    }
    if (listeners[hookName][eventName]) {
        const listenersArray = listeners[hookName][eventName];
        const index = listenersArray.indexOf(listenerObject);
        if (index > -1) {
            listenersArray.splice(index, 1);
        }
    }
}

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
    const ee = getHook(hookName);
    if (ee) {
        if (ee.allowedEventNames.includes(eventName)) {
            let wrappedFunction = null;
            // If it is async, wrap around, so an error can be emitted if it has an exception
            if (func instanceof AsyncFunction) {
                wrappedFunction = async function(...args) {
                    try {
                        await func(...args)
                    } catch (error) {
                        // Emit an error
                        ee.emitter.emit(ERROR_EVENTNAME, error);
                    }
                }
                ee.emitter.on(eventName, wrappedFunction);
            } else {
                wrappedFunction = function(...args) {
                    try {
                        func(...args);
                    } catch (error) {
                        ee.emitter.emit(ERROR_EVENTNAME, error);
                    }
                }
                ee.emitter.on(eventName, wrappedFunction);
            }
            // Track the given listener function
            trackListener(hookName, eventName, createListenerObject(wrappedFunction, func));
        } else {
            throw Error(`Event name ${eventName} not part of allowed event names on hook: ${hookName}`);
        }
    }
}

/** Removes the given listener function from the given hook name and event name */
const removeFromHook = (hookName, eventName, func) => {
    const trackedListener = getTrackedListener(hookName, eventName, func);
    if (trackedListener) {
        const hook = getHook(hookName);
        hook.emitter.off(eventName, trackedListener.wrappedFunction);
        untrackListener(hookName, eventName, trackedListener);
    }
}

/** Gets the hook object for the given name */
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
    if (hook) {
        hook.emit(eventName, ...args);
    }
}

module.exports = {
    createHook,
    listenHook,
    removeFromHook,
    callHook
}
