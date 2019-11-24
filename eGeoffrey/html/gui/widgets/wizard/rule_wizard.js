// rule wizard widget
class Rule_wizard extends Widget {
    constructor(id, widget) {
        super(id, widget)
        this.constants_count = 0
        this.variables_count = 0
        this.macro_count = 0
        this.trigger_count = 0
        this.conditions_block_count = 0
        this.conditions_count = []
        this.actions_count = 0
        this.waiting_for_rule = null
    }
    
    // draw the widget's content
    draw() {
        // extract requested rule_id from URL
        var rule_id = null
        if (location.hash.includes("=")) {
            var request = location.hash.split("=")
            rule_id = request[1]
        }
        // clear up the modal
        $("#wizard_body").html("")
        $("#wizard_title").html("Rule Configuration")
        // show the modal
        $("#wizard").modal()
        // build the form
        $("#wizard_body").append('\
            <form method="POST" role="form" id="'+this.id+'_form" class="needs-validation" novalidate>\
                <ul class="nav nav-tabs" id="'+this.id+'_tabs" role="tablist">\
                    <li class="nav-item">\
                        <a class="nav-link active" id="'+this.id+'_tab_general" data-toggle="pill" href="#'+this.id+'_tab_general_content" role="tab" aria-controls="'+this.id+'_tab_general_content" aria-selected="true">General</a>\
                    </li>\
                    <li class="nav-item">\
                        <a class="nav-link" id="'+this.id+'_tab_macro" data-toggle="pill" href="#'+this.id+'_tab_macro_content"  role="tab" aria-controls="'+this.id+'_tab_macro_content" aria-selected="false">Macro</a>\
                    </li>\
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+this.id+'_tab_triggers" data-toggle="pill" href="#'+this.id+'_tab_triggers_content"  role="tab" aria-controls="'+this.id+'_tab_triggers_content" aria-selected="false">Triggers</a>\
                    </li>\
                    <li class="nav-item">\
                        <a class="nav-link" id="'+this.id+'_tab_constants" data-toggle="pill" href="#'+this.id+'_tab_constants_content"  role="tab" aria-controls="'+this.id+'_tab_constants_content" aria-selected="false">Constants</a>\
                    </li>\
                    <li class="nav-item">\
                        <a class="nav-link" id="'+this.id+'_tab_variables" data-toggle="pill" href="#'+this.id+'_tab_variables_content" role="tab" aria-controls="'+this.id+'_tab_variables_content" aria-selected="false">Variables</a>\
                    </li>\
                    <li class="nav-item">\
                        <a class="nav-link" id="'+this.id+'_tab_conditions" data-toggle="pill" href="#'+this.id+'_tab_conditions_content" role="tab" aria-controls="'+this.id+'_tab_conditions_content" aria-selected="false">Conditions</a>\
                    </li>\
                    <li class="nav-item d-none">\
                        <a class="nav-link" id="'+this.id+'_tab_schedule" data-toggle="pill" href="#'+this.id+'_tab_schedule_content" role="tab" aria-controls="'+this.id+'_tab_schedule_content" aria-selected="false">Schedule</a>\
                    </li>\
                    <li class="nav-item">\
                        <a class="nav-link" id="'+this.id+'_tab_actions" data-toggle="pill" href="#'+this.id+'_tab_actions_content" role="tab" aria-controls="'+this.id+'_tab_actions_content" aria-selected="false">Actions</a>\
                    </li>\
                </ul>\
                <div class="tab-content">\
                    <div class="tab-pane fade show active" id="'+this.id+'_tab_general_content" role="tabpanel" aria-labelledby="'+this.id+'_tab_general">\
                        <div class="form-group">\
                            <label>Rule identifier*</label>\
                            <input type="text" id="'+this.id+'_rule_id" class="form-control" placeholder="identifier that will be used to reference the rule" required>\
                        </div>\
                        <div class="form-check">\
                            <input type="checkbox" class="form-check-input" id="'+this.id+'_disabled">\
                            <label class="form-check-label">Disabled</label>\
                        </div><br>\
                        <div class="form-group">\
                            <label>Rule Text*</label>\
                            <input type="text" id="'+this.id+'_text" class="form-control" placeholder="text of the rule when triggers. Values of variables can be referenced with %variable%" required>\
                        </div>\
                        <div class="form-group">\
                            <label>Severity*</label>\
                            <select id="'+this.id+'_severity" class="form-control" required>\
                                <option value="alert">Alert</option>\
                                <option value="warning">Warning</option>\
                                <option value="info">Info</option>\
                                <option value="debug">Debug</option>\
                            </select>\
                        </div>\
                        <div class="form-group">\
                            <label>Type*</label>\
                            <select id="'+this.id+'_type" class="form-control" required>\
                                <option value="recurrent">Recurrent - schedule rule\'s execution through the Schedule tab</option>\
                                <option value="on_demand">On-Demand - runs manually or when requested by the chatbot</option>\
                                <option value="realtime">Realtime - runs whenever one of the sensors listed in the Triggers tab is updated</option>\
                            </select>\
                        </div>\
                    </div>\
                    <div class="tab-pane fade" id="'+this.id+'_tab_macro_content" role="tabpanel" aria-labelledby="'+this.id+'_tab_macro">\
                        <div class="text-right"><a onClick=\'$("#'+this.id+'_help_macro\").toggleClass(\"d-none\")\'><i class="fas fa-question-circle text-info fa-1x"></i></a></div>\
                        <div id="'+this.id+'_help_macro" class="callout callout-info d-none">\
                            <p>If you want the same rule to be executed for multiple entities (e.g. different sensors), reference its sensor_id below. Then you can use the %i% placeholder in variables and actions that will be replaced with the sensor\'s value and the rule will be run in parallel for each instance</p>\
                            <p>Examples:</p>\
                            <ul>\
                                <li><code>alarm/pir/ground_floor</code>\
                                    <ul><li>The <code>%i%</code> placeholder is made available in variables and actions and can be used for e.g. referencing other sensors like <code>%i%_armed</code> which will be expanded into <code>alarm/pir/ground_floor_armed</code></li></ul>\
                                </li>\
                            </ul>\
                        </div>\
                        <div id="'+this.id+'_macro"></div>\
                        <br>\
                        <div class="form-group">\
                            <button type="button" class="btn btn-default float-right" id="'+this.id+'_add_macro"><i class="fas fa-plus"></i> Add Placeholder</button>\
                        </div>\
                    </div>\
                    <div class="tab-pane fade" id="'+this.id+'_tab_triggers_content" role="tabpanel" aria-labelledby="'+this.id+'_tab_triggers">\
                        <div class="text-right"><a onClick=\'$("#'+this.id+'_help_triggers\").toggleClass(\"d-none\")\'><i class="fas fa-question-circle text-info fa-1x"></i></a></div>\
                        <div id="'+this.id+'_help_triggers" class="callout callout-info d-none">\
                            <p>For rules of type realtime, you have to set one or more sensor_id(s) which are monitored and which will trigger the rule\'s execution (hence conditions will be evaluated) whenever a new value is saved.\
                        </div>\
                        <div id="'+this.id+'_triggers"></div>\
                        <br>\
                        <div class="form-group">\
                            <button type="button" class="btn btn-default float-right" id="'+this.id+'_add_trigger"><i class="fas fa-plus"></i> Add Trigger</button>\
                        </div>\
                    </div>\
                    <div class="tab-pane fade" id="'+this.id+'_tab_constants_content" role="tabpanel" aria-labelledby="'+this.id+'_tab_constants">\
                        <div class="text-right"><a onClick=\'$("#'+this.id+'_help_constants\").toggleClass(\"d-none\")\'><i class="fas fa-question-circle text-info fa-1x"></i></a></div>\
                        <div id="'+this.id+'_help_constants" class="callout callout-info d-none">\
                            <p>If in a condition you need to compare the value of a sensor with a static number of string, the latter has to be defined as a constants below</p>\
                            <p>Examples:</p>\
                            <ul>\
                                <li><code>status_on = 1</code>\
                                    <ul><li><code>alarm_status</code> will be assigned the value of <code>1</code> and can be referenced in a condition</li></ul>\
                                </li>\
                            </ul>\
                        </div>\
                        <div id="'+this.id+'_constants"></div>\
                        <br>\
                        <div class="form-group">\
                            <button type="button" class="btn btn-default float-right" id="'+this.id+'_add_constant"><i class="fas fa-plus"></i> Add Constant</button>\
                        </div>\
                    </div>\
                    <div class="tab-pane fade" id="'+this.id+'_tab_variables_content" role="tabpanel" aria-labelledby="'+this.id+'_tab_variables">\
                        <div class="text-right"><a onClick=\'$("#'+this.id+'_help_variables\").toggleClass(\"d-none\")\'><i class="fas fa-question-circle text-info fa-1x"></i></a></div>\
                        <div id="'+this.id+'_help_variables" class="callout callout-info d-none">\
                            <p>If in a condition you want to compare the value of a sensor with a constant or another variable, this has to be defined below. The variables value is in the format <code>[DISTANCE|TIMESTAMP|ELAPSED|COUNT|SCHEDULE|POSITION_LABEL|POSITION_TEXT] [-&lt;start_position&gt;],[-&lt;end_position&gt;] &lt;sensor_id&gt;</code></p>\
                            <p>For any variable defined here a placeholder in the format <code>%variable_id%</code> can be used in the rule\'s text and will be replaced by its value when the rule triggers.</p>\
                            <p>Examples:</p>\
                            <ul>\
                                <li><code>alarm_status = alarm/status</code>\
                                    <ul><li><code>alarm_status</code> will be assigned the latest value of the <code>alarm/status/status</code> sensor</li></ul>\
                                </li>\
                                <li><code>boiler_off_minutes = ELAPSED boiler/status</code>\
                                    <ul><li>The elapsed time in minutes since the latest measure of <code>boiler/status/status</code> will be assigned to the variable <code>boiler_off_minutes</code></li></ul>\
                                </li>\
                                <li><code>latest_5_days = -5,-1 outdoor/temperature/day/avg</code>\
                                    <ul><li>The latest 5 daily averages of the sensor <code>outdoor/temperature</code> will be assigned to the variable <code>latest_5_days</code></li></ul>\
                                </li>\
                            </ul>\
                        </div>\
                        <div id="'+this.id+'_variables"></div>\
                        <br>\
                        <div class="form-group">\
                            <button type="button" class="btn btn-default float-right" id="'+this.id+'_add_variable"><i class="fas fa-plus"></i> Add Variable</button>\
                        </div>\
                    </div>\
                    <div class="tab-pane fade" id="'+this.id+'_tab_conditions_content" role="tabpanel" aria-labelledby="'+this.id+'_tab_conditions">\
                        <div class="text-right"><a onClick=\'$("#'+this.id+'_help_conditions\").toggleClass(\"d-none\")\'><i class="fas fa-question-circle text-info fa-1x"></i></a></div>\
                        <div id="'+this.id+'_help_conditions" class="callout callout-info d-none">\
                            <p>Previously defined constants and variables can be compared in conditions. The rule triggers if all the conditions of a block evaluate to true (AND). If there are multiple blocks the rule triggers when at least one block evaluate true (OR).</p>\
                            <p>The condition has to be in the format <code>&lt;variable_id|constant_id&gt; [==|!=|&lt;|&gt;] &lt;variable_id|constant_id&gt;</code>.</p>\
                            <p>Single subexpressions are also allowed on both the sides of the comparison by using parentheses and one of the following operators: <code>+|-|*|/</code>.</p>\
                            <p>Examples:</p>\
                            <ul>\
                                <li><code>alarm_status == status_on</code>\
                                    <ul><li>Check if the variable <code>alarm_status</code> is equals to the constant  <code>status_on</code></li></ul>\
                                </li>\
                                <li><code>temperature > threshold</code>\
                                    <ul><li>Check if the variable <code>temnperature</code> is higher than then constant <code>threshold</code></li></ul>\
                                </li>\
                                <li><code>temperature > (threshold + delta)</code>\
                                    <ul><li>Check if the <code>temperature</code> is higher than the <code>threshold</code> summed to <code>delta</code></li></ul>\
                                </li>\
                            </ul>\
                        </div>\
                        <div id="'+this.id+'_conditions"></div>\
                        <br>\
                        <div class="form-group">\
                            <button type="button" class="btn btn-default float-right" id="'+this.id+'_add_condition_block"><i class="fas fa-plus"></i> Add Block</button>\
                        </div>\
                    </div>\
                    <div class="tab-pane fade" id="'+this.id+'_tab_schedule_content" role="tabpanel" aria-labelledby="'+this.id+'_tab_schedule">\
                        <div class="form-group">\
                            <label>Scheduling Mode*</label>\
                            <select id="'+this.id+'_schedule_trigger" class="form-control">\
                                <option value="interval">Interval - run the rule at fixed intervals of time</option>\
                                <option value="cron">Cron - run the rule periodically at certain time(s) of day</option>\
                            </select>\
                        </div>\
                        <div id="'+this.id+'_schedule_panel_interval" class="d-none">\
                            <div class="form-group">\
                                <label>days</label>\
                                <input type="text" id="'+this.id+'_schedule_days" class="form-control" placeholder="e.g. 3 to poll every 3 days">\
                            </div>\
                            <div class="form-group">\
                                <label>hours</label>\
                                <input type="text" id="'+this.id+'_schedule_hours" class="form-control" placeholder="e.g. 3 to poll every 3 hours">\
                            </div>\
                            <div class="form-group">\
                                <label>minutes</label>\
                                <input type="text" id="'+this.id+'_schedule_minutes" class="form-control" placeholder="e.g. 3 to poll every 3 minutes">\
                            </div>\
                            <div class="form-group">\
                                <label>seconds</label>\
                                <input type="text" id="'+this.id+'_schedule_seconds" class="form-control" placeholder="e.g. 3 to poll every 3 seconds">\
                            </div>\
                        </div>\
                        <div id="'+this.id+'_schedule_panel_cron" class="d-none">\
                            <div class="form-group">\
                                <label>day</label>\
                                <input type="text" id="'+this.id+'_schedule_day" class="form-control" placeholder="e.g. 3 to poll at the 3rd of each month. Use \'*\' for every day">\
                            </div>\
                            <div class="form-group">\
                                <label>hour</label>\
                                <input type="text" id="'+this.id+'_schedule_hour" class="form-control" placeholder="e.g. 3 to poll at 3am every day. Use \'*\' for every hour">\
                            </div>\
                            <div class="form-group">\
                                <label>minute</label>\
                                <input type="text" id="'+this.id+'_schedule_minute" class="form-control" placeholder="e.g. 3 to poll at the 3rd minute of every hour. Use \'*\' for every minute">\
                            </div>\
                            <div class="form-group">\
                                <label>second</label>\
                                <input type="text" id="'+this.id+'_schedule_second" class="form-control" placeholder="e.g. 3 to poll at the 3rd second of every minute">\
                            </div>\
                        </div>\
                    </div>\
                    <div class="tab-pane fade" id="'+this.id+'_tab_actions_content" role="tabpanel" aria-labelledby="'+this.id+'_tab_actions">\
                        <div class="text-right"><a onClick=\'$("#'+this.id+'_help_actions\").toggleClass(\"d-none\")\'><i class="fas fa-question-circle text-info fa-1x"></i></a></div>\
                        <div id="'+this.id+'_help_actions" class="callout callout-info d-none">\
                            <p>When conditions meet and a rule triggers, the rule\'s text with the placeholders replaced by variables\' current values will be used as a the notification text which is  both added in the notification widget and used to trigger any configured notification service. In addition to this, further actions can be configured to e.g. set values to different sensors, trigger an actuator or manually trigger other rules. You can either SET a new value to a sensor, POLL a service associated to a sensor, RUN a different rule in the format <code>[SET|POLL|RUN] &lt;sensor_id|rule_id&gt; [&lt;value&gt;]</code>.</p>\
                            <p>Examples:</p>\
                            <ul>\
                                <li><code>SET alarm/door/first_floor_armed 1</code>\
                                    <ul><li>Set the value of the sensor <code>alarm/door/first_floor_armed</code> to <code>1</code></li></ul>\
                                </li>\
                                <li><code>SET irrigation/control/req 1</code>\
                                    <ul><li>Turn the irrigation on by triggering the <code>irrigation/control/req</code> actuator</li></ul>\
                                </li>\
                                <li><code>RUN welcome_home</code>\
                                    <ul><li>Run the rule <code>welcome_home</code></li></ul>\
                                </li>\
                            </ul>\
                        </div>\
                        <div id="'+this.id+'_actions"></div>\
                        <br>\
                        <div class="form-group">\
                            <button type="button" class="btn btn-default float-right" id="'+this.id+'_add_action"><i class="fas fa-plus"></i> Add Action</button>\
                        </div>\
                    </div>\
                </div>\
            </form>\
        ')
        // add link to advanced configuration
        var link = rule_id == null ? "__new__" : rule_id
        $("#wizard_body").append('<br><a id="'+this.id+'_advanced_editor" class="float-right text-primary">Advanced Editor</a>')
        $("#"+this.id+"_advanced_editor").unbind().click(function(this_class) {
            return function () {
                $('#wizard').unbind('hidden.bs.modal')
                $("#wizard").modal("hide")
                gui.unload_page()
                window.location.hash = "#__configuration=rules/"+link 
            };
        }(this));
        // configure add buttons
        $("#"+this.id+"_add_macro").unbind().click(function(this_class) {
            return function () {
                this_class.add_macro()
            };
        }(this));
        $("#"+this.id+"_add_trigger").unbind().click(function(this_class) {
            return function () {
                this_class.add_trigger()
            };
        }(this));
        $("#"+this.id+"_add_constant").unbind().click(function(this_class) {
            return function () {
                this_class.add_constant()
            };
        }(this));
        $("#"+this.id+"_add_variable").unbind().click(function(this_class) {
            return function () {
                this_class.add_variable()
            };
        }(this));
        $("#"+this.id+"_add_condition_block").unbind().click(function(this_class) {
            return function () {
                this_class.add_condition_block()
            };
        }(this));
        $("#"+this.id+"_add_action").unbind().click(function(this_class) {
            return function () {
                this_class.add_action()
            };
        }(this));
        // configure rule type selector
        $('#'+this.id+'_type').unbind().change(function(this_class) {
            return function () {
                var type = $('#'+this_class.id+'_type').val()
                // show the schedule panel only if the rule is recurrent
                if (type == "recurrent") {
                    $('#'+this_class.id+'_tab_schedule').parent('li').removeClass("d-none")
                } else {
                    $('#'+this_class.id+'_tab_schedule').parent('li').addClass("d-none")
                }
                if (type == "realtime") {
                    $('#'+this_class.id+'_tab_triggers').parent('li').removeClass("d-none")
                } else {
                    $('#'+this_class.id+'_tab_triggers').parent('li').addClass("d-none")
                }
                // trigger change on schedule trigger
                $('#'+this_class.id+'_schedule_trigger').trigger("change")
            };
        }(this))
        // configure schedule trigger selector
        $('#'+this.id+'_schedule_trigger').unbind().change(function(this_class) {
            return function () {
                var value = $('#'+this_class.id+'_schedule_trigger').val()
                if (value == "cron") {
                    $('#'+this_class.id+'_schedule_panel_interval').addClass("d-none")
                    $('#'+this_class.id+'_schedule_panel_cron').removeClass("d-none")
                }
                else if (value == "interval") {
                    $('#'+this_class.id+'_schedule_panel_cron').addClass("d-none")
                    $('#'+this_class.id+'_schedule_panel_interval').removeClass("d-none")
                }

            };
        }(this))
        // select the first item of type
        $('#'+this.id+'_type').prop("selectedIndex", 0).trigger("change")
        // what to do when the form is submitted
        var id = this.id
        var this_class = this
        $('#'+this.id+'_form').on('submit', function (e) {
            // form is validated
            if ($('#'+this_class.id+'_form')[0].checkValidity()) {
                // get rule_id 
                var rule_id = $("#"+this_class.id+"_rule_id").val()
                // build up the configuration file
                var rule = {}
                for (var item of ["text", "severity", "type"]) {
                    var value = $("#"+this_class.id+"_"+item).val()
                    if (value == null || value == "") continue
                    rule[item] = $.isNumeric(value) ? parseFloat(value) : value
                }
                // disabled
                if ($("#"+this_class.id+"_disabled").prop("checked")) rule["disabled"] = true
                // schedule
                if (rule["type"] == "recurrent") {
                    var schedule_trigger = $("#"+this_class.id+"_schedule_trigger").val()
                    var schedule_panel = this_class.id+"_schedule_panel_"+schedule_trigger
                    rule["schedule"] = {}
                    rule["schedule"]["trigger"] = schedule_trigger
                    $("#"+schedule_panel+" :input").each(function(e){
                        var item = this.id.replace(this_class.id+"_schedule_", "")
                        var value = this.value
                        if (value != null && value != "") rule["schedule"][item] = $.isNumeric(value) ? parseFloat(value) : value
                    });
                }
                // macro
                $("#"+this_class.id+"_macro :input[type=text]").each(function(e){
                    if (! ("macros" in rule)) rule["macros"] = []
                    rule["macros"].push(this.value)
                });
                // triggers
                if (rule["type"] == "realtime") {
                    $("#"+this_class.id+"_triggers :input[type=text]").each(function(e){
                        if (! ("triggers" in rule)) rule["triggers"] = []
                        rule["triggers"].push(this.value)
                    });
                }
                // constants
                var key = null
                $("#"+this_class.id+"_constants :input[type=text]").each(function(e){
                    if (! ("constants" in rule)) rule["constants"] = {}
                    if (key == null) key = this.value
                    else if (key != null) {
                        rule["constants"][key] = $.isNumeric(this.value) ? parseFloat(this.value) : this.value
                        key = null
                    }
                });
                // variables
                var key = null
                $("#"+this_class.id+"_variables :input[type=text]").each(function(e){
                    if (! ("variables" in rule)) rule["variables"] = {}
                    if (key == null) key = this.value
                    else if (key != null) {
                        rule["variables"][key] = this.value
                        key = null
                    }
                });
                // conditions
                var conditions = []
                $("#"+this_class.id+"_conditions :input[type=text]").each(function(e){
                    var split = this.id.replace(this_class.id+"_", "").replace("condition_key_", "").split("_")
                    var block_i = split[0]
                    if (conditions[block_i] == null) conditions[block_i] = []
                    conditions[block_i].push(this.value)
                });
                if (conditions.length > 0) rule["conditions"] = []
                for (var block of conditions) {
                    if (block == null) continue
                    rule["conditions"].push(block)
                }
                if (! ("conditions" in rule)) rule["conditions"] = [[]]
                // save new/updated configuration
                var message = new Message(gui)
                message.recipient = "controller/config"
                message.command = "SAVE"
                message.args = "rules/"+rule_id
                message.config_schema = gui.supported_rules_config_schema
                message.set_data(rule)
                gui.send(message)
                // close the modal
                $("#wizard").modal("hide")
                gui.notify("success","Rule "+rule_id+" saved successfully")
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
        // what to do when the modal is closed
        $('#wizard').one('hidden.bs.modal', function () {
            gui.unload_page()
            window.history.back()
        })
        // request content for editing the rule
        if (rule_id != null) {
            setTimeout(function(this_class, rule_id) {
                return function() {
                    this_class.waiting_for_rule = rule_id
                    this_class.add_configuration_listener("rules/"+this_class.waiting_for_rule, gui.supported_rules_config_schema)
                };
            }(this, rule_id), 100);
        }
    }
    
    // receive data and load it into the widget
    on_message(message) {
    }
    
    // add a macro to the form
    add_macro(key="") {
        var i = this.macro_count
        var html = '\
            <div class="row" id="'+this.id+'_macro_row_'+i+'">\
                <div class="col-11">\
                    <input type="text" id="'+this.id+'_macro_key_'+i+'" class="form-control" placeholder="sensor placeholder" value="'+key+'" required>\
                </div>\
                <div class="col-1">\
                    <button type="button" id="'+this.id+'_text" class="btn btn-default">\
                        <i class="fas fa-times text-red" id="'+this.id+'_macro_remove_'+i+'"></i>\
                    </button>\
                </div>\
            </div>\
        '
        $("#"+this.id+"_macro").append(html)
        // configure remove button
        $("#"+this.id+"_macro_remove_"+i).unbind().click(function(this_class) {
            return function () {
                $("#"+this_class.id+"_macro_row_"+i).remove()
            };
        }(this));
        this.macro_count++
        return i
    }
    
    // add a trigger to the form
    add_trigger(key="") {
        var i = this.trigger_count
        var html = '\
            <div class="row" id="'+this.id+'_trigger_row_'+i+'">\
                <div class="col-11">\
                    <input type="text" id="'+this.id+'_trigger_key_'+i+'" class="form-control" placeholder="e.g. sensor_id" value="'+key+'" required>\
                </div>\
                <div class="col-1">\
                    <button type="button" id="'+this.id+'_text" class="btn btn-default">\
                        <i class="fas fa-times text-red" id="'+this.id+'_trigger_remove_'+i+'"></i>\
                    </button>\
                </div>\
            </div>\
        '
        $("#"+this.id+"_triggers").append(html)
        // configure remove button
        $("#"+this.id+"_trigger_remove_"+i).unbind().click(function(this_class) {
            return function () {
                $("#"+this_class.id+"_trigger_row_"+i).remove()
            };
        }(this));
        this.trigger_count++
        return i
    }
    
    // add a constant to the form
    add_constant(key="", value="") {
        var i = this.constants_count
        var html = '\
            <div class="row" id="'+this.id+'_constant_row_'+i+'">\
                <div class="col-4">\
                    <input type="text" id="'+this.id+'_constant_key_'+i+'" class="form-control" placeholder="name of the constant" value="'+key+'" required>\
                </div>\
                <div class="col-1">\
                    <i class="fas fa-equals fa-1x"></i>\
                </div>\
                <div class="col-6">\
                    <input type="text" id="'+this.id+'_constant_value_'+i+'" class="form-control" placeholder="value of the constant" value="'+value+'" required>\
                </div>\
                <div class="col-1">\
                    <button type="button" id="'+this.id+'_text" class="btn btn-default">\
                        <i class="fas fa-times text-red" id="'+this.id+'_constant_remove_'+i+'"></i>\
                    </button>\
                </div>\
            </div>\
        '
        $("#"+this.id+"_constants").append(html)
        // configure remove button
        $("#"+this.id+"_constant_remove_"+i).unbind().click(function(this_class) {
            return function () {
                $("#"+this_class.id+"_constant_row_"+i).remove()
            };
        }(this));
        this.constants_count++
        return i
    }
    
    // add a variable to the form
    add_variable(key="", value="") {
        var i = this.variables_count
        var html = '\
            <div class="row" id="'+this.id+'_variable_row_'+i+'">\
                <div class="col-4">\
                    <input type="text" id="'+this.id+'_variable_key_'+i+'" class="form-control" placeholder="name of the variable" value="'+key+'" required>\
                </div>\
                <div class="col-1">\
                    <i class="fas fa-equals fa-1x"></i>\
                </div>\
                <div class="col-6">\
                    <input type="text" id="'+this.id+'_variable_value_'+i+'" class="form-control" placeholder="reference of the sensor" value="'+value+'" required>\
                </div>\
                <div class="col-1">\
                    <button type="button" id="'+this.id+'_text" class="btn btn-default">\
                        <i class="fas fa-times text-red" id="'+this.id+'_variable_remove_'+i+'"></i>\
                    </button>\
                </div>\
            </div>\
        '
        $("#"+this.id+"_variables").append(html)
        // configure remove button
        $("#"+this.id+"_variable_remove_"+i).unbind().click(function(this_class) {
            return function () {
                $("#"+this_class.id+"_variable_row_"+i).remove()
            };
        }(this));
        this.variables_count++
        return i
    }
    
    // add a condition block
    add_condition_block() {
        var i = this.conditions_block_count
        var html = '\
            <div class="card" id="'+this.id+'_condition_block_row_'+i+'">\
                <div class="card-body">\
                    <div id="'+this.id+'_conditions_'+i+'"></div>\
                    <br>\
                    <div class="row">\
                        <div class="col-6">\
                            <button type="button" class="btn btn-default float-right" id="'+this.id+'_remove_condition_block_'+i+'"><i class="fas fa-minus"></i> Remove Block</button>\
                        </div>\
                        <div class="col-6">\
                            <button type="button" class="btn btn-default float-right" id="'+this.id+'_add_condition_'+i+'"><i class="fas fa-plus"></i> Add Condition</button>\
                        </div>\
                    </div>\
                </div>\
            </div>\
        '
        $("#"+this.id+"_conditions").append(html)
        // configure add condition button
        $("#"+this.id+"_add_condition_"+i).unbind().click(function(this_class) {
            return function () {
                this_class.add_condition(i)
            };
        }(this));
        // configure remove button
        $("#"+this.id+"_remove_condition_block_"+i).unbind().click(function(this_class) {
            return function () {
                $("#"+this_class.id+"_condition_block_row_"+i).remove()
            };
        }(this));
        this.conditions_block_count++
        return i
    }
    
    // add a condition in a block
    add_condition(block_i, key="") {
        if (this.conditions_count[block_i] == null) this.conditions_count[block_i] = 0
        var i = this.conditions_count[block_i]
        var html = '\
            <div class="row" id="'+this.id+'_condition_row_'+block_i+'_'+i+'">\
                <div class="col-11">\
                    <input type="text" id="'+this.id+'_condition_key_'+block_i+'_'+i+'" class="form-control" placeholder="condition" value="'+key+'" required>\
                </div>\
                <div class="col-1">\
                    <button type="button" id="'+this.id+'_text" class="btn btn-default">\
                        <i class="fas fa-times text-red" id="'+this.id+'_condition_remove_'+block_i+'_'+i+'"></i>\
                    </button>\
                </div>\
            </div>\
        '
        $("#"+this.id+"_conditions_"+block_i).append(html)
        // configure remove button
        $("#"+this.id+"_condition_remove_"+block_i+'_'+i).unbind().click(function(this_class) {
            return function () {
                $("#"+this_class.id+"_condition_row_"+block_i+'_'+i).remove()
            };
        }(this));
        this.conditions_count[block_i]++
        return i
    }
    
    // add an action to the form
    add_action(key="") {
        var i = this.actions_count
        var html = '\
            <div class="row" id="'+this.id+'_action_row_'+i+'">\
                <div class="col-11">\
                    <input type="text" id="'+this.id+'_actions_key_'+i+'" class="form-control" placeholder="action to perform" value="'+key+'" required>\
                </div>\
                <div class="col-1">\
                    <button type="button" id="'+this.id+'_text" class="btn btn-default">\
                        <i class="fas fa-times text-red" id="'+this.id+'_action_remove_'+i+'"></i>\
                    </button>\
                </div>\
            </div>\
        '
        $("#"+this.id+"_actions").append(html)
        // configure remove button
        $("#"+this.id+"_action_remove_"+i).unbind().click(function(this_class) {
            return function () {
                $("#"+this_class.id+"_action_row_"+i).remove()
            };
        }(this));
        this.actions_count++
        return i
    }
    
    // receive configuration
    on_configuration(message) {
        // assuming we are receiving a rule configuration (edit)
        var rule_id = message.args.replace("rules/","")
        if (this.waiting_for_rule == rule_id) this.waiting_for_rule = null
        else return
        var rule = message.get_data()
        $("#"+this.id+"_rule_id").val(rule_id)
        $("#"+this.id+"_rule_id").prop("disabled", true)
        // populate the form
        for (var item of ["text", "severity", "type"]) {
            if (item in rule) $("#"+this.id+"_"+item).val(rule[item])
        }
        // populate disabled checkbox
        if ("disabled" in rule && rule["disabled"]) $("#"+this.id+"_disabled").prop("checked", true)
        // populate for
        if ("macros" in rule) {
            for (var macro of rule["macros"]) {
                this.add_macro(macro)
            }
        }
        // populate triggers
        if ("triggers" in rule) {
            for (var trigger of rule["triggers"]) {
                this.add_trigger(trigger)
            }
        }
        // populate constants
        if ("constants" in rule) {
            for (var constant in rule["constants"]) {
                this.add_constant(constant, rule["constants"][constant])
            }
        }
        // populate variables
        if ("variables" in rule) {
            for (var variable in rule["variables"]) {
                this.add_variable(variable, rule["variables"][variable])
            }
        }
        // populate conditions
        if ("conditions" in rule) {
            for (var condition_block of rule["conditions"]) {
                var block_i = this.add_condition_block()
                for (var condition of condition_block) {
                    this.add_condition(block_i, condition)
                }
            }
        }
        // populate schedule
        if ("schedule" in rule) {
            for (var item in rule["schedule"]) $("#"+this.id+"_schedule_"+item).val(rule["schedule"][item])
        }
        // populate actions
        if ("actions" in rule) {
            for (var action of rule["actions"]) {
                this.add_action(action, rule["actions"][action])
            }
        }
        $('#'+this.id+'_type').trigger("change")
        $('#'+this.id+'_schedule_trigger').trigger("change")
    }
}