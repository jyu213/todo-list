// An example Backbone application contributed by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses a simple
// [LocalStorage adapter](backbone-localstorage.html)
// to persist Backbone models within your browser.

// Load the application once the DOM is ready, using `jQuery.ready`:
$(function(){

	// Todo Model
	// ----------

	// Our basic **Todo** model has `title`, `order`, and `done` attributes.
	var Todo = Backbone.Model.extend({

		// Default attributes for the todo item.
		defaults: function() {
			return {
				title: "empty todo...",
				tag: '',
				date: '',
				order: Todos.nextOrder(),
				done: false
			};
		},

		// Toggle the `done` state of this todo item.
		toggle: function() {
			this.save({done: !this.get("done")});
		}

	});

	// Todo Collection
	// ---------------

	// The collection of todos is backed by *localStorage* instead of a remote
	// server.
	var TodoList = Backbone.Collection.extend({

		// Reference to this collection's model.
		model: Todo,

		// Save all of the todo items under the `"todos-backbone"` namespace.
		localStorage: new Backbone.LocalStorage("todos-backbone"),

		// Filter down the list of all todo items that are finished.
		done: function() {
			return this.where({done: true});
		},

		// Filter down the list to only todo items that are still not finished.
		remaining: function() {
			return this.where({done: false});
		},

		// We keep the Todos in sequential order, despite being saved by unordered
		// GUID in the database. This generates the next order number for new items.
		nextOrder: function() {
			if (!this.length) return 1;
			return this.last().get('order') + 1;
		},

		// Todos are sorted by their original insertion order.
		comparator: 'order'

	});

	// Create our global collection of **Todos**.
	var Todos = new TodoList;

	// Todo Item View
	// --------------

	// The DOM element for a todo item...
	var TodoView = Backbone.View.extend({

		//... is a list tag.
		tagName:  "li",

		// Cache the template function for a single item.
		template: _.template($('#item-template').html()),

		// The DOM events specific to an item.
		events: {
			"click .toggle"   : "toggleDone",
			"dblclick .view"  : "edit",
			"click a.destroy" : "clear",
			"keypress .edit"  : "updateOnEnter",
			"blur .edit"      : "close"
		},

		// The TodoView listens for changes to its model, re-rendering. Since there's
		// a one-to-one correspondence between a **Todo** and a **TodoView** in this
		// app, we set a direct reference on the model for convenience.
		initialize: function() {
			// console.log(this.model)
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'destroy', this.remove);
		},

		// Re-render the titles of the todo item.
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			this.$el.toggleClass('done', this.model.get('done'));
			this.input = this.$('.edit');
			return this;
		},

		// Toggle the `"done"` state of the model.
		toggleDone: function() {
			this.model.toggle();
		},

		// Switch this view into `"editing"` mode, displaying the input field.
		edit: function() {
			this.$el.addClass("editing");
			this.input.focus();
		},

		// Close the `"editing"` mode, saving changes to the todo.
		close: function() {
			var value = this.input.val();
			if (!value) {
				this.clear();
			} else {
				this.model.save({title: value});
				this.$el.removeClass("editing");
			}
		},

		// If you hit `enter`, we're through editing the item.
		updateOnEnter: function(e) {
			if (e.keyCode == 13) this.close();
		},

		// Remove the item, destroy the model.
		clear: function() {
			this.model.destroy();
		}

	});
	
	// Todo tag modal
	var Tag = Backbone.Model.extend({
		defaults: function() {
			return {
				tags: '',
				done: ''  
			};
		},
		toggle: function(){
			this.save({done: !this.get("done")});
		}
	});

	// Todo tag Collection
	var TagList = Backbone.Collection.extend({
		model: Tag,
		localStorage: new Backbone.LocalStorage("todos-backbone-tags"),
		spliceArray: function(name){
			var model = new this.model;

			console.log( model.get('tags'), name)
			var arr = this.model.get('tags') || [];
			console.log(arr,' this is tags list ');

			_.each(arr, function(item){
				console.log(item,arguments, ' this is item')
				if(item === name){
					arr.splice(index, 1);
				}
			});
		},

		done: function() {
			return this.where({done: true});
		},

		remaining: function() {
			return this.where({done: false});
		}
	});
	var Tags = new TagList;

	var TagView = Backbone.View.extend({
		el: '#tag-box',
		template: _.template($('#tag-template').html()),
		events: {
			"click a": "toggleClass",
			"hover a": "toggleDel",
			"keypress #new-tag": "addOne",
			"click .delete": "delete"
		},
		initialize: function() {
			var _self = this;
			// @REVIEW; waiting for u write better way
			Tags.fetch();
			
			this.listenTo(Tags, 'add', this.render);
			this.listenTo(Tags, 'change', this.render); 
		},
		render: function() {
			var _self = this, tags = [];
			Tags.each(function(model){
				tags.push( model.get('tags') );
			});
			_self.$('#tag-list').html( _self.template({tags: tags}) );
			return this;
		},
		toggleDel: function(e){
			var et = (e.nodeName === 'A' ? $(e.target) : $(e.target).closest('a') );
			et.find('.delete').toggle();
		},
		toggleClass: function(e) {
			var et = e.nodeName === 'A' ? $(e.target) : $(e.target).closest('a');
			this.$el.find('a').removeClass('checked');
			et.hasClass('checked') ? et.removeClass('checked') : et.addClass('checked');
		},
		addOne: function(e){
			this.tagInput = this.$('#new-tag');
			var val = this.tagInput.val(), arr, f = true;
			if( e.keyCode != 13 || !val ) return;
			Tags.each(function(model){
				if( model.get('tags') === val ){
					f = false;
					console.log('here')
				}
			});

			f && Tags.create({tags: val});

			this.tagInput.val('');
		},
		delete: function(e){
			var et = $(e.target).closest('a'),
				val = et.find('.txt').text();
				// newTag = Tags.spliceArray(val);
			
			Tags.each(function(model){
				if( model.get('tags') === val ){
					model.destroy();
					et.remove();
				}
			});
		}
		// destroy: function() {
		// 	this.model.destroy();
		// }
	});

	// The Application
	// ---------------

	// Our overall **AppView** is the top-level piece of UI.
	var AppView = Backbone.View.extend({

		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
		el: $("#todoapp"),

		// Our template for the line of statistics at the bottom of the app.
		statsTemplate: _.template($('#stats-template').html()),

		// Delegated events for creating new items, and clearing completed ones.
		events: {
			"keypress #new-todo":  "createOnEnter",
			"click #clear-completed": "clearCompleted",
			"click #toggle-all": "toggleAllComplete",
			"click #new-add-tag": "toggleTag"
		},

		// At initialization we bind to the relevant events on the `Todos`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting todos that might be saved in *localStorage*.
		initialize: function() {

			this.input = this.$("#new-todo");
			this.allCheckbox = this.$("#toggle-all")[0];

			this.listenTo(Todos, 'add', this.addOne);
			this.listenTo(Todos, 'reset', this.addAll);
			this.listenTo(Todos, 'all', this.render);

			this.footer = this.$('footer');
			this.main = $('#main');

			Todos.fetch();

		},

		// Re-rendering the App just means refreshing the statistics -- the rest
		// of the app doesn't change.
		render: function() {
			var done = Todos.done().length;
			var remaining = Todos.remaining().length;

			if (Todos.length) {
				this.main.show();
				this.footer.show();
				this.footer.html(this.statsTemplate({done: done, remaining: remaining}));
			} else {
				this.main.hide();
				this.footer.hide();
			}

			this.allCheckbox.checked = !remaining;
		},

		// Add a single todo item to the list by creating a view for it, and
		// appending its element to the `<ul>`.
		addOne: function(todo) {
			var view = new TodoView({model: todo});
			this.$("#todo-list").append(view.render().el);
		},

		// Add all items in the **Todos** collection at once.
		addAll: function() {
			Todos.each(this.addOne, this);
		},

		// If you hit return in the main input field, create new **Todo** model,
		// persisting it to *localStorage*.
		createOnEnter: function(e) {
			var val = this.input.val(),
				tag = this.$('#tag-box .checked .txt').text() || '';
			if (e.keyCode != 13) return;
			if (!val) return;

			Todos.create({title: val, tag: tag});
			this.input.val('');
		},

		// Clear all done todo items, destroying their models.
		clearCompleted: function() {
			_.invoke(Todos.done(), 'destroy');
			return false;
		},

		toggleAllComplete: function () {
			var done = this.allCheckbox.checked;
			Todos.each(function (todo) { todo.save({'done': done}); });
		},

		toggleTag: function(){
			this.$('#tag-box').toggle('hidden');
			if(!this.tagView){
				this.tagView = new TagView;
				this.tagView.render();
			}
		}
	});

	// Finally, we kick things off by creating the **App**.
	var App = new AppView;

});
