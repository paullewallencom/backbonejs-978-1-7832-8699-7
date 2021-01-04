App.module('Chat', function (Chat) {
    var Message = Backbone.Model.extend({});

    Chat.Collection = Backbone.Collection.extend({
        model: Message,
        initialize: function (models, options) {
            var thiz = this;
            App.Socket.io.emit('room:join', options.room, this.add.bind(this)); 
            App.Socket.io.on('message:new', function (data) {
                if (data.room === options.room) {
                    thiz.add(data);
                }
            });
        }
    });

    var MessageView = Backbone.Marionette.ItemView.extend({
        tagName: 'li',
        template: '#message'
    });

    Chat.CollectionView = Backbone.Marionette.CollectionView.extend({
        tagName: 'ul',
        itemView: MessageView,
        onRender: function () {
            setTimeout(this.render.bind(this), 60000);
        }
    });
    
    Chat.CreateMessageView = Backbone.Marionette.ItemView.extend({
        tagName: 'form',
        template: '#form',
        model: new Backbone.Model({ placeholder: 'message', button: 'Post' }),
        events: {
            'click button': 'addMessage'
        },
        ui: {
            'input': 'input'
        },
        addMessage: function (e) {
            e.preventDefault();
            App.Socket.io.emit('message:new', { 
                user: App.name,
                text: this.ui.input.val(), 
                room: App.room.get('name'),
                date: new Date()
            });
            this.ui.input.val('').focus();
            return false;
        }
    });
});
