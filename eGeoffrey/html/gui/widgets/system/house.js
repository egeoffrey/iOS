// house widget
class House extends Widget {
    constructor(id, widget) {
        super(id, widget)
        // add an empty box into the given column
        this.add_large_box(this.id, this.widget["title"])
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: 
        var body = "#"+this.id+"_body"
        $(body).html("")
        $(body).append('\
            <ul class="nav nav-tabs" id="'+this.id+'_tabs" role="tablist">\
                <li class="nav-item">\
                    <a class="nav-link active" id="'+this.id+'_tab_house" data-toggle="pill" href="#'+this.id+'_tab_house_content" role="tab" aria-controls="'+this.id+'_tab_house_content" aria-selected="true"><i class="fas fa-home"></i> House</a>\
                </li>\
                <li class="nav-item">\
                    <a class="nav-link" id="'+this.id+'_tab_gui" data-toggle="pill" href="#'+this.id+'_tab_gui_content"  role="tab" aria-controls="'+this.id+'_tab_gui_content" aria-selected="false"><i class="fas fa-columns"></i> Web Interface</a>\
                </li>\
                <li class="nav-item">\
                    <a class="nav-link" id="'+this.id+'_tab_users" data-toggle="pill" href="#'+this.id+'_tab_users_content"  role="tab" aria-controls="'+this.id+'_tab_users_content" aria-selected="false"><i class="fas fa-user"></i> Users</a>\
                </li>\
                <li class="nav-item">\
                    <a class="nav-link" id="'+this.id+'_tab_groups" data-toggle="pill" href="#'+this.id+'_tab_groups_content"  role="tab" aria-controls="'+this.id+'_tab_groups_content" aria-selected="false"><i class="fas fa-users"></i> Groups</a>\
                </li>\
            </ul>\
            <div class="tab-content text-left">\
                <div class="tab-pane fade show active" id="'+this.id+'_tab_house_content" role="tabpanel" aria-labelledby="'+this.id+'_tab_house">\
                    <form method="POST" role="form" id="'+this.id+'_form_house" class="needs-validation" novalidate>\
                        <div class="form-group">\
                            <label>Name of your House - used in notifications and as web interface title*</label>\
                            <input type="text" id="'+this.id+'_house_name" class="form-control" placeholder="House Name" required>\
                        </div>\
                        <div class="form-group">\
                            <label>Timezone Offset - used by the scheduler to run your rules or poll your sensors at the right time*</label>\
                            <input type="text" id="'+this.id+'_house_timezone" class="form-control" placeholder="1" required>\
                        </div>\
                        <div class="form-group">\
                            <label>Language* - used for localizing the information coming from your services</label>\
                            <input type="text" id="'+this.id+'_house_language" class="form-control" placeholder="en" required>\
                        </div>\
                        <div class="form-group">\
                            <label>Units* - used for providing you the measures in the right format</label>\
                            <select id="'+this.id+'_house_units" class="form-control" required>\
                                <option value="metric">Metric (e.g. °C, km, etc.)</option>\
                                <option value="imperial">Imperial (e.g. °F, miles, etc.)</option>\
                            </select>\
                        </div>\
                        <div class="form-group">\
                            <label>Latitude* - used by e.g. weather and earthquake services (<a target="_blank" href="https://gps-coordinates.org/">find out my position</a>)</label>\
                            <input type="text" id="'+this.id+'_house_latitude" class="form-control" placeholder="48.85" required>\
                        </div>\
                        <div class="form-group">\
                            <label>Longitude* - used by e.g. weather and earthquake services (<a target="_blank" href="https://gps-coordinates.org/">find out my position</a>)</label>\
                            <input type="text" id="'+this.id+'_house_longitude" class="form-control" placeholder="2.35" required>\
                        </div>\
                        <div class="float-right">\
                          <button type="button" class="btn btn-primary" id="'+this.id+'_house_save">Save</button>\
                        </div>\
                    </form>\
                </div>\
                <div class="tab-pane fade" id="'+this.id+'_tab_gui_content" role="tabpanel" aria-labelledby="'+this.id+'_tab_gui">\
                    <form method="POST" role="form" id="'+this.id+'_form_gui" class="needs-validation" novalidate>\
                        <div class="form-group">\
                            <label>Default Page*</label>\
                            <input type="text" id="'+this.id+'_gui_default_page" class="form-control" placeholder="overview/welcome" required>\
                        </div>\
                        <div class="form-group">\
                            <label>Map API Key - used by the Map widget to draw interactive maps (<a target="_blank" href="http://developers.google.com/maps/documentation/embed/get-api-key">get it from here</a>)</label>\
                            <input type="text" id="'+this.id+'_gui_map_api_key" class="form-control">\
                        </div>\
                        <div class="float-right">\
                          <button type="button" class="btn btn-primary" id="'+this.id+'_house_save">Save</button>\
                        </div>\
                    </form>\
                </div>\
                <div class="tab-pane fade" id="'+this.id+'_tab_users_content" role="tabpanel" aria-labelledby="'+this.id+'_tab_users">\
                    <form method="POST" role="form" id="'+this.id+'_form_users" class="needs-validation" novalidate>\
                        <div class="row">\
                            <div class="col-3">\
                                <div class="nav flex-column nav-tabs" role="tablist" aria-orientation="vertical" id="'+this.id+'_users_tabs">\
                                </div>\
                            </div>\
                            <div class="col-9">\
                                <div class="tab-content" id="'+this.id+'_users_tab_content">\
                                </div>\
                            </div>\
                        </div>\
                        <div class="float-right">\
                          <button type="button" class="btn btn-default" id="'+this.id+'_users_new">New User</button>\
                          <button type="button" class="btn btn-default text-red" id="'+this.id+'_users_delete">Delete User</button>\
                          <button type="button" class="btn btn-primary" id="'+this.id+'_users_save">Save</button>\
                        </div>\
                    </form>\
                </div>\
                <div class="tab-pane fade" id="'+this.id+'_tab_groups_content" role="tabpanel" aria-labelledby="'+this.id+'_tab_groups">\
                    <form method="POST" role="form" id="'+this.id+'_form_groups" class="needs-validation" novalidate>\
                        <div class="row">\
                            <div class="col-3">\
                                <div class="nav flex-column nav-tabs" role="tablist" aria-orientation="vertical" id="'+this.id+'_groups_tabs">\
                                </div>\
                            </div>\
                            <div class="col-9">\
                                <div class="tab-content" id="'+this.id+'_groups_tab_content">\
                                </div>\
                            </div>\
                        </div>\
                        <div class="float-right">\
                          <button type="button" class="btn btn-default" id="'+this.id+'_groups_new_user">New User</button>\
                          <button type="button" class="btn btn-default" id="'+this.id+'_groups_new">New Group</button>\
                          <button type="button" class="btn btn-default text-red" id="'+this.id+'_groups_delete">Delete Group</button>\
                          <button type="button" class="btn btn-primary" id="'+this.id+'_groups_save">Save</button>\
                        </div>\
                    </form>\
                </div>\
            </div>\
        ')
        var id = this.id
        var this_class = this
        
        // configure house form
        $('#'+this.id+'_form_house').on('submit', function (e) {
            // form is validated
            if ($('#'+this_class.id+'_form_house')[0].checkValidity()) {
                // build up the configuration file
                var configuration = {}
                $("#"+this_class.id+"_form_house :input").each(function(e){
                    var item = this.id.replace(this_class.id+"_house_", "")
                    var value = this.value
                    if (value != null && value != "") configuration[item] = $.isNumeric(value) ? parseFloat(value) : value
                });
                // save configuration
                var message = new Message(gui)
                message.recipient = "controller/config"
                message.command = "SAVE"
                message.args = "house"
                message.config_schema = gui.supported_house_config_schema
                message.set_data(configuration)
                gui.send(message)
                // close the modal
                gui.notify("success","House configuration saved successfully")
                return false
            }
            else {
                e.preventDefault();
                e.stopPropagation();
            }
            $('#'+this_class.id+'_form_house').addClass("was-validated")
        })
        $('#'+this.id+'_house_save').unbind().click(function(this_class) {
            return function () {
                $("#"+this_class.id+"_form_house").submit()
            };
        }(this))
        
        // configure gui form
        $('#'+this.id+'_form_gui').on('submit', function (e) {
            // form is validated
            if ($('#'+this_class.id+'_form_gui')[0].checkValidity()) {
                // build up the configuration file
                var configuration = {}
                $("#"+this_class.id+"_form_gui :input").each(function(e){
                    var item = this.id.replace(this_class.id+"_gui_", "")
                    var value = this.value
                    if (value != null && value != "") configuration[item] = $.isNumeric(value) ? parseFloat(value) : value
                });
                // save configuration
                var message = new Message(gui)
                message.recipient = "controller/config"
                message.command = "SAVE"
                message.args = "gui/settings"
                message.config_schema = gui.settings_config_schema
                message.set_data(configuration)
                gui.send(message)
                // close the modal
                gui.notify("success","Web Interface configuration saved successfully")
                return false
            }
            else {
                e.preventDefault();
                e.stopPropagation();
            }
            $('#'+this_class.id+'_form_gui').addClass("was-validated")
        })
        $('#'+this.id+'_gui_save').unbind().click(function(this_class) {
            return function () {
                $("#"+this_class.id+"_form_gui").submit()
            };
        }(this))
        
        // configure users form
        var id = this.id
        var this_class = this
        $('#'+this.id+'_users_delete').unbind().click(function(this_class) {
            return function () {
                var username
                $("#"+this_class.id+"_users_tab_content > div").each(function(e){
                    // identify the selected tab/user
                    if (! $("#"+this.id).hasClass("active")) return
                    var username = this.id.replace(id+"_users_", "").replace("_tab_content", "")
                });
                // delete the tab
                $("#"+id+'_users_'+username+'_tab').remove()
                $("#"+id+'_users_'+username+'_tab_content').remove()
                // select the first user left
                var first = true
                $("#"+this_class.id+"_users_tabs > a").each(function(e){
                    if (! first) return
                    if (first) $("#"+this.id).trigger("click")
                });
            };
        }(this))
        $('#'+this.id+'_users_new').unbind().click(function(this_class) {
            return function () {
                // ask the fhe username
                bootbox.prompt("Type in the username of the new user", function(result){ 
                    if (result == null) return
                    var username = result
                    // add a new tab and focus on it
                    this_class.add_user(username, {fullname: "", icon: "", password: ""}, false)
                    $("#"+this_class.id+'_users_'+username+'_tab').trigger("click")
                });
            };
        }(this))
        $('#'+this.id+'_form_users').on('submit', function (e) {
            // form is validated
            if ($('#'+this_class.id+'_form_users')[0].checkValidity()) {
                // build up the configuration file
                var users = {}
                $("#"+this_class.id+"_users_tabs > a").each(function(e){
                    // for each username
                    var username = this.id.replace(id+"_users_", "").replace("_tab", "")
                    users[username] = {}
                    for (var key of ["fullname", "icon", "password"]) {
                        var value = $("#"+id+'_user_'+username+'_'+key).val()
                        if (value != null && value != "") users[username][key] = $.isNumeric(value) ? parseFloat(value) : value
                    }
                });
                // save configuration
                var message = new Message(gui)
                message.recipient = "controller/config"
                message.command = "SAVE"
                message.args = "gui/users"
                message.config_schema = gui.users_config_schema
                message.set_data(users)
                gui.send(message)
                // close the modal
                gui.notify("success","Users saved successfully")
                return false
            }
            else {
                e.preventDefault();
                e.stopPropagation();
            }
            $('#'+this_class.id+'_form_users').addClass("was-validated")
        })
        $('#'+this.id+'_users_save').unbind().click(function(this_class) {
            return function () {
                $("#"+this_class.id+"_form_users").submit()
            };
        }(this))
        
        // configure groups form
        var id = this.id
        var this_class = this
        $('#'+this.id+'_groups_delete').unbind().click(function(this_class) {
            return function () {
                var groupname
                // identify the selected group
                $("#"+this_class.id+"_groups_tab_content > div").each(function(e){
                    if (! $("#"+this.id).hasClass("active")) return
                    groupname = this.id.replace(id+"_groups_", "").replace("_tab_content", "")
                });
                // delete the tab
                $("#"+id+'_groups_'+groupname+'_tab').remove()
                $("#"+id+'_groups_'+groupname+'_tab_content').remove()
                // select the first user left
                var first = true
                $("#"+this_class.id+"_groups_tabs > a").each(function(e){
                    if (! first) return
                    if (first) $("#"+this.id).trigger("click")
                });
            };
        }(this))
        $('#'+this.id+'_groups_new').unbind().click(function(this_class) {
            return function () {
                // ask the fhe groupname
                bootbox.prompt("Type in the name of the new group", function(result){ 
                    if (result == null) return
                    var groupname = result
                    // add a new tab and focus on it
                    this_class.add_group(groupname, [], false)
                    $("#"+this_class.id+'_groups_'+groupname+'_tab').trigger("click")
                });
            };
        }(this))
        $('#'+this.id+'_groups_new_user').unbind().click(function(this_class) {
            return function () {
                var groupname
                // identify the selected group
                $("#"+this_class.id+"_groups_tab_content > div").each(function(e){
                    if (! $("#"+this.id).hasClass("active")) return
                    groupname = this.id.replace(id+"_groups_", "").replace("_tab_content", "")
                });
                this_class.add_user_to_group(groupname, "")
            };
        }(this))
        $('#'+this.id+'_form_groups').on('submit', function (e) {
            // form is validated
            if ($('#'+this_class.id+'_form_groups')[0].checkValidity()) {
                // build up the configuration file
                var groups = {}
                $("#"+this_class.id+"_groups_tabs > a").each(function(e){
                    // for each groupname
                    var groupname = this.id.replace(id+"_groups_", "").replace("_tab", "")
                    groups[groupname] = []
                    $("#"+this_class.id+"_groups_"+groupname+"_tab_content :input").each(function(e){
                        var value = $("#"+this.id).val()
                        if (value == "") return
                        groups[groupname].push(value)
                    });
                });
                // save configuration
                var message = new Message(gui)
                message.recipient = "controller/config"
                message.command = "SAVE"
                message.args = "gui/groups"
                message.config_schema = gui.groups_config_schema
                message.set_data(groups)
                gui.send(message)
                // close the modal
                gui.notify("success","Groups saved successfully")
                return false
            }
            else {
                e.preventDefault();
                e.stopPropagation();
            }
            $('#'+this_class.id+'_form_groups').addClass("was-validated")
        })
        $('#'+this.id+'_groups_save').unbind().click(function(this_class) {
            return function () {
                $("#"+this_class.id+"_form_groups").submit()
            };
        }(this))
        
        // request data
        this.add_configuration_listener("house", gui.supported_house_config_schema)
        this.add_configuration_listener("gui/settings", gui.settings_config_schema)
        this.add_configuration_listener("gui/users", gui.users_config_schema)
        this.add_configuration_listener("gui/groups", gui.groups_config_schema)
    }
    
        
    // close the widget
    close() {
    }    
    
    // receive data and load it into the widget
    on_message(message) {
    }
    
    // add a new user
    add_user(username, user, active) {
        var is_active = active ? "active" : ""
        var selected = active ? "true" : "false"
        var tab = '\
            <a class="nav-link '+is_active+'" id="'+this.id+'_users_'+username+'_tab" data-toggle="pill" href="#'+this.id+'_users_'+username+'_tab_content" role="tab" aria-controls="'+this.id+'_users_'+username+'_tab_content" aria-selected="'+selected+'">'+username+'</a>\
        '
        $("#"+this.id+"_users_tabs").append(tab)
        var is_active = active ? "show active" : ""
        var password = user["password"] != null ? user["password"] : "" 
        var tab_content = '\
            <div class="tab-pane fade '+is_active+'" id="'+this.id+'_users_'+username+'_tab_content" role="tabpanel" aria-labelledby="'+this.id+'_users_'+username+'_tab">\
                <div class="form-group">\
                    <label>Fullname*</label>\
                    <input type="text" id="'+this.id+'_user_'+username+'_fullname" class="form-control" placeholder="Name Surname" value="'+user["fullname"]+'" required>\
                </div>\
                <div class="form-group">\
                    <label>Icon*</label>\
                    <input type="text" id="'+this.id+'_user_'+username+'_icon" class="form-control" placeholder="user" value="'+user["icon"]+'" required>\
                </div>\
                <div class="form-group">\
                    <label>Password</label>\
                    <input type="password" id="'+this.id+'_user_'+username+'_password" class="form-control" value="'+password+'">\
                </div>\
            </div>\
        '
        $("#"+this.id+"_users_tab_content").append(tab_content)
    }
    
    // add a new group
    add_group(groupname, group, active) {
        var is_active = active ? "active" : ""
        var selected = active ? "true" : "false"
        var tab = '\
            <a class="nav-link '+is_active+'" id="'+this.id+'_groups_'+groupname+'_tab" data-toggle="pill" href="#'+this.id+'_groups_'+groupname+'_tab_content" role="tab" aria-controls="'+this.id+'_groups_'+groupname+'_tab_content" aria-selected="'+selected+'">'+groupname+'</a>\
        '
        $("#"+this.id+"_groups_tabs").append(tab)
        var is_active = active ? "show active" : ""
        var tab_content = '\
            <div class="tab-pane fade '+is_active+'" id="'+this.id+'_groups_'+groupname+'_tab_content" role="tabpanel" aria-labelledby="'+this.id+'_groups_'+groupname+'_tab">\
            </div>\
        '
        $("#"+this.id+"_groups_tab_content").append(tab_content)
        for (var username of group) {
            this.add_user_to_group(groupname, username)
        }
    }
    
    // add a user to a group
    add_user_to_group(groupname, username) {
        var i = Math.floor(Math.random() * 100)
        var html = '\
            <div class="row" id="'+this.id+'_group_'+groupname+'_row_'+i+'">\
                <div class="col-11">\
                    <input type="text" id="'+this.id+'_group_'+groupname+'_user_'+i+'" class="form-control" placeholder="username" value="'+username+'" required>\
                </div>\
                <div class="col-1">\
                    <button type="button" id="'+this.id+'_group_'+groupname+'_remove_'+i+'" class="btn btn-default">\
                        <i class="fas fa-times text-red"></i>\
                    </button>\
                </div>\
            </div>\
        '
        $("#"+this.id+'_groups_'+groupname+'_tab_content').append(html)
        // configure remove button
        $("#"+this.id+'_group_'+groupname+'_remove_'+i).unbind().click(function(this_class) {
            return function () {
                $("#"+this_class.id+'_group_'+groupname+'_row_'+i).remove()
            };
        }(this));
    }
    
    // receive configuration
    on_configuration(message) {
        // receiving house configuration
        if (message.args == "house") {
            var data = message.get_data()
            // populate the form
            for (var configuration of ["name", "timezone", "language", "units", "latitude", "longitude"]) {
                $("#"+this.id+"_house_"+configuration).val(data[configuration])
            }
        }
        // receiving gui configuration
        else if (message.args == "gui/settings") {
            var data = message.get_data()
            // populate the form
            for (var configuration of ["default_page", "map_api_key"]) {
                $("#"+this.id+"_gui_"+configuration).val(data[configuration])
            }
        }
        // receiving users configuration
        else if (message.args == "gui/users") {
            var data = message.get_data()
            // populate the form
            var first = true
            $("#"+this.id+"_users_tabs").empty()
            $("#"+this.id+"_users_tab_content").empty()
            for (var username in data) {
                this.add_user(username, data[username], first)
                if (first) first = false
            }
        }
        // receiving groups configuration
        else if (message.args == "gui/groups") {
            var data = message.get_data()
            // populate the form
            var first = true
            $("#"+this.id+"_groups_tabs").empty()
            $("#"+this.id+"_groups_tab_content").empty()
            for (var groupname in data) {
                this.add_group(groupname, data[groupname], first)
                if (first) first = false
            }
        }
    }
}