// Notice, less code in the views, but perhaps more code in the
// router/controller. Good? Bad?

App.module('Router', function () {
    function Controller () {
        this.rooms = new App.Room.Collection();
        this.users = new App.User.Collection();
    }

    Controller.prototype.index = function () {
        this.showUsersAndRooms();
        this.showLogin().on('user-added', function () {
            App.layout.controls.show(new App.Room.CreateRoomView({ 
                collection: this.rooms 
            }));
        }, this);
    };

    Controller.prototype.room = function (room) {
        this.showUsersAndRooms();
        App.room = this.rooms.getRoom(room);
        if (!App.name) {
            this.showLogin().on('user-added', this.showChat.bind(this));
        } else {
            this.showChat();
        }
    };

    Controller.prototype.user = function (user) {
        this.showUsersAndRooms();

        this.users.addUser(user, function (joined) {
            if (joined) {
                App.layout.controls.show(new App.Room.CreateRoomView({ collection: this.rooms }));
            } else {
                Backbone.history.navigate('', { trigger: true });
            }
        }, this);
    };

    Controller.prototype.room_user = function (room, user) {
        this.showUsersAndRooms();
        App.room = this.rooms.getRoom(room);

        this.users.addUser(user, function (joined) {
            if (joined) {
                this.showChat(room);
            } else {
                Backbone.history.navigate(App.room.url(), { trigger: true });
            }
        }, this);
    };

    Controller.prototype.user_room = function (user, room) {
        this.room_user(room, user);
    };

    Controller.prototype.showUsersAndRooms = function () {
        App.layout.users.show(new App.User.CollectionView({ collection: this.users }));
        App.layout.rooms.show(new App.Room.CollectionView({ collection: this.rooms }));
    };
    Controller.prototype.showLogin = function () {
        var loginView = new App.User.LogInView({
            collection: this.users
        });
        App.layout.controls.show(loginView);
        return loginView;
    };
    Controller.prototype.showChat = function () {
        App.layout.controls.show(new App.Chat.CreateMessageView());
        App.layout.conversation.show(new App.Chat.CollectionView({
            collection: new App.Chat.Collection([], { room: App.room.get('name') })
        }));
    };

    var Router = Backbone.Marionette.AppRouter.extend({
        initialize: function (options) {
            App.layout = new App.Layout.Layout();
            App.main.show(App.layout);
        },
        appRoutes: {
            '': 'index',
            'room/:room': 'room',
            'user/:user': 'user',
            'room/:room/user/:user': 'room_user',
            'user/:user/room/:room': 'user_room'
        }
    });

    App.addInitializer(function () {
        var r = new Router({
            controller: new Controller()    
        });
    });
});
