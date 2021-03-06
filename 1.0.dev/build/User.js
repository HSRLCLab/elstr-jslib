// Create the Namespace for the Framework
if (ELSTR === undefined) {
    var ELSTR = {};
}

/**
 * Die User Klasse regelt den Umgang mit dem Benutzer in der Webapp
 * 
 * Example of the widget/markup
 * 
 * Required for Authentication: 
 * 	<div id="loginHandler">
 *		<span class="login clickable">Anmelden</span>
 *		<span class="logout clickable">Abmelden</span>
 *		<span class="user"></span>
 *		<span class="admin clickable">Admin</span>
 *	</div>
 * 
 * 
 * Optional for Authentication: 
 *  <div id="dialogLogin">
 *		<div class="hd">Login</div>
 *		<div class="bd">
 *			<form name="loginDialogForm" method="POST" action="services/ELSTR_AuthServer">
 *				<div class="filterSetting">
 *				    <label for="username">Username</label><input type="text" name="username" />
 *					</div>
 *					<div class="filterSetting">
 *						<label for="password">Password</label><input type="password" name="password" />
 *					</div>
 *			</form>
 *		</div>
 *	</div>
 *  
 * To use this component the following YUI components ar required YUI
 * components: ["dom","event","datasource","json","dialog"]
 * 
 * @author egli@intelliact.ch
 * @copyright Intelliact AG, 2009
 * @namespace ELSTR
 * @class ELSTR.User
 * @alias ElstrUser
 * @classDescription User handling for Elstr applications
 * @constructor
 */
ELSTR.User = function() {

    // ///////////////////////////////////////////////////////////////
    // Declare all class variables
    var currentUsername,
    isAuth,
    isAdmin,
    resourcesAllowed,
    enterpriseApplicationData,
    datasource,
    loginDialog,
    loginDialogMessageContainer,
    accessDeniedDialog,
    forceAuthentication,
    callbackFunction;

    var YCustomEvent = YAHOO.util.CustomEvent,
    YDom = YAHOO.util.Dom;

    // Member Variabless
    var that = this;

    // ////////////////////////////////////////////////////////////
    // Event Declarations
	
    that.onAfterInitEvent = new YCustomEvent("afterInitEvent", this);
    that.onAfterAuthEvent = new YCustomEvent("afterAuthEvent", this);
    that.onAfterLogoutEvent = new YCustomEvent("afterLogoutEvent", this);
    that.onBeforeLogoutEvent = new YCustomEvent("beforeLogoutEvent", this);
    that.enterpriseApplicationAuthEvent = {};

    // ////////////////////////////////////////////////////////////
    // Public functions

    /**
	 * Initialisiert das Userobject
	 * 
	 * @method init
	 * @param {Boolean}
	 *            authRequired True, if for the app authentication is required
	 * @param {Function}
	 *            fnLoginComplete Callback function that is executed when the
	 *            login ist successfully completed and the user is authenticated
	 * @return {Boolean} True, if the values were valid
	 */
    this.init = function(authRequired, fnLoginComplete) {

        _renderLoginDialog();

        if (YAHOO.lang.isObject(ELSTR.applicationData.user)) {
            currentUsername = ELSTR.applicationData.user.username;
            isAuth = ELSTR.applicationData.user.isAuth;
            isAdmin = ELSTR.applicationData.user.isAdmin;
            resourcesAllowed = ELSTR.applicationData.user.resourcesAllowed;
            enterpriseApplicationData = ELSTR.applicationData.user.enterpriseApplicationData;
			
            ELSTR.applicationData.user = "empty afert reading it to the user object";
        } else {
            currentUsername = "anonymous";
            isAuth = false;
            isAdmin = false;
        }

        _renderLoginHandler();
        _createDatasource();

        if (authRequired && authRequired === true) {
            forceAuthentication = true;

            // It is not allowed to abort the login dialog
            var loginDialogButtons = loginDialog.getButtons();
            loginDialogButtons[1].set("disabled", true);
        } else {
            forceAuthentication = false;
        }

        if (YAHOO.lang.isFunction(fnLoginComplete)) {
            callbackFunction = fnLoginComplete;
        } else {
            // Create empty callback if none or an invalid one is provided
            callbackFunction = function() {
            };
        }

        if (forceAuthentication === true && isAuth === false) {
            that.login();
        }

        that.onAfterInitEvent.fire();

        if (isAuth) {
            that.onAfterAuthEvent.fire();
            callbackFunction();
        }
        return true;
    };

    this.login = function(enterpriseApplication) {
		
        if(YAHOO.lang.isUndefined(enterpriseApplication) || enterpriseApplication == ''){
            loginDialog.enterpriseApplication = '';
        } else {
            if(YAHOO.lang.isUndefined(that.enterpriseApplicationAuthEvent[enterpriseApplication])){
                that.enterpriseApplicationAuthEvent[enterpriseApplication] = new YAHOO.util.CustomEvent("afterAuthEvent_"+enterpriseApplication, this, true, YAHOO.util.CustomEvent.LIST, true);
            }

            loginDialog.enterpriseApplication = enterpriseApplication;
        }
		
        loginDialog.show();
    };

    this.logout = function() {
        _logoutRequest();
    };

    this.openAdminConsole = function() {
        if (isAdmin) {
            if (YAHOO.lang.isUndefined(ELSTR.admin)) {
                // Load the required language Modules first and then load the Admin Module itself
                ELSTR.lang.registerModule('admin',function(){
                    ELSTR.loader('script',
                        'jslib/elstr/' + LIBS.elstrVersion + '/build/Admin.js',
                        function() {
                            ELSTR.admin = new ELSTR.Admin();
                            ELSTR.admin.init();
                            ELSTR.admin.openConsole();
                        });
                });
            } else {

                ELSTR.admin.openConsole();
            }
        }
    };

    /**
	 * Returns the current authentification status
	 * 
	 * @method isAuth
	 * @return {Boolean} The authentification status
	 */
    this.isAuth = function() {
        return isAuth;
    };

    /**
	 * Returns if the user is an admin user
	 * 
	 * @method isAdmin
	 * @return {Boolean} The admin status
	 */
    this.isAdmin = function() {
        return isAdmin;
    };

    /**
	 * Returns if the user has allowed access to a resource
	 * 
	 * @param {string/array}
	 *            resource name of a resource
	 * @method isAdmin
	 * @return {Boolean} The admin status
	 */
    this.resourceAllowed = function(resource) {
        var isAllowed = true;
        var objectLiteralOfResourcesAllowed = {};
        for ( var i = 0; i < resourcesAllowed.length; i++) {
            objectLiteralOfResourcesAllowed[resourcesAllowed[i]] = '';
        }
        if (YAHOO.lang.isArray(resource)) {
            for ( var i = 0, len = resource.length; i < len; i++) {
                if (!(resource[i] in objectLiteralOfResourcesAllowed)) {
                    isAllowed = false;
                }
            }
        } else {
            if (!(resource in objectLiteralOfResourcesAllowed)) {
                isAllowed = false;
            }
        }
        return isAllowed;
    };
	
    /**
	 * Interface for reading enterprise application data
	 * 
	 * @param {string} enterpriseApplication
	 * @param {string} key
	 * @method getApplicationData
	 * @return 
	 */
    this.getEnterpriseApplicationData = function(enterpriseApplication, key) {
        if (YAHOO.lang.isObject(enterpriseApplicationData[enterpriseApplication])){
            var oEnterpriseApplication = enterpriseApplicationData[enterpriseApplication];
            if (!YAHOO.lang.isUndefined(oEnterpriseApplication[key])){
                return oEnterpriseApplication[key];
            }
            else {
                return null;
            }
        } else {
            return null;
        }
    };
	
	
    /**
	 * Shows a moda access denied Panel
	 * 
	 */
    this.showAccessDenied = function(additionalText){
        var handleOtherUser = function() {
            this.hide();
            that.login();
        };

        accessDeniedDialog = new YAHOO.widget.SimpleDialog("accessDeniedDialog", {
            visible : true,
            fixedcenter : true,
            draggable : false,
            close : false,
            modal : true,
            icon: YAHOO.widget.SimpleDialog.ICON_BLOCK,
            buttons : [ {
                text : "Als anderer Benutzer anmelden",
                handler : handleOtherUser
            } ]
        });
        accessDeniedDialog.setHeader("ERROR");
        accessDeniedDialog.setBody("Kein Zugriff auf diese Applikation");
        accessDeniedDialog.render(document.body);
    };


    /**
	 * Return the current username
	 *
	 */
    this.getCurrentUsername = function(){
        return currentUsername;
    };

    this.submitLoginData = function() {
        _handleSubmit();
    }

    // ////////////////////////////////////////////////////////////
    // Private functions

    var _createDatasource = function() {
        datasource = new YAHOO.util.XHRDataSource("services/ELSTR_AuthServer");
        datasource.connMethodPost = true;
        datasource.responseType = YAHOO.util.DataSource.TYPE_JSON;
        datasource.responseSchema = {
            resultsList : "result"
        };
    };

    var _handleSubmit = function() {
        var username = loginDialog.getData().username;
        var password = loginDialog.getData().password;
        var enterpriseApplication = loginDialog.enterpriseApplication;

        _clearPasswordValue();
        // Clear all child nodes of the message container element
        ELSTR.utils.clearChilds(loginDialogMessageContainer);

        _authRequest(username, password, enterpriseApplication);
    };
    var _handleCancel = function() {
        this.cancel();
        _clearPasswordValue();
        // Clear all child nodes of the message container element
        ELSTR.utils.clearChilds(loginDialogMessageContainer);
    };
                
    var _renderLoginDialog = function() {

		

		
        loginDialog = new YAHOO.widget.Dialog("dialogLogin", {
            postmethod : "none",
            visible : false,
            fixedcenter : true,
            draggable : false,
            close : false,
            modal : true,
            buttons : [ {
                text : "<span textid='Login'>"+ELSTR.lang.text('Login')+"</span>",
                handler : _handleSubmit,
                isDefault : true
            }, {
                text : "<span textid='Cancel'>"+ELSTR.lang.text('Cancel')+"</span>",
                handler : _handleCancel
            } ]
        });
        loginDialog.render(document.body);
        loginDialog.enterpriseApplication = '';

        // Add listeners to the Panel
        var enterListener = new YAHOO.util.KeyListener("dialogLogin", {
            ctrl : false,
            keys : 13
        }, {
            fn : _handleSubmit,
            correctScope : true
        });
        enterListener.enable();
		
        loginDialogMessageContainer = document.createElement("div");
        loginDialog.body.appendChild(loginDialogMessageContainer);
        YDom.addClass(loginDialogMessageContainer, "loginDialogMessageContainer");
    };
	

    var _renderLoginHandler = function() {
        // Render the handler only if it exists
        if (document.getElementById('loginHandler')) {
            var loginHandler = document.getElementById('loginHandler'),
            elLogin = YDom.getElementsByClassName('login','span', loginHandler),
            elLogout = YDom.getElementsByClassName('logout','span', loginHandler),
            elUser = YDom.getElementsByClassName('user', 'span',loginHandler),
            elAdmin = YDom.getElementsByClassName('admin','span', loginHandler);

            // Add event listerners
            for ( var i = 0; i < elLogin.length; i++) {
                YAHOO.util.Event.addListener(elLogin[i], "click", function() {
                    that.login();
                });
            }
            for ( var i = 0; i < elLogout.length; i++) {
                YAHOO.util.Event.addListener(elLogout[i], "click", function() {
                    that.logout();
                });
            }
            for ( var i = 0; i < elAdmin.length; i++) {
                YAHOO.util.Event.addListener(elAdmin[i], "click", function() {
                    that.openAdminConsole();
                });
            }
        }
        _updateLoginHandler();
    };

    var _updateLoginHandler = function() {
        if (document.getElementById('loginHandler')) {
            var loginHandler = document.getElementById('loginHandler'),
            elLogin = YDom.getElementsByClassName('login','span', loginHandler),
            elLogout = YDom.getElementsByClassName('logout','span', loginHandler),
            elUser = YDom.getElementsByClassName('user', 'span',loginHandler),
            elAdmin = YDom.getElementsByClassName('admin','span', loginHandler);

            if (isAuth) {
                for ( var i = 0; i < elLogin.length; i++) {
                    YDom.setStyle(elLogin[i], "display", "none");
                }
                for ( var i = 0; i < elUser.length; i++) {
                    YDom.setStyle(elUser[i], "display", "");
                    elUser[i].innerHTML = currentUsername;
                }
                for ( var i = 0; i < elLogout.length; i++) {
                    YDom.setStyle(elLogout[i], "display", "");
                }
            } else {
                for ( var i = 0; i < elLogin.length; i++) {
                    YDom.setStyle(elLogin[i], "display", "");
                }
                for ( var i = 0; i < elUser.length; i++) {
                    YDom.setStyle(elUser[i], "display", "none");
                    elUser[i].innerHTML = "";
                }
                for ( var i = 0; i < elLogout.length; i++) {
                    YDom.setStyle(elLogout[i], "display", "none");
                }
            }

            if (isAdmin) {
                for ( var i = 0; i < elAdmin.length; i++) {
                    YDom.setStyle(elAdmin[i], "display", "");
                }
            } else {
                for ( var i = 0; i < elAdmin.length; i++) {
                    YDom.setStyle(elAdmin[i], "display", "none");
                }
            }
        }
    };

    var _authRequest = function(username, password, enterpriseApplication) {
        var eApp = enterpriseApplication;
        var oCallback = {
            // if our XHR call is successful, we want to make use
            // of the returned data and create child nodes.
            success : function(oRequest, oParsedResponse, oPayload) {
                ELSTR.utils.cursorWait.hide();

                var responseAction = oParsedResponse.results[0].action;
                var responseMessages = oParsedResponse.results[0].message;

                if (responseAction == "success") {
                    isAuth = oParsedResponse.results[0].isAuth;
                    isAdmin = oParsedResponse.results[0].isAdmin;
                    resourcesAllowed = oParsedResponse.results[0].resourcesAllowed;
                    currentUsername = oParsedResponse.results[0].username;
                    enterpriseApplicationData = oParsedResponse.results[0].enterpriseApplicationData;
                    loginDialog.hide();
                    _updateLoginHandler();
                    that.onAfterAuthEvent.fire(username, password);
									
                    try {
                        var oRequestPost = YAHOO.lang.JSON.parse(oRequest);
                        if (oRequestPost.params.enterpriseApplication != ''){
                            var enterpriseApplication = oRequestPost.params.enterpriseApplication;
							
                            that.enterpriseApplicationAuthEvent[enterpriseApplication].fire();
                        }
                    }
                    catch (e) {
                    }

                    callbackFunction();
                } else {
                    if (forceAuthentication === true && isAuth === false) {
                        that.login(eApp);
                    }
					
                    ELSTR.lang.alert("error", responseMessages[0],loginDialogMessageContainer);
                }

            },
            failure : function(oRequest, oParsedResponse, oPayload) {
                ELSTR.utils.cursorWait.hide();

                ELSTR.error.requestFailure(oRequest, oParsedResponse, oPayload);

                if (forceAuthentication === true && isAuth === false) {
                    that.login();
                }

            },
            scope : {},
            argument : {}
        };

        var oRequestPost = {
            "jsonrpc" : "2.0",
            "method" : "auth",
            "params" : {
                username : username,
                password : password,
                enterpriseApplication : enterpriseApplication
            },
            "id" : ELSTR.utils.uuid()
        };

        datasource.sendRequest(YAHOO.lang.JSON.stringify(oRequestPost),	oCallback);

        ELSTR.utils.cursorWait.show();
    }

    var _logoutRequest = function() {
        that.onBeforeLogoutEvent.fire();

        var oCallback = {
            // if our XHR call is successful, we want to make use
            // of the returned data and create child nodes.
            success : function(oRequest, oParsedResponse, oPayload) {
                ELSTR.utils.cursorWait.hide();

                isAuth = false;
                isAdmin = false;
                currentUsername = "anonymous";

                _updateLoginHandler();
                that.onAfterLogoutEvent.fire();

                if (forceAuthentication === true && isAuth === false) {
                    that.login();
                }

            },
            failure : function(oRequest, oParsedResponse, oPayload) {
                ELSTR.utils.cursorWait.hide();
                ELSTR.error.requestFailure(oRequest, oParsedResponse, oPayload);
            },
            scope : {},
            argument : {}
        };

        var oRequestPost = {
            "jsonrpc" : "2.0",
            "method" : "logout",
            "params" : {},
            "id" : ELSTR.utils.uuid()
        };

        datasource.sendRequest(YAHOO.lang.JSON.stringify(oRequestPost),	oCallback);

        ELSTR.utils.cursorWait.show();
    };
	
    var _clearPasswordValue = function(){
        var isPasswordInput = function(el) {
            return (el.getAttribute("name")=="password");
        };
        var elPassword = YDom.getElementsBy(isPasswordInput, "input","dialogLogin");
        for ( var i = 0; i < elPassword.length; i++) {
            elPassword[i].value = "";
        }
    };
	
};
