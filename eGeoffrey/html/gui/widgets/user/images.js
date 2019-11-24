// image widget
class Images extends Widget {
    constructor(id, widget) {
        super(id, widget)
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
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: _image
        // add the image
        var body = "#"+this.id+"_body"
        var style = this.id != "popup_body" ? "width:100%;height: 400px;" : ""
        $(body).html('<div style="'+style+'"><i style="line-height: 350px;" class="fas fa-spinner fa-spin fa-6x"></i></div>')
        // request sensors' data
        this.request_data()
        // subscribe for acknoledgments from the database for saved values
        this.add_inspection_listener("controller/db", "*/*", "SAVED", "#")
    }
    
    // receive data and load it into the widget
    on_message(message) {
        // database just saved a value check if our sensor is involved and if so refresh the data
        if (message.sender == "controller/db" && message.command == "SAVED") {
            if (message.args == this.widget["sensor"]) this.request_data()
        }
        else if (message.sender == "controller/db" && message.command.startsWith("GET")) {
            var session = gui.sessions.restore(message)
            if (session == null) return
            var data = message.get("data")
            if (data.length == 1) {
                var style = this.id != "popup_body" ? "width:100%;height: 400px;" : ""
                $("#"+this.id+"_body").html('<img style="'+style+'" class="img-responsive" id="'+this.id+'_image"/>')
                $("#"+this.id+"_image").attr("src", "data:image/jpeg;base64,"+data[0]);
            }
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}