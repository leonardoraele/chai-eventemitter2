const { should } = require('chai');
const hasStructure = require("../../lib/has-structure");

describe('has-structure', function()
{
	before(should);

	it('compares equal simple values', function()
	{
		const symbol = Symbol();
		const fn = function() {};

		hasStructure(0, 0).should.be.true;
		hasStructure(1, 1).should.be.true;
		hasStructure('', '').should.be.true;
		hasStructure('xyz', 'xyz').should.be.true;
		hasStructure(null, null).should.be.true;
		hasStructure(undefined, undefined).should.be.true;
		hasStructure(symbol, symbol).should.be.true;
		hasStructure(true, true).should.be.true;
		hasStructure(false, false).should.be.true;
		hasStructure(fn, fn).should.be.true;
	});

	it('compares different simple values', function()
	{
		hasStructure(0, 1).should.be.false;
		hasStructure('', 'xyz').should.be.false;
		hasStructure(null, undefined).should.be.false;
		hasStructure(Symbol(), Symbol()).should.be.false;
		hasStructure(true, false).should.be.false;
		hasStructure((() => {}), (() => {})).should.be.false;
	});

	it('compares equivalent arrays and objects', function()
	{
		hasStructure([1, true, {}, [], 'a', null], [1, true, {}, [], 'a', null]).should.be.true;
		hasStructure(
			{a:1, b:2, c:3, d:{ e:null, f:''}, g:[1, true, {}, [], 'a', null]},
			{a:1, b:2, c:3, d:{ e:null, f:''}, g:[1, true, {}, [], 'a', null]},
		).should.be.true;
	});

	it('compares same-reference arrays and objects', function()
	{
		const a = [1, true, {}, [], 'a', null];
		const o = {a:1, b:2, c:3, d:{ e:null, f:''}};

		hasStructure(a, a).should.be.true;
		hasStructure(o, o).should.be.true;
	});

	it('compares partially equal arrays and objects', function()
	{
		hasStructure({a:1,b:2,c:3}, {}).should.be.true;
		hasStructure([1, 2, 3], []).should.be.true;
		hasStructure({a:1,b:2,c:3}, {a:1,b:2}).should.be.true;
		hasStructure([1, 2, 3], [1, 2]).should.be.true;
		hasStructure({a:1,b:{c:'s',d:null},e:3}, {b:{c:'s'}}).should.be.true;
		hasStructure([1, {a:2,b:[3,4,5]}, 6], [1, {b:[3]}]).should.be.true;
		hasStructure({a:1,b:2,c:3}, {d:4}).should.be.false;
		hasStructure([1, 2, 3], [4]).should.be.false;
	});
});
