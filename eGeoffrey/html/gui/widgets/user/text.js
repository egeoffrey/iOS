// Text widget
class Text extends Widget {
    constructor(id, widget) {
        super(id, widget)
        // add an empty box into the given column
        this.add_large_box(this.id, this.widget["title"])
    }
    
    // request the data to the database
    request_data() {
        // if the text is coming from a sensor, retrieve the latest value
        if ("sensor" in this.widget) {
            var message = new Message(gui)
            message.recipient = "controller/db"
            message.command = "GET"
            message.args = this.widget["sensor"]
            gui.sessions.register(message, {
            })
            this.send(message)
        }
        // if it is a static text, just add it to the widget
        else if ("text" in this.widget) {
            $("#"+this.id+"_text").html(this.widget["text"].replaceAll("\n", "<br>"))
        }
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: _text
        // add the image
        var body = "#"+this.id+"_body"
        $(body).html('<div class="text-left" id="'+this.id+"_text"+'"></div>')
        // request sensors' data
        this.request_data()
        // subscribe for acknoledgments from the database for saved values
         if ("sensor" in this.widget) this.add_inspection_listener("controller/db", "*/*", "SAVED", "#")
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
            if (data.length == 1) $("#"+this.id+"_text").html(data[0].replaceAll("\n", "<br>"))
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}