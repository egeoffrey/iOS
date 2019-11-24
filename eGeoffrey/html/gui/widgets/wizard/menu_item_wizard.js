// menu item wizard widget
class Menu_item_wizard extends Widget {
    constructor(id, widget) {
        super(id, widget)
        this.waiting_for_item = null
    }
    
    // draw the widget's content
    draw() {
        // extract requested menu item from URL
        var section_id = null
        var menu_item_id = null
        if (location.hash.includes("=")) {
            var request = location.hash.split("=")
            var split = request[1].split("/")
            section_id = split[0]
            menu_item_id = split[1]
        }
        // show up cancel button
        $("#menu_edit_button").addClass("d-none")
        $("#menu_edit_cancel").removeClass("d-none")
        // clear up the modal
        $("#wizard_body").html("")
        $("#wizard_title").html("Menu Item Configuration")
        // show the modal
        $("#wizard").modal()
        // build the form
        $("#wizard_body").append('\
            <form method="POST" role="form" id="'+this.id+'_form" class="needs-validation" novalidate>\
                <div class="form-group">\
                    <label>Section identifier*</label>\
                    <input type="text" id="'+this.id+'_section_id" class="form-control" placeholder="section identifier (must exists) this item belongs to" required>\
                </div>\
                <div class="form-group">\
                    <label>Menu item identifier*</label>\
                    <input type="text" id="'+this.id+'_menu_item_id" class="form-control" placeholder="identifier of the menu item" required>\
                </div>\
                <div class="form-group">\
                    <label>Text*</label>\
                    <input type="text" id="'+this.id+'_text" class="form-control" placeholder="text to show">\
                </div>\
                <div class="form-group">\
                    <label>Page*</label>\
                    <input type="text" id="'+this.id+'_page" class="form-control" placeholder="page identifier to open when clicked">\
                </div>\
                <div class="form-group">\
                    <label>Icon</label>\
                    <input type="text" id="'+this.id+'_icon" class="form-control" placeholder="icon of the menu item">\
                </div>\
                <div class="form-group">\
                    <label>Order*</label>\
                    <input type="text" id="'+this.id+'_order" class="form-control" placeholder="order of this menu item in the section" required>\
                </div>\
                <div class="form-group">\
                    <label>Authorized Groups</label>\
                    <div id="'+this.id+'_groups"></div>\
                    <br>\
                    <div class="form-group">\
                        <button type="button" class="btn btn-default float-right" id="'+this.id+'_groups_add"><i class="fas fa-plus"></i> Add Group</button>\
                    </div>\
                </div>\
            </form>\
        ')
        // configure add group button
        $("#"+this.id+'_groups_add').unbind().click(function(this_class, id) {
            return function () {
                this_class.add_array_item(id)
            };
        }(this, this.id+'_groups'));
        // add link to advanced configuration
        var link = menu_item_id == null ? "__new__" : section_id+"/"+menu_item_id
        $("#wizard_body").append('<br><a id="'+this.id+'_advanced_editor" class="float-right text-primary">Advanced Editor</a>')
        $("#"+this.id+"_advanced_editor").unbind().click(function(this_class) {
            return function () {
                $('#wizard').unbind('hidden.bs.modal')
                $("#wizard").modal("hide")
                gui.unload_page()
                window.location.hash = "#__configuration=gui/menu/"+link 
            };
        }(this));
        // what to do when the form is submitted
        var id = this.id
        var this_class = this
        $('#'+this.id+'_form').on('submit', function (e) {
            // form is validated
            if ($('#'+this_class.id+'_form')[0].checkValidity()) {
                // get menu_item_id 
                var section_id = $("#"+this_class.id+"_section_id").val()
                var menu_item_id = $("#"+this_class.id+"_menu_item_id").val()
                // build up the configuration file
                var menu_item = {}
                for (var item of ["text", "page", "icon", "order"]) {
                    var value = $("#"+this_class.id+"_"+item).val()
                    if (value == null || value == "") continue
                    menu_item[item] = $.isNumeric(value) ? parseFloat(value) : value
                }
                $("#"+this_class.id+"_groups :input[type=text]").each(function(e){
                    if (! ("allow" in menu_item)) menu_item["allow"] = []
                    menu_item["allow"].push(this.value)
                });
                // save new/updated configuration
                var message = new Message(gui)
                message.recipient = "controller/config"
                message.command = "SAVE"
                message.args = "gui/menu/"+section_id+"/"+menu_item_id
                message.config_schema = gui.menu_config_schema
                message.set_data(menu_item)
                gui.send(message)
                // close the modal
                $("#wizard").modal("hide")
                gui.notify("success","Menu item "+section_id+"/"+menu_item_id+" saved successfully")
                return false
            }
            else {
                e.preventDefault();
                e.stopPropagation();
            }
            $('#'+this_class.id+'_form').addClass("was-validated")
        })
        // configure submit button
        $('#wizard_save').unbind().click(function(this_class) {
            return function () {
                $("#"+this_class.id+"_form").submit()
            };
        }(this))
        if (menu_item_id != null) {
            // configure delete button
            $('#wizard_delete').removeClass("d-none")
            $('#wizard_delete').unbind().click(function(this_class) {
                return function () {
                    gui.confirm("Do you really want to delete this menu item?", function(result){ 
                        if (! result) return
                        // delete the menu item configuration file
                        var message = new Message(gui)
                        message.recipient = "controller/config"
                        message.command = "DELETE"
                        message.args = "gui/menu/"+section_id+"/"+menu_item_id
                        message.config_schema = gui.menu_config_schema
                        gui.send(message)
                        gui.notify("info", "Requesting to delete menu item "+section_id+"/"+menu_item_id)
                        // close the modal
                        $("#wizard").modal("hide")
                    });
                };
            }(this))
        }
        // what to do when the modal is closed
        $('#wizard').one('hidden.bs.modal', function () {
            $('#wizard_delete').addClass("d-none")
            $("#menu_edit_button").removeClass("d-none")
            $("#menu_edit_cancel").addClass("d-none")
            gui.menu.refresh()
            window.history.back()
        })
        // // request content for editing the menu item
        if (menu_item_id != null) {
            setTimeout(function(this_class, section_id, menu_item_id) {
                return function() {
                    this_class.waiting_for_item = section_id+"/"+menu_item_id
                    this_class.add_configuration_listener("gui/menu/"+this_class.waiting_for_item, gui.menu_config_schema)
                };
            }(this, section_id, menu_item_id), 100);
        }
    }
    
    // return a random number
    get_random() {
        var min = 1; 
        var max = 100000;
        return Math.floor(Math.random() * (+max - +min)) + +min;
    }
    
    // add an array item to the wizard form
    add_array_item(id, value="") {
        var i = this.get_random()
        var html = '\
            <div class="row" id="'+id+'_row_'+i+'">\
                <div class="col-11">\
                    <input type="text" id="'+id+'_value_'+i+'" class="form-control" value="'+value+'" required>\
                </div>\
                <div class="col-1">\
                    <button type="button" class="btn btn-default">\
                        <i class="fas fa-times text-red" id="'+id+'_remove_'+i+'"></i>\
                    </button>\
                </div>\
            </div>\
        '
        $("#"+id).append(html)
        // configure remove button
        $("#"+id+"_remove_"+i).unbind().click(function(id, i) {
            return function () {
                $("#"+id+"_row_"+i).remove()
            };
        }(id, i));
    }
    
    // receive data and load it into the widget
    on_message(message) {
    }
    
    // receive configuration
    on_configuration(message) {
        // assuming we are receiving a configuration (edit)
        var split = message.args.replace("gui/menu/","").split("/")
        var section_id = split[0]
        var menu_item_id = split[1]
        if (this.waiting_for_item == section_id+"/"+menu_item_id) this.waiting_for_item = null
        else return
        var menu_item = message.get_data()
        $("#"+this.id+"_section_id").val(section_id)
        $("#"+this.id+"_section_id").prop("disabled", true)
        $("#"+this.id+"_menu_item_id").val(menu_item_id)
        $("#"+this.id+"_menu_item_id").prop("disabled", true)
        // populate the form
        for (var item of ["text", "page", "icon", "order"]) {
            if (item in menu_item) $("#"+this.id+"_"+item).val(menu_item[item])
        }
        if ("allow" in menu_item) {
            for (var i = 0; i < menu_item["allow"].length; i++) {
                var value = menu_item["allow"][i]
                this.add_array_item(this.id+'_groups', value)
            }
        }
    }
}