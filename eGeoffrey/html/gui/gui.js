// GUI main class

class Gui extends Module {
    // What to do when initializing
    on_init() {
        this.username = "EGEOFFREY_USERNAME" in window ? window.EGEOFFREY_USERNAME : "guest"
        this.password = "EGEOFFREY_PASSWORD" in window ? window.EGEOFFREY_PASSWORD : ""
        // apply locale
        $("#popup_close").html(locale("gui.popup.close"))
        $("#wizard_close").html(locale("gui.wizard.close"))
        $("#wizard_delete").html(locale("gui.wizard.delete"))
        $("#wizard_save").html(locale("gui.wizard.save"))
        // map a subscribed topic with an array of widgets
        this.listeners = {}
        // map a requested configuration with its content (since a retained message, we need to keep track)
        this.configurations = {}
        // map a manifest with its content (since a retained message, we need to keep track)
        this.manifests = {}
        // map request_id with an array of the requesting widgets
        this.requests = {}
        // other settings
        this.house = {}
        this.settings = {}
        this.charts = {}
        this.users = {}
        this.groups = {}
        // date/time helper
        this.date = null
        // managed configuration schema
        this.page_config_schema = 1
        this.chart_config_schema = 1
        this.settings_config_schema = 1
        this.menu_config_schema = 1
        this.users_config_schema = 1
        this.groups_config_schema = 1
        // unmanaged configuration schema
        this.supported_sensors_config_schema = 1
        this.supported_house_config_schema = 1
        this.supported_rules_config_schema = 2
        this.supported_manifest_schema = 2
        // subscribe to required settings
        this.add_configuration_listener("house", 1, true)
        this.add_configuration_listener("gui/settings", "+", true)
        this.add_configuration_listener("gui/charts", "+", true)
        this.add_configuration_listener("gui/users", "+", true)
        this.add_configuration_listener("gui/groups", "+", true)
        // objects of the current page
        this.page = null
        this.page_listener = null
        this.menu = new Menu("menu")
        this.toolbar = new Toolbar("toolbar")
		this.first_page_loaded = false
        // set to true when waiting for a page
        this.waiting_for_page = false
        // loaded Google Maps
        this.maps_loaded = false
        // scheduler's events
        this.scheduler_events = []
        // check for updates after login
        this.check_for_updates = true
        // flag set on when the user is logged in
        this.logged_in = false
    }
    
	// notify the user about something
	notify(type, message) {
        toastr.options = {
            "closeButton": false,
            "preventDuplicates": true,
            "hideDuration": "500",
            "timeOut": "4000",
        }
        if (type == "danger") type = "error"
        if (type != "warning" && type != "success" && type != "info" && type != "error") type = "info"
        toastr[type](message)
	}
    
	// ask the user confirmation about something
	confirm(message, func) {
        bootbox.confirm({
            "message": message,
            "buttons": {
                "cancel": {
                    "label": '<i class="fas fa-times"></i> Cancel'
                },
                "confirm": {
                    "label": '<i class="fas fa-check"></i> Confirm'
                }
            },
            "callback": func
        });
	}
    
    // unload the current page
    unload_page() {
        // clear all previously cached settings
        this.requests = {}
        // unsubscribe from all previously subscribed objects
        for (var topic in this.listeners) {
            // rebuild the array of registered widgets
            var new_listener = []
            for (var widget of this.listeners[topic]) {
                // keep only persistent widgets
                if (widget.persistent) new_listener.push(widget)
            }
            this.listeners[topic] = new_listener
            // if there are no more widgets listening for that topic, remove the listener
            if (this.listeners[topic].length == 0) {
                // TODO: do not remove mandatory topics
                this.remove_listener(topic)
                delete this.listeners[topic]
            }
        }
        // close the old page
        if (this.page != null) this.page.close()
    }
    
    // load the page requested in window.hash
    load_page() {
        this.unload_page()
        // move to the top of the page
        window.scrollTo(0,0)
        var page_id = location.hash.replace('#','')
        // remove arguments from the page_id
        if (page_id.includes("=")) {
            var split = page_id.split("=")
            page_id = split[0]
        }
        // if no page is provided, load the default_page
        if (page_id == "") {
            window.location.hash = '#'+gui.settings["default_page"]
            return
        }
        // keep track of the current page
        localStorage.setItem("EGEOFFREY_CURRENT_PAGE", page_id)
		// if loading the page for the first time, draw the menu and toolbar (otherwise unload_page() would reset pending requests)
		if (! this.first_page_loaded) {
			this.menu.draw()
			this.toolbar.draw()
			this.first_page_loaded = true
		}
        // load system pages
        if (page_id.startsWith("__")) {
            this.page = new Page("SYSTEM", page_id, "")
        }
        // load user's custom page
        else {
            this.waiting_for_page = true
            if (this.page_listener != null) this.remove_listener(this.page_listener)
            this.page_listener = this.add_configuration_listener("gui/pages/"+page_id, "+")
        }
    }

    // What to do just after connecting
    on_connect() {
        $("#status").html('<i class="fas fa-circle text-success"></i> <span style="cursor: default">'+window.EGEOFFREY_GATEWAY_HOSTNAME+'</span>');
    }
    
    // return true if the current user is authorized to access the item, false otherwise
    is_authorized(authorized_groups) {
        // for each authorized group, check if the current user belong to one of them
        for (var group of authorized_groups) {
            if (! (group in this.groups)) continue
            if (this.groups[group].includes(this.username)) return true
        }
        return false
    }
    
    // check if the user is authenticated
    is_authenticated() {
        // authenticate the user
        if (! (this.username in this.users)) this.logout()
        var user = this.users[this.username]
        if ("password" in user && user["password"] != this.password) this.logout()
        $("#user_icon").addClass("fa-"+user["icon"])
        $("#user_fullname").html('<i class="fas fa-sign-out-alt"></i> '+user["fullname"])
        $("#user_fullname").unbind().click(function(this_class) {
            return function () {
                // clear stored credentials
                localStorage.clear()
                // disconnect
                this_class.logout()
            };
        }(this));
    }

    // log out the user
    logout() {
        this.logged_in = false
        this.join()
    }
    
    // animate the logo
    animate_logo() {
        var element = $("#logo");
        var duration = 200
        var deg = 15
        var target_degrees = deg;
        $({degrees: target_degrees - deg}).animate({degrees: target_degrees}, {
            duration: duration,
            step: function(now) {
                element.css({
                    transform: 'rotate(' + now + 'deg)'
                });
            },
            complete: function() {
                var target_degrees = 0;
                $({degrees: target_degrees + deg}).animate({degrees: target_degrees}, {
                    duration: duration,
                    step: function(now) {
                        element.css({
                            transform: 'rotate(' + now + 'deg)'
                        });
                    },
                    complete: function() {
                        var target_degrees = - deg;
                        $({degrees: target_degrees + deg}).animate({degrees: target_degrees}, {
                            duration: duration,
                            step: function(now) {
                                element.css({
                                    transform: 'rotate(' + now + 'deg)'
                                });
                            },
                            complete: function() {
                                var target_degrees = 0;
                                $({degrees: target_degrees - deg}).animate({degrees: target_degrees}, {
                                    duration: duration,
                                    step: function(now) {
                                        element.css({
                                            transform: 'rotate(' + now + 'deg)'
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
    
    // What to do after starting
    on_start() {
        // ensure the user is authenticated
        this.is_authenticated()
        // user logged in successfully
        this.logged_in = true
        $("#body").html('<center><i class="fas fa-spin fa-spinner"></i> Loading...</center>')
        // safeguard, if not receiving a configuration file timely, disconnect
        setTimeout(function(this_class) {
            return function() {
                if (Object.keys(this_class.settings).length === 0) {
                    this_class.log_error("Timeout in receiving the configuration, disconnecting")
                    this_class.logout()
                }
            };
        }(this), 3000);
        // periodically send keepalive messages to keep connection open (default timeout is 60 seconds)
        setInterval(function(this_class) {
            return function() {
                var message = new Message(gui)
                message.recipient = "*/*"
                message.command = "KEEPALIVE"
                message.args = "0"
                this_class.send(message)
            };
        }(this), 20000);
        // if a page is requested, load it
        this.load_page()
        // whenever the hash changes, load the requested page
        window.onhashchange = function() {
            gui.load_page()
        }
        // animate the logo icon
        this.animate_logo()
    }
        
    // What to do when exiting
    on_stop() {
        var user = this.users[this.username]
        if (user != null) $("#user_icon").removeClass("fa-"+user["icon"])
    }
    
    // What to do when disconnecting
    on_disconnect() {
        $("#body").html('<center><i class="fas fa-spin fa-spinner"></i> Loading...</center>')
        $("#user_fullname").html("");
        $("#status").html("");
    }
  
    // What to do when receiving a request for this module
    on_message(message) {
        var delivered = 0
        // dispatch the message to the requesting widget if there is an associated request_id
        var request_id = message.get_request_id()
        if (request_id in this.requests) {
            var widget = this.requests[request_id]
            widget.on_message(message)
            delete this.requests[request_id]
            delivered++
        }
        // deliver the message to any widget waiting for a message on that topic
        if (delivered == 0) {
            for (var topic in this.listeners) {
                // deliver the message to all the listeners
                if (topic_matches_sub(topic, message.topic)) {
                    for (var widget of this.listeners[topic]) {
                        widget.on_message(message)
                        delivered++
                    }
                }
            }
        }
        // keep track of received manifest files
        if (message.command == "MANIFEST") this.manifests[message.args] = message
        if (delivered == 0) this.log_warning("undelivered message: "+message.dump())
    }
    
    // What to do when receiving a new/updated configuration for this module
    on_configuration(message) {
        // TODO: how to handle sensors/pages/menu removed from config
        if (message.is_null) return
        // load the page
        else if ((this.waiting_for_page && message.args.startsWith("gui/pages/") ) || (this.page != null && message.args == this.page.page_id)) {
            if (message.config_schema != this.page_config_schema) {
                return false
            }
            this.log_debug("Received "+message.args)
            this.page = new Page("USER", message.args, message.get_data())
            this.waiting_for_page = false
        }
        // load charts
        else if (message.args == "gui/charts") {
            if (message.config_schema != this.chart_config_schema) {
                return false
            }
            for (var chart_name in message.get_data()) {
                var chart = message.get(chart_name)
                // if a template is defined, merge the template configuration with the chart configuration
                if ("template" in chart) {
                    this.charts[chart_name] = Object.assign({}, this.charts[chart["template"]], chart)
                }
                else this.charts[chart_name] = chart
            }
        }
        else if (message.args == "house") {
            if (! this.is_valid_configuration(["units", "timezone", "language", "name"], message.get_data())) return false
            this.house = message.get_data()
            // set house name
            $("#house_name").html(this.house["name"].replaceAll(" ","&nbsp;"))
            // set house time
            this.date = new DateTimeUtils(message.get("timezone"))
            $("#house_time").html(gui.date.format_timestamp())
            setInterval(function() {
                if (gui.date != null) $("#house_time").html(gui.date.format_timestamp())
            }, 1000);
        }
        else if (message.args == "gui/settings") {
            if (message.config_schema != this.settings_config_schema) {
                return false
            }
            if (! this.is_valid_configuration(["default_page"], message.get_data())) return false
            this.settings = message.get_data()
        }
        else if (message.args == "gui/users") {
            if (message.config_schema != this.users_config_schema) {
                return false
            }
            this.users = message.get_data()
            // ensure the user is still authenticated
            this.is_authenticated()
        }
        else if (message.args == "gui/groups") {
            if (message.config_schema != this.groups_config_schema) {
                return false
            }
            this.groups = message.get_data()
        }
        this.log_debug("Received configuration "+message.args)
        // keep track of the configuration file
        this.configurations[message.args] = message
        // deliver the configuration to any widget waiting for it
        for (var topic in this.listeners) {
            // deliver the message to all the listeners
            if (topic_matches_sub(topic, message.topic)) {
                for (var widget of this.listeners[topic]) {
                    widget.on_configuration(message)
                }
            }
        }
    }
}
