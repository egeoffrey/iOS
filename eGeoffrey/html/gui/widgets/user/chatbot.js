// chatbot widget
class Chatbot extends Widget {
    constructor(id, widget) {
        super(id, widget)
        this.answer_count = 0
        // add an empty box into the given column
        this.add_chat_box(this.id, this.widget["title"])
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _messages, _text, _button
        // IDs Widget: 
        var body = "#"+this.id+"_body"
        // configure send button
        $("#"+this.id+"_button").unbind().click(function(this_class) {
            return function () {
                var question = $("#"+this_class.id+"_text").val()
                if (question == "") return
                // add the user's question to the chat
                this_class.add_question(question)
                $("#"+this_class.id+"_text").val("")
                // ask the chatbot about the user's question
                var request = {
                    request: question,
                    accept: ["text","image"]
                }
                var message = new Message(gui)
                message.recipient = "controller/chatbot"
                message.command = "ASK"
                message.set_data(request)
                this_class.send(message)
                // add an answer box and typing indicator
                this_class.add_answer_box()
            };
        }(this));
        // submit the question when pressing enter inside the text box
        $("#"+this.id+"_text").keypress(function(this_class) {
            return function (e) {
                if (e.which == 13) {
                    $("#"+this_class.id+"_button").click()
                    return false
                }
            };
        }(this));
        // initialize the chat box
        this.add_answer_box()
        this.add_answer({content: "Sir, Madam, do you require anything of me?", type: "text"})
        // capture all alerter notifications, they will become chat messages
        this.add_inspection_listener("controller/alerter", "*/*", "NOTIFY", "#")
    }
    
    // add a question to the chat box
    add_question(question) {
        var user = gui.users[gui.username]
        // TODO: current time
        var question_html = '\
            <div class="direct-chat-msg">\
              <div class="direct-chat-info clearfix">\
                <span class="direct-chat-name pull-left">'+user["fullname"]+'</span>\
                <span class="direct-chat-timestamp float-right">'+gui.date.format_timestamp()+'</span>\
              </div>\
              <i class="direct-chat-img fas fa-2x fa-'+user["icon"]+'"></i>\
              <div class="direct-chat-text">\
                '+question+'\
              </div>\
            </div>\
            '
        $("#"+this.id+"_messages").append(question_html)
        this.scroll_messages()
    }
    
    // scroll at the bottom of the chat box
    scroll_messages() {
        if ($("#"+this.id+"_messages").get(0) == null) return
        $("#"+this.id+"_messages").animate({
            scrollTop: $("#"+this.id+"_messages").get(0).scrollHeight
        }, 1000);
    }
    
    // add an answer box to the chat window
    add_answer_box() {
        // TODO: current time
        var answer_html = '\
            <div class="direct-chat-msg right">\
              <div class="direct-chat-info clearfix">\
                <span class="direct-chat-name float-right">'+gui.house["name"]+'</span>\
                <span class="direct-chat-timestamp pull-left">'+gui.date.format_timestamp()+'</span>\
              </div>\
              <i class="direct-chat-img fas fa-2x fa-concierge-bell"></i>\
              <div class="direct-chat-text" id="'+this.id+'_answer_'+this.answer_count+'">\
                <i class="fas fa-hourglass-half fa-spin"></i>\
              </div>\
            </div>\
            '
        $("#"+this.id+"_messages").append(answer_html)
        this.scroll_messages()
    }
    
    // add an answer to the existing box
    add_answer(answer) {
        // TODO: current time
        var message = ""
        if (answer["type"] == "text") message = answer["content"]
        else if (answer["type"] == "image") message = '<img width=300 heigth=200 src="data:image/png;base64,'+answer["content"]+'"/>'
        $("#"+this.id+"_answer_"+this.answer_count).html(message)
        this.scroll_messages()
        this.answer_count++
    }
    
    // receive data and load it into the widget
    on_message(message) {
        if (message.command == "ASK") {
            this.add_answer(message.get_data())
        }
        else if (message.sender == "controller/alerter" && message.command == "NOTIFY") {
            this.add_answer({type: "text", content: message.get_data()})
        }
    }
    
    // receive configuration
    on_configuration(message) {
    }
}