// Tasks widget
class Tasks extends Widget {
    constructor(id, widget) {
        super(id, widget)
        this.list_schema = 1
        this.save_in_progress = false
        // add an empty box into the given column
        this.add_large_box(this.id, this.widget["title"])
    }
    
    // request the data to the database
    request_data() {
        var message = new Message(gui)
        message.recipient = "controller/db"
        message.command = "GET"
        message.args = this.widget["sensor"]
        gui.sessions.register(message, {
        })
        this.send(message)
    }
    
    // generate a random item id
    generate_id() {
        var min = 1; 
        var max = 100000;
        return Math.floor(Math.random() * (+max - +min)) + +min; 
    }
    
    // edit the text of an item, replace text with input
    edit_text_start(item_id) {
        // get text and tags
        var text = $("#"+this.id+'_'+item_id+'_text').html()
        var tags = $("#"+this.id+'_'+item_id+'_tags').html()
        // set the the input
        $("#"+this.id+'_'+item_id+'_text_input').val(text)
        $("#"+this.id+'_'+item_id+'_tags_input').val(tags)
        // hide the text
        $("#"+this.id+'_'+item_id+'_text').addClass("d-none")
        $("#"+this.id+'_'+item_id+'_tags_box').addClass("d-none")
        // show the form
        $("#"+this.id+'_'+item_id+'_text_input').removeClass("d-none")
        $("#"+this.id+'_'+item_id+'_tags_input').removeClass("d-none")
        // show save button
        $("#"+this.id+'_'+item_id+'_edit').addClass("d-none")
        $("#"+this.id+'_'+item_id+'_delete').addClass("d-none")
        $("#"+this.id+'_'+item_id+'_save').removeClass("d-none")
        $("#"+this.id+'_'+item_id+'_checkbox').attr("disabled", true)
        $("#"+this.id+'_'+item_id+'_text_input').focus()
    }
    
    // edit done, replace input back with text
    edit_text_end(item_id, save=true) {
        // get new text and tags
        var text = $("#"+this.id+'_'+item_id+'_text_input').val()
        var tags = $("#"+this.id+'_'+item_id+'_tags_input').val()
        // text is mandatory
        if (text == "") return
        // sync text with the provided input
        if (save) {
            $("#"+this.id+'_'+item_id+'_text').html(text)
            $("#"+this.id+'_'+item_id+'_tags').html(tags)
        }
        // hide the input
        $("#"+this.id+'_'+item_id+'_text_input').addClass("d-none")
        $("#"+this.id+'_'+item_id+'_tags_input').addClass("d-none")
        // show the text
        $("#"+this.id+'_'+item_id+'_text').removeClass("d-none")
        $("#"+this.id+'_'+item_id+'_tags_box').removeClass("d-none")
        // render tags
        if (save) this.render_tags(item_id)
        // hide save button
        $("#"+this.id+'_'+item_id+'_edit').removeClass("d-none")
        $("#"+this.id+'_'+item_id+'_delete').removeClass("d-none")
        $("#"+this.id+'_'+item_id+'_save').addClass("d-none")
        $("#"+this.id+'_'+item_id+'_checkbox').attr("disabled", false)
        if (save) this.save_list()
    }
    
    // save the list
    save_list() {
        var data = {}
        data["list_schema"] = this.list_schema
        data["todo"] = []
        data["done"] = []
        // search both the lists
        var this_class = this
        for (var list of ["todo", "done"]) {
            var items = $("#"+this.id+"_list_"+list+" li")
            // for each item of the list
            items.each(function(li) {
                // retrieve the id of the item
                var li_id = $(this).attr("id")
                var item_id = li_id.replace(this_class.id+"_", "").replace("_item", "")
                // retrieve the values
                var text = $("#"+this_class.id+"_"+item_id+"_text").html()
                var tags = $("#"+this_class.id+"_"+item_id+"_tags").html()
                // serialize the item
                var item = {
                    "text": text,
                    "tags": tags,
                    "item_id": item_id,
                }
                data[list].unshift(item)
            });
        }
        // save the list to the database
        var message = new Message(gui)
        message.recipient = "controller/hub"
        message.command = "SET"
        message.args = this.widget["sensor"]
        message.set("value", JSON.stringify(data))
        this.save_in_progress = true
        gui.send(message)
    }
    
    // load the list
    load_list(data) {
        if (data["list_schema"] != this.list_schema) return
        // populate the list
        for (var list of ["todo", "done"]) {
            // empty the lists
            $("#"+this.id+'_list_'+list).empty()
            // reset the counter
            $("#"+this.id+'_list_'+list+"_counter").html(0)
            for (var item of data[list]) {
                // add the items
                this.add_item(item["item_id"], item["text"], item["tags"], list == "done")
            }
        }
    }

    // render tags
    render_tags(item_id) {
        $("#"+this.id+'_'+item_id+'_tags_box').empty()
        var tags = $("#"+this.id+'_'+item_id+'_tags').html()
        if (tags == "") return
        for (var tag of tags.split(" ")) {
            $("#"+this.id+'_'+item_id+'_tags_box').append('<a onClick=\'$("#'+this.id+'_search").val("'+tag+'"); $("#'+this.id+'_search").keyup()\'><span class="badge badge-info"><i class="fas fa-tag"></i> '+tag+'</span></a>')
        }
    }
    
    // add an item to a list
    add_item(item_id=null, text="", tags="", done=false) {
        var new_item = item_id == null
        var item_id = item_id != null ? item_id : this.generate_id()
        var list = done ? "done" : "todo"
        var checked = done ? "checked" : ""
        var item = '\
            <li id="'+this.id+'_'+item_id+'_item">\
                  <span class="handle">\
                    <i class="fas fa-ellipsis-v"></i>\
                    <i class="fas fa-ellipsis-v"></i>\
                  </span>\
              <input type="checkbox" value="" id="'+this.id+'_'+item_id+'_checkbox" '+checked+'>\
              <span class="text" id="'+this.id+'_'+item_id+'_text"></span>\
              <span class="text d-none" id="'+this.id+'_'+item_id+'_tags"></span>\
              <span id="'+this.id+'_'+item_id+'_tags_box"></span>\
              <input class="d-none" id="'+this.id+'_'+item_id+'_text_input" placeholder="description of the item"></span>\
              <input class="d-none" id="'+this.id+'_'+item_id+'_tags_input" placeholder="tags"></span>\
              <div class="tools">\
                <i class="fas fa-edit" id="'+this.id+'_'+item_id+'_edit"></i>\
                <i class="fas fa-trash-alt" id="'+this.id+'_'+item_id+'_delete"></i>\
                <i class="fas fa-save d-none text-green" id="'+this.id+'_'+item_id+'_save"></i>\
              </div>\
            </li>'
        // add the item at the beginning of the list
        $("#"+this.id+"_list_"+list).prepend(item)
        // add done style
        if (done) $("#"+this.id+'_'+item_id+'_item').addClass("done")
        // set text and tags
        $("#"+this.id+'_'+item_id+'_text').text(text)
        $("#"+this.id+'_'+item_id+'_tags').text(tags)
        // render tags
        this.render_tags(item_id)
        // configure checkbox actions
        $("#"+this.id+'_'+item_id+"_checkbox").unbind().click(function(this_class, list, item_id) {
            return function () {
                var done = $("#"+this_class.id+'_'+item_id+'_checkbox').prop("checked")
                var text = $("#"+this_class.id+'_'+item_id+'_text').html()
                var tags = $("#"+this_class.id+'_'+item_id+'_tags').html()
                // remove the item from the current list
                $("#"+this_class.id+'_'+item_id+'_item').remove()
                var counter = parseInt($("#"+this_class.id+'_list_'+list+'_counter').html())
                $("#"+this_class.id+'_list_'+list+'_counter').html(counter-1)
                // add the item to the other list
                this_class.add_item(item_id, text, tags, done)
                // save the list
                this_class.save_list()
            };
        }(this, list, item_id));
        // configure delete button
        $("#"+this.id+'_'+item_id+"_delete").unbind().click(function(this_class, list, item_id) {
            return function () {
                $("#"+this_class.id+'_'+item_id+'_item').remove()
                var counter = parseInt($("#"+this_class.id+'_list_'+list+'_counter').html())
                $("#"+this_class.id+'_list_'+list+'_counter').html(counter-1)
                this_class.save_list()
            };
        }(this, list, item_id));
        // configure edit button
        $("#"+this.id+'_'+item_id+"_edit").unbind().click(function(this_class, item_id) {
            return function () {
                this_class.edit_text_start(item_id)
            };
        }(this, item_id));
        // configure save button
        $("#"+this.id+'_'+item_id+"_save").unbind().click(function(this_class, item_id) {
            return function () {
                this_class.edit_text_end(item_id)
            };
        }(this, item_id));
        // configure events for text
        $("#"+this.id+'_'+item_id+"_text_input").unbind().keyup(function(this_class, item_id) {
            return function (e) {
                // enter is pressed
                if(e.which == 13) this_class.edit_text_end(item_id)
                // esc is pressed
                if(e.which == 27) this_class.edit_text_end(item_id, false)
            };
        }(this, item_id));
        $("#"+this.id+'_'+item_id+"_text").unbind().click(function(this_class, item_id) {
            return function () {
                this_class.edit_text_start(item_id)
            };
        }(this, item_id));
        // configure events for tags
        $("#"+this.id+'_'+item_id+"_tags_input").unbind().keyup(function(this_class, item_id) {
            return function (e) {
                // enter is pressed
                if(e.which == 13) this_class.edit_text_end(item_id)
                // esc is pressed
                if(e.which == 27) this_class.edit_text_end(item_id, false)
            };
        }(this, item_id));
        // increase the counter
        var counter = parseInt($("#"+this.id+'_list_'+list+'_counter').html())
        $("#"+this.id+'_list_'+list+'_counter').html(counter+1)
        // if it is a new item, start the editor
        if (new_item) this.edit_text_start(item_id)
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: _list_todo, _list_done, _search, _add
        var body = "#"+this.id+"_body"
        var todo = '\
            <div class="row"><div class="col-lg-12">\
                <input type="text" class="form-control input-sm" id="'+this.id+'_search" placeholder="Search..."><br>\
            </div></div>\
            <div class="row"><div class="col-lg-12">\
                <button type="button" class="btn btn-default float-right" id="'+this.id+'_add"><i class="fas fa-plus"></i> Add item</button>\
            </div></div>\
            <div class="row"><div class="col-lg-12 text-left">\
                <label class="text-muted">To Do (<span id="'+this.id+'_list_todo_counter">0</span> items):</label>\
                <ul class="todo-list" data-widget="todo-list" id="'+this.id+'_list_todo"></ul>\
            </div></div>\
            <div class="row"><div class="col-lg-12 text-left">\
                <br>\
                <label class="text-muted text-left">Done (<span id="'+this.id+'_list_done_counter">0</span> items):</label>\
                <ul class="todo-list" data-widget="todo-list" id="'+this.id+'_list_done"></ul>\
            </div></div>\
        '
        $(body).html(todo)
        // sortable list
        $('.todo-list').sortable({
            placeholder         : 'sort-highlight',
            handle              : '.handle',
            forcePlaceholderSize: true,
            zIndex              : 999999
        });
        // configure add item button
        $("#"+this.id+"_add").unbind().click(function(this_class) {
            return function () {
                this_class.add_item()
            };
        }(this));
        // configure search
        $("#"+this.id+"_search").unbind().keyup(function(this_class) {
            return function () {
                // search both the lists
                for (var list of ["todo", "done"]) {
                    var items = $("#"+this_class.id+"_list_"+list+" li")
                    // for each item of the list
                    var counter = 0
                    items.each(function(li) {
                        // retrieve the id of the item
                        var li_id = $(this).attr("id")
                        var item_id = li_id.replace(this_class.id+"_", "").replace("_item", "")
                        // do the search
                        var text = $("#"+this_class.id+"_"+item_id+"_text").html()
                        var tags = $("#"+this_class.id+"_"+item_id+"_tags").html()
                        var search = $("#"+this_class.id+"_search").val()
                        if (text.includes(search) || tags.includes(search)) {
                            $("#"+this_class.id+"_"+item_id+"_item").removeClass("d-none")
                            counter++
                        }
                        else $("#"+this_class.id+"_"+item_id+"_item").addClass("d-none")
                    });
                    // update the counter
                    $("#"+this_class.id+"_list_"+list+"_counter").html(counter)
                }
            };
        }(this));
        // save the list when the user has done sorting the list
        $("#"+this.id+"_list_todo").on("sortupdate", function(this_class) {
            return function () {
                this_class.save_list()
            };
        }(this));
        // request sensors' data
        this.request_data()
        // subscribe for acknoledgments from the database for saved values
        this.add_inspection_listener("controller/db", "*/*", "SAVED", "#")
    }
    
    // receive data and load it into the widget
    on_message(message) {
        // database just saved a value check if our sensor is involved and if so refresh the data
        if (message.sender == "controller/db" && message.command == "SAVED") {
            if (message.args != this.widget["sensor"]) return
            if (this.save_in_progress) {
                this.save_in_progress = false
                return
            }
            else this.request_data()
        }
        // load the list from a sensor
        else if (message.sender == "controller/db" && message.command.startsWith("GET")) {
            var session = gui.sessions.restore(message)
            if (session == null) return
            var data = message.get("data")
            if (data.length == 1) {
                this.load_list(JSON.parse(data[0]))
            }
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}