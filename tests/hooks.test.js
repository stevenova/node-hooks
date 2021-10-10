const assert = require('assert');
const { createHook, listenHook, callHook } = require('../hooks');

describe('Hooks', function() {

    it('should create a hook and emit', function(done) {
        const hookName = 'TestHook';
        const eventEmitterObject = createHook(hookName, ['testBefore', 'testAfter', 'testOn']);
        listenHook(hookName, 'testBefore', function(a, b) {
            assert.strictEqual(a, 2);
            assert.strictEqual(b, 8);
        });
        listenHook(hookName, 'testAfter', function(a, b) {
            assert.strictEqual(a, 3);
            assert.strictEqual(b, 9);
        });
        listenHook(hookName, 'testOn', function(a, b) {
            assert.strictEqual(a, 9);
            assert.strictEqual(b, 8);
            done();
        });
        // Emit using EventEmitter instance
        eventEmitterObject.emitter.emit('testBefore', 2, 8);
        eventEmitterObject.emitter.emit('testAfter', 3, 9);
        // Emit using the object's helper function
        eventEmitterObject.emit('testOn', 9, 8);
    })

    it('should create a hook and callHook', function(done) {
        const hookName = 'TestHook';
        createHook(hookName, ['testBefore', 'testAfter', 'testOn']);
        listenHook(hookName, 'testBefore', function(a, b) {
            assert.strictEqual(a, 2);
            assert.strictEqual(b, 8);
        });
        listenHook(hookName, 'testAfter', function(a, b) {
            assert.strictEqual(a, 3);
            assert.strictEqual(b, 9);
        });
        listenHook(hookName, 'testOn', function(a, b) {
            assert.strictEqual(a, 9);
            assert.strictEqual(b, 8);
            done();
        });

        // Call the hooks using callHook
        callHook(hookName, 'testBefore', 2, 8);
        callHook(hookName, 'testAfter', 3, 9);
        callHook(hookName, 'testOn', 9, 8);
    })

    it('should create a hook and callHook an async function', function(done) {
        const hookName = 'TestHook';
        createHook(hookName, ['testBefore', 'testAfter']);
        const asyncFunction = async function(a, b) {
            setTimeout(function() {
                console.log(`1) ${a} ${b}`)
                console.log('Finished async')
                done()
            }, 20)
        }
        listenHook(hookName, 'testBefore', asyncFunction);
        listenHook(hookName, 'testAfter', function(a, b) {
            console.log('2) sync');
            console.log(`a: ${a} b: ${b}`);
            assert.strictEqual(a, 3);
            assert.strictEqual(b, 9);
        });

        // Call the hooks using callHook
        callHook(hookName, 'testBefore', 2, 8);
        callHook(hookName, 'testAfter', 3, 9);
    });

    it('should handle the error event on async handlers', function(done) {
        const hookName = 'TestHook';
        createHook(hookName, ['testThrow']);
        const asyncFunction = async function() {
            throw Error('Test throw in asyncFunction');
        }
        const errorHandler = function(error) {
            assert.ok(error);
            done();
        }
        // Handle the error hook
        listenHook(hookName, 'error', errorHandler);
        listenHook(hookName, 'testThrow', asyncFunction);

        callHook(hookName, 'testThrow', true);
    });

    it('should handle the error event on synchronous handlers', function(done) {
        const hookName = 'TestHook';
        createHook(hookName, ['testThrow']);
        const syncFunction = function() {
            throw Error('Test throw in synchronous Function');
        }
        const errorHandler = function(error) {
            assert.ok(error);
            done();
        }
        // Handle the error hook
        listenHook(hookName, 'error', errorHandler);
        listenHook(hookName, 'testThrow', syncFunction);

        callHook(hookName, 'testThrow', true);
    });

});
