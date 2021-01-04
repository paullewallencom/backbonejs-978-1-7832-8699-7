function t(selector) {
    return _.template($(selector).html() || '');
}

//var ItemView = Backbone.View.extend({
//    initialize: function () {
//        this.init && this.init();
//        this.listenTo(this.model, 'change', this.render);
//    },
//    render: function () {
//        this.el.innerHTML = this.template(this.model.toJSON());
//        this.trigger('rendered');
//        this.onRender && this.onRender();
//        return this;
//    }
//});

var CollectionView = Backbone.View.extend({
    initialize: function () {
        this.init && this.init();
        this.listenTo(this.collection, 'add', this.renderItem);
        this.listenTo(this.collection, 'remove', this.render);
    },
    render: function () {
        this.el.innerHTML = '';
        if (this.collection.length > 0) {
            this.collection.forEach(this.renderItem, this);
        } else {
            var v = new this.itemView({ model: new Backbone.Model() });
            v.el.innerHTML = this.emptyMessage;
            this.el.appendChild(v.el);
        }
        this.trigger('rendered');
        this.onRender && this.onRender();
        return this;
    },
    renderItem: function (model) {
        var v = new this.itemView({ model: model });
        this.el.appendChild(v.render().el);
    },
    removeItem: function (model) {
        console.log(arguments);
    }
});
