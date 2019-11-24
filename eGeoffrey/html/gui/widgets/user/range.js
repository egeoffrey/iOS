// range widget
class Range extends Widget {
    constructor(id, widget) {
        super(id, widget)
        // add an empty box into the given column
        this.add_large_box(this.id, this.widget["title"])
    }
    
    // request the data to the database
    request_data() {
        var sensor_id = this.widget["sensor"]
        // customize the chart based on the selected timeframe
        var timeframe = "last_4_hours"
        if ("group_by" in this.widget) {
            if (this.widget["group_by"] == "hour") timeframe = "last_6_hours"
            else if (this.widget["group_by"] == "day") timeframe = "last_6_days"
        }
        if ("timeframe" in this.widget) timeframe = this.widget["timeframe"]
        var message = new Message(gui)
        message.recipient = "controller/db"
        message.command = "GET"
        message.set("timeframe", timeframe)
        // if it is the first sensor, request also range
        message.args = sensor_id+"/"+this.widget["group_by"]+"/"+"range"
        gui.sessions.register(message, {
            "sensor_id": sensor_id,
            "style": "columnrange",
            "label": "range"
        })
        this.send(message)
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: 
        // add the chart
        var options = $.extend(true,{}, gui.charts["timeseries_min_max"]);
        var body = "#"+this.id+"_body";
		$(body).highcharts(options);
		var chart = $(body).highcharts();
        // TODO: same as timeseries_timeline
        // TODO: forecast?
        // set xAxis tick interval
        if ("group_by" in this.widget) {
            if (this.widget["group_by"] == "hour") options["xAxis"]["tickInterval"] = 1*3600*1000
            else if (this.widget["group_by"] == "day") options["xAxis"]["tickInterval"] = 1*24*3600*1000
        } else options["xAxis"]["tickInterval"] = 1*3600*1000
        // TODO: if (sensor["format"] == "percentage") options["yAxis"]["max"] = 100;
        chart.showLoading()
        // request the sensor's configuration
        this.add_configuration_listener("sensors/"+this.widget["sensor"], gui.supported_sensors_config_schema)
        // request the values of the sensor
        this.request_data()
		// make the chart adapting to the modal
        // TODO: this is always in common
		$('#popup').on('show.bs.modal', function() {
			$(body).css('visibility', 'hidden');
		});
		$('#popup').on('shown.bs.modal', function() {
			$(body).css('visibility', 'initial');
			chart.reflow();
		});
        // subscribe for acknoledgments from the database for saved values
        this.add_inspection_listener("controller/db", "*/*", "SAVED", "#")
    }
    
    // receive data and load it into the widget
    on_message(message) {
        // database just saved a value check if our sensor is involved and if so refresh the data
        if (message.sender == "controller/db" && message.command == "SAVED") {
            if (message.args == this.widget["sensor"]) {
                if ("group_by" in this.widget) {
                    if (! message.has("group_by") || message.get("group_by") != this.widget["group_by"]) return
                } else {
                    if (message.has("group_by")) return
                }
                // remove all series
                var chart = $("#"+this.id+"_body").highcharts();
                while(chart.series.length > 0) chart.series[0].remove(false)
                chart.redraw()
                chart.colorCounter = 0;
                // request the updated data
                this.request_data()
            }
        }
        else if (message.sender == "controller/db" && message.command.startsWith("GET")) {
            var session = gui.sessions.restore(message)
            if (session == null) return
            var data = message.get("data")
            var chart = $("#"+this.id+"_body").highcharts();
            chart.hideLoading()
            var sensor = gui.configurations["sensors/"+session["sensor_id"]].get_data()
            var series = {}
            series["name"] = sensor["description"]+" "+session["label"]
            series["type"] = session["style"]
            series["id"] = message.args
            series["data"] = data
            if (!("tooltip" in series)) series["tooltip"] = {};
            if (!("dataLabels" in series)) series["dataLabels"] = {};
            var unit = "unit" in sensor ? sensor["unit"] : ""
            series["tooltip"]["valueSuffix"] = unit
            series["dataLabels"]["format"] = "{y}"+unit
            // if the data is a string, add flags
            if (sensor["format"] == "string") {
                flags = [];
                for (var i = 0; i < data.length; i++) {
                    if (data[i][1] === null || data[i][1] === "") continue;
                    // TODO: replace img with icon
                    flags[i] = {'x': data[i][0], 'shape': 'circlepin', 'title': '<img width="'+series['width']+'" heigth="'+series['heigth']+'" src="images/'+sensor['module_id']+":"+sensor['group_id']+":"+sensor['sensor_id']+"_"+data[i][1]+'.png">'};
                }
                series['data'] = flags;
            }
            // ensure a series with the same name is not already in the chart
            for (var existing_series of chart.series) {
                if (existing_series["name"] == series["name"]) return
            }
            // attach the series to the chart
            chart.addSeries(series);
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}