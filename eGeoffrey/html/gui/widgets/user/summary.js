// summary widget
class Summary extends Widget {
    constructor(id, widget) {
        super(id, widget)
        this.timestamp = null
        // add an empty box into the given column
        this.add_large_box(this.id, this.widget["title"])
    }
    
    // request the data to the database
    request_data() {
        // ask for the icon
        if ("icon_sensor" in this.widget) {
            var message = new Message(gui)
            message.recipient = "controller/db"
            message.command = "GET"
            message.args = this.widget["icon_sensor"]
            gui.sessions.register(message, {
                "component": "icon",
                "sensor_id": this.widget["icon_sensor"]
            })
            this.send(message)
        }
        // ask data for the chart
        for (var i = 0; i < this.widget["sensors"].length; i++) {
            var sensor_id = this.widget["sensors"][i]
            // request sensor's configuration
            this.add_configuration_listener("sensors/"+sensor_id, gui.supported_sensors_config_schema)
            // for the first sensor in the list ask for current measures to populate the header
            if (i == 0) {
                // ask for the current measure
                var message = new Message(gui)
                message.recipient = "controller/db"
                message.command = "GET"
                message.args = sensor_id
                gui.sessions.register(message, {
                    "component": "value",
                    "sensor_id": sensor_id
                })
                this.send(message)
                // ask for the timestamp
                var message = new Message(gui)
                message.recipient = "controller/db"
                message.command = "GET_TIMESTAMP"
                message.args = sensor_id
                gui.sessions.register(message, {
                    "component": "timestamp",
                    "sensor_id": sensor_id
                })
                this.send(message)
            }
            // ask for yesterday's range
            var message = new Message(gui)
            message.recipient = "controller/db"
            message.command = "GET"
            message.args = sensor_id+"/day/range"
            message.set("timeframe", "yesterday")
            gui.sessions.register(message, {
                "component": "chart",
                "sensor_id": sensor_id,
                "series": 0,
                "index": i
            })
            this.send(message)
            // ask for today's range
            var message = new Message(gui)
            message.recipient = "controller/db"
            message.command = "GET"
            message.args = sensor_id+"/day/range"
            message.set("timeframe", "today")
            gui.sessions.register(message, {
                "component": "chart",
                "sensor_id": sensor_id,
                "series": 1,
                "index": i
            })
            this.send(message)
        }
    }
    
    // close the widget
    close() {
        if (this.timestamp_timer != null) clearInterval(this.timestamp_timer)
    }
    
    // update the elapsed time based on the stored timestamp
    update_timestamp() {
        var tag = "#"+this.id+"_timestamp"
        if (this.timestamp == null) $(tag).html("");
        else $(tag).html(gui.date.timestamp_difference(gui.date.now(), this.timestamp))
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: _icon, _value, _timestamp, _chart
        // add the header
        // TODO: icon based on sensor value
        var icon = "icon" in this.widget ? this.widget["icon"] : "question"
        var color = "color" in this.widget ? this.widget["color"] : "gray"
		var box_header = '\
			<div class="box-profile">\
				<div class="profile-user-img img-fluid img-responsive"><span id="'+this.id+'_icon" class="fas fa-4x fa-'+icon+' icon-logo" style="color:'+color+'"></span></div>\
					<h3 class="profile-username text-center"><span id="'+this.id+'_value">&nbsp;</span><span id="'+this.id+'_value_suffix"></span></h3>\
					<p class="text-muted text-center" id="'+this.id+'_timestamp">&nbsp;</p>\
					<div id="'+this.id+'_chart"></div>\
				<div>';
		// add the header to the box
		$("#"+this.id+"_body").html(box_header);
        var chart_tag = "#"+this.id+"_chart";
        // add summary chart
        var options = $.extend(true,{}, gui.charts["timeseries_summary"]);
        options["chart"]["height"] = 250
        $(chart_tag).highcharts(options);
		var chart = $(chart_tag).highcharts();
        chart.showLoading()
        // request the sensors data
        this.request_data()
 		// make the chart adapting if loaded within a modal
		$('#popup').on('show.bs.modal', function() {
			$(chart_tag).css('visibility', 'hidden');
		});
		$('#popup').on('shown.bs.modal', function() {
			$(chart_tag).css('visibility', 'initial');
			chart.reflow();
		});
        // subscribe for acknoledgments from the database for saved values
        this.add_inspection_listener("controller/db", "*/*", "SAVED", "#")
    }
    
    // receive data and load it into the widget
    on_message(message) {
        // database just saved a value check if our sensor is involved and if so refresh the data
        if (message.sender == "controller/db" && message.command == "SAVED") {
            for (var sensor of this.widget["sensors"]) {
                if (message.args == sensor) {
                    this.request_data()
                    return
                }
            }
            if ("icon_sensor" in this.widget && message.args == this.widget["icon_sensor"]) this.request_data()
        }
        if (message.sender == "controller/db" && message.command.startsWith("GET")) {
            var session = gui.sessions.restore(message)
            if (session == null) return
            var data = message.get("data")
            // add last value
            if (session["component"] == "value") {
                var sensor = gui.configurations["sensors/"+session["sensor_id"]].get_data()
                var tag = "#"+this.id+"_value"
                // add value and suffix
                $(tag).html(data.length == 1 ? data[0] : "N/A");
                if ("unit" in sensor) $(tag+"_suffix").html(sensor["unit"]);
            }
            // add timestamp
            else if (session["component"] == "timestamp") {
                this.timestamp = data.length != 1 ? null : data[0]
                // update the timestsamp value
                this.update_timestamp()
                // periodically refresh the elapsed time
                if (this.timestamp_timer != null) clearInterval(this.timestamp_timer)
                var this_class = this
                this.timestamp_timer = setInterval(function() {
                        this_class.update_timestamp()
                    }, 10000);
            }
            // add chart data
            else if (session["component"] == "chart") {
                var tag = "#"+this.id+"_chart"
                var chart = $(tag).highcharts();
                chart.hideLoading()
                var sensor = gui.configurations["sensors/"+session["sensor_id"]].get_data()
                // add the sensor to the xAxis of the chart
                chart['xAxis'][0]['categories'][session["index"]] = sensor["description"];
                // apply the suffix to the today's series
                var unit = "unit" in sensor ? sensor["unit"] : ""
                chart.series[1].update({"dataLabels":{"enabled": true,"format":'{y}'+unit}});
                // add the point to the series
                chart.series[session["series"]].addPoint([session["index"], data[0], data[1]]);
            }
            // add icon
            else if (session["component"] == "icon") {
                if (data.length != 1) return
                $("#"+this.id+"_icon").removeClass()
                $("#"+this.id+"_icon").addClass("icon-logo fas fa-5x fa-"+data[0])
            }
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}
    