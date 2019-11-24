// handle the left menu

class Menu extends Widget {
    constructor(id) {
        super(id, {})
        this.sections = []
        this.entries = {}
        this.persistent = true
    }
    
    // draw the widget's content
    draw() {
        // draw menu edit button
        $("#menu_edit").html('\
            <center>\
                <div class="form-group" id="menu_edit_button">\
                    <div class="btn-group">\
                        <button type="button" class="btn btn-sm btn-info">'+locale("menu.edit")+'</button>\
                        <button type="button" class="btn btn-sm btn-info dropdown-toggle" data-toggle="dropdown">\
                            <span class="caret"></span>\
                            <span class="sr-only">Toggle Dropdown</span>\
                        </button>\
                        <div class="dropdown-menu" role="menu" style="cursor: pointer;">\
                            <a class="dropdown-item" id="menu_section_new" style="color: black">'+locale("menu.new_section")+'</a>\
                            <a class="dropdown-item" id="menu_section_edit" style="color: black">'+locale("menu.edit_sections")+'</a>\
                            <div class="dropdown-divider"></div>\
                            <a class="dropdown-item" id="menu_item_new" style="color: black">'+locale("menu.new_item")+'</a>\
                            <a class="dropdown-item" id="menu_item_edit" style="color: black">'+locale("menu.edit_items")+'</a>\
                        </div>\
                    </div>\
                </div>\
                <button type="button" class="btn btn-sm btn-info d-none" id="menu_edit_cancel"><i class="fas fa-undo"></i> '+locale("menu.edit_cancel")+'</button>\
            </center>\
        ')
        if (! gui.is_authorized(["house_admins"])) $("#menu_edit").addClass("d-none")
        // get the menu contents
        this.add_configuration_listener("gui/menu/#", "+")
    }
    
    // receive data and load it into the widget
    on_message(message) {
    }
    
    // what to do when start editing the menu
    menu_edit_start() {
        $("#menu_edit_button").addClass("d-none")
        $("#menu_edit_cancel").removeClass("d-none")
    }
    
    // add a menu item to the menu
    add_menu_item(entry, add_to_section=true) {
        var selected = null
        // check if the user selected already a page
        if (location.hash != null) selected = location.hash.replace('#','')
        // add the entry
        var page_tag = entry["page"].replaceAll("/","_")
        var tag = add_to_section ? "#menu_section_"+entry["section_id"] : "#"+this.id
        var href = "url" in entry ? entry["url"] : "#"+entry["page"]
        var target = "url" in entry ? "target=_blank" : ""
        $(tag).append('\
        <li class="nav-item">\
            <a class="nav-link" id="menu_user_item_'+page_tag+'" href="'+href+'" '+target+'>&nbsp;\
                <input type="text" value="'+entry["page"]+'" class="d-none" id="menu_user_item_'+page_tag+'_id">\
                <i class="nav-icon fas fa-'+entry["icon"]+'" id="menu_user_item_'+page_tag+'_icon"></i>\
                <p>'+capitalizeFirst(entry["text"])+'</p>\
            </a>\
        </li>');
        // open the page on click
        if (! ("url" in entry)) {
            $("#menu_user_item_"+page_tag).unbind().click(function(page, section_id, page_tag){
                return function () {
                    // if clicking on the current page, explicitly reload it since hash will not change
                    if (location.hash.replace("#","") == page) gui.load_page(page)
                    window.scrollTo(0,0)
                    // close active section
                    $("#menu li").removeClass("active menu-open")
                    // remove active section
                    $("#menu li a").removeClass("active")
                    // open new section
                    $("#menu_section_"+section_id+"_tree").addClass("active menu-open")
                    // make new section as active
                    $("#menu_section_"+section_id+"_name").addClass("active")
                    // set item as active
                    $("#menu_user_item_"+page_tag).addClass("active")
                    // collapse the sidebar if open on mobile
                    if ($("body").hasClass('sidebar-open')) $("body").removeClass('sidebar-open').removeClass('sidebar-collapse').trigger('collapsed.pushMenu');
                }
            }(entry["page"], entry["section_id"], page_tag));
        }
        // open up the section containing the selected menu item
        if (selected != null && selected == entry["page"]) {
            // set section as active
            $("#menu_section_"+entry["section_id"]+"_name").addClass("active")
            // open the section menu
            $("#menu_section_"+entry["section_id"]+"_tree").addClass("active menu-open")
            // set item as active
            $("#menu_user_item_"+page_tag).addClass("active")
        }
    }
    
    // refresh the menu
    refresh() {
        $("#"+this.id).empty()
        // clone sections and entries objects
        var sections = this.sections.slice()
        var entries = jQuery.extend({ }, this.entries)
        // add welcome and notifications entries on top
        this.add_menu_item({entry_id: "__welcome", text: "Welcome", icon: "robot", page: "__welcome"}, false)
        this.add_menu_item({entry_id: "__notifications", text: "Notifications", icon: "comments", page: "__notifications"}, false)
        sections.unshift({ header: "MY HOUSE"})
        // add admin entries
        if (gui.is_authorized(["house_admins"]) || gui.is_authorized(["egeoffrey_admins"])) sections[sections.length] = { header: "ADMINISTRATION"}
        if (gui.is_authorized(["house_admins"])) {
            sections[sections.length+1] = { text: "House", order: sections.length+1, section_id: "__house_admin", icon: "user-shield"}
            entries["__house_admin"] = []
            entries["__house_admin"].push({section_id: "__house_admin",  order: 0, entry_id: "house", text: "Settings", icon: "home", page: "__house"})
            entries["__house_admin"].push({section_id: "__house_admin",  order: 1, entry_id: "sensors", text: "Sensors", icon: "microchip", page: "__sensors"})
            entries["__house_admin"].push({section_id: "__house_admin",  order: 2, entry_id: "rules", text: "Rules", icon: "brain", page: "__rules"})
        }
        if (gui.is_authorized(["egeoffrey_admins"])) {
            sections[sections.length+2] = { text: "eGeoffrey", order: sections.length+2, section_id: "__egeoffrey_admin", icon: "toolbox"}
            entries["__egeoffrey_admin"] = []
            entries["__egeoffrey_admin"].push({section_id: "__egeoffrey_admin",  order: 0, entry_id: "packages", text: "Packages", icon: "cubes", page: "__packages"})
            entries["__egeoffrey_admin"].push({section_id: "__egeoffrey_admin",  order: 1, entry_id: "modules", text: "Modules", icon: "server", page: "__modules"})
            entries["__egeoffrey_admin"].push({section_id: "__egeoffrey_admin",  order: 2, entry_id: "marketplace", text: "Marketplace", icon: "shopping-cart", page: "__marketplace", url: "https://marketplace.egeoffrey.com"})
            entries["__egeoffrey_admin"].push({section_id: "__egeoffrey_admin",  order: 3, entry_id: "logs", text: "Logs", icon: "align-justify", page: "__logs"})
            entries["__egeoffrey_admin"].push({section_id: "__egeoffrey_admin",  order: 4, entry_id: "database", text: "Database", icon: "database", page: "__database"})
            entries["__egeoffrey_admin"].push({section_id: "__egeoffrey_admin",  order: 5, entry_id: "gateway", text: "Gateway", icon: "project-diagram", page: "__gateway"})
            entries["__egeoffrey_admin"].push({section_id: "__egeoffrey_admin",  order: 6, entry_id: "configuration", text: "Advanced Editor", icon: "edit", page: "__configuration"})
            entries["__egeoffrey_admin"].push({section_id: "__egeoffrey_admin",  order: 7, entry_id: "icons", text: "Icons", icon: "palette", page: "__icons"})
        }
        if (gui.is_authorized(["house_admins"]) || gui.is_authorized(["egeoffrey_admins"])) {
            sections[sections.length+3] = { text: "Help", order: sections.length+3, section_id: "__help", icon: "question-circle"}
            entries["__help"] = []
            entries["__help"].push({section_id: "__help",  order: 0, entry_id: "__docs", text: "Docs", icon: "book-open", url: "https://docs.egeoffrey.com", page: "__docs"})
            entries["__help"].push({section_id: "__help",  order: 0, entry_id: "__forum", text: "Forum", icon: "comments", url: "https://forum.egeoffrey.com", page: "__forum"})
            entries["__help"].push({section_id: "__help",  order: 0, entry_id: "__developer", text: "Developers", icon: "code", url: "https://developer.egeoffrey.com", page: "__developer"})
        }
        // draw the menu
        for (var section of sections) {
            if (section == null) continue
            // this is just a header
            if ("header" in section) {
                $("#"+this.id).append('<li class="nav-header">'+section["header"]+'</li>')
                continue
            }
            if (! (section["section_id"] in entries)) continue
            // add the section
            var section_icon = "icon" in section ? "fas fa-"+section["icon"] : "far fa-circle"
            var section_html = '\
                <li class="nav-item has-treeview" id="menu_section_'+section["section_id"]+'_tree">\
                    <a href="#" class="nav-link" id="menu_section_'+section["section_id"]+'_name">\
                        <input type="text" value="'+section["section_id"]+'" class="d-none" id="menu_section_'+section["section_id"]+'_id">\
                        <i class="'+section_icon+' nav-icon" id="menu_section_'+section["section_id"]+'_icon"></i> \
                        <p>\
                            '+section["text"]+'\
                            <i class="fa fa-angle-left right" id="menu_section_'+section["section_id"]+'_arrow"></i>\
                        </p>\
                    </a>\
                    <ul class="nav nav-treeview" id="menu_section_'+section["section_id"]+'">\
                    </ul>\
                </li>'
            $("#"+this.id).append(section_html)
            // add the entries to the section
            var items = 0
            for (var entry of entries[section["section_id"]]) {
                if (entry == null) continue
                if (entry["section_id"] != section["section_id"]) continue
                // add the entry to the menu
                if ("allow" in entry && ! gui.is_authorized(entry["allow"])) continue
                this.add_menu_item(entry)
                items++
            }
            // hide the section if it has no items
            if (items == 0) $("#menu_section_"+entry["section_id"]).addClass("d-none")
        }
        var this_class = this
        // configure new menu section button
        var this_class = this
        $("#menu_section_new").unbind().click(function(this_class) {
            return function () {
                this_class.menu_edit_start()
                // open up the wizard
                window.location.hash = "#__menu_section_wizard"
            };
        }(this));
        // configure menu section edit button
        $("#menu_section_edit").unbind().click(function(this_class) {
            return function () {
                this_class.menu_edit_start()
                $("#"+this_class.id+" > li > ul").each(function(e){
                    $("#"+this.id).remove()
                });
                $("#"+this_class.id+" > li > a").each(function(e){
                    var id = this.id.replace("_name", "")
                    if (id.includes("__")) return
                    // change the icon of each menu item
                    var section_id = $("#"+id+"_id").val()
                    $("#"+id+"_icon").removeClass().addClass("fas fa-edit")
                    // change anchor href to menu section wizard                    
                    $("#"+this.id).off()
                    $("#"+this.id).attr("href", "#__menu_section_wizard="+section_id)
                });
            };
        }(this));
        $("#menu_item_new").unbind().click(function(this_class) {
            return function () {
                this_class.menu_edit_start()
                // open up the wizard
                window.location.hash = "#__menu_item_wizard"
            };
        }(this));
        // configure menu item edit button
        $("#menu_item_edit").unbind().click(function(this_class) {
            return function () {
                this_class.menu_edit_start()
                $("#"+this_class.id+" > li > ul > li > a").each(function(e){
                    // change the icon of each menu item
                    var menu_item_id = $("#"+this.id+"_id").val()
                    if (menu_item_id.includes("__")) return
                    $("#"+this.id+"_icon").removeClass().addClass("fas fa-edit")
                    // change anchor href to menu item wizard                    
                    $("#"+this.id).attr("href", "#__menu_item_wizard="+menu_item_id)
                });
            };
        }(this));
        // configure menu edit cancel button
        $("#menu_edit_cancel").unbind().click(function(this_class) {
            return function () {
                $("#menu_edit_button").removeClass("d-none")
                $("#menu_edit_cancel").addClass("d-none")
                this_class.refresh()
            };
        }(this));
    }
    
    // receive configuration
    on_configuration(message) {
        if (message.config_schema != gui.menu_config_schema) {
            return false
        }
        if (message.args.endsWith("_section")) {
            var section_id = message.args.replace("gui/menu/","").replace("/_section","")
            var section = message.get_data()
            section["section_id"] = section_id
            // if there is another section with the same name name, skip it
            for (var existing_section of this.sections) {
                if (existing_section == null) continue
                if (existing_section["section_id"] == section["section_id"]) return
            }
            // if there is another section in the same position, shift this ahead
            while (this.sections[section["order"]] != null) section["order"]++
            this.sections[section["order"]] = section
        }
        else {
            var split = message.args.replace("gui/menu/","").split("/")
            var section_id = split[0]
            var entry_id = split[1]
            var entry = message.get_data()
            entry["entry_id"] = entry_id
            entry["section_id"] = section_id
            // this is the first entry in the section
            if (! (section_id in this.entries)) this.entries[section_id] = []
            else {
                // if there is another entry in this section with the same name name, skip it
                for (var existing_entry of this.entries[section_id]) {
                    if (existing_entry == null) continue
                    if (existing_entry["entry_id"] == entry["entry_id"]) return
                }
                // if there is another entry in the same position, shift this ahead
                while (this.entries[section_id][entry["order"]] != null) entry["order"]++
            }
            this.entries[section_id][entry["order"]] = entry
        }
        this.refresh()
    }
}