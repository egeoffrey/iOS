// Database widget
class Database extends Widget {
    constructor(id, widget) {
        super(id, widget)
        // add an empty box into the given column
        this.add_large_box(this.id, this.widget["title"])
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: _table
        var body = "#"+this.id+"_body"
        // add table
        // 0: key
        // 1: size
        // 2: start
        // 3: end
        // 4: value
        var table = '\
            <table id="'+this.id+'_table" class="table table-bordered table-striped">\
                <thead>\
                    <tr><th>Key</th><th># Entries</th><th>Oldest</th><th>Newest</th><th>Latest Value</th></tr>\
                </thead>\
                <tbody></tbody>\
            </table>'
        $(body).html(table)
        // how to render the timestamp
        function render_timestamp(data, type, row, meta) {
            if (type == "display") return gui.date.timestamp_difference(gui.date.now(), data)
            else return data
        };
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
            "columnDefs": [ 
                {
                    "targets" : [2, 3],
                    "render": render_timestamp,
                },
                {
                    "className": "dt-center",
                    "targets": [1, 2, 3]
                }
            ],
            "language": {
                "emptyTable": '<span id="'+this.id+'_table_text"></span>'
            }
        };
        // create the table
        $("#"+this.id+"_table").DataTable(options);
        $("#"+this.id+"_table_text").html('<i class="fas fa-spinner fa-spin"></i> Loading')
        // ask the database for statistics
        var message = new Message(gui)
        message.recipient = "controller/db"
        message.command = "STATS"
        this.send(message)
    }
    
    // receive data and load it into the widget
    on_message(message) {
        if (message.command == "STATS") {
            var table = $("#"+this.id+"_table").DataTable()
            var entries = message.get_data()
            for (var entry of entries) {
                table.row.add([entry[0], entry[1], entry[2], entry[3], format_multiline(truncate(entry[4].replaceAll("\n", "<br>"), 100), 50)])
            }
            table.draw()
            table.responsive.recalc()
            if (table.data().count() == 0) $("#"+this.id+"_table_text").html('No data to display')
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}