
    var URIModel = Backbone.Model.extend({

        validate: function(){

            var expression = /^(?:([a-z0-9+.-]+:\/\/)((?:(?:[a-z0-9-._~!$&'()*+,;=:]|%[0-9A-F]{2})*)@)?((?:[a-z0-9-._~!$&'()*+,;=]|%[0-9A-F]{2})*)(:(?:\d*))?(\/(?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*)?|([a-z0-9+.-]+:)(\/?(?:[a-z0-9-._~!$&'()*+,;=:@]|%[0-9A-F]{2})+(?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*)?)(\?(?:[a-z0-9-._~!$&'()*+,;=:\/?@]|%[0-9A-F]{2})*)?(#(?:[a-z0-9-._~!$&'()*+,;=:\/?@]|%[0-9A-F]{2})*)?$/i;
            var regex = new RegExp(expression);

            if (!this.get("item").match(regex)) {
                return "Invalid URI";
            }
        }

    });


    /*
    * Backbone JS Reusable ListWidget
    *  Options
    * {
    *   collection: Backbone JS Collection
    *   type: ('uri'|'default')
    *   autocomplete: ['item1','item2'] List of auto complete items
    * }
    *
     */
    var ListWidgetView = Backbone.View.extend({

        tagName: "table",

        childView: Backbone.View.extend({

            tagName: 'tr',

            events:{
                "click .icon-minus-sign":function () {
                    this.$el.tooltip('destroy');
                    this.model.destroy();
                }
            },

            initialize:function () {

                if (!this.template) {
                    this.template = _.template($('#tmpl-list-widget-child').html());
                }

                this.model.bind('destroy', this.remove, this);

            },

            render:function () {
                this.$el.html(this.template(this.model.toJSON()));

                if (this.model.get('item').length > 27) {
                    this.$el.tooltip({title:this.model.get('item')});
                }
                return this;
            }
        }),

        events:{
            "click button":"addItem",
            "keypress input":function (e) {
                if (e.which == 13) {
                    this.addItem();
                    e.preventDefault();
                    $("input", this.$el).focus();
                }
            }
        },

        initialize:function () {

            if (!this.template) {
                this.template = _.template($('#tmpl-list-widget').html());
            }

            this.$el.addClass("table table-condensed table-hover span4");
            this.collection.bind('add', this.render, this);

        },

        addItem:function() {
            var input_value = $("input", this.el).val().trim();

            var model;

            if (this.options.type == 'uri') {
                model = new URIModel({item:input_value});
            } else {
                model = new Backbone.Model({item:input_value});
                model.validate = function() { if(!this.get("item")) return "value can't be null"; };
            }

            // if it's valid and doesn't already exist
            if (model.isValid() && this.collection.where({item: input_value}).length < 1) {
                this.collection.add(model);
            } else {
                // else add a visual error indicator
                $(".control-group", this.el).addClass('error');
            }
        },

        render:function (eventName) {

            this.$el.html(this.template({placeholder:this.options.placeholder}));

            // bind autocomplete options
            if (this.options.autocomplete) {
                $('input', this.$el).typeahead({source:this.options.autocomplete});
            }

            _self = this;

            _.each(this.collection.models, function (model) {
                var el = new this.childView({model:model}).render().el;
                $("tbody", _self.el).append(el);
            }, this);

            return this;
        }

    });


    var ClientModel = Backbone.Model.extend({

        idAttribute: "id",

        initialize: function () {

            // bind validation errors to dom elements
            // this will display form elements in red if they are not valid
            this.bind('error', function(model, errs) {
                _.map(errs, function (val, elID) {
                    $('#' + elID).addClass('error');
                });
            });

        },

        validate:{
            clientName:{
               /* required:true,
                pattern:/^[\w ]+$/,
                minlength:3,*/
                maxlength:100
            },
            clientDescription:{
                /*required:true,
                pattern:/^[\w ]+$/,
                minlength:3,*/
                maxlength:200
            }
        },


        // We can pass it default values.
        defaults:{
            id:null,
            idTokenValiditySeconds: 600,
            applicationName:"",
            clientSecret:"",
            registeredRedirectUri:[],
            authorizedGrantTypes:["authorization_code"],
            scope:["openid"],
            authorities:[],
            clientDescription:"",
            logoUrl:"",
            clientId:"",
            allowRefresh:false,
            accessTokenValiditySeconds: 3600,
            refreshTokenValiditySeconds: 604800,
            displayClientSecret: false,
            generateClientSecret: false,
            requireClientSecret: true
        },

        urlRoot:"api/clients"

    });

    var ClientCollection = Backbone.Collection.extend({

        initialize: function() {
            this.fetch();
        },

        model:ClientModel,
        url:"api/clients"
    });



    var BreadCrumbView = Backbone.View.extend({

        tagName: 'ul',

        initialize:function () {

            if (!this.template) {
                this.template = _.template($('#tmpl-breadcrumbs').html());
            }

            this.$el.addClass('breadcrumb');

            this.collection.bind('add', this.render, this);
        },

        render:function () {

            this.$el.empty();
            var parent = this;

            // go through each of the breadcrumb models
            _.each(this.collection.models, function (crumb, index) {

                // if it's the last index in the crumbs then render the link inactive
                if (index == parent.collection.size() - 1) {
                    crumb.set({active:true}, {silent:true});
                } else {
                    crumb.set({active:false}, {silent:true});
                }

                this.$el.append(this.template(crumb.toJSON()));
            }, this);

            $('#breadcrumbs').html(this.el);
        }
    });


    var ClientView = Backbone.View.extend({

        tagName: 'tr',

        initialize:function () {

            if (!this.template) {
                this.template = _.template($('#tmpl-client').html());
            }

            this.model.bind('change', this.render, this);
        },

        render:function (eventName) {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        events:{
            "click .btn-edit":"editClient",
            "click .btn-delete":"deleteClient"
        },

        editClient:function () {
            app.navigate('client/' + this.model.id, {trigger: true});
        },

        deleteClient:function () {

            if (confirm("Are you sure sure you would like to delete this client?")) {
                var self = this;

                this.model.destroy({
                    success:function () {
                        self.$el.fadeTo("fast", 0.00, function () { //fade
                            $(this).slideUp("fast", function () { //slide up
                                $(this).remove(); //then remove from the DOM
                            });
                        });
                    }
                });

                app.clientListView.delegateEvents();
            }

            return false;
        },

        close:function () {
            $(this.el).unbind();
            $(this.el).empty();
        }
    });

    var ClientListView = Backbone.View.extend({

        tagName: 'span',

        initialize:function () {
            this.model.bind("reset", this.render, this);
        },

        events:{
            "click .btn-primary":"newClient"
        },

        newClient:function () {
            this.remove();
            app.navigate('client/new', {trigger: true});
        },

        render:function (eventName) {

            // append and render table structure
            $(this.el).html($('#tmpl-client-table').html());

            _.each(this.model.models, function (client) {
                $("#client-table",this.el).append(new ClientView({model:client}).render().el);
            }, this);

            return this;
        }
    });

    var ClientFormView = Backbone.View.extend({

        tagName:"span",

        initialize:function () {

            if (!this.template) {
                this.template = _.template($('#tmpl-client-form').html());
            }

            this.registeredRedirectUriCollection = new Backbone.Collection();
            this.scopeCollection = new Backbone.Collection();
        },

        events:{
            "click .btn-primary":"saveClient",
            "click #allowRefresh" : "toggleRefreshTokenTimeout",
            "click #disableAccessTokenTimeout" : function(){ $("#access-token-timeout-seconds", this.$el).prop('disabled',!$("#access-token-timeout-seconds", this.$el).prop('disabled')); },
            "click #disableIDTokenTimeout" : function(){ $("#id-token-timeout-seconds", this.$el).prop('disabled',!$("#id-token-timeout-seconds", this.$el).prop('disabled')); },
            "click #disableRefreshTokenTimeout" : function(){ $("#refresh-token-timeout-seconds", this.$el).prop('disabled',!$("#refresh-token-timeout-seconds", this.$el).prop('disabled')); },
            "click .btn-cancel": function() { window.history.back(); return false; },
            "change #requireClientSecret":"toggleRequireClientSecret",
            "change #displayClientSecret":"toggleDisplayClientSecret",
            "change #generateClientSecret":"toggleGenerateClientSecret",
            "change #logoUrl input":"previewLogo"
        },

        toggleRefreshTokenTimeout:function () {
            $("#refreshTokenValiditySeconds", this.$el).toggle();
        },
        
        previewLogo:function(event) {
        	if ($('#logoUrl input').val()) {
        		$('#logoPreview').empty();
        		$('#logoPreview').attr('src', $('#logoUrl input').val());
        	} else {
        		//$('#logoBlock').hide();
        	}
        },

        /**
         * Set up the form based on the current state of the requireClientSecret checkbox parameter
         * @param event
         */
        toggleRequireClientSecret:function(event) {
        	
        	if ($('#requireClientSecret input').is(':checked')) {
        		// client secret is required, show all the bits
        		$('#clientSecretPanel').show();
        		// this function sets up the display portions
        		this.toggleGenerateClientSecret();
        	} else {
        		// no client secret, hide all the bits
        		$('#clientSecretPanel').hide();        		
        	}
        },
        
        /**
         * Set up the form based on the "Generate" checkbox
         * @param event
         */
        toggleGenerateClientSecret:function(event) {

        	if ($('#generateClientSecret input').is(':checked')) {
        		// show the "generated" block, hide the "display" checkbox
        		$('#displayClientSecret').hide();
        		$('#clientSecret').hide();
        		$('#clientSecretGenerated').show();
        		$('#clientSecretHidden').hide();
        	} else {
        		// show the display checkbox, fall back to the "display" logic
        		$('#displayClientSecret').show();
        		this.toggleDisplayClientSecret(event);
        	}
        },
        
        /**
         * Handle whether or not to display the client secret
         * @param event
         */
        toggleDisplayClientSecret:function(event) {
        	
        	if ($('#displayClientSecret input').is(':checked')) {
        		// want to display it
        		$('#clientSecret').show();
        		$('#clientSecretHidden').hide();
        		$('#clientSecretGenerated').hide();
        	} else {
        		// want to hide it
        		$('#clientSecret').hide();
        		$('#clientSecretHidden').show();
        		$('#clientSecretGenerated').hide();
        	}
        },

        getFormTokenValue:function(value) {
            if (value == "") return null;
            else return value;
        },
        
        saveClient:function (event) {

            $('.control-group').removeClass('error');

            // build the grant type object
            var authorizedGrantTypes = [];
            $.each(["authorization_code","client_credentials","password","implicit"],function(index,type) {
                if ($('#authorizedGrantTypes-' + type).is(':checked')) {
                    authorizedGrantTypes.push(type);
                }
            });

            var requireClientSecret = $('#requireClientSecret input').is(':checked');
            var generateClientSecret = $('#generateClientSecret input').is(':checked');
            var clientSecret = null;
            
            if (requireClientSecret && !generateClientSecret) {
            	// if it's required but we're not generating it, send the value
            	clientSecret = $('#clientSecret').val();
            }

            var accessTokenValiditySeconds = null;
            if (!$('disableAccessTokenTimeout').is(':checked')) {
            	accessTokenValiditySeconds = this.getFormTokenValue($('#accessTokenValiditySeconds input[type=text]').val()); 
            }
            
            var idTokenValiditySeconds = null;
            if (!$('disableIDTokenTimeout').is(':checked')) {
            	idTokenValiditySeconds = this.getFormTokenValue($('#idTokenValiditySeconds input[type=text]').val()); 
            }
            
            var refreshTokenValiditySeconds = null;
            if ($('#allowRefresh').is(':checked') && !$('disableRefreshTokenTimeout').is(':checked')) {
            	refreshTokenValiditySeconds = this.getFormTokenValue($('#refreshTokenValiditySeconds input[type=text]').val()); 
            }
            
            var valid = this.model.set({
                applicationName:$('#applicationName input').val(),
                clientId:$('#clientId input').val(),
                clientSecret: clientSecret,
                generateClientSecret:generateClientSecret,
                registeredRedirectUri: this.registeredRedirectUriCollection.pluck("item"),
                clientDescription:$('#clientDescription textarea').val(),
                logoUrl:$('#logoUrl input').val(),
                allowRefresh:$('#allowRefresh').is(':checked'),
                authorizedGrantTypes: authorizedGrantTypes,
                accessTokenValiditySeconds: accessTokenValiditySeconds,
                refreshTokenValiditySeconds: refreshTokenValiditySeconds,
                idTokenValiditySeconds: idTokenValiditySeconds,
                scope: this.scopeCollection.pluck("item")
            });

            if (this.model.get("allowRefresh") == false) {
                this.model.set("refreshTokenValiditySeconds",null);
            }

            if ($('#disableIDTokenTimeout').is(':checked')) {
                 this.model.set("idTokenValiditySeconds",null);
            }

            if ($('#disableAccessTokenTimeout').is(':checked')) {
                this.model.set("accessTokenValiditySeconds",null);
            }

            if ($('#disableRefreshTokenTimeout').is(':checked')) {
                this.model.set("refreshTokenValiditySeconds",null);
            }

            if (valid) {

                var _self = this;
                this.model.save(this.model, {
                    success:function () {
                        app.clientList.add(_self.model);
                        app.navigate('clients', {trigger:true});
                    },
                    error:function (model,resp) {
                        console.error("Oops! The object didn't save correctly.",resp);
                    }
                });
            }

            return false;
        },

        render:function (eventName) {

            $(this.el).html(this.template(this.model.toJSON()));

            
            var _self = this;

            // build and bind registered redirect URI collection and view
            _.each(this.model.get("registeredRedirectUri"), function (registeredRedirectUri) {
                _self.registeredRedirectUriCollection.add(new URIModel({item:registeredRedirectUri}));
            });

            $("#registeredRedirectUri .controls",this.el).html(new ListWidgetView({type:'uri', placeholder: 'http://',
                                                                                    collection: this.registeredRedirectUriCollection}).render().el);

            _self = this;
            // build and bind scopes
            _.each(this.model.get("scope"), function (scope) {
                _self.scopeCollection.add(new Backbone.Model({item:scope}));
            });

            $("#scope .controls",this.el).html(new ListWidgetView({placeholder: 'new scope here'
                , autocomplete: _.uniq(_.flatten(app.clientList.pluck("scope")))
                , collection: this.scopeCollection}).render().el);

            if (!this.model.get("allowRefresh")) {
                $("#refreshTokenValiditySeconds", this.$el).hide();
            }

            if (this.model.get("accessTokenValiditySeconds") == null) {
                $("#access-token-timeout-seconds", this.$el).prop('disabled',true);
            }

            if (this.model.get("refreshTokenValiditySeconds") == null) {
                $("#refresh-token-timeout-seconds", this.$el).prop('disabled',true);
            }

            if (this.model.get("idTokenValiditySeconds") == null) {
                $("#id-token-timeout-seconds", this.$el).prop('disabled',true);
            }


            return this;
        },
        
        postRender:function() {
            this.toggleRequireClientSecret();
            this.previewLogo();
        }
    });




    // Router
    var AppRouter = Backbone.Router.extend({

        routes:{
            "clients":"listClients",
            "client/new":"newClient",
            "client/:id":"editClient",
            "white_list":"whiteList",
            '*path':  'listClients'
        },

        initialize:function () {

            this.clientList = new ClientCollection();

            this.clientListView = new ClientListView({model:this.clientList});

            this.breadCrumbView = new BreadCrumbView({
                collection:new Backbone.Collection()
            });

            this.breadCrumbView.render();

            this.startAfter([this.clientList]);

        },

        startAfter:function (collections) {
            // Start history when required collections are loaded
            var start = _.after(collections.length, _.once(function () {
            	var baseUrl = $.url($('base').attr('href'));
            	
                Backbone.history.start({pushState: true, root: baseUrl.attr('relative') + 'admin/manage/'});

            }));
            _.each(collections, function (collection) {
                collection.bind('reset', start, Backbone.history);
            });
        },

        listClients:function () {

            this.breadCrumbView.collection.reset();
            this.breadCrumbView.collection.add([
                {text:"Home", href:""},
                {text:"Manage Clients", href:"admin/manage/#clients"}
            ]);

            $('#content').html(this.clientListView.render().el);
            this.clientListView.delegateEvents();

        },

        newClient:function() {

            this.breadCrumbView.collection.reset();
            this.breadCrumbView.collection.add([
                {text:"Home", href:""},
                {text:"Manage Clients", href:"admin/manage/#clients"},
                {text:"New", href:""}
            ]);

        	var client = new ClientModel();
        	
        	// set up this new client to require a secret and have us autogenerate one
        	client.set({
        		requireClientSecret:true, 
        		generateClientSecret:true,
        		displayClientSecret:false
        	}, { silent: true });
        	
            this.clientFormView = new ClientFormView({model:client});
            $('#content').html(this.clientFormView.render().el);
            this.clientFormView.postRender(); // set up the form for the given model data
        },

        editClient:function(id) {

            this.breadCrumbView.collection.reset();
            this.breadCrumbView.collection.add([
                {text:"Home", href:""},
                {text:"Manage Clients", href:"admin/manage/#clients"},
                {text:"Edit", href:"admin/manage/#client/" + id}
            ]);

            var client = this.clientList.get(id);

            if (client.get("clientSecret") == null) {
            	client.set({
            		requireClientSecret:false
            	}, { silent: true });
            }
            
        	client.set({
        		generateClientSecret:false,
        		displayClientSecret:false
        	}, { silent: true });
            
            this.clientFormView = new ClientFormView({model:client});
            $('#content').html(this.clientFormView.render().el);
            this.clientFormView.postRender(); // set up the form for the given model data
        },

        whiteList:function () {
            $('#content').html(this.whiteListView.render().el);
        }


    });

    // holds the global app.
    // this gets init after the templates load
    var app = null;

    // main
    $(function () {

        jQuery.ajaxSetup({async:false});

        var _load = function (templates) {
            $('body').append(templates);
        };

        // load templates and append them to the body
        $.get('resources/template/admin.html', _load);

        jQuery.ajaxSetup({async:true});
        app = new AppRouter();

        // grab and re-map all hash-based URLs on the site to go through the router
        $('a[href*="#"]').on('click', function(event) {
        	event.preventDefault();
        	app.navigate(this.hash.slice(1), {trigger: true});
        });
        
    });


