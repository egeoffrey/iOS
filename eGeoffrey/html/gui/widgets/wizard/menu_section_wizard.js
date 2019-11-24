// menu section wizard widget
class Menu_section_wizard extends Widget {
    constructor(id, widget) {
        super(id, widget)
        this.waiting_for_item = null
    }
    
    // draw the widget's content
    draw() {
        // extract requested section item from URL
        var section_id = null
        if (location.hash.includes("=")) {
            var request = location.hash.split("=")
            section_id = request[1]
        }
        // clear up the modal
        $("#wizard_body").html("")
        $("#wizard_title").html("Menu Section Configuration")
        // show the modal
        $("#wizard").modal()
        // build the form
        $("#wizard_body").append('\
            <form method="POST" role="form" id="'+this.id+'_form" class="needs-validation" novalidate>\
                <div class="form-group">\
                    <label>Section identifier*</label>\
                    <input type="text" id="'+this.id+'_section_id" class="form-control" placeholder="section identifier" required>\
                </div>\
                <div class="form-group">\
                    <label>Text*</label>\
                    <input type="text" id="'+this.id+'_text" class="form-control" placeholder="text to show">\
                </div>\
                <div class="form-group">\
                    <label>Icon</label>\
                    <input type="text" id="'+this.id+'_icon" class="form-control" placeholder="icon of the menu item">\
                </div>\
                <div class="form-group">\
                    <label>Order*</label>\
                    <input type="text" id="'+this.id+'_order" class="form-control" placeholder="order of this section" required>\
                </div>\
            </form>\
        ')
        // add link to advanced configuration
        var link = section_id == null ? "__new__" : section_id
        $("#wizard_body").append('<a id="'+this.id+'_advanced_editor" class="float-right text-primary">Advanced Editor</a>')
        $("#"+this.id+"_advanced_editor").unbind().click(function(this_class) {
            return function () {
                $('#wizard').unbind('hidden.bs.modal')
                $("#wizard").modal("hide")
                gui.unload_page()
                window.location.hash = "#__configuration=gui/menu/"+link+"/_section"
            };
        }(this));
        // what to do when the form is submitted
        var id = this.id
        var this_class = this
        $('#'+this.id+'_form').on('submit', function (e) {
            // form is validated
            if ($('#'+this_class.id+'_form')[0].checkValidity()) {
                // get section_id 
                var section_id = $("#"+this_class.id+"_section_id").val()
                // build up the configuration file
                var section = {}
                for (var item of ["text", "icon", "order"]) {
                    var value = $("#"+this_class.id+"_"+item).val()
                    if (value == null || value == "") continue
                    section[item] = $.isNumeric(value) ? parseFloat(value) : value
                }
                // save new/updated configuration
                var message = new Message(gui)
                message.recipient = "controller/config"
                message.command = "SAVE"
                message.args = "gui/menu/"+section_id+"/_section"
                message.config_schema = gui.menu_config_schema
                message.set_data(section)
                gui.send(message)
                // close the modal
                $("#wizard").modal("hide")
                gui.notify("success","Menu section "+section_id+" saved successfully")
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
        if (section_id != null) {
            // configure delete button
            $('#wizard_delete').removeClass("d-none")
            $('#wizard_delete').unbind().click(function(this_class) {
                return function () {
                    gui.confirm("Do you really want to delete this menu section? Menu items and pages will not be deleted", function(result){ 
                        if (! result) return
                        // delete the menu section configuration file
                        var message = new Message(gui)
                        message.recipient = "controller/config"
                        message.command = "DELETE"
                        message.args = "gui/menu/"+section_id+"/_section"
                        message.config_schema = gui.menu_config_schema
                        gui.send(message)
                        gui.notify("info", "Requesting to delete menu section "+section_id)
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
        // // request content for editing the menu section
        if (section_id != null) {
            setTimeout(function(this_class, section_id) {
                return function() {
                    this_class.waiting_for_item = section_id
                    this_class.add_configuration_listener("gui/menu/"+this_class.waiting_for_item, gui.menu_config_schema)
                };
            }(this, section_id), 100);
        }
    }
    
    // receive data and load it into the widget
    on_message(message) {
    }
    
    // receive configuration
    on_configuration(message) {
        // assuming we are receiving a configuration (edit)
        var section_id = message.args.replace("gui/menu/","").replace("/_section", "")
        if (this.waiting_for_item == section_id) this.waiting_for_item = null
        else return
        var section = message.get_data()
        $("#"+this.id+"_section_id").val(section_id)
        $("#"+this.id+"_section_id").prop("disabled", true)
        // populate the form
        for (var item of ["text", "icon", "order"]) {
            if (item in section) $("#"+this.id+"_"+item).val(section[item])
        }
    }
}