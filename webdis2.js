var subscriptions = {};

function publishValue(server, key, value)
{
	console.log("Writing " + value + " to " + key);
	var setSocket = new WebSocket("ws://" + server.address + "/.json");
	setSocket.onopen = function() {
		console.log("SETing '" +value + "' to key " + key);
		setSocket.send(JSON.stringify(["SET", key, value]));
	};
	var publishSocket = new WebSocket("ws://" + server.address + "/.json");
	publishSocket.onopen = function() {
		console.log("PUBLISHing '" +value + "' to key " + key);
		publishSocket.send(JSON.stringify(["PUBLISH", key, value]));
	};
}

function getValue(server, key, callback, retry)
{
	var gotResult = false;

	var getSocket = new WebSocket("ws://" + server.address + "/.json");
	getSocket.onmessage = function(messageEvent) {
		gotResult = true;
		var result = JSON.parse(messageEvent.data);
		console.log("Got " + key + ": " + result.GET);
		callback(result.GET);
	};
	getSocket.onopen = function() {
		console.log("GETing " + key);
		getSocket.send(JSON.stringify(["GET", key]));
	};
	getSocket.onerror = function (event)
	{
		console.log("ERROR");
		console.log(event);
	};

	// Check if the connection has been successful and retry if not
	setTimeout(function () {
		if (!gotResult && retry)
		{
			console.log("Failed to GET " + key);
			console.log("State " + getSocket.readyState);
			console.log("Buffered amount: " + getSocket.bufferedAmount);

			// we've not managed to connect
			getSocket.close();

			// Retry connecting
			console.log("Retrying GET " + key);
			getValue(server, key, callback);
		}
	}, 1000);
}

function subscribeValue(server, key, callback)
{
	console.log("SUBSCRIBEing to " + key);
	getValue(server, key, callback, true);

	var subscribeSocket = new WebSocket("ws://" + server.address + "/.json");
	subscribeSocket.onmessage = function(messageEvent) {
		var result = JSON.parse(messageEvent.data);
		switch (result.SUBSCRIBE[0])
    	{
    		case "message":
    			// We got an update
    			callback(result.SUBSCRIBE[2]);
    			break;
    		case "subscribe":
    			console.log("Successfully subscribed to " + key);
    			// We got a confirmation we are subscribed
    			break;
    		default:
    			console.log("Unexpected message");
    			console.log(result);
    			throw("Unexpected message");
    	}
	};
	subscribeSocket.onopen = function() {
		subscribeSocket.send(JSON.stringify(["SUBSCRIBE", key]));
	};
	subscriptions[key] = subscribeSocket;
}

function unsubscribeValue(key)
{
	console.log("Closing subscription to " + key);
	subscriptions["sensors"].close();
}
