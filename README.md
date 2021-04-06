# chai-eventemitter2
This is a [chai](chai) plugin for testing node-style [EventEmitters](node-eventemitter).

## Install

⚠️ I'm still testing this plugin; it's not in npm yet.

## Usage

With [Expect](chai-bdd-api):

```js
const emitter = new EventEmitter();

expect(emitter)
	.to.emit('foo')
	.to.emit('bar', {count: 2})
	.to.emit('baz', {withArgs: ['X', 'Y', 'Z']})
	.on(() =>
	{
		emitter.emit('foo');
		emitter.emit('bar');
		emitter.emit('bar');
		emitter.emit('baz', 'X', 'Y', 'Z');
	});
```

With [Should](chai-bdd-api):

```js
const emitter = new EventEmitter();

emitter.should
	.emit('foo')
	.emit('bar', {count: 2})
	.emit('baz', {withArgs: ['X', 'Y', 'Z']})
	.on(() =>
	{
		emitter.emit('foo');
		emitter.emit('bar');
		emitter.emit('bar');
		emitter.emit('baz', 'X', 'Y', 'Z');
	});
```

## Disclaimer

Inspired by [fengb/chai-eventemitter](chai-eventemitter).

## License

MIT

<!-- Links: -->
[chai]: chaijs.com
[chai-bdd-api]: https://www.chaijs.com/api/bdd/
[chai-eventemitter]: https://github.com/fengb/chai-eventemitter
[node-eventemitter]: https://nodejs.org/api/events.html
