NS.Handler = (function() {// function to catch all exceptions  and track events 
	var logHandlerArr = new Array();
	var analyticsHandlerArr = new Array();

	function getType(value) {
		if (value === null) {
			return "Null"; // special case
		} else {
			return Object.prototype.toString.call(value).match(
					/^\[object (.*)\]$/)[1];
		}
	}

	function log(msg, error) { // internal log handler
		for ( var k = 0; k < analyticsHandlerArr.length; k++) {
			analyticsHandlerArr[k].log(msg, error);
		}
	}

	function track(elem, type) { // internal analytics handler
		for ( var k = 0; k < logHandlerArr.length; k++) {
			logHandlerArr[k].trackEventWrapper(elem, type);
		}
	}

	function wrap(context, value) {
		var type = getType(value);  //getType function is defined above
		if (type == "Function") {
			return gaurd(value, context);
		} else if (type == "Object") {
			if (value.hasOwnProperty("target")            // code to track the events
					|| value.hasOwnProperty("selector")) {
				if (value.hasOwnProperty("target")) {
					if (value.hasOwnProperty("originalEvent")
							&& !value.hasOwnProperty("genericAttr")) {
						track(value.target, value.type);  // call to internal analytics handler
						Object.defineProperty(value, "genericAttr", {
							value : "set"
						});
					}
				}
				return value;
			} else {
				for ( var key in value) { // iterating all the values of an object
					value[key] = wrap(value, value[key]);
				}
			}
		}
		return value;
	}

	function guard(fnOrObj, context) {
		var extraArgs = new Array();
		if (arguments.length > 2) {
			extraArgs = Array.prototype.slice.call(arguments, 2);
		}
		var type = getType(fnOrObj); //getType function is defined above
		if (type == "Function") {
			return function() {
				// capture the arguments and functions
				var wrapArgsFn = wrap.bind(null, context);
				var args = extraArgs.concat(
						Array.prototype.slice.call(arguments)).map(wrapArgsFn);
				// exception handler blocks
				try {
					var returnObj = fnOrObj.apply(context, args);
					// check for the return object
					if (typeof returnObj == "undefined") {
						return returnObj;
					} else {
						return wrap(context, returnObj);
					}
				} catch (e) {
					log("Exception on executing guard on function", e); // call to internal log handler
				}
			};
		} else if (type == "Object") {
			try {
				return wrap(fnOrObj, fnOrObj);
			} catch (e) {
				log("Exception on executing guard on object", e); // call to internal log handler
			}
		} else {
			return fnOrObj;
		}
	}

	var api = {  //set of public methods which are exposed
		proxy : function(fnOrObj, context) {
			return guard.apply(context, arguments);
		},
		 // analytics handlers are passed using this function
		initializeAnalyticsHandler : function(analyticsHandler) {
			analyticsHandlerArr.push(analyticsHandler);
		},
		// log handlers are passed using this function
		initializeLogHandler : function(logHandler) {
			logHandlerArr.push(logHandler);
		}
	};

	return api;
})();

NS.AnalyticsWrapper = {
	trackEventWrapper : function(elem, eventType)
	{
		var trackingattr = elem.getAttribute("track_attr");
		if (trackingattr) {
			var attrs = trackingattr.split(";");
			var typeAttrs = new Array();
			if (attrs.length > 0) {
				for ( var i = 0; i < attrs.length; i++) {
					typeAttrs.push(attrs[i].split(":")[0].toLowerCase());
				}

				var index = typeAttrs.indexOf(eventType.toLowerCase(), 0);
				if (index >= 0) {
					var category = attrs[index].split(":")[1];
					var action = attrs[index].split(":")[2];
					var label = attrs[index].split(":")[3];
				}
				if (category !== undefined && action !== undefined && label !== undefined) {
					this.trackEvent(category, action, label);
				}
			}
		}
	},

	trackEvent : function(category, action, label)
	{
	}
};

NS.LoggingWrapper = {
	log : function(msg, error)
	{
	}
};
