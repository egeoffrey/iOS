// sensors widget
class Sensors extends Widget {
    // TODO: when refreshing a new table is added
    // TODO: when searching all the buttons stop working
    constructor(id, widget) {
        super(id, widget)
        this.sensors = {}
        this.listener = null
        this.hub = null
        // add an empty box into the given column
        this.add_large_box(this.id, this.widget["title"])
    }
    
    // request the data to the database
    request_data(sensor_id) {
        // ask for the latest value
        var message = new Message(gui)
        message.recipient = "controller/db"
        message.command = "GET"
        message.args = sensor_id
        gui.sessions.register(message, {
            "component": "value",
            "sensor_id": sensor_id,
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
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: _table
        // if refresh requested, we need to unsubscribe from the topics to receive them again
        if (this.listener != null) {
            this.remove_listener(this.listener)
            this.sensors = {}
        }
        var body = "#"+this.id+"_body"
        $(body).html("")
        // add new sensor button
        var button_html = '\
            <div class="form-group">\
                <button type="button" id="'+this.id+'_new" class="btn btn-block btn-primary btn-lg"><i class="fas fa-plus"></i> Register a new sensor</button>\
            </div>'
        $(body).append(button_html)
        $("#"+this.id+"_new").unbind().click(function(this_class) {
            return function () {
                window.location.hash = '#__sensor_wizard'
            };
        }(this));
        // add table
        // 0: sensor_id (hidden)
        // 1: sensor
        // 2: format (hidden)
        // 3: unit (hidden)
        // 4: service
        // 5: last value
        // 6: timestamp
        // 7: disabled (hidden)
        var table = '\
            <table id="'+this.id+'_table" class="table table-bordered table-striped">\
                <thead>\
                    <tr><th>_sensor_id_</th><th class="all">Sensor</th><th>_format_</th><th>_unit_</th><th>Associated Service</th><th>Value</th><th>Elapsed</th><th>_disabled_</th></tr>\
                </thead>\
                <tbody></tbody>\
            </table>'
        $(body).append(table)
        // how to render the timestamp
        var this_class = this
        function render_timestamp(data, type, row, meta) {
            if (type == "display") return this_class.disabled_item(gui.date.timestamp_difference(gui.date.now(), data), row[7])
            else return this_class.disabled_item(data, row[7])
        };

        // define datatables options
        // TODO: move options from all the tables in the widget class
        var options = {
            "responsive": true,
            "dom": "Zlfrtip",
            "fixedColumns": false,
            "paging": false,
            "lengthChange": false,
            "searching": true,
            "ordering": true,
            "info": true,
            "autoWidth": false,
            "columnDefs": [ 
                {
                    "targets" : 6,
                    "render": render_timestamp,
                },
                {
                    "targets" : [0, 2, 3, 7],
                    "visible": false,
                },
                {
                    "className": "dt-center", 
                    "targets": [5, 6]
                }
            ],
            "language": {
                "emptyTable": '<span id="'+this.id+'_table_text"></span>'
            }
        };
        // create the table
        if (! $.fn.dataTable.isDataTable("#"+this.id+"_table")) {
            $("#"+this.id+"_table").DataTable(options)
        } else {
            var table = $("#"+this.id+"_table").DataTable()
            table.clear()
        }
        $("#"+this.id+"_table_text").html('<i class="fas fa-spinner fa-spin"></i> Loading')
        // discover registered sensors
        this.listener = this.add_configuration_listener("sensors/#", gui.supported_sensors_config_schema)
        // request controller/hub
        this.add_configuration_listener("controller/hub", 2)
        // subscribe for acknoledgments from the database for saved values
        this.add_inspection_listener("controller/db", "*/*", "SAVED", "#")
    }
    
    // receive data and load it into the widget
    on_message(message) {
        // database just saved a value check if our sensor is involved and if so refresh the data
        if (message.sender == "controller/db" && message.command == "SAVED") {
            if (message.has("group_by")) return
            var sensor_id = message.args
            if (sensor_id in this.sensors) this.request_data(sensor_id)
        }
        else if (message.command.startsWith("GET")) {
            var session = gui.sessions.restore(message)
            if (session == null) return
            var data = message.get("data")
            var sensor_id = session["sensor_id"]
            var sensor = gui.configurations["sensors/"+sensor_id].get_data()
            var table = $("#"+this.id+"_table").DataTable()
            // add value
            var this_class = this
            if (session["component"] == "value") {
                table.rows().every( function ( row_index, table_loop, row_loop ) {
                    var row = this.data()
                    if (row[0] != sensor_id) return
                    else if (row[2] == "calendar") data = '<i class="fas fa-calendar-alt fa-1x"></i>'
                    else if (row[2] == "tasks") data = '<i class="fas fa-tasks fa-1x"></i>'
                    else if (row[2] == "image" && data != "") data = '<img class="img-responsive" width="200" height="100" src="data:image/jpeg;base64,'+data+'"/>'
                    else {
                        var unit = data != "" ? row[3] : ""
                        data = data+unit
                        data = format_multiline(truncate(data.replaceAll("\n", "<br>"), 100), 15)
                        data = this_class.disabled_item(data, row[7])
                    }
                    table.cell(row_index, 5).data(data).draw(false)
                });
            }
            // add timestamp
            if (session["component"] == "timestamp") {
                table.rows().every( function ( row_index, table_loop, row_loop ) {
                    if (data.length != 1) return
                    var row = this.data()
                    if (row[0] != sensor_id) return
                    table.cell(row_index, 6).data(data[0]).draw(false)
                });
            }
        }
    }
    
    // format an object for displaying
    format_object(object) {
        return "- "+JSON.stringify(object).replaceAll("{","").replaceAll("}","").replaceAll("\"","").replaceAll(":",": ").replaceAll(",","<br>- ")
    }
    
    // if the item is disabled, gray out the text
    disabled_item(item, disabled) {
        if (! disabled) return item
        if (typeof item === 'object' && item.constructor === Array) {
            for (var i = 0; i < item.length; i++) item[i] = '<p class="text-muted">'+item[i]+'</p>'
            return item
        }
        else return '<p class="text-muted">'+item+'</p>'
    }
    
    // receive configuration
    on_configuration(message) {
        if (message.args == "controller/hub") {
            this.hub = message.get_data()
        }
        else if (message.args.startsWith("sensors/")) {
            var sensor_id = message.args.replace("sensors/","")
            // skip sensors already received
            // TODO: handle / in sensor_id for html
            if (sensor_id in this.sensors) return
            var sensor = message.get_data()
            this.sensors[sensor_id] = sensor
            var sensor_tag = sensor_id.replaceAll("/","_")
            // add a line to the table
            var table = $("#"+this.id+"_table").DataTable()
            var disabled = "disabled" in sensor && sensor["disabled"]
            var icon = "icon" in sensor ? sensor["icon"] : 'microchip'
            var description = "description" in sensor ? sensor["description"] : ""
            var description_html = '\
                <div>\
                    '+this.disabled_item('<i class="fas fa-'+icon+'"></i> '+description, disabled)+'<br>\
                    <i>'+this.disabled_item("["+sensor_id+"]", disabled)+'</i>\
                </div>\
                <div class="form-group" id="'+this.id+'_actions_'+sensor_tag+'">\
                    <div class="btn-group">\
                        <button type="button" class="btn btn-sm btn-info">Actions</button>\
                        <button type="button" class="btn btn-sm btn-info dropdown-toggle" data-toggle="dropdown">\
                            <span class="caret"></span>\
                            <span class="sr-only">Toggle Dropdown</span>\
                        </button>\
                        <div class="dropdown-menu" role="menu">\
                            <a class="dropdown-item" id="'+this.id+'_poll_'+sensor_tag+'" style="cursor: pointer"><i class="fas fa-play"></i> Poll Service</a>\
                            <a class="dropdown-item" id="'+this.id+'_set_'+sensor_tag+'" style="cursor: pointer"><i class="fas fa-sign-out-alt"></i> Set Value</a>\
                            <a class="dropdown-item" id="'+this.id+'_graph_'+sensor_tag+'" style="cursor: pointer"><i class="fas fa-chart-bar"></i> Show Graph</a>\
                            <a class="dropdown-item" id="'+this.id+'_edit_'+sensor_tag+'" style="cursor: pointer"><i class="fas fa-edit"></i> Edit Sensor</a>\
                            <a class="dropdown-item" id="'+this.id+'_empty_'+sensor_tag+'" style="cursor: pointer"><i class="fas fa-eraser"></i> Empty Database</a>\
                            <a class="dropdown-item" id="'+this.id+'_retain_'+sensor_tag+'" style="cursor: pointer"><i class="fas fa-backspace"></i> Apply Retention Policies</a>\
                            <div class="dropdown-divider"></div>\
                            <a class="dropdown-item" id="'+this.id+'_delete_'+sensor_tag+'" style="cursor: pointer"><i class="fas fa-trash"></i> Delete Sensor</a>\
                        </div>\
                    </div>\
                </div>\
            '
            var unit = "unit" in sensor ? sensor["unit"] : ""
            var service = ""
            if ("service" in sensor) {
                var service_name = "<u>"+sensor["service"]["name"]+"</u>"
                var service_mode = '<span class="d-none">'+"mode: "+sensor["service"]["mode"]+"</span>"
                var service_configuration = "configuration:<br>&nbsp;&nbsp;"+this.format_object(sensor["service"]["configuration"]).replaceAll("<br>", "<br>&nbsp;&nbsp;")
                var service_icon = ""
                service = "<u>"+sensor["service"]["name"]+"</u><br>mode: "+sensor["service"]["mode"]+"<br>configuration:<br>&nbsp;&nbsp;"+this.format_object(sensor["service"]["configuration"]).replaceAll("<br>", "<br>&nbsp;&nbsp;")
                if (sensor["service"]["mode"] == "actuator") service_icon = "cogs"
                else if (sensor["service"]["mode"] == "push") service_icon = "satellite-dish"
                else if (sensor["service"]["mode"] == "pull") service_icon = "play"
                var service_schedule = ""
                if ("schedule" in sensor["service"]) {
                    service_schedule = "schedule:<br>&nbsp;&nbsp;"+this.format_object(sensor["service"]["schedule"]).replaceAll("<br>", "<br>&nbsp;&nbsp;")
                }
                service = '<i class="fas fa-'+service_icon+'"></i>&nbsp;&nbsp;'+service_name+service_mode+"<br>"+service_configuration+"<br>"+service_schedule
            }
            // add the row
            var row_data = [
                sensor_id, 
                description_html,
                sensor["format"], 
                unit, 
                this.disabled_item(service, disabled), 
                "", 
                "", 
                disabled
            ]
            var row = table.row.add(row_data).draw(false);
            table.responsive.recalc()
            if (table.data().count() == 0) $("#"+this.id+"_table_text").html('No data to display')
            // request value and timestamp
            this.request_data(sensor_id)
            // enable graph and set button
            if (sensor["format"] != "float_1" && sensor["format"] != "float_2" && sensor["format"] != "string" && sensor["format"] != "int") {
                $("#"+this.id+"_graph_"+sensor_tag).addClass("d-none");
                $("#"+this.id+"_set_"+sensor_tag).addClass("d-none");
                $("#"+this.id+"_set_text_"+sensor_tag).addClass("d-none");
            }
            // poll the service associated to the sensor
            $("#"+this.id+"_poll_"+sensor_tag).unbind().click(function(sensor_id) {
                return function () {
                    var message = new Message(gui)
                    message.recipient = "controller/hub"
                    message.command = "POLL"
                    message.args = sensor_id
                    gui.send(message)
                    gui.notify("info", "Requesting to poll the service associated to "+sensor_id)
                };
            }(sensor_id));
            // manually set the value to a sensor
            $("#"+this.id+"_set_"+sensor_tag).unbind().click(function(id, sensor_id) {
                return function () {
                    // ask for the value
                    bootbox.prompt("Type in the value you want to assign to this sensor", function(result){ 
                        if (result == null) return
                        var sensor_tag = sensor_id.replaceAll("/","_")
                        var value = result
                        var message = new Message(gui)
                        message.recipient = "controller/hub"
                        message.command = "SET"
                        message.args = sensor_id
                        message.set("value", value)
                        gui.send(message)
                        gui.notify("info", "Requesting to set "+sensor_id+" to value "+value)
                    });
                };
            }(this.id, sensor_id));
            // show graphs for the selected sensor
            $("#"+this.id+"_graph_"+sensor_tag).unbind().click(function(sensor_id) {
                return function () {
                    window.location.hash = '#__sensor='+sensor_id;
                };
            }(sensor_id));
            // edit the selected sensor
            $("#"+this.id+"_edit_"+sensor_tag).unbind().click(function(sensor_id) {
                return function () {
                    window.location.hash = '#__sensor_wizard='+sensor_id;
                };
            }(sensor_id));
            // empty the database entries for this sensor
            $("#"+this.id+"_empty_"+sensor_tag).unbind().click(function(sensor_id) {
                return function () {
                    gui.confirm("Do you really want to delete all database entries of sensor "+sensor_id+"?", function(result){ 
                        if (! result) return
                        var message = new Message(gui)
                        message.recipient = "controller/db"
                        message.command = "DELETE_SENSOR"
                        message.args = sensor_id
                        gui.send(message)
                        gui.notify("info", "Requesting the database to delete all the entries associated to sensor "+sensor_id)
                    });
                };
            }(sensor_id));
            // manually apply retention policies
            $("#"+this.id+"_retain_"+sensor_tag).unbind().click(function(this_class, sensor_id) {
                return function () {
                    gui.confirm("Do you want to manually apply configured retention policies for sensor "+sensor_id+"?", function(result){ 
                        if (! result) return
                        sensor = this_class.sensors[sensor_id]
                        console.log(this_class.hub)
                        console.log(sensor)
                        if (this_class.hub != null && "retain" in sensor && sensor["retain"] in this_class.hub["retain"]) {
                            
                            var message = new Message(gui)
                            message.recipient = "controller/db"
                            message.command = "PURGE_SENSOR"
                            message.args = sensor_id
                            message.set_data(this_class.hub["retain"][sensor["retain"]]["policies"])
                            gui.send(message)
                            gui.notify("info", "Requesting the database to apply configured retention policies associated to sensor "+sensor_id)
                        }
                    });
                };
            }(this, sensor_id));
            // delete the sensor and empty the database 
            $("#"+this.id+"_delete_"+sensor_tag).unbind().click(function(sensor_id, version) {
                return function () {
                    gui.confirm("Do you really want to delete sensor "+sensor_id+" and all its associated data?", function(result){ 
                        if (! result) return
                        // delete the sensor from the database
                        var message = new Message(gui)
                        message.recipient = "controller/db"
                        message.command = "DELETE_SENSOR"
                        message.args = sensor_id
                        gui.send(message)
                        // delete the sensor configuration file
                        var message = new Message(gui)
                        message.recipient = "controller/config"
                        message.command = "DELETE"
                        message.args = "sensors/"+sensor_id
                        message.config_schema = version
                        gui.send(message)
                        gui.notify("info", "Requesting to delete the sensor "+sensor_id)
                    });
                };
            }(sensor_id, message.config_schema));
            // disable buttons 
            if (disabled) {
                $("#"+this.id+"_poll_"+sensor_tag).remove()
                $("#"+this.id+"_set_"+sensor_tag).remove()
                $("#"+this.id+"_set_text_"+sensor_tag).remove()
            }
            if ( (! ("service" in sensor)) || ("service" in sensor && sensor["service"]["mode"] != "pull")) $("#"+this.id+"_poll_"+sensor_tag).remove()
        }
    }
}