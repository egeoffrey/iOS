

// Widget class from which all the widgets inherits common functionalities
class Widget {
    constructor(id, widget) {
        // keep track html id and widget content
        this.id = id.replaceAll("/","_")
        this.widget = widget
        // persistent widget survives when a page is changed (e.g. menu)
        this.persistent = false
    }
    
    // draw the widget (subclass has to implement)
    draw() {
        throw new Error('draw() not implemented')
    }
    
    // load data into the widget (subclass has to implement)
    on_message(message) {
        throw new Error('on_message() not implemented')
    }
    
    // pass configuration into the widget (subclass has to implement)
    on_configuration(message) {
        throw new Error('on_configuration() not implemented')
    }
    
    // wrap gui.add_inspection_listener()
    add_inspection_listener(from_module, to_module, command, args) {
        // add the listener
        if (command == "MANIFEST") {
            // if the manifest was already received, pass it along to the widget
            for (var item in gui.manifests) {
                if (topic_matches_sub(args, item)) {
                    this.on_message(gui.manifests[item])
                }
            }
        }
        var topic = gui.add_inspection_listener(from_module, to_module, command, args)
        // whenever there will be a message matching this request, the widget will be notified
        if (topic in gui.listeners && ! gui.listeners[topic].includes(this)) gui.listeners[topic].push(this)
        else gui.listeners[topic] = [this]
        return topic
    }
    
    // wrap gui.add_broadcast_listener()
    add_broadcast_listener(from_module, command, args) {
        return this.add_inspection_listener(from_module, "*/*", command, args)
    }
    
    // wrap gui.add_configuration_listener()
    add_configuration_listener(configuration, version) {
        // if the requested configuration was already received, pass it along to the widget
        for (var item in gui.configurations) {
            if (topic_matches_sub(configuration, item)) {
                this.on_configuration(gui.configurations[item])
            }
        }
        // add the listener
        var topic = gui.add_configuration_listener(configuration, version)
        // whenever there will be a configuration matching this request, the widget will be notified
        if (topic in gui.listeners && ! gui.listeners[topic].includes(this)) gui.listeners[topic].push(this)
        else gui.listeners[topic] = [this]
        return topic
    }
    
    // remove this object from the queue of listeners for the given configuration without unsubscribing the topic
    remove_listener(topic) {
        if (! (topic in gui.listeners)) return
        var index = gui.listeners[topic].indexOf(this)
        if (index > -1) gui.listeners[topic].splice(index, 1)
    }
    
    // wrap gui.send() keeping track of the requesting widget
    send(message) {
        var request_id = message.get_request_id()
        // map the request with this widget
        gui.requests[request_id] = this
        // send the message
        gui.send(message)
    }
    
    // add a large box
    add_large_box(id, title) {
        var template = '\
            <div class="card card-primary" id="'+id+'_card">\
                <div class="card-header with-border">\
                    <h3 class="card-title" id="'+id+'_title">'+title+'</h3>\
                    <div class="card-tools float-right" id="'+id+'_widget_buttons">\
                        <button id="'+id+'_edit" type="button" class="btn btn-tool edit_page_item d-none"><i class="fas fa-edit"></i></button>\
                        <button id="'+id+'_move" type="button" class="btn btn-tool edit_page_item d-none"><i class="fas fa-arrows-alt sortable_widget" style="cursor: move;"></i></button>\
                        <button id="'+id+'_delete" type="button" class="btn btn-tool edit_page_item d-none"><i class="fas fa-trash-alt"></i></button>\
                        <button id="'+id+'_refresh" type="button" class="btn btn-tool no_edit_page_item"><i class="fas fa-sync"></i></button>\
                        <button id="'+id+'_popup" type="button" class="btn btn-tool no_edit_page_item" ><i class="fas fa-expand"></i></button>\
                    </div>\
                </div>\
                <div class="card-body no-padding card-primary">\
                    <div class="card-body" id="'+id+'_body" align="center">\
                    </div>\
                </div>\
                <div class="overlay d-none" id="'+id+'_loading">\
                    <i class="fas fa-refresh fa-spin"></i>\
                </div>\
            </div>'
        $("#"+id).empty()
        $("#"+id).html(template)
        if (id.includes("popup_body")) $("#"+id+"_widget_buttons").addClass("d-none")
    }

    // add an info box
    add_small_box(id, title, icon, color) {
        var template = '\
        <section class="info-box">\
            <span class="info-box-icon bg-'+color+'" id="'+id+'_color"><i class="fas fa-'+icon+'" id="'+id+'_icon"></i></span>\
            <div class="info-box-content">\
                <div class="card-tools float-right" id="'+id+'_widget_buttons">\
                    <button id="'+id+'_edit" type="button" class="btn btn-tool edit_page_item d-none"><i class="fas fa-edit"></i></button>\
                    <button id="'+id+'_move" type="button" class="btn btn-tool edit_page_item d-none" ><i class="fas fa-arrows-alt sortable_widget"></i></button>\
                    <button id="'+id+'_delete" type="button" class="btn btn-tool edit_page_item d-none"><i class="fas fa-trash-alt"></i></button>\
                </div>\
                <span class="info-box-text">'+title+'</span>\
                <span class="info-box-number">\
                    <span id="'+id+'_value"></span>\
                    <span id="'+id+'_value_suffix"></span>\
                </span>\
                <small><div class="text-muted" id="'+id+'_timestamp">&nbsp;</div></small>\
            </div>\
        </section>'
        $("#"+id).empty()
        $("#"+id).html(template)
    }
    
    // add a stat box
    add_small_box_2(id, title, icon, color, link=null) {
        var template = '\
        <section class="small-box bg-'+color+'" id="'+id+'_color">\
            <div class="inner">\
                <div class="card-tools float-right" id="'+id+'_widget_buttons">\
                    <button id="'+id+'_edit" type="button" class="btn btn-tool edit_page_item d-none"><i class="fas fa-edit"></i></button>\
                    <button id="'+id+'_move" type="button" class="btn btn-tool edit_page_item d-none" ><i class="fas fa-arrows-alt sortable_widget"></i></button>\
                    <button id="'+id+'_delete" type="button" class="btn btn-tool edit_page_item d-none"><i class="fas fa-trash-alt"></i></button>\
                </div>\
                <h3 >\
                    <span id="'+id+'_value">&nbsp;</span>\
                    <span id="'+id+'_value_suffix"></span>\
                </h3>\
                <p>'+title+'</p>\
                <small><div class="" id="'+id+'_timestamp">&nbsp;</div></small>\
            </div>\
            <div class="icon">\
                <i class="fas fa-'+icon+'" id="'+id+'_icon"></i>\
            </div>\
            <a class="small-box-footer" id="'+id+'_link"> Show More <i class="fa fa-arrow-circle-right"></i></a>\
        </section>'
        $("#"+id).empty()
        $("#"+id).html(template)
        if (link != null) $("#"+id+"_link").attr("href", "#"+link)
        else $("#"+id+"_link").addClass("d-none")
    }
    
    // add chat box
    add_chat_box(id, title) {
        var template = '\
        <div class="card card-primary cardutline direct-chat direct-chat-info">\
            <div class="card-header with-border">\
                <h3 class="card-title">'+title+'</h3>\
                <div class="card-tools float-right" id="'+id+'_widget_buttons">\
                    <button id="'+id+'_edit" type="button" class="btn btn-tool edit_page_item d-none"><i class="fas fa-edit"></i></button>\
                    <button id="'+id+'_move" type="button" class="btn btn-tool edit_page_item d-none" ><i class="fas fa-arrows-alt sortable_widget"></i></button>\
                    <button id="'+id+'_delete" type="button" class="btn btn-tool edit_page_item d-none"><i class="fas fa-trash-alt"></i></button>\
                    <button type="button" id="'+id+'_popup" class="btn btn-tool no_edit_page_item"><i class="fas fa-expand"></i></button>\
                </div>\
            </div>\
            <div class="card-body">\
                <div class="direct-chat-messages" id="'+id+'_messages">\
                </div>\
            </div>\
            <div class="card-footer">\
                <form>\
                    <div class="input-group">\
                        <span class="input-group-btn">\
                            <button type="button" class="btn btn-default btn-flat" id="'+id+'_eraser"><i class="fas fa-eraser"></i></button>\
                        </span>\
                        <input type="text" name="message" placeholder="Type Message ..." class="form-control" id="'+id+'_text">\
                        <span class="input-group-btn">\
                            <button type="button" class="btn btn-primary btn-flat" id="'+id+'_button">Send</button>\
                        </span>\
                    </div>\
                </form>\
            </div>\
        </div>\
        '
        $("#"+id).empty()
        $("#"+id).html(template)
        $("#"+id+"_eraser").unbind().click(function(id) {
            return function () {
                $("#"+id+"_messages").empty()  
            };
        }(id));
        if (id.includes("popup_body")) $("#"+id+"_widget_buttons").addClass("d-none")
    }
}