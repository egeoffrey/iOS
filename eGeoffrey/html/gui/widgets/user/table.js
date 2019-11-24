// Table widget
class Table extends Widget {
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
        // IDs Widget: _table
        // add the table
        var body = "#"+this.id+"_body"
        $(body).html("")
        // add table
        // 0: text
        var table = '\
            <table id="'+this.id+'_table" class="table table-bordered table-striped">\
                <thead>\
                    <tr><th></th></tr>\
                </thead>\
                <tbody></tbody>\
            </table>'
        $(body).append(table)
        // define datatables options
        var options = {
            "responsive": true,
            "dom": "Zlfrtip",
            "fixedColumns": false,
            "paging": true,
            "lengthChange": false,
            "searching": true,
            "ordering": true,
            "info": true,
            "autoWidth": false,
            "language": {
                "emptyTable": '<span id="'+this.id+'_table_text"></span>'
            }
        };
        // create the table
        if (! $.fn.dataTable.isDataTable("#"+this.id+"_table")) {
            $("#"+this.id+"_table").DataTable(options)
        } else {
            var table = $("#"+this.id+"_table").DataTable()
            table.clear()
        }
        $("#"+this.id+"_table_text").html('<i class="fas fa-spinner fa-spin"></i> Loading')
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
            if (data.length != 1) return
            var table = $("#"+this.id+"_table").DataTable()
            table.clear()
            for (var entry of data[0].split("\n")) {
                if (entry == "") continue
                table.row.add([escape_html(entry)]).draw(false);
            }
            if (table.data().count() == 0) $("#"+this.id+"_table_text").html('No data to display')
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}