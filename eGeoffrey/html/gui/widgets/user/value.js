// single value widget
class Value extends Widget {
    constructor(id, widget) {
        super(id, widget)
        this.timestamp = null
        this.timestamp_timer = null
        // add an empty box into the given column
        var icon = "icon" in this.widget ? this.widget["icon"] : "question"
        var color = "color" in this.widget ? this.widget["color"] : "blue"
        var link = "link" in this.widget ? this.widget["link"] : null
        if ("variant" in this.widget && this.widget["variant"] == 2) this.add_small_box_2(this.id, this.widget["title"], icon, color, link)
        else this.add_small_box(this.id, this.widget["title"], icon, color)
    }
    
    // request the data to the database
    request_data() {
        var sensor_id = this.widget["sensor"]
        // ask for the latest value
        var message = new Message(gui)
        message.recipient = "controller/db"
        message.command = "GET"
        message.args = sensor_id
        gui.sessions.register(message, {
            "component": "value",
            "sensor_id": sensor_id,
            "widget": this.widget
        })
        this.send(message)
        var timestamp_sensor = sensor_id
        // if for the timestamp we need to ask a different sensor
        if ("timestamp_sensor" in this.widget) timestamp_sensor = this.widget["timestamp_sensor"]
        // ask for the timestamp of the latest value
        var message = new Message(gui)
        message.recipient = "controller/db"
        message.command = "GET_TIMESTAMP"
        message.args = timestamp_sensor
        gui.sessions.register(message, {
            "component": "timestamp",
            "sensor_id": sensor_id
        })
        this.send(message)
        // ask for the icon (if the icon points to a sensor)
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
    }
    
    // update the elapsed time based on the stored timestamp
    update_timestamp() {
        var tag = "#"+this.id+"_timestamp"
        if (this.timestamp == null) $(tag).html("");
        else $(tag).html(gui.date.timestamp_difference(gui.date.now(), this.timestamp))
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _color, _icon, _value, _value_suffix, _timestamp
        // IDs Widget: 
        // TODO: change column attributes to col-md-3 col-sm-6 col-xs-12
        // for button widgets, just add the button and configure the action(s)
        if (this.widget["widget"] == "button") {
            var tag = "#"+this.id+"_value"
            $(tag.replace("_value","_timestamp")).addClass("d-none")
            var html = '\
            <center><div class="input-group">\
                <button type="button" id="'+this.id+'_button" class="btn btn-primary btn-lg">'+this.widget["text"]+'</button>\
            </div></center>'
            $(tag).html(html)
            // listen for click
            $("#"+this.id+"_button").unbind().click(function(actions) {
                return function () {
                    // trigger actions
                    for (var action of actions) {
                        gui.notify("info", "Requesting to execute "+action)
                        var action_split = action.split(" ")
                        var command = action_split[0]
                        // set the sensor to a value or poll it
                        if (command == "SET" || command == "POLL") {
                            var sensor_id = action_split[1]
                            var message = new Message(gui)
                            message.recipient = "controller/hub"
                            message.command = command
                            message.args = sensor_id
                            if (command == "SET") message.set_data(action_split[2])
                            gui.send(message)
                        }
                        // run a rule
                        else if (command == "RUN") {
                            var rule_to_run = action_split[1]
                            var message = new Message(gui)
                            message.recipient = "controller/alerter"
                            message.command = command
                            message.args = rule_to_run
                            gui.send(message)
                        }
                    }
                };
            }(this.widget["actions"]));
        }
        // otherwise request the data for this sensor
        else {
            var sensor_id = this.widget["sensor"]
            this.add_configuration_listener("sensors/"+sensor_id, gui.supported_sensors_config_schema)
            if (this.widget["widget"] == "value" && "icon_sensor" in this.widget) this.add_configuration_listener("sensors/"+this.widget["icon_sensor"], gui.supported_sensors_config_schema)
            if ("timestamp_sensor" in this.widget) this.add_configuration_listener("sensors/"+this.widget["timestamp_sensor"], gui.supported_sensors_config_schema)
            this.request_data()
        }
        // subscribe for acknoledgments from the database for saved values
        this.add_inspection_listener("controller/db", "*/*", "SAVED", "#")
    }
    
    // close the widget
    close() {
        if (this.timestamp_timer != null) clearInterval(this.timestamp_timer)
    }
    
    // receive data and load it into the widget
    on_message(message) {
        // database just saved a value check if our sensor is involved and if so refresh the data
        if (message.sender == "controller/db" && message.command == "SAVED") {
            if (message.args == this.widget["sensor"]) this.request_data()
            if ("icon_sensor" in this.widget && message.args == this.widget["icon_sensor"]) this.request_data()
        }
        // database returned a requested value
        else if (message.sender == "controller/db" && message.command.startsWith("GET")) {
            var session = gui.sessions.restore(message)
            if (session == null) return
            var data = message.get("data")
            if (gui.configurations["sensors/"+session["sensor_id"]] == null) {
                gui.log_warning("configuration of sensor "+session["sensor_id"]+" not found")
                return
            }
            var sensor = gui.configurations["sensors/"+session["sensor_id"]].get_data()
            // add value
            if (session["component"] == "value") {
                var tag = "#"+this.id+"_value"
                if (session["widget"]["widget"] == "value") {
                    // add value and suffix
					if (data.length == 1) {
						var value = data[0]
						var text_color = "black"
						for (var color of ["success", "warning", "danger"]) {
							if ("color_"+color in session["widget"]) {
								var min, max
								if (session["widget"]["color_"+color].includes("-")) {
									var split = session["widget"]["color_"+color].split("-")
									min = split[0]
									max = split[1]
								}
								else {
									min = max = session["widget"]["color_"+color]
								}
								if (jQuery.isNumeric(min) && jQuery.isNumeric(max) && jQuery.isNumeric(value)) {
									if (value > min && value <= max) text_color = color
								} else {
									if (value == min) text_color = color
								}
							}
						}
						$(tag).html('<span class="text-'+text_color+'">'+value+'</span>');
						if ("unit" in sensor) $(tag+"_suffix").html('<span class="text-'+text_color+'">'+sensor["unit"]+'</span>');
					}
					else $(tag).html(data.length == 1 ? data[0] : "N/A");
                }
                // this is a status box, set the status
                else if (session["widget"]["widget"] == "status") {
                    tag = tag.replace("_value","")
                    if (data.length == 1) {
                        var target = "info-box-icon"
                        var icon_class = "info-box-icon"
                        if ("variant" in this.widget && this.widget["variant"] == 2) {
                            target = "small-box"
                            icon_class = "small-box"
                        }
                        if (data[0] == 0) {
                            $(tag+"_icon").removeClass().addClass("fa fa-power-off")
                            if ($(tag+"_color").hasClass(target)) $(tag+"_color").removeClass().addClass(icon_class+" bg-red")
                            // TODO: localize
                            $(tag+"_value").html("OFF")
                        }
                        else if (data[0] == 1) {
                            $(tag+"_icon").removeClass().addClass("fa fa-plug")
                            if ($(tag+"_color").hasClass(target)) $(tag+"_color").removeClass().addClass(icon_class+" bg-green")
                            $(tag+"_value").html("ON")
                        }
                    } else {
                        $(tag+"_value").html("N/A")
                    }
                }
                // this is a control box, configure the checkbox
                else if (session["widget"]["widget"] == "control") {
                    var id = tag.replace("#","")
                    var html = '\
                    <center>\
                        <div class="input-group">\
                            <input type="checkbox" id="'+id+'_toggle" data-width="100">\
                        </div>\
                    </center>'
                    $(tag).html(html)
                    $(tag+"_toggle").bootstrapToggle()
                    // TODO: if not defined, set 0 to the db as well
                    if (data.length == 1) $(tag+"_toggle").prop("checked", data[0]).change()
                    else $(tag+"_toggle").prop("checked", false)
                    // listen for changes
                    var actions = "actions" in this.widget ? this.widget["actions"] : null
                    $(tag+"_toggle").unbind().change(function(tag, sensor_id, actions) {
                        return function () {
                            var value = $(tag).is(':checked') ? 1 : 0
                            gui.log_debug("Setting "+sensor_id+"="+value)
                            var message = new Message(gui)
                            message.recipient = "controller/hub"
                            message.command = "SET"
                            message.args = sensor_id
                            message.set("value", value)
                            gui.send(message)
                            // TODO: update timestamp
                            // TODO: trigger update of other elements where sensor_id is used
                            // trigger additional actions
                            if (actions != null) {
                                for (var action of actions) {
                                    var action_split = action.split(" ")
                                    var command = action_split[0]
                                    // set the sensor to a value or poll it
                                    if (command == "SET" || command == "POLL") {
                                        sensor_id = action_split[1]
                                        message = new Message(gui)
                                        message.recipient = "controller/hub"
                                        message.command = command
                                        message.args = sensor_id
                                        if (command == "SET") message.set_data(value)
                                        gui.send(message)
                                    }
                                    // run a rule
                                    else if (command == "RUN") {
                                        rule_to_run = action_split[1]
                                        message = Message(gui)
                                        message.recipient = "controller/alerter"
                                        message.command = command
                                        message.args = rule_to_run
                                        gui.send(message)
                                    }
                                }
                            }
                        };
                    }(tag+"_toggle", session["sensor_id"], actions));
                }
                // this is an input box, populate the input
                else if (session["widget"]["widget"] == "input") {
                    var id = tag.replace("#","")
                    $(tag.replace("_value","_timestamp")).addClass("d-none")
                    var html = '\
                    <div class="input-group input-group">\
                        <input style="text-align:center;" id="'+id+'_input" class="form-control input" type="text" value="">\
                    </div>'
                    $(tag).html(html)
                    if (data.length == 1) $(tag+"_input").val(data[0])
                    // if a number, add +/- buttons
                    if ("format" in sensor && sensor["format"] != "string") {
                        var decimals = sensor["format"] == "int" ? 0 : 1
                        var steps = sensor["format"] == "int" ? 1 : 0.1
                        $(tag+"_input").TouchSpin({
                            min: -1000000000,
                            max: 1000000000,
                            step: steps,
                            decimals: decimals,
                            boostat: 5,
                            maxboostedstep: 10,
                        });
                    }
                    // listen for changes
                    $(tag+"_input").unbind().change(function(tag, sensor_id) {
                        return function () {
                            var value = $(tag).val()
                            gui.log_debug("Setting "+sensor_id+"="+value)
                            var message = new Message(gui)
                            message.recipient = "controller/hub"
                            message.command = "SET"
                            message.args = sensor_id
                            message.set("value", value)
                            gui.send(message)
                        };
                    }(tag+"_input", session["sensor_id"]));
                }
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
            // add icon
            else if (session["component"] == "icon") {
                if (data.length != 1) return
                $("#"+this.id+"_icon").removeClass()
                $("#"+this.id+"_icon").addClass("fas fa-"+data[0])
            }
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}