const MODULE = 'chai-eventemitter2';
const FLAG_EXPECTED_EVENTS = MODULE + '#expectedEvents';
const { AssertionError } = require('chai');
const deepEqual = require('deep-equal');
const isMatch = require('lodash.ismatch');
const groupBy = require('lodash.groupby');
const { set } = require('./util/fp');

// TODO Implement a utility method/helper that allows the user to redefine the default options of the `emit` method.
//  This is useful to avoid repetition in case the user wants, like, to always use "deepMatch" in their tests.
// TODO Implement an interface that allows the user to write asynchronous tests that emit events. (not sure if would
//  work, but maybe make an async version of `.on`)
// IMPORTANT Do not work with the `not` flag
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

	chai.Assertion.addMethod(
		'emit',
		function(event, options = {})
		{
			// TODO Validate arguments

			const registeredExpectations = utils.flag(this, FLAG_EXPECTED_EVENTS)
				?? utils.flag(this, FLAG_EXPECTED_EVENTS, [])
				?? utils.flag(this, FLAG_EXPECTED_EVENTS);

			options.argsMatch = options.argsMatch ?? 'soft';
			options.count = options.count ?? { min: 1, max: 1 };
			options.orderMatters = options.orderMatters ?? false;
			options.withArgs = options.withArgs ?? null;

			if (typeof options.count === 'object')
			{
				options.count.min = options.count.min ?? 0;
				options.count.max = options.count.max ?? Number.POSITIVE_INFINITY;
			}
			else
			{
				options.count = { min: options.count, max: options.count}
			}

			registeredExpectations.push({ event, options });
		},
	);

	chai.Assertion.addMethod('on', function(testingBlock)
	{
		// Setup alias for better readability
		const emitter = this._obj;

		// Before anything, assert that we are working with an event emitter
		new chai.Assertion(isEventEmitter(emitter)).to.be.true;

		// Gets the list of events to be validated
		const expectedEvents = utils.flag(this, FLAG_EXPECTED_EVENTS);

		if (!expectedEvents || !expectedEvents.length)
		{
			throw new AssertionError("No events registered. Use '.emit' before calling '.on'");
		}

		// Init
		const errors = [];
		const listeners = [];
		expectedEvents.forEach(set('callCount', 0));

		// Start listening for events
		// Save the listeners added to the emitter so that we can remove them after the assertion
		Object.entries(groupBy(expectedEvents, 'event'))
			.forEach(([event, expectations]) =>
			{
				const handler = function(...args)
				{
					const expectedEvent = expectations.find(expectation => expectedArgumentsMatch(args, expectation));

					if (expectedEvent)
					{
						expectedEvent.callCount++;
					}
					else
					{
						let argsMessage = '';

						try
						{
							argsMessage = `Arguments: ${JSON.stringify(args)}`;
						} catch(e) {}

						errors.push(`Event ${event} was emitted but it doesn't match any of the registered expectations. ${argsMessage}`);
					}
				};

				listeners.push({ event, handler });
				emitter.on(event, handler);
			});

		// Runs the user code
		try
		{
			testingBlock(emitter);
		}
		catch(error)
		{
			chai.expect.fail('An error occured during .on test block: \n' + error.stack);
		}
		finally
		{
			listeners.forEach(({ event, handler }) => emitter.removeListener(event, handler));
		}

		// Validates errors
		this.assert(
			!errors.length,
			JSON.stringify(errors),
		);

		// Validates if expectations were met
		expectedEvents.forEach(expectedEvent => this.assert(
			expectedEvent.callCount >= expectedEvent.options.count.min
				&& expectedEvent.callCount <= expectedEvent.options.count.max,
			`Event ${expectedEvent.event} was called ${expectedEvent.callCount} times. Expected ${JSON.stringify(expectedEvent.options.count)}.`,
		));
	});
};

function expectedArgumentsMatch(args, expectedEvent)
{
	if (typeof expectedEvent.options.withArgs === 'function')
	{
		try
		{
			return expectedEvent.options.withArgs(...args);
		}
		catch (e)
		{
			console.error(`eventemitter2: Your 'withArgs' callback for event '${expectedEvent.event}' threw an error:`, e);
			return false;
		}
	}
	else if (Array.isArray(expectedEvent.options.withArgs))
	{
		return ARG_MATCHERS[expectedEvent.options.argsMatch](args, expectedEvent.options.withArgs);
	}

	return true;
}

const ARG_MATCHERS =
{
	soft(args, withArgs)
	{
		return isMatch(args, withArgs);
	},
	deep(args, withArgs)
	{
		return deepEqual(args, withArgs);
	},
	exact(args, withArgs)
	{
		return args.length === withArgs.length
			&& withArgs.every((_, i) => withArgs[i] === args[i]);
	},
};
