# node-hooks
Simple Hooks implementation for NodeJS using EventEmitter

**Usage**

You create a hook using ```createHook``` function, where you give it a string name and then an array of event string names that you want to allow in the hook.  You listen to the hook using ```listenHook``` function, where you give it the hook name, the event name you want to listen too and finally the listener function.  To call the hook in order to notify or send events to the listeners you use ```callHook``` where you give the hook name, event name, and pass in any arguments you want after that.  The listener function will get the parameters that ```callHook``` will send.  If you want to remove the listener for a specific hook event name, just use ```removeFromHook``` and give the hook name, event name, and the listener function.

Your listener function will always be wrapped with a try/catch internally, so that any error would be sent to your listener through a hook error event name.  The event name would be 'error'.  It is **always** created as part of your given array of events.  So you should always listen for error events, if you need to handle any possible errors caused by your listener function.



**Example**

```
const name = 'TestHookName'
// Creating the hook for the given events, remember that 'error' event is always added
createHook(name, ['event1', 'event2'])
// Create the listener functions
const handler1 = function() {
  console.log('from event1')
}
const handler2 = function() {
  console.log('from event2')
}
// Listen to the hook events
listenHook(name, 'event1', handler1)
listenHook(name, 'event2', handler2)
// Listen to possible error events from the same hook
listenHook(name, 'error', function(error) {
  console.log(error)
})
// Call the hook to send/notify listeners
callHook(name, 'event1', 'test event1')
callHook(name, 'event2', 'test event2')
// Remove the listeners if no longer want to listen for events
removeFromHook(name, 'event1', handler1)
removeFromHook(name, 'event2', handler2)
```
