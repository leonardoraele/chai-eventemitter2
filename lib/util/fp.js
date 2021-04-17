module.exports.set = function(key, value)
{
	return subject => subject[key] = value;
}
