const MODULE = 'chai-eventemitter2';
const FLAG_EXPECTED_EVENTS = MODULE + '#expectedEvents';
const deepEqual = require('deep-equal');

// TODO Implement a utility method/helper that allows the user to redefine the default options of the `emit` method.
//  This is useful to avoid repetition in case the user wants, like, to always use "deepMatch" in their tests.
// TODO Implement an interface that allows the user to write asynchronous tests that emit events. (not sure if would
//  work, but maybe make an async version of `.on`)
module.exports = (options = {}) => (chai, utils) =>
{
	function isEventEmitter(subject)
	{
		return ['on', 'emit'].every(method => typeof subject?.[method] === 'function');
	}

	chai.Assertion.addProperty('eventEmitter', function()
	{
		this.assert(
			isEventEmitter(this._obj),
			"expected #{this} to have .on and .emit methods",
			"expected #{this} not to have .on and .emit methods",
		);
	});

	// TODO implement `deepMatch`[boolean][default=false] option. If set to true and `matcher` is an array of args,
	//  makes a deepEqual comparison; if false, only checks if the args in the `matcher` array are present in the event
	//  args, but ignore excess emitted args that are not present in the `matcher` (e.g. matcher `{a:1}` would match
	//  emitted args `{a:1,b:2,c:3}`)
	// TODO implement `exactMatch`[boolean][default=false] option, which compares the `matcher` array elements to the
	//  emitted args by `===` instead of value.
	// TODO implement `count`[number][default=1] option, which defines how many times a given event should be emitted
	// TODO implement `ordered`[boolean][default=false] option, that determines if the order of the events matter. i.e.
	//  if true, each expected event will only be validated if the other expected events registered before it have been
	//  emitted already.
	chai.Assertion.addMethod('emit', function(event, matcher = null, { expected = true } = {})
	{
		if (typeof event === 'object')
		{
			Object.entries(event).forEach(([ event, matcher ]) => this.emit(event, matcher));
		}
		else if (typeof event === 'string')
		{
			const expectedEvents = utils.flag(this, FLAG_EXPECTED_EVENTS)
				?? utils.flag(this, FLAG_EXPECTED_EVENTS, [])
				?? utils.flag(this, FLAG_EXPECTED_EVENTS);

			if (typeof matcher === 'object' && matcher !== null && !Array.isArray(matcher))
			{
				expected = matcher.expected;
				matcher = null;
			}

			expectedEvents.push({ event, matcher, expected, called: false, listener: null });
		}
		else
		{
			throw new Error("Invalid arguments to the '.emit'");
		}
	});

	chai.Assertion.addMethod('on', function(testingBlock)
	{
		// Setup alias for better readability
		const emitter = this._obj;

		// Before anything, assert that we are working with an event emitter
		new chai.Assertion(isEventEmitter(emitter)).to.be.true;

		// Gets the list of events to be validated
		const expectedEvents = utils.flag(this, FLAG_EXPECTED_EVENTS);

		// Start listening for events
		// Save the listeners added to the emitter so that we can remove them after the assertion
		expectedEvents.forEach(expectedEvent =>
		{
			expectedEvent.listener = function(...args)
			{
				if (expectedEvent.matcher === null
					|| typeof expectedEvent.matcher === 'function' && expectedEvent.matcher(...args)
					|| Array.isArray(expectedEvent.matcher) && deepEqual(expectedEvent.matcher, args, this)
				)
				{
					expectedEvent.called = true;
				}
			};

			emitter.on(expectedEvent.event, expectedEvent.listener);
		});

		// Runs the user code
		try
		{
			testingBlock();
		}
		catch(error)
		{
			chai.expect.fail('An error occured during .on test block: \n' + error.stack);
		}
		finally
		{
			expectedEvents.forEach(({ event, listener }) => emitter.removeListener(event, listener));
		}

		// Checks whether any registered events that were expected NOT to be emitted were actually emitted.
		const unexpectedEvents = expectedEvents.filter(({ called, expected }) => !expected && called);

		this.assert(
			unexpectedEvents.length === 0,
			'The following events were emitted but were expected not to be: '
				+ unexpectedEvents.map(({ event, matcher }) => event + (Array.isArray(matcher) ? JSON.stringify(matcher) : ''))
					.join(', '),
			'Avoid using chai-eventemitter2 with .not flag',
		);
		
		// Checks whether all registered expected events were called.
		const pendingEvents = expectedEvents.filter(({ called, expected }) => expected && !called);

		this.assert(
			pendingEvents.length === 0,
			'The following expected events were not emitted: '
				+ pendingEvents.map(({ event, matcher }) => event + (Array.isArray(matcher) ? JSON.stringify(matcher) : ''))
					.join(', '),
			'Avoid using chai-eventemitter2 with .not flag',
		);
	});
};
