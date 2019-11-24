// Counter widget
class Counter extends Widget {
    constructor(id, widget) {
        super(id, widget)
        var icon = "icon" in this.widget ? this.widget["icon"] : "question"
        var color = "color" in this.widget ? this.widget["color"] : "blue"
        var link = "link" in this.widget ? this.widget["link"] : null
        // add an empty box into the given column
        this.add_small_box_2(this.id, this.widget["title"], icon, color, link)
    }
    
    // request the data to the database
    request_data() {
        var timeframe = "last_24_hours"
        if ("timeframe" in this.widget) timeframe = this.widget["timeframe"]
        var message = new Message(gui)
        message.recipient = "controller/db"
        message.command = "GET_COUNT"
        if ("scope" in this.widget) message.set("scope", this.widget["scope"])
        message.args = this.widget["sensor"]
        message.set("timeframe", timeframe)
        gui.sessions.register(message, {
        })
        this.send(message)
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
        if ("scope" in this.widget && this.widget["scope"] == "alerts") {
            // subscribe for new alert
            this.listener = this.add_broadcast_listener("+/+", "NOTIFY", "#")
        } else {
            // subscribe for acknoledgments from the database for saved values
            this.add_inspection_listener("controller/db", "*/*", "SAVED", "#")
        }
    }
    
    // receive data and load it into the widget
    on_message(message) {
        // database just saved a value check if our sensor is involved and if so refresh the data
        if (message.sender == "controller/db" && message.command == "SAVED") {
            if (message.args == this.widget["sensor"]) this.request_data()
        }
        else if (message.sender == "controller/db" && message.command == "GET_COUNT") {
            var session = gui.sessions.restore(message)
            if (session == null) return
            var data = message.get("data")
            if (data.length == 1) $("#"+this.id+"_value").html(data[0])
        }
        // realtime alerts
        else if (message.recipient == "*/*" && message.command == "NOTIFY") {
            var args = message.args.split("/")
            if (args[0] == this.widget["sensor"]) this.request_data()
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}