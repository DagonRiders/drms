function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
function BinaryToArray(value)
{
	var output = [];
	for (var digit = 0; digit < 8; digit++)
	{
		output[digit] = (value >> digit) & 1;
	}
	return output;
}
function ArrayToBinary(value)
{
	var output = 0;
	for (var digit = 0; digit < 8; digit++)
	{
		output += value[digit] * (1 << digit);
	}
	return output;
}
function ReadSwitch(state, switchID)
{
	return BinaryToArray(state)[switchID] != 0;
}
function SetSwitch(state, switchID, value)
{
	var current = BinaryToArray(state);
	current[switchID] = value ? 1 : 0;
	return ArrayToBinary(current);
}