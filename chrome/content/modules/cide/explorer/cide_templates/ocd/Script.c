/**
	Rock
	Basic construction material and weapon.
	
	@author -
*/

protected func Construction()
{
	var graphic = Random(10);
	if(graphic)
		SetGraphics(Format("%d",graphic));
}

protected func Hit(x, y)
{
	StonyObjectHit(x,y);
	return true;
}

local Collectible = 1;
local Name = "$Name$";
local Description = "$Description$";
local Rebuy = true;
local Plane = 450;
