const chai = require('chai');
const events = require('events');

chai.use(require('.')());

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

	describe('emit method', function()
	{
		it('captures the correct event', function()
		{
			expect(this.emitter).to.emit('foo').on(() => this.emitter.emit('foo'));
			// expect(emitter).not.to.emit('foo').on(() => emitter.emit('bar'));
			expect(
				() => expect(this.emitter).to.emit('foo').on(() => this.emitter.emit('bar'))
			).to.throw(AssertionError);
			expect(() => expect(this.emitter).to.emit('foo').on(() => {})).to.throw(AssertionError);
		});

		it('handles multiple event assertions', function()
		{
			expect(this.emitter)
				.to.emit('foo').and
				.to.emit('bar')
				.on(() =>
				{
					this.emitter.emit('foo');
					this.emitter.emit('bar');
				});

			// expect(emitter)
			// 	.to.emit('foo')
			// 	.but.not.to.emit('bar')
			// 	.on(() => emitter.emit('foo'));

			expect(
				() => expect(this.emitter)
					.to.emit('foo').and
					.to.emit('bar')
					.on(() => this.emitter.emit('foo'))
			).to.throw(AssertionError);
		});

		it('validates lists of arguments', function()
		{
			const assertion = expect(this.emitter).to.emit('foo', [1, 2, 3]);

			assertion.on(() => this.emitter.emit('foo', 1, 2, 3));
			expect(
				() => assertion.on(() => this.emitter.emit('foo', 3, 2, 1))
			).to.throw(AssertionError);

			expect(this.emitter).to.emit('foo', []).on(() => this.emitter.emit('foo'));

			expect(this.emitter).to.emit('foo', [{a:1,b:2,c:3}]).on(() => this.emitter.emit('foo', {a:1,b:2,c:3}));
		});

		it('accepts argument validation functions', function()
		{
			const assertion = expect(this.emitter).to.emit('foo', (...args) => args.length === 3);

			assertion.on(() => this.emitter.emit('foo', 1, 2, 3));
			expect(
				() => assertion.on(() => this.emitter.emit('foo'))
			).to.throw(AssertionError);
		});

		it('allows describing multiple events at once', function()
		{
			const _symbol = Symbol();

			const assertion = expect(this.emitter).to.emit(
			{
				foo: true,
				bar: false,
				baz: [1, 2, 3],
				boo: arg0 => arg0 === _symbol,
			});

			assertion.on(() =>
			{
				this.emitter.emit('foo');
				// not emit 'bar'
				this.emitter.emit('baz', 1, 2, 3);
				this.emitter.emit('boo', _symbol);
			});

			expect(
				() => assertion.on(() =>
				{
					this.emitter.emit('foo');
					this.emitter.emit('bar'); // illegal
					this.emitter.emit('baz', 1, 2, 3);
					this.emitter.emit('boo', _symbol);
				})
			).to.throw(AssertionError);

			expect(
				() => assertion.on(() => {})
			).to.throw(AssertionError);
		});
	});
});
