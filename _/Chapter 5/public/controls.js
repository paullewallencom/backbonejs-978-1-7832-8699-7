// Leave this here, but use it as an example of 
// where the structure gets in the way. If we 
// weren't using Marionette, we could simply
// through up an <h1>. Now, we need to write
// several lines to just show an <h1>.

App.module('Controls', function (Controls) {
    Controls.InstructionsView = Backbone.Marionette.ItemView.extend({
        template: _.template('<h1>{{ text }}</h1>')
    });
});
