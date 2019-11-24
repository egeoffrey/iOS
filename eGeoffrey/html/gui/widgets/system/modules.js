// modules widget
class Modules extends Widget {
    constructor(id, widget) {
        super(id, widget)
        this.ping = {}
        this.indexes = []
        // add an empty box into the given column
        this.add_large_box(this.id, this.widget["title"])
    }
    
    // request the data
    request_data() {
        // subscribe for start/stop notifications
        this.add_inspection_listener("+/+", "*/*", "STATUS", "#")
        // subscribe for ping responses
        this.add_inspection_listener("+/+", "+/+", "PONG", "#")
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: _table
        var body = "#"+this.id+"_body"
        $(body).html("")
        // add table
        // 0: module
        // 1: type  (hidden)
        // 2: watchdog (hidden)
        // 3: version
        // 4: running
        // 5: configured
        // 6: ping
        // 7: debug
        // 8: module_id (hidden)
        var table = '\
            <table id="'+this.id+'_table" class="table table-bordered table-striped">\
                <thead>\
                   <tr><th class="all">Name</th><th>Type</th><th>Watchdog</th><th>Version</th><th>Running</th><th>Configured</th><th>Ping</th><th>Debug</th><th>module_id</th></tr>\
                </thead>\
                <tbody></tbody>\
            </table>'
        $(body).append(table)
        // define datatables options
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
                    "className": "dt-center",
                    "targets": [3, 4, 5, 6, 7]
                },
                {
                    "targets" : [1, 2, 8],
                    "visible": false,
                }
            ],
            "language": {
                "emptyTable": '<span id="'+this.id+'_table_text"></span>'
            }
        };
        // create the table
        if (! $.fn.dataTable.isDataTable("#"+this.id+"_table")) {
            $("#"+this.id+"_table").DataTable(options);
        } else {
            var table = $("#"+this.id+"_table").DataTable()
            table.clear()
        }
        $("#"+this.id+"_table_text").html('<i class="fas fa-spinner fa-spin"></i> Loading')
        this.request_data()
        // ask for manifest files
        this.add_broadcast_listener("+/+", "MANIFEST", "#")
    }
    
    // set the status to given module_id
    set_status(module_id, status) {
        var table = $("#"+this.id+"_table").DataTable()        
        table.rows().every( function ( row_index, table_loop, row_loop ) {
            var row = this.data()
            if (row[8] != module_id) return
            if (status == 1) table.cell(row_index, 4).data('<i class="fas fa-check" style="color: green;"></i>').draw(false)
        });
    }
    
    // receive data and load it into the widget
    on_message(message) {
        // a module is changing status
        if (message.command == "STATUS") {
            if (message.sender.startsWith("system")) return
            this.set_status(message.sender, message.args)
            if (message.args == 1) gui.notify("success", message.sender+" has started")
            else gui.notify("success", message.sender+" has stopped")
        }
        // receiving a manifest
        if (message.command == "MANIFEST") {
            // discover modules of this watchdog
            var discover_message = new Message(gui)
            discover_message.recipient = message.sender
            discover_message.command = "DISCOVER"
            discover_message.args = "*"
            this.indexes = []
            this.send(discover_message)
        }
        // received a ping response
        else if (message.command == "PONG") {
            var latency = (((new Date()).getTime()-this.ping[message.sender])/1000).toFixed(1)
            var table = $("#"+this.id+"_table").DataTable()        
            table.rows().every( function ( row_index, table_loop, row_loop ) {
                var row = this.data()
                if (row[8] != message.sender) return
				var text = latency < 2 ? latency+"s" : '<span class="text-danger">'+latency+"s</span>" 
                table.cell(row_index, 6).data(text).draw(false)
            });
        }
        // received a discover response
        else if (message.command == "DISCOVER") {
            // for each module managed by the watchdog
            var watchdog = message.sender
            for (var module of message.get_data()) {
                // prevent adding the same module twice
                if (this.indexes.includes(watchdog+"|"+module["fullname"])) continue
                this.indexes.push(watchdog+"|"+module["fullname"])
                // add a row to the table with the discovered module
                var table = $("#"+this.id+"_table").DataTable()
                var module_id = module["scope"]+'_'+module["name"]
                var icon = "question"
                if (module["scope"] == "controller") icon = "gamepad"
                else if (module["scope"] == "notification") icon = "bell"
                else if (module["scope"] == "interaction") icon = "comment"
                else if (module["scope"] == "service") icon = "exchange-alt"
                else if (module["scope"] == "gui") icon = "columns"
                var module_name = '<i class="fas fa-'+icon+'"></i> '+module["fullname"]
                var module_name = '\
                    <div>\
                        '+'<i class="fas fa-'+icon+'"></i> '+module["fullname"]+'\
                    </div>\
                    <div class="form-group" id="'+this.id+'_actions_'+module_id+'">\
                        <div class="btn-group">\
                            <button type="button" class="btn btn-sm btn-info">Actions</button>\
                            <button type="button" class="btn btn-sm btn-info dropdown-toggle" data-toggle="dropdown">\
                                <span class="caret"></span>\
                                <span class="sr-only">Toggle Dropdown</span>\
                            </button>\
                            <div class="dropdown-menu" role="menu">\
                                <a class="dropdown-item" id="'+this.id+'_set_'+module_id+'" style="cursor: pointer"><i class="fas fa-sign-out-alt"></i> Send Notification</a>\
                                <a class="dropdown-item" id="'+this.id+'_edit_'+module_id+'" style="cursor: pointer"><i class="fas fa-edit"></i> Edit Configuration</a>\
                                <div class="dropdown-divider"></div>\
                                <a class="dropdown-item" id="'+this.id+'_start_'+module_id+'" style="cursor: pointer"><i class="fas fa-play"></i> Start Module</a>\
                                <a class="dropdown-item" id="'+this.id+'_stop_'+module_id+'" style="cursor: pointer"><i class="fas fa-stop"></i> Stop Module</a>\
                                <a class="dropdown-item" id="'+this.id+'_restart_'+module_id+'" style="cursor: pointer"><i class="fas fa-sync"></i> Restart Module</a>\
                            </div>\
                        </div>\
                    </div>\
                '
                var type = module["scope"]
                var version = module["version"]
                var debug_html = '<input id="'+this.id+'_debug_'+module_id+'" type="checkbox">'
                var table_options = [
                    module_name, 
                    type,
                    watchdog, 
                    version, 
                    "", 
                    "", 
                    "",
                    debug_html,
                    module["fullname"]
                ]
                var row = table.row.add(table_options).draw();
                table.responsive.recalc()
                if (table.data().count() == 0) $("#"+this.id+"_table_text").html('No data to display')
                // set configured checkbox
                if (module["configured"]) {
                    row.data()[5] = '<i class="fas fa-check text-success"></i>'
                    row.invalidate()
                }
                // set debug checkbox
                $("#"+this.id+"_debug_"+module_id).iCheck({
                  checkboxClass: 'icheckbox_square-blue',
                  radioClass: 'iradio_square-blue',
                  increaseArea: '20%' 
                });
                // set the debug checkbox
                $("#"+this.id+"_debug_"+module_id).prop('checked', module["debug"])
				$("#"+this.id+"_debug_"+module_id).iCheck('update')
                // when the debug checkbox changes, send a message to the module's watchdog
                $("#"+this.id+"_debug_"+module_id).unbind().on('ifChanged',function(module, watchdog) {
                    return function () {
                        var message = new Message(gui)
                        message.recipient = watchdog
                        message.command = "DEBUG"
                        message.args = module["fullname"]
                        message.set_data(this.checked)
                        gui.send(message)
                    };
                }(module, watchdog));
                // edit the module's configuration
                $("#"+this.id+"_edit_"+module_id).unbind().click(function(scope, name) {
                    return function () {
                        if (scope == "controller") window.location.hash = '#__configuration='+scope+'/'+name;
                        else window.location.hash = '#__module_wizard='+scope+'/'+name;
                    };
                }(module["scope"], module["name"]));
                // start the module
                $("#"+this.id+"_start_"+module_id).unbind().click(function(module, watchdog) {
                    return function () {
                        var message = new Message(gui)
                        message.recipient = watchdog
                        message.command = "START"
                        message.args = module["fullname"]
                        gui.send(message)
                    };
                }(module, watchdog));
                // stop the module
                $("#"+this.id+"_stop_"+module_id).unbind().click(function(module, watchdog) {
                    return function () {
                        var message = new Message(gui)
                        message.recipient = watchdog
                        message.command = "STOP"
                        message.args = module["fullname"]
                        gui.send(message)
                    };
                }(module, watchdog));
                // restart the module
                $("#"+this.id+"_restart_"+module_id).unbind().click(function(module, watchdog) {
                    return function () {
                        var message = new Message(gui)
                        message.recipient = watchdog
                        message.command = "RESTART"
                        message.args = module["fullname"]
                        gui.send(message)
                    };
                }(module, watchdog));
                // for a notification module, manually run it
                if (module["scope"] == "notification") {
                    $("#"+this.id+"_set_"+module_id).unbind().click(function(module_id, module, id) {
                        return function () {
                            // ask for the value
                            bootbox.prompt("Type in the value you want to notify about", function(result){ 
                                if (result == null) return
                                var value = result
                                var message = new Message(gui)
                                message.recipient = module["fullname"]
                                message.command = "RUN"
                                message.args = "info"
                                message.set_data(value)
                                gui.send(message)
                                gui.notify("info", "Requesting "+module["fullname"]+" to notify about "+value)
                            });
                        };
                    }(module_id, module, this.id));
                } else {
                    $("#"+this.id+"_set_"+module_id).addClass("d-none");
                }
                // set status
                this.set_status(module["fullname"], module["started"])
                // ping the module
                // TODO: ping not working with remote modules
                this.ping[module["fullname"]] = (new Date()).getTime()
                var message = new Message(gui)
                message.recipient = module["fullname"]
                message.command = "PING"
                this.send(message)
            }
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}