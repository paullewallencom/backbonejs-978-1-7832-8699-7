/*jslint sloppy: true, nomen: true, regexp: true, browser: true, es5: true */
/*globals Backbone, USER, $, _, console, FormData */
/*

server - user accounts

+ a user logs in
a user can follow other users
+ a user can post photos, which upload by ajax.
a user can view their photos
a user can view the photos of those they follow.
a user can comment on photos.


sign up
add photos
follow others
comment on photos
*/

_.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g
};

var Photo = Backbone.Model.extend({
    urlRoot: "/photos",
    sync: function (method, model, options) {
        var opts = {
            url: this.url(),
            success: function (data) {
                if (options.success) {
                    options.success(data);
                }
            }
        };
            
        switch (method) {
        case "create":
            opts.type = "POST";
            opts.data = new FormData();
            opts.data.append("file", model.get('file'));
            opts.data.append("caption", model.get('caption'));
            opts.processData = false;
            opts.contentType = false;
            break;
        default:
            opts.type = "GET";
        }
        return $.ajax(opts);
    }
});

var Photos = Backbone.Collection.extend({
    model: Photo,
    initialize: function (options) {
        if (options.url) {
            this.url = options.url;
        }
    }
});

var User = Backbone.Model.extend({
    url: function () {
        return '/user-' + this.get('id') + '.json';
    }
});
var Users = Backbone.Collection.extend({
    model: User,
    url: '/users.json'
});

var Comment = Backbone.Model.extend();
var Comments = Backbone.Collection.extend({
    model: Comment,
    initialize: function (options) {
        this.photo = options.photo;
    },
    url: function () {
        return this.photo.url() + '/comments';
    }
});

var Follow = Backbone.Model.extend({
    urlRoot: '/follow',
    delete: function (options) {
        return $.ajax({
            type: "DELETE",
            url: this.urlRoot + "/" + this.get("userId")
        });
    }
});

var UserListItemView = Backbone.View.extend({
    tagName: "li",
    template: _.template($("#userListItemView").html()),
    events: {
        'click #follow': 'follow',
        'click #unfollow': 'unfollow'
    },
    update: function () {
        if (USER.following.indexOf(this.model.get("id")) === -1) {
            this.$("#unfollow").remove();
            this.$el.append(" <button id='follow'> Follow </button>");
        } else {
            this.$("#follow").remove();
            this.$el.append(" <button id='unfollow'> Unfollow </button>");
        }
    },
    render: function () {
        this.el.innerHTML = this.template(this.model.toJSON());
        if (USER.username === this.model.get("username")) {
            this.$el.append(" (me)");
        } else {
            this.update();
        }
        return this;
    },
    follow: function (evt) {
        console.log("follow");
        var thiz = this,
            f = new Follow({ userId: thiz.model.id });
        f.save().then(function (user) {
            USER.following = user.following;
            thiz.update();
        });
    },
    unfollow: function (evt) {
        console.log("unfollow");
        var thiz = this,
            f = new Follow({ userId: thiz.model.id });
        f.delete().then(function (user) {
            USER.following = user.following;
            thiz.update();
        });
    }
});

var UserListView = Backbone.View.extend({
    tagName: "ul",
    render: function () {
        this.collection.forEach(function (model) {
            this.$el.append((new UserListItemView({ model: model })).render().el);
        }, this);
        return this;
    }
});

var PhotosView = Backbone.View.extend({
    tagName: 'ul',
    template: _.template($("#photoView").html()),
    initialize: function () {
        this.collection.on("add", this.addPhoto, this);
    },
    render: function () {
        this.collection.forEach(this.addPhoto, this);
        return this;
    },
    addPhoto: function (photo) {
        this.$el.append(this.template(photo.toJSON()));
    }
});

var CommentView = Backbone.View.extend({
    tagName: "li",
    template: _.template($("#commentView").html()),
    render: function () {
        this.el.innerHTML = this.template(this.model.toJSON());
        return this;
    }
});

var PhotoPageView = Backbone.View.extend({
    template: _.template($("#photoPageView").html()),
    initialize: function () {
        this.collection.on("add", this.showComment, this);
    },
    events: {
        'click button': 'addComment'
    },
    render: function () {
        var model = this.model.toJSON();
        model.user = this.model.user;
        this.el.innerHTML = this.template(model);
        this.collection.forEach(this.showComment.bind(this));
        return this;
    },
    addComment: function () {
        var textarea = this.$("#commentText"),
            text = textarea.val(),
            comment = {
                text: text,
                photoId: this.model.get("id"),
                username: USER.username
            };
        textarea.val("");
        this.collection.create(comment);
    },
    showComment: function (comment) {
        var commentView = new CommentView({ model: comment });
        this.$("ul").append(commentView.render().el);
    }
});

var AddPhotoView = Backbone.View.extend({
    initialize: function (options) {
        this.photos = options.photos;
    },
    template: _.template($("#addPhotoView").html()),
    events: {
        "click button": "uploadFile"
    },
    render: function () {
        this.el.innerHTML = this.template();
        return this;
    },
    uploadFile: function (evt) {
        evt.preventDefault();
        var photo = new Photo({
            file: $("#imageUpload")[0].files[0],
            caption: $("#imageCaption").val()
        });
        //this.$("form").reset();
        this.photos.create(photo, { wait: true });
    }
});

var NavView = Backbone.View.extend({
    template: _.template($("#navView").html()),
    render: function () {
        this.el.innerHTML = this.template(this.model);
        return this;
    }
});

var UserView = Backbone.View.extend({
    render: function () {
        console.log(this.model);
        var ul;
        this.el.innerHTML = "<h1>" + this.model.username + "</h1><ul></ul>";
        ul = this.$("ul");
        this.collection.forEach(function (photo) {
            ul.append(new PhotoView({ model: photo }).render().el);
        });
        return this;
    }
});

var AppRouter = Backbone.Router.extend({
    initialize: function (options) {
        this.main = options.main;
        this.userPhotos = options.userPhotos;
        this.followingPhotos = options.followingPhotos;
        this.navView = new NavView({ model: USER });
    },
    routes: {
        '': 'index',
        'upload': 'upload',
        'photo/:id': 'showPhoto',
        'users': 'showUsers',
        'users/:id': 'showUser',
        'following': 'following'
    },
    index: function () {
        var photosView = new PhotosView({ collection: this.followingPhotos });
        this.main.html(this.navView.render().el);
        this.main.append(photosView.render().el);
    },
    upload: function () {
        var apv = new AddPhotoView({ photos: this.userPhotos }),
            photosView = new PhotosView({ collection: this.userPhotos });
        
        this.main.html(this.navView.render().el);
        this.main.append(apv.render().el);
        this.main.append(photosView.render().el);
    },
    showPhoto: function (id) {
        window.THIS = this;
        var thiz = this,
            photo = new Photo({ id : parseInt(id, 10) });
        
        photo.fetch().then(function () {
            var comments = new Comments({ photo: photo }),
                photoView = new PhotoPageView({ model: photo, collection: comments });
            
            comments.fetch().then(function () {
                thiz.main.html(thiz.navView.render().el);
                thiz.main.append(photoView.render().el);
            });
        });
    },
    showUsers: function () {
        var users = new Users(),
            thiz  = this;
        this.main.html(this.navView.render().el);
        users.fetch().then(function () {
            thiz.main.append(new UserListView({ collection: users }).render().el);
        });
    },
    showUser: function (id) {
        var thiz = this,
            user;
        
        id = parseInt(id, 10);
        
        function render() {
            var photos = new Photos({ url: "/photos/user/" + user.id }),
                userView = new UserView({ model: user.toJSON(), collection: photos });
                
            thiz.main.html(thiz.navView.render().el);
            photos.fetch().then(function () {
                thiz.main.append(userView.render().el);
            });
        }
        
        if (id === USER.id) {
            user = new User(USER);
            render();
        } else {
            user = new User({ id: id });
            // ugly, but opportunity to talk about how refreshes, changed urls, and the necessary data work.
            user.fetch().then(render);
        }
    },
    following: function () {
        var thiz = this,
            photos = new Photos({ url: '/photos/following' });
        photos.fetch().then(function () {
            var pv = new PhotosView({ collection: photos });
            thiz.main.html(pv.render().el);
        });
    }
});
