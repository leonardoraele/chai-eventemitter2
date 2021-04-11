module.exports = function hasStructure(subject, structure)
{
	if (Array.isArray(structure))
	{
		return Array.isArray(subject) && structure.every((_, i) => hasStructure(subject[i], structure[i]));
	}
	else if (typeof structure === 'object' && structure !== null)
	{
		return typeof subject === 'object'
			&& subject !== null
			&& hasStructure(
				Object.entries(subject)
					.filter(([key]) => key in structure),
				Object.entries(structure),
			);
	}

	return structure === subject;
}
