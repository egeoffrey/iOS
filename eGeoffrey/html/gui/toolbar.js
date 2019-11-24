// handle top-right notification widget

class Toolbar extends Widget {
    constructor(id) {
        super(id, {})
        this.persistent = true
        this.max_items = 10
        this.notification_value_enabled = false
        // draw toolbar structure
        $("#toolbar").html('\
            <li class="nav-item dropdown">\
                <a class="nav-link" data-toggle="dropdown" href="#">\
                    <i class="fas fa-ban"></i>\
                    <span class="badge badge-danger navbar-badge" id="notification_alert_count"></span>\
                </a>\
                <div class="dropdown-menu dropdown-menu-lg dropdown-menu-right" id="notification_alert">\
                    <div class="dropdown-divider"></div>\
                    <a class="dropdown-item dropdown-footer" id="notification_alert_link">'+locale("toolbar.view_all")+'</a>\
                </div>\
            </li>\
            <li class="nav-item dropdown">\
                <a class="nav-link" data-toggle="dropdown" href="#">\
                    <i class="fas fa-exclamation-triangle"></i>\
                    <span class="badge badge-warning navbar-badge" id="notification_warning_count"></span>\
                </a>\
                <div class="dropdown-menu dropdown-menu-lg dropdown-menu-right" id="notification_warning">\
                    <div class="dropdown-divider"></div>\
                    <a class="dropdown-item dropdown-footer" id="notification_warning_link">'+locale("toolbar.view_all")+'</a>\
                </div>\
            </li>\
            <li class="nav-item dropdown">\
                <a class="nav-link" data-toggle="dropdown" href="#">\
                    <i class="fas fa-info"></i>\
                    <span class="badge badge-success navbar-badge" id="notification_info_count"></span>\
                </a>\
                <div class="dropdown-menu dropdown-menu-lg dropdown-menu-right" id="notification_info">\
                    <div class="dropdown-divider"></div>\
                    <a class="dropdown-item dropdown-footer" id="notification_info_link">'+locale("toolbar.view_all")+'</a>\
                </div>\
            </li>\
            <li class="nav-item dropdown">\
                <a class="nav-link" data-toggle="dropdown" href="#">\
                    <input type="checkbox" id="notification_value_enabled">\
                    <i class="fas fa-microchip"></i>\
                    <span class="badge badge-info navbar-badge" id="notification_value_count"></span>\
                </a>\
                <div class="dropdown-menu dropdown-menu-lg dropdown-menu-right" id="notification_value">\
                    <div class="dropdown-divider"></div>\
                    <a class="dropdown-item dropdown-footer" id="notification_value_link">'+locale("toolbar.view_all")+'</a>\
                </div>\
            </li>\
        ')
    }
    
    // draw the widget's content
    draw() {
        // ask for the old alerts
        for (var severity of ["info", "warning", "alert", "value"]) {
            // set the link to the widget
            $("#notification_"+severity+"_link").attr("href", "#__notifications"+"="+severity.toUpperCase())
            // retrieve the counter from the database
            var message = new Message(gui)
            message.recipient = "controller/db"
            message.command = "GET_COUNT"
            message.args = severity
            message.set("timeframe", "last_24_hours")
            message.set("scope", "alerts")
            gui.sessions.register(message, {
            })
            this.send(message)
        }
        // setup notification values checkbox
        if (this.notification_value_enabled) $("#notification_value_enabled").iCheck('check')
        $("#notification_value_enabled").iCheck({
          checkboxClass: 'icheckbox_square-blue',
          radioClass: 'iradio_square-blue',
          increaseArea: '20%' 
        });
        $("#notification_value_enabled").unbind().on('ifChanged',function(this_class) {
            return function () {
                this_class.notification_value_enabled = this.checked
            };
        }(this));
        // subscribe for new alert
        this.add_broadcast_listener("+/+", "NOTIFY", "#")
        // ask for manifest files needed for notifying about available updates
        if (gui.check_for_updates) this.add_broadcast_listener("+/+", "MANIFEST", "#")
    }

    // add a new item to a widget
    add_item(tag, text) {
        $(tag).prepend('\
            <a class="dropdown-item">'+text+'</a>\
            <div class="dropdown-divider"></div>\
        ')
    }
        
    // receive data and load it into the widget
    on_message(message) {
        // realtime alerts
        if (message.recipient == "*/*" && message.command == "NOTIFY") {
            var severity = message.args.split("/")[0]
            if (severity == "value" && ! $("#notification_value_enabled").prop('checked')) return
            var alert_text = escape_html(message.get_data())
            var widget = "#notification_"+severity;
            var widget_counter = "#notification_"+severity+"_count"
            // increase the counter
            var counter = parseInt($(widget_counter).html())+1
            $(widget_counter).html(counter)
            // unhide the counter if hidden
            if ($(widget_counter).hasClass("d-none")) $(widget_counter).removeClass("d-none")
            // add the alert to the list
            this.add_item(widget, alert_text)
            // remove the oldest one
            $(widget+" li:last").remove()
            // notify the user
            var color = severity
            if (severity == "alert") color = "danger"
            if (severity == "info") color = "success"
            if (severity == "value") color = "info"
            gui.notify(color, alert_text)
            // notify the andoid device if running within an app
            if (typeof Android !== "undefined" && Android !== null) {
                Android.notify(window.EGEOFFREY_ID, severity, alert_text);
            }
            try {
                webkit.messageHandlers.notify.postMessage([window.EGEOFFREY_ID, severity, alert_text]);
            } catch(err) {}
        }
        // last 24 hours counter
        else if (message.sender == "controller/db" && message.command == "GET_COUNT") {
            var session = gui.sessions.restore(message)
            if (session == null) return
            var data = message.get("data")
            var severity = message.args
            var widget_counter = "#notification_"+severity+"_count"
            var count = data[0]
            // set the counter
            $(widget_counter).html(data[0])
            // hide the counter if there are no items
            if (data[0] == 0) $(widget_counter).addClass("d-none")
            // retrieve the most recent items from the database
            var alerts_to_retrieve = count >= 10 ? 10 : count
            var message = new Message(gui)
            message.recipient = "controller/db"
            message.command = "GET"
            message.args = severity
            message.set("start", -alerts_to_retrieve)
            message.set("end", -1)
            message.set("scope", "alerts")
            gui.sessions.register(message, {
            })
            this.send(message)
        }
        // latest notifications
        else if (message.sender == "controller/db" && message.command == "GET") {
            var session = gui.sessions.restore(message)
            if (session == null) return
            var data = message.get("data")
            var severity = message.args
            var widget = "#notification_"+severity
            // take the latest elements if needed
            if (data.length > this.max_items) data = data.slice(-this.max_items)
            for (var entry of data) {
                entry = truncate(escape_html(entry), 40)
                this.add_item(widget, entry)
            }
        }
        // manifest file - check for updates
        else if (message.command == "MANIFEST") {
            var manifest = message.get_data()
            if (manifest["manifest_schema"] != gui.supported_manifest_schema) return
            // set gui version
            if (manifest["package"] == "egeoffrey-gui") $("#version").html(manifest["version"].toFixed(1)+"-"+manifest["revision"]+" ("+manifest["branch"]+")")
            // check for update
            var url = "https://raw.githubusercontent.com/"+manifest["github"]+"/"+manifest["branch"]+"/manifest.yml?timestamp="+new Date().getTime()
            $.get(url, function(data) {
                var remote_manifest = jsyaml.load(data)
                if (remote_manifest["manifest_schema"] != gui.supported_manifest_schema) return
                if (remote_manifest["version"] > manifest["version"] || (remote_manifest["version"] == manifest["version"] && remote_manifest["revision"] > manifest["revision"])) gui.notify("info", "A new version of "+manifest["package"]+" is available")
            });
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}
