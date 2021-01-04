App.module('Room', function (Room) {
    var RoomModel = Backbone.Model.extend({
        url: function () {
            return '/room/' + this.get('name');
        }
    });

    Room.Collection = Backbone.Collection.extend({
        model: RoomModel,
        initialize: function () {
            App.Socket.io.on('room:new', this.getRoom.bind(this));
        },
        getRoom: function(room) {
            return this.findWhere({ name: room }) || this.add({ name: room });
        }
    });

    var RoomView = Backbone.Marionette.ItemView.extend({
        tagName: 'li',
        template: '#room',
        events: {
            'click a': 'chooseRoom'
        },
        chooseRoom: function (e) {
            e.preventDefault();
            Backbone.history.navigate(this.model.url(), { trigger: true });
        }
    });

    Room.CollectionView = Backbone.Marionette.CollectionView.extend({
        tagName: 'ul',
        itemView: RoomView
    });

    Room.CreateRoomView = Backbone.Marionette.ItemView.extend({
        tagName: 'form',
        template: '#form',
        model: new Backbone.Model({ placeholder: 'room name', button: 'Join' }),
        events: {
            'click button': 'createRoom'
        },
        ui: {
            'input': 'input'
        },
        createRoom: function (e) {
            e.preventDefault();
            var name = this.ui.input.val().toLowerCase().replace(/ /g, '_').replace(/\W/g, ''),
                room = this.collection.getRoom(name);
            Backbone.history.navigate(room.url(), { trigger: true });
            return false;
        }
    });
});
