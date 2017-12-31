var sensors = [];
var switches = [];
var states = [];
var rooms = [];
var weather = {};

function toggle(togglePack, toggleSwitch)
{
	console.log("Toggling pack " + togglePack + " switch " + toggleSwitch);
	states[togglePack] = SetSwitch(
		states[togglePack], 
		toggleSwitch, 
		ReadSwitch(states[togglePack], toggleSwitch) == true ? false : true
	);
	publishValue(server, "state." + togglePack, states[togglePack]);
}

function showRoom(roomID)
{
	$("#switches, #switchesHeading").show();
	$(".room").removeClass("active");
	$("#room" + roomID).addClass("active");

	if (roomID == 0)
	{
		$(".switch").show();
		$(".sensor").show();
	}
	else
	{
		packs.forEach(function (pack) {
			if (pack.roomID == roomID)
			{
				$(".pack" + pack.packID).show();
			}
			else
			{
				$(".pack" + pack.packID).hide();
			}
		});
	}
}

function draw(target)
{
	return function(err, rendered) {
      if(err) throw err;
      $(target).html(rendered);
    }
}

function init()
{
	console.log("Loading...");

	subscribeValue(server, "switches", function (value) {
		switches = JSON.parse(value);
		ejs.renderAsync("views/switches.ejs", {"switches": switches}, draw("#switches"));
	});

	subscribeValue(server, "sensors", function (value) {
		sensors = JSON.parse(value);
		ejs.renderAsync("views/sensors.ejs", {"sensors": sensors}, draw("#sensors"));

		sensors.forEach(function (sensor)
		{
			unsubscribeValue(sensor); // Remove any existing subscription
			subscribeValue(server, "sensor." + sensor.sensorID, function (value) {
				$("#s" + sensor.sensorID).text(sensor.name + ": " + parseFloat(value).toFixed(1) + "°" + sensor.unit); 
			});
		});
	});

	subscribeValue(server, "weather", function (value) {
		weather = JSON.parse(value);
		ejs.renderAsync("views/weather.ejs", {"weather": weather}, function (err, rendered) {
			draw("#weather")(err, rendered);
			// Load and run animated icons
			var skycons = new Skycons({"color": "#80ffcA"});
			skycons.add("tdIcon", weather.tdIcon);
			skycons.add("tmIcon", weather.tmIcon);
			skycons.play();	
		});
	});

	subscribeValue(server, "rooms", function (value) {
		rooms = JSON.parse(value);
		ejs.renderAsync("./views/rooms.ejs", {"rooms": rooms}, draw("#rooms"));
	});

	subscribeValue(server, "packs", function (value) {
		packs = JSON.parse(value);
		packs.forEach(function (pack)
		{
			subscribeValue(server, "state." + pack.packID, function (value) {
				states[pack.packID] = value;

				switches.forEach(function (item)
				{
					if (!item.enabled) { return; }
					$("#pack" + item.packID + "switch" + item.swID).removeClass("active");
					if (ReadSwitch(states[item.packID], item.swID))
					{
						$("#pack" + item.packID + "switch" + item.swID).addClass("active");
					}
				});
			});
		});
	});
}
