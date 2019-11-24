// map widget
class Maps extends Widget {
    constructor(id, widget) {
        super(id, widget)
        // variables
        this.map = null
        this.map_type = "map_type" in widget ? widget["map_type"] : "hybrid"
        // add an empty box into the given column
        this.add_large_box(this.id, this.widget["title"])
    }
    
    // request the data to the database
    request_data() {
		var timeframe = "timeframe" in this.widget ? this.widget["timeframe"] : 7
        // for each sensor
        for (var i = 0; i < this.widget["sensors"].length; i++) {
            var sensor_id = this.widget["sensors"][i]
            this.add_configuration_listener("sensors/"+sensor_id)
            var message = new Message(gui)
            message.recipient = "controller/db"
            message.command = "GET"
            message.args = sensor_id
			message.set("timeframe", "last_"+timeframe+"_days")
            gui.sessions.register(message, {
                "sensor_id": sensor_id,
            })
            this.send(message)
        }
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: _map
        // add the map
        var body = "#"+this.id+"_body"
        $(body).html('<div id="'+this.id+'_map" style="width:100%; height: 640px;"></div>')
        if (! gui.maps_loaded) {
            // load google maps api (lazy loading since we need the api_key from the conf)
            var script = document.createElement('script')
            script.src = "https://maps.googleapis.com/maps/api/js?key="+gui.settings["map_api_key"]
            script.onload = function(this_class) {
                return function () {
                    var script = document.createElement('script');
                    script.src = "lib/gmaps/gmaps.min.js";
                    // load gmaps 
                    script.onload = function(this_class) {
                        return function () {
                            //create the map
                            this_class.map = new GMaps({
                                div: "#"+this_class.id+"_map",
                                lat: 0,
                                lng: 0,
                                mapType: this_class.map_type,
                                zoom: 2
                            });
                            gui.maps_loaded = true
                            // request the data
                            this_class.request_data()
                        }; // end function ()
                    }(this_class); // onload gmaps.js
                    // append gmaps to head
                    document.head.appendChild(script);
                }; // end function ()
            }(this); // onload google maps
            // append google api to head
            document.head.appendChild(script);
        } 
        // reload the map
        else {
            //create the map
            this.map = new GMaps({
                div: "#"+this.id+"_map",
                lat: 0,
                lng: 0,
                mapType: this.map_type,
                zoom: 2
            });
            // request the data
            this.request_data()
        }
        
    }
    
    // receive data and load it into the widget
    on_message(message) {
        // database just saved a value check if our sensor is involved and if so refresh the data
        if (message.sender == "controller/db" && message.command == "SAVED") {
            for (var sensor of this.widget["sensors"]) {
                if (message.args == sensor) {
                    // TODO: clear the map
                    // request the updated data
                    this.request_data()
                    return
                }
            }
        }
        else if (message.sender == "controller/db" && message.command.startsWith("GET")) {
            var session = gui.sessions.restore(message)
            if (session == null) return
            var data = message.get("data")
            gui.log_debug("received "+data)
            if (data.length == 0) return
            var waypoints = []
            // for each data point
            for (var i = 0; i < data.length; i++) {
                if (data[i] == null) continue
                // normalize and parse position
                var position = JSON.parse(data[i][1])
                // add a marker
                var options = {
                    lat: position["latitude"],
                    lng: position["longitude"],
                    label: position["label"],
                    icon: null,
                    infoWindow: { content: position["text"]}
                }
                // customize the layout of the marker when tracking position
                if ("tracking" in this.widget && this.widget["tracking"]) {
                    if (i == (data.length-1)) {
                        // this is the last position, if the position is not accurate, draw a circle around it
                        if ("accuracy" in position && position["accuracy"] > 500) {
                            this.map.drawCircle({
                                lat: position["latitude"],
                                lng: position["longitude"],
                                radius: position["accuracy"],
                                strokeColor: '#BBD8E9',
                                strokeOpacity: 1,
                                strokeWeight: 3,
                                fillColor: '#BBD8E9',
                                fillOpacity: 0.6
                            });
                        }
                    } else {
                        // for intermediate positions, remote the label and use a small blue dot as icon
                        options["label"] = null;
                        options["icon"] = "https://maps.gstatic.com/intl/en_us/mapfiles/markers2/measle_blue.png";
                    }
                }
                // add the marker to the map
                this.map.addMarker(options)
                // keep track of the waypoint
                waypoints.push({location:position["latitude"]+","+position["longitude"],stopover: true})
                // auto zoom the map
                this.map.fitZoom();
                if ("tracking" in this.widget && this.widget["tracking"]) {
                    // build the route
                    if (waypoints.length < 2) return;
                    // set origin and destination
                    var first = JSON.parse(data[1][0])
                    var last = JSON.parse(data[1][(data.length-1)])
                    // draw the route
                    thismap.drawRoute({
                        origin: [first["latitude"],first["longitude"]],
                        destination: [last["latitude"],last["longitude"]],
                        travelMode: 'driving',
                        strokeColor: get_color(),
                        strokeOpacity: 0.6,
                        strokeWeight: 6,
                        waypoints: waypoints
                    });                    
                    // auto zoom the map
                    this.map.fitZoom();
                }
            }
        }

    }
    
    // receive configuration
    on_configuration(message) {
    }
}