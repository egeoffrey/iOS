// timeline widget
class Timeline extends Widget {
    constructor(id, widget) {
        super(id, widget)
        // add an empty box into the given column
        this.add_large_box(this.id, this.widget["title"])
    }
    
    // request the data to the database
    request_data() {
        // customize the chart based on the selected timeframe
        var timeframe = "last_4_hours"
        if ("group_by" in this.widget) {
            if (this.widget["group_by"] == "hour") timeframe = "last_24_hours"
            else if (this.widget["group_by"] == "day") timeframe = "last_365_days"
        }
        if ("timeframe" in this.widget) timeframe = this.widget["timeframe"]
		// for each sensor
        var first_series_id = null
        for (var i = 0; i < this.widget["sensors"].length; i++) {
            var sensor_id = this.widget["sensors"][i]
            this.add_configuration_listener("sensors/"+sensor_id, gui.supported_sensors_config_schema)
            // if it is the first sensor, request also range
            var add_range = true
            if ("no_range" in this.widget && this.widget["no_range"]) add_range = false
            if (add_range && i == 0 && "group_by" in this.widget) {
                var message = new Message(gui)
                message.recipient = "controller/db"
                message.command = "GET"
                message.set("timeframe", timeframe)
                message.args = sensor_id+"/"+this.widget["group_by"]+"/"+"range"
                gui.sessions.register(message, {
                    "sensor_id": sensor_id,
                    "style": "arearange",
                    "label": "range",
                    "group_by": "group_by" in this.widget ? this.widget["group_by"] : null
                })
                this.send(message)
            }
            // custom style
            var style = "style" in this.widget ? this.widget["style"] : "spline"
            // custom series style
            var series = "series" in this.widget ? this.widget["series"] : "avg"
            var message = new Message(gui)
            message.recipient = "controller/db"
            message.command = "GET"
            message.set("timeframe", timeframe)
            // request calculated average values if group_by is specified
            message.args = "group_by" in this.widget ? sensor_id+"/"+this.widget["group_by"]+"/"+series : sensor_id
            // keep track of the first series so flags will be placed on it
            if (i == 0) first_series_id = message.args
            gui.sessions.register(message, {
                "sensor_id": sensor_id,
                "style": style,
                "label": series,
                "first_series_id": first_series_id,
                "group_by": "group_by" in this.widget ? this.widget["group_by"] : null
            })
            this.send(message)
		}
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: 
        // add the chart
        var options = $.extend(true,{}, gui.charts["timeseries_timeline"]);
        // set xAxis tick interval
        if ("group_by" in this.widget) {
            if (this.widget["group_by"] == "hour") options["xAxis"]["tickInterval"] = 1*3600*1000
            else if (this.widget["group_by"] == "day") options["xAxis"]["tickInterval"] = 1*24*3600*1000
        } else options["xAxis"]["tickInterval"] = 1*3600*1000
        // add the chart
        var body = "#"+this.id+"_body"
		$(body).highcharts('StockChart',options);
		var chart = $(body).highcharts();
        chart.showLoading()
        // request sensors' data
        this.request_data()
		// make the chart adapting to the modal
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
            for (var sensor of this.widget["sensors"]) {
                if (message.args == sensor) {
                    if ("group_by" in this.widget) {
                        if (! message.has("group_by") || message.get("group_by") != this.widget["group_by"]) return
                    } else {
                        if (message.has("group_by")) return
                    }
                    // remove all series
                    var chart = $("#"+this.id+"_body").highcharts()
                    while (chart.series.length > 0) chart.series[0].remove(false)
                    try {
                        chart.redraw()
                    } catch(e) {}
                    chart.colorCounter = 0;
                    // request the updated data
                    this.request_data()
                    return
                }
            }
        }
        if (message.sender == "controller/db" && message.command.startsWith("GET")) {
            var session = gui.sessions.restore(message)
            if (session == null) return
            var data = message.get("data")
            if (data.length == 0) return
            // TODO: global debug with widget id and shared among all widgets
            var chart = $("#"+this.id+"_body").highcharts();
            chart.hideLoading()
            var sensor = gui.configurations["sensors/"+session["sensor_id"]].get_data()
            var series = {}
            series["name"] = sensor["description"]+" "+session["label"]
            series["type"] = session["style"]
            series["id"] = message.args
            series["data"] = data
            if (session["group_by"] != null) series["gapSize"] = 1
            if (!("tooltip" in series)) series["tooltip"] = {};
            if (!("dataLabels" in series)) series["dataLabels"] = {};
            series["tooltip"]["valueSuffix"] = "unit" in sensor ? sensor["unit"] : ""
            series["dataLabels"]["format"] = "{y}"+series["tooltip"]["valueSuffix"]
            // if the data is a string, add flags
            if (sensor["format"] == "string") {
                series["onSeries"] = session["first_series_id"]
                series["type"] = "flags"
                var flags = [];
                for (var i = 0; i < data.length; i++) {
                    if (data[i][1] === null || data[i][1] === "") continue;
                    flags[i] = {'x': data[i][0], 'shape': 'circlepin', 'title': '<i class="fas fa-1x fa-'+data[i][1]+'"></i>'};
                }
                series["data"] = flags
            }
            // ensure a series with the same name is not already in the chart
            for (var existing_series of chart.series) {
                if (existing_series["name"] == series["name"]) return
            }
            // attach the series to the chart
            chart.addSeries(series)
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}