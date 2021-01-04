/*jslint nomen: true, sloppy: true, regexp: true */
/*globals Backbone, $, _, console, Event, moment, JST */

var EventView = Backbone.View.extend({
    tagName: "tr",
    template: JST.event,
    events: {
        "click .delete" : "destroy",
        "click .edit"   : "edit"
    },
    initialize: function (options) {
        this.nav = options.nav;
        this.listenTo(this.model, "remove", this.remove);
        this.listenTo(this.model, "change", this.render);
    },
    render: function () {
        var attrs = this.model.toJSON(),
            date = moment(attrs.date),
            diff = date.unix() - moment().unix();
        
        attrs.date = date.calendar();
        attrs.createdOn = moment(attrs.createdOn).fromNow();
        this.el.innerHTML = this.template(attrs);
        
        if (diff < 0) {
            this.el.className = "danger";
        } else if (diff < 172800) { // next 2 days
            this.el.className = "warning";
        } else if (diff < 604800) { // next 7 days
            this.el.className = "success";
        }
        
        return this;
    },
    remove: function () {
        this.$el.fadeOut(Backbone.View.prototype.remove.bind(this));
        return false;
    },
    destroy: function (evt) {
        evt.preventDefault();
        this.model.destroy();
        this.remove();
    },
    edit: function (evt) {
        evt.preventDefault();
        this.nav("/edit/" + this.model.get("id"), { trigger: true });
    }
});

var EventsView = Backbone.View.extend({
    tagName: "table",
    className: "table",
    template: JST.events,
    events: {
        'click th[data-field]': 'sort'
    },
    initialize: function (options) {
        this.nav = options.nav;
        this.children = {};
        this.listenTo(this.collection, 'add', this.addRow);
        this.listenTo(this.collection, 'sort', this.renderRows);
        this.collection.refresh();
    },
    render: function () {
        this.el.innerHTML = this.template();
        var target = this.$("th[data-field='" + this.collection.comparator + "']");
        this.fixSortIcons(target.get(0), "asc");
        this.renderRows();
        return this;
    },
    addRow: function (event) {
        if (!this.children[event.id]) {
            this.children[event.id] = new EventView({
                model: event,
                nav: this.nav
            }).render();
        }
        
        this.$("tbody").append(this.children[event.id].el);
    },
    renderRows: function () {
        this.collection.forEach(this.addRow, this);
    },
    fixSortIcons: function (target, dir) {
        var icon = 'glyphicon glyphicon-arrow-' + (dir === 'asc' ? 'down' : 'up');
        this.$("th i").remove();
        target.setAttribute("data-direction", dir);
        $("<i>").addClass(icon).appendTo(target);
    },
    sort: function (evt) {
        var target = evt.currentTarget,
            c = this.collection;
        
        c.comparator = target.getAttribute("data-field");
        
        if (target.getAttribute("data-direction") === "asc") {
            c.reverse();
            this.fixSortIcons(target, "desc");
        } else {
            c.sort();
            this.fixSortIcons(target, "asc");
        }
    }
});

var ControlsView = Backbone.View.extend({
    tagName: "ul",
    className: "nav nav-pills",
    template: JST.controls,
    initialize: function (options) {
        this.nav = options.nav;
    },
    events: {
        'click a[href="/create"]': 'create'
    },
    render: function () {
        this.el.innerHTML = this.template();
        return this;
    },
    create: function (evt) {
        evt.preventDefault();
        this.nav("create", { trigger: true });
    }
});

var ModifyEventView = Backbone.View.extend({
    className: "modal fade",
    template: JST.modifyEvent,
    events: {
        "click .close": "close",
        "click .modify": "modify"
    },
    initialize: function (options) {
        this.nav = options.nav;
        this.$el.on("hidden.bs.modal", this.hide.bind(this));
    },
    hide: function () {
        this.remove();
        this.nav('/');
    },
    close: function (evt) {
        evt.preventDefault();
        this.$el.modal("hide");
    },
    render: function (model) {
        var data = this.model.toJSON();
        data.heading = this.heading;
        data.btnText = this.btnText;
        this.el.innerHTML = this.template(data);
        this.$el.modal("show");  
        return this;
    },
    modify: function (evt) {
        evt.preventDefault();
        var a = {
            title: this.$("#title").val(),
            details: this.$("#details").val(),
            date: this.$("#date").val()
        };
        this.$el.modal("hide");
        this.save(a);
        return false;
    }
});

var CreateEventView = ModifyEventView.extend({
    heading: "Create New Event",
    btnText: "Create",
    initialize: function (options) {
        ModifyEventView.prototype.initialize.call(this, options);
        this.model = new Event();
    },
    save: function (e) {
        this.collection.create(e, { wait: true });
    }
});

var EditEventView = ModifyEventView.extend({
    heading: "Edit Event",
    btnText: "Update",
    save: function (e) {
        this.model.save(e);
    }
});