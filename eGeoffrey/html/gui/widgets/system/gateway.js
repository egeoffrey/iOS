// Gateway widget
class Gateway extends Widget {
    constructor(id, widget) {
        super(id, widget)
        this.listener = null
        this.live = true
        // add an empty box into the given column
        this.add_large_box(this.id, this.widget["title"])
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: _table
        if (this.listener != null) this.remove_listener(this.listener)
        var body = "#"+this.id+"_body"
        $(body).html("")
        // add buttons
        var button_html = '\
            <div class="form-group float-right">&nbsp;\
                <button type="button" id="'+this.id+'_clear" class="btn btn-default btn-sm"><i class="fas fa-eraser"></i> Clear</button>\
                <input id="'+this.id+'_live" type="checkbox" checked> Live\
            </div>'
        $(body).append(button_html)
        // configure buttons
        $("#"+this.id+"_clear").unbind().click(function(this_class) {
            return function () {
                var table = $("#"+this_class.id+"_table").DataTable()
                table.clear().draw()
            };
        }(this));
        $("#"+this.id+"_live").iCheck({
            checkboxClass: 'icheckbox_square-blue',
            radioClass: 'iradio_square-blue',
            increaseArea: '20%' 
        });
        $("#"+this.id+"_live").unbind().on('ifChanged',function(this_class) {
            return function () {
                this_class.live = this.checked
            };
        }(this));
        // add table
        // 0: timestamp
        // 1: source
        // 2: recipient
        // 3: command
        // 4: args
        // 5: retain
        // 6: content
        var table = '\
            <table id="'+this.id+'_table" class="table table-bordered table-striped">\
                <thead>\
                    <tr><th>Time</th><th>Source Module</th><th>Recipient Module</th><th>Command</th><th>Args</th><th>Retain</th><th>Content</th></tr>\
                </thead>\
                <tbody></tbody>\
            </table>'
        $(body).append(table)
        // how to render the timestamp
        function render_timestamp(data, type, row, meta) {
            if (type == "display") return gui.date.format_timestamp(data)
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
            "order": [[ 0, "desc" ]],
            "columnDefs": [ 
                {
                    "className": "dt-center",
                    "targets": [1, 2, 3, 5]
                },
                {
                    "targets" : [0],
                    "render": render_timestamp,
                },
            ],
            "language": {
                "emptyTable": '<span id="'+this.id+'_table_text"></span>'
            }
        };
        // create the table
        $("#"+this.id+"_table").DataTable(options);
        $("#"+this.id+"_table_text").html('<i class="fas fa-spinner fa-spin"></i> Loading')
        // subscribe for all topics
        this.listener = this.add_inspection_listener("+/+", "+/+", "+", "#")
    }
    
    // receive data and load it into the widget
    on_message(message) {
        if (! this.live) return
        // TODO: if now opened on this page, the table gets empty just after loading
        var table = $("#"+this.id+"_table").DataTable()
        var retain = message.retain ? '<i class="fas fa-check"></i>' : ""
        var content = truncate(format_multiline(JSON.stringify(message.get_data()), 70),1000)
        table.row.add([gui.date.now(), message.sender, message.recipient, message.command, message.args, retain, content]).draw(false)
        table.responsive.recalc()
        if (table.data().count() == 0) $("#"+this.id+"_table_text").html('No data to display')
    }
    
    // receive configuration
    on_configuration(message) {
    }
}