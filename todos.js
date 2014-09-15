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
				remindDate: '',
				color: '',
				note: '',
				// id: '',
				parentId: '',
				curParentId: '',
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
		done: function(parentId) {
			parentId = parentId || '';
			return this.where({done: true, parentId: parentId});
		},

		// Filter down the list to only todo items that are still not finished.
		remaining: function(parentId) {
			parentId = parentId || '';
			return this.where({done: false, parentId: parentId});
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
			"click a.btn-destroy" : "clear",
			"keypress .edit"  : "updateOnEnter",
			"blur .edit"      : "close",
			"click .btn-note": "showNote",
			"keypress .note-edit": "updateNote",
			"blur .note-edit": "closeNote",
			"click .btn-change-color": "showColor",
			"click .color-box a": "changeColor",
			"click .btn-clock": "showClock",
			"click .modal-close, .btn-cancel": "hideModal",
			"click .btn-submit": "subForm"
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
			// console.log(Todos, this.model.toJSON() , 'model')

			// reset localStorage id
			this.model.set({id: this.model.id});
			// this.model.set({curParentId: })


			this.$el.html(this.template(this.model.toJSON()));
			this.$el.toggleClass('done', this.model.get('done'));
			this.input = this.$('.edit');

			this.setColor();
			this.setRemind();

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
		},

		changeColor: function(e){
			var color = $(e.target).data('color'),
				box = this.$el.find('.color-box');
			this.model.save({color: color});
			box.hide();
		},
		showColor: function(e){
			// var box = $(e.target).closest('.view').find('.color-box');
			this.$el.find('.color-box').show();
		},
		setColor: function(){
			var box = this.$el.find('.color-box');
			$.each( box.find('.color-span'), function(i, e){
				$(this).addClass($(this).data('color'));
			});
		},

		showNote: function(){
			this.$('.note-box').show();
			this.$('.note-box .note-edit').val( this.$('.note-txt').text() ).toggle();
			this.$('.note-txt').toggle();
		},
		updateNote: function(e){
			if( e.keyCode == 13 ) this.closeNote();
		},
		closeNote: function(){
			var value = this.$('.note-edit').val();
			this.model.save({note: value});
		},

		showClock: function(){
			if( Notify.isSupported ){
				if(Notify.needsPermission){
					Notify.requestPermission();
				}
			}else{
				alert(' your Browser is not support the notification! ');
				return false;
			}

			// $('#todoapp')
			this.$el.append( _.template( $('#clock-modal').html(), this.model.toJSON() ) );
			this.$el.find('.view').hide();

			// set today date if is none;
			// if( this.$el.find('.date-pick').val() === '' ){
			// 	var d = new Date(),	
			// 		val = this.toDateInputValue.call(d) + 'T' + this.checkTime(d.getHours()) + ':' + this.checkTime(d.getMinutes());
			// 	console.log( this.toDateInputValue.call(d) ,val)
			// 	this.$el.find('.date-pick').val( val );
			// }
		},
		hideModal: function(){
			this.$el.find('.view').show();
			$('.modal').remove();
		},
		subForm: function(){
			var val = this.$el.find('#clock-box .date-pick').val();
			
			if( val !== ''){
				this.model.save({remindDate: val});
			}
		},
		setRemind: function(){
			var val = this.$el.find('.btn-clock').data('time'),
				title = this.model.get('title'),
				note = this.model.get('note'),
				d = new Date(),
				curDay = new Date(),
				date, time, timeDur;
			// console.log(val)
			if( val === '' ){
				return false;
			}else{
				date = val.split('T')[0].split('-');
				time = val.split('T')[1].split(':');

				d.setFullYear(date[0], date[1]-1, date[2]);
				d.setHours(time[0], time[1]);
				timeDur = d.getTime() - curDay.getTime();

				var myNotification = new Notify(title, {
					body: note,
					timeout: 3,
					notifyClick: function(){
						console.log('notification is clicked');
					}
				});

				if( timeDur >=0 ){
					var s = setTimeout(function(){
						myNotification.show();
						clearTimeout(s);
					}, timeDur);
				}
				
			}
		},

		toDateInputValue: function() {
		    var local = new Date(this);
		    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
		    return local.toJSON().slice(0,10);
		},
		checkTime: function(i){
			if( i < 10 ){
				i = '0' + i;
			}
			return i;
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
			"click #new-add-tag": "toggleTag",
			"click .go-back": "goBack"
		},

		// At initialization we bind to the relevant events on the `Todos`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting todos that might be saved in *localStorage*.
		initialize: function() {

			this.input = this.$("#new-todo");
			this.allCheckbox = this.$("#toggle-all")[0];

			this.listenTo(Todos, 'add', this.addOne);
			this.listenTo(Todos, 'reset', this.addAll);
			this.listenTo(Todos, 'change', this.render);
			// this.listenTo(Todos, 'all', this.render);

			this.headerTitle = this.$('header h1');
			this.footer = this.$('footer');
			this.main = $('#main');

			this.parentId = this.parentId || '';
			this.tag = this.tag || '';
			// console.log( this.parentId ,' parentId' )

			Todos.fetch();

			// this.headerTitle.html('Todos').removeClass('go-back');
			this.render();

		},

		// Re-rendering the App just means refreshing the statistics -- the rest
		// of the app doesn't change.
		render: function(model) {
			console.log('this is app render', arguments)
			var _self = this;
			var done = Todos.done(this.parentId).length;
			var remaining = Todos.remaining(this.parentId).length;

			if (Todos.length) {
				this.main.show();
				this.footer.show();
				this.footer.html(this.statsTemplate({done: done, remaining: remaining}));
			} else {
				this.main.hide();
				this.footer.hide();
			}

			this.allCheckbox.checked = !remaining;

			$.each(Todos.models, function(i, model){
				if( model.id === _self.parentId ){
					_self.headerTitle.html( model.get('title') ).addClass('go-back');
				}else{
					_self.headerTitle.html('Todos').removeClass('go-back');
				}
				return false;
			});
			// _self.headerTitle.html('Todos').removeClass('go-back');
		},

		// Add a single todo item to the list by creating a view for it, and
		// appending its element to the `<ul>`.
		addOne: function(todo) {
			var parentId = todo.get('parentId'),
				tag = todo.get('tag');
			// todo.id === this.parentId && this.headerTitle.html( todo.get('title') ).addClass('go-back');

			// console.log( todo, todo.toJSON() ,this.parentId)
			// remove un sub child
			if( (this.parentId !== '' && this.parentId !== parentId) 
				|| (this.parentId === '' && parentId !== '') ){
				return false;
			}

			if( this.tag !== '' && this.tag !== tag ){
				return false;
			}

			var view = new TodoView({model: todo});
			this.$("#todo-list").append(view.render().el);	
			// this.render(todo);
		},

		// Add all items in the **Todos** collection at once.
		addAll: function() {
			console.log('this is add all', Todos)
			Todos.each(this.addOne, this);
			this.render();
		},

		// If you hit return in the main input field, create new **Todo** model,
		// persisting it to *localStorage*.
		createOnEnter: function(e) {
			var val = this.input.val(),
				tag = this.$('#tag-box .checked .txt').text() || '',
				d = new Date(),
				date = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
			if (e.keyCode != 13) return;
			if (!val) return;

			// console.log(this.parentId, Todos)
			Todos.create({title: val, tag: tag, date: date, parentId: this.parentId});
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
		},

		goBack: function(){
			location.href = location.href.split('#')[0];
		}
	});
	
	var Router = Backbone.Router.extend({
		routes: {
			'id/:query': 'id',
			'tag/:query': 'tag'
		},
		id: function(id){
			App.parentId = id;

			$("#todo-list").html('');
			// @TODO; not expect way to render
			App.addAll();

			// Todos.fetch();
		},
		tag: function(tag){
			console.log(tag, 'this is tag fn');

			App.tag = tag;

			$('#todo-list').html('');
			App.addAll();
		}
	});

	var App = new AppView;

	var pageRouter = new Router;
	Backbone.history.start();

});