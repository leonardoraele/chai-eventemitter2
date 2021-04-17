const chai = require('chai');
const { assert } = require('console');
const events = require('events');

chai.use(require('../../lib/chai-eventemitter2')());

const { expect, AssertionError } = chai;

describe('chai-eventemitter2', function()
{
	beforeEach(function()
	{
		this.emitter = new events.EventEmitter();
	});

	describe('eventEmitter property', function()
	{
		it('works in positive scenarios', function()
		{
			expect(this.emitter).to.be.an.eventEmitter;
			expect(undefined).not.to.be.an.eventEmitter;
			expect({}).not.to.be.an.eventEmitter;
		});

		it('throws in negative scenarios (not EventEmitters)', function()
		{
			expect(() => expect(this.emitter).not.to.be.an.eventEmitter).to.throw(AssertionError);
			expect(() => expect(undefined).to.be.an.eventEmitter).to.throw(AssertionError);
			expect(() => expect({}).to.be.an.eventEmitter).to.throw(AssertionError);
		});
	});

	describe('emit/on flow', function()
	{
		it('passes correct arguments in the user callback function', function()
		{
			let called = false;
			expect(this.emitter)
				.to.emit('foo')
				.on(emitter =>
				{
					emitter.emit('foo');
					expect(emitter === this.emitter).to.be.true;
					called = true;
				});
			expect(called).to.be.true;
		});

		it('assert event is emitted', function()
		{
			const assertion = expect(this.emitter).to.emit('foo');

			expect(() => assertion.on(() => this.emitter.emit('foo')))
				.not.to.throw();
			expect(() => assertion.on(() => this.emitter.emit('bar')))
				.to.throw(AssertionError);
			expect(() => assertion.on(() => {}))
				.to.throw(AssertionError);
		});

		it('assert multiple events are emitted', function()
		{
			const assertion = expect(this.emitter)
				.to.emit('foo')
				.to.emit('bar');

			expect(() => assertion.on(() =>
			{
				this.emitter.emit('foo');
				this.emitter.emit('bar');
			})).not.to.throw();

			expect(() => assertion.on(() =>
			{
				this.emitter.emit('foo');
			})).to.throw(AssertionError);

			expect(() => assertion.on(() =>
			{
				this.emitter.emit('bar');
				this.emitter.emit('baz');
			})).to.throw(AssertionError);
		});

		describe('incorrect user usage', function()
		{
			it('doesnt allow calling .on without events registered', function()
			{
				expect(() =>
				{
					expect(this.emitter)
						.on(() => {});
				}).to.throw(AssertionError);
			});

			it('handles user code exceptions', function()
			{
				expect(() =>
				{
					expect(this.emitter)
						.to.emit('foo')
						.on(() =>
						{
							throw new Error();
						});
				}).to.throw(AssertionError);
			});
		});

		describe('withArgs option', function()
		{
			describe('as an array', function()
			{
				describe('argsMatch option', function()
				{
					before(function()
					{
						this.complexObj =
						{
							num: 1,
							str: 'abc',
							nil: null,
							ary: [2, 'xyz', undefined, { a: 10, b: 20, c: 30 }],
							obj: { num: 3, str: 'text', nil: null, deep: { x: -10, y: -20, z: -30 } },
						};
					});

					describe('soft', function()
					{
						it('simple values', function()
						{
							const argsMatch = 'soft';
							const assertion = expect(this.emitter)
								.to.emit('foo', { withArgs: [1, 2, 3], argsMatch });

							expect(() => assertion.on(() => this.emitter.emit('foo', 1, 2, 3)))
								.not.to.throw();
							expect(() => assertion.on(() => this.emitter.emit('foo', 1, 2, 3, 4)))
								.not.to.throw();
							expect(() => assertion.on(() => this.emitter.emit('foo')))
								.to.throw(AssertionError);
							expect(() => assertion.on(() => this.emitter.emit('foo', 3, 2, 1)))
								.to.throw(AssertionError);

							expect(this.emitter)
								.to.emit('foo', { withArgs: [], argsMatch })
								.on(() => this.emitter.emit('foo'));
							expect(this.emitter)
								.to.emit('foo', { withArgs: [], argsMatch })
								.on(() => this.emitter.emit('foo', 1, 2, 3));
							expect(this.emitter)
								.to.emit('foo', { withArgs: [1], argsMatch })
								.on(() => this.emitter.emit('foo', 1, 2, 3));
							expect(this.emitter)
								.to.emit('foo', { withArgs: [1, 2], argsMatch })
								.on(() => this.emitter.emit('foo', 1, 2, 3));
						});

						it('complex values', function()
						{
							const argsMatch = 'soft';

							expect(this.emitter)
								.to.emit('foo', { withArgs: [], argsMatch })
								.on(() => this.emitter.emit('foo', this.complexObj));
							expect(this.emitter)
								.to.emit('foo', { withArgs: [{}], argsMatch })
								.on(() => this.emitter.emit('foo', this.complexObj));
							expect(this.emitter)
								.to.emit('foo', { withArgs: [{ num: 1 }], argsMatch })
								.on(() => this.emitter.emit('foo', this.complexObj));
							expect(this.emitter)
								.to.emit('foo', { withArgs: [{ num: 1, str: 'abc', nil: null }], argsMatch })
								.on(() => this.emitter.emit('foo', this.complexObj));
							expect(this.emitter)
								.to.emit('foo', { withArgs: [{ ary: [], obj: {} }], argsMatch })
								.on(() => this.emitter.emit('foo', this.complexObj));
							expect(this.emitter)
								.to.emit('foo', { withArgs: [{ ary: [2, 'xyz', undefined, { b: 20 }] }], argsMatch })
								.on(() => this.emitter.emit('foo', this.complexObj));
							expect(this.emitter)
								.to.emit('foo', { withArgs: [{ obj: { deep: { y: -20 } } }], argsMatch })
								.on(() => this.emitter.emit('foo', this.complexObj));
							expect(this.emitter)
								.to.emit('foo', { withArgs: [null, 1, { ary: [], obj: {} }], argsMatch })
								.on(() => this.emitter.emit('foo', null, 1, this.complexObj, 'text'));
							expect(this.emitter)
								.to.emit('foo', { withArgs: [[{a:{b:{c:1}}}, {}]], argsMatch })
								.on(() => this.emitter.emit('foo', [{_:0, a:{_:0, b:{_:0, c:1}}}, {_:0}]));
							expect(this.emitter)
								.to.emit('foo', { withArgs: [1, [2, [3, [4]]]], argsMatch })
								.on(() => this.emitter.emit('foo', 1, [2, [3, [4]]]));
						});

						it('negative scenarios', function()
						{
							const argsMatch = 'soft';

							expect(
								() => expect(this.emitter)
									.to.emit('foo', { withArgs: [this.complexObj], argsMatch })
									.on(() => this.emitter.emit('foo'))
							).to.throw(AssertionError);

							expect(
								() => expect(this.emitter)
									.to.emit('foo', { withArgs: [this.complexObj], argsMatch })
									.on(() => this.emitter.emit('foo', {}))
							).to.throw(AssertionError);

							expect(
								() => expect(this.emitter)
									.to.emit('foo', { withArgs: [[{a:{b:{c:1}}}, {}]], argsMatch })
									.on(() => this.emitter.emit('foo', [{_:0, a:{_:0, b:{_:0}}}, {_:0}]))
							).to.throw(AssertionError);
						});

						it('handles events with circular references', function()
						{
							
						});
					});

					describe('deep', function()
					{
						it('matches number of args', function()
						{
							const assertion = expect(this.emitter)
								.to.emit('foo', { withArgs: [ 1, 2, 3 ], argsMatch: 'deep' });
	
							expect(() => assertion.on(() => this.emitter.emit('foo', 1, 2, 3)))
								.not.to.throw();
							expect(() => assertion.on(() => this.emitter.emit('foo', 1, 2))) // missing args
								.to.throw(AssertionError);
							expect(() => assertion.on(() => this.emitter.emit('foo', 1, 2, 3, undefined))) // extra args
								.to.throw(AssertionError);
						});

						it('matches args array-deep', function()
						{
							const assertion = expect(this.emitter)
								.to.emit('foo', { withArgs: [ [1, [2, [3, [4]]]] ], argsMatch: 'deep' });
	
							expect(() => assertion.on(() => this.emitter.emit('foo', [1, [2, [3, [4]]]]))) // deeply equal
								.not.to.throw();
							expect(() => assertion.on(() => this.emitter.emit('foo', [1, [2, [3, []]]]))) // missing args
								.to.throw(AssertionError);
							expect(() => assertion.on(() => this.emitter.emit('foo', [1, [2, [3, [4, 5]]]]))) // extra args
								.to.throw(AssertionError);
						});

						it('matches args object-deep', function()
						{
							const assertion = expect(this.emitter)
								.to.emit('foo', { withArgs: [{ a: { b:1 } }, { c: { d:2 } }], argsMatch: 'deep' });
	
							expect(() => assertion.on(() => this.emitter.emit('foo', { a: { b:1 } }, { c: { d:2 } })))
								.not.to.throw();
							expect(() => assertion.on(() => this.emitter.emit('foo', {}, {})))
								.to.throw(AssertionError);
							expect(() => assertion.on(() => this.emitter.emit('foo', { a: { b: 1 } })))
								.to.throw(AssertionError);
							expect(() => assertion.on(() => this.emitter.emit('foo', { a: { b: 1 } }, null)))
								.to.throw(AssertionError);
							expect(() => assertion.on(() => this.emitter.emit('foo', { a: { b: 1 } }, {})))
								.to.throw(AssertionError);
							expect(() => assertion.on(() => this.emitter.emit('foo', null, { c: { d:2 } })))
								.to.throw(AssertionError);
							expect(() => assertion.on(() => this.emitter.emit('foo', { a: { b:1 } }, { c: { d:2 } }, undefined)))
								.to.throw(AssertionError);
						});
					});

					describe('exact', function()
					{
						it('matches number of arguments', function()
						{
							const argsMatch = 'exact';
							const assertion = expect(this.emitter)
								.to.emit('foo', { withArgs: [1, 2, 3], argsMatch });

							expect(() => assertion.on(() => this.emitter.emit('foo', 1, 2, 3)))
								.not.to.throw();
							expect(() => assertion.on(() => this.emitter.emit('foo')))
								.to.throw(AssertionError);
							expect(() => assertion.on(() => this.emitter.emit('foo', 1 , 2)))
								.to.throw(AssertionError);
							expect(() => assertion.on(() => this.emitter.emit('foo', 1, 2, 3, undefined)))
								.to.throw(AssertionError);
						});

						it('matches objects by reference', function()
						{
							const obj = {a: 1};
							const argsMatch = 'exact';

							const assertion = expect(this.emitter)
								.to.emit('foo', { withArgs: [obj], argsMatch });

							expect(() => assertion.on(() => this.emitter.emit('foo', obj)))
								.not.to.throw();
							expect(() => assertion.on(() => this.emitter.emit('foo', {a: 1})))
								.to.throw(AssertionError);
						});

						it('matches symbols by reference', function()
						{
							const sym = Symbol('example');
							const argsMatch = 'exact';

							const assertion = expect(this.emitter)
								.to.emit('foo', { withArgs: [sym], argsMatch });

							expect(() => assertion.on(() => this.emitter.emit('foo', sym)))
								.not.to.throw();
							expect(() => assertion.on(() => this.emitter.emit('foo', Symbol('example'))))
								.to.throw(AssertionError);
						});
					});
				});
			});

			describe('as a function', function()
			{
				it('accepts argument validation functions', function()
				{
					const assertion = expect(this.emitter)
						.to.emit('foo', { withArgs: (...args) => args.length === 2 });

					expect(() => assertion.on(() => this.emitter.emit('foo', 1, 2)))
						.not.to.throw();
					expect(() => assertion.on(() => this.emitter.emit('foo')))
						.to.throw(AssertionError);
					expect(() => assertion.on(() => this.emitter.emit('foo', 1)))
						.to.throw(AssertionError);
					expect(() => assertion.on(() => this.emitter.emit('foo', 1, 2, 3)))
						.to.throw(AssertionError);
				});

				it('makes sure the callback function is being called', function()
				{
					let called = false;

					expect(this.emitter)
						.to.emit('foo', { withArgs: () => called = true })
						.on(() => this.emitter.emit('foo'));

					expect(called).to.be.true;
				});

				it('handles function exceptions', function()
				{
					expect(() =>
					{
						expect(this.emitter)
							.to.emit('foo', { withArgs: () => { throw new Error(); } })
							.on(() => this.emitter.emit('foo'));
					}).to.throw(AssertionError);
				});
			});
		});

		describe('count option', function()
		{
			before(function ()
			{
				emitTimes = (expected, actual) => () =>
				{
					expect(this.emitter)
						.to.emit('foo', { count: expected })
						.on(() =>
						{
							for (let i = 0; i < actual; i++)
							{
								this.emitter.emit('foo');
							}
						});
				};

				this.success = (expected, actual) => expect(emitTimes(expected, actual)).not.to.throw();
				this.failure = (expected, actual) => expect(emitTimes(expected, actual)).to.throw(AssertionError);
			});

			it('as a number', function()
			{
				this.success(0, 0);
				this.success(1, 1);
				this.success(2, 2);
				this.success(3, 3);

				this.failure(0, 1);
				this.failure(0, 2);
				this.failure(1, 0);
				this.failure(1, 2);
				this.failure(2, 0);
				this.failure(2, 1);
				this.failure(2, 3);
			});

			it('as a range', function()
			{
				this.success({ min: 0, max: 0 }, 0);
				this.success({ min: 0, max: 1 }, 0);
				this.success({ min: 0, max: 1 }, 1);
				this.success({ min: 1, max: 3 }, 1);
				this.success({ min: 1, max: 3 }, 2);
				this.success({ min: 1, max: 3 }, 3);

				this.failure({ min: 0, max: 0 }, 1);
				this.failure({ min: 0, max: 1 }, 2);
				this.failure({ min: 1, max: 3 }, 0);
				this.failure({ min: 1, max: 3 }, 4);
			});

			it('a partial range', function()
			{
				// Only min
				this.success({ min: 2 }, 2);
				this.success({ min: 2 }, 3);
				this.success({ min: 2 }, 10);

				this.failure({ min: 2 }, 0);
				this.failure({ min: 2 }, 1);

				// Only max
				this.success({ max: 2 }, 0);
				this.success({ max: 2 }, 1);
				this.success({ max: 2 }, 2);

				this.failure({ max: 2 }, 3);
				this.failure({ max: 2 }, 10);
			});
		});

		describe.skip('orderMatters option', function() // Option not implemented yet
		{});
	});
});
