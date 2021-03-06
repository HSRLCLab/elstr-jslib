// Create the Namespace for the Framework
if (ELSTR === undefined) {
	var ELSTR = {};
}

/**
 * Die User Klasse regelt den Umgang mit dem Benutzer in der Webapp
 * 
 * Example of the widget/markup
 * 
 * Required for Authentication: LoginDialog
 *	<div id="loginDialog">
 *		<div class="hd">Login</div>
 *		<div class="bd">
 *			<form name="loginDialogForm" method="POST" action="services/ELSTR_AuthServer">
 *				<label for="username">Username</label><input type="text" name="username" />
 *				<label for="password">Password</label><input type="password" name="password" />
 *			</form>
 *		</div>
 *	</div>
 * 
 * Optinal for Authentication: LoginDialog
 *	<div id="loginHandler">
 *		<span class="login">Anmelden</span> <span class="logout">Abmelden :</span>
 *		<span class="user"></span>
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
ELSTR.Admin = function() {

	// ///////////////////////////////////////////////////////////////
	// Declare all class variables
	var consoleDialog,
	datasource,
	resourceDataTable,
	roleDataTable;

	var YDom = YAHOO.util.Dom;

	// Member Variabless
	var that = this;

	// ////////////////////////////////////////////////////////////
	// Event Declarations

	// ////////////////////////////////////////////////////////////
	// Public functions
	/**
	 * Initialisiert das Admin Objekt
	 * 
	 * @method init
	 * @return void
	 */
	this.init = function() {
		_renderConsoleDialog();
		_createDatasource();
		_renderRoleWidget();
		_renderResourceWidget();
	};

	/**
	 * Opens the admin console
	 * 
	 * @method openConsole
	 * @return void
	 */
	this.openConsole = function() {
		consoleDialog.show();
	};

	// ////////////////////////////////////////////////////////////
	// Private functions

	var _createDatasource = function() {
		datasource = new YAHOO.util.XHRDataSource("services/ELSTR_WidgetServer_JSON_Admin");
		datasource.connMethodPost = true;
        datasource.connXhrMode = "queueRequests";
		datasource.responseType = YAHOO.util.DataSource.TYPE_JSON;
		datasource.responseSchema = {
			resultsList : "result"
		};
	};

	var _renderConsoleDialog = function() {
		var tableHeight = document.body.offsetHeight - 100;
		var bodyHtml = "";
		bodyHtml += "<div style='overflow:auto;height:" + tableHeight + "px;'>";
		bodyHtml += "	<div class='yui-gf'>";
		bodyHtml += "		<div class='yui-u first'>";
		bodyHtml += "			<h3><span textid='Roles'>"+ELSTR.lang.text('Roles')+"</span></h3>";
		bodyHtml += "			<div>";
		bodyHtml += "				<select id='elstrAdminConsoleRoleHandlerMode' style='margin:5px 0 10px 0;vertical-align:top;'>";
		bodyHtml += "					<option value='add'>Add</option>";
		bodyHtml += "					<option value='delete'>Delete</option>";
		bodyHtml += "				</select>";
		bodyHtml += "				<input id='elstrAdminConsoleRoleHandlerInput' type='text' value='' size='25' style='margin:5px 0 10px 0;vertical-align:top;'>";
		bodyHtml += "				<button id='elstrAdminConsoleRoleHandlerButton' type='button'>Go!</button>";
		bodyHtml += "			</div>";
		bodyHtml += "			<div id='elstrAdminConsoleRoleWidget'></div>";
		bodyHtml += "		</div>";
		bodyHtml += "		<div class='yui-u'>";
		bodyHtml += "			<h3><span textid='Resources'>"+ELSTR.lang.text('Resources')+"</span></h3>";
		bodyHtml += "			<div>";
		bodyHtml += "				<select id='elstrAdminConsoleResourceHandlerMode' style='margin:5px 0 10px 0;vertical-align:top;'>";
		bodyHtml += "					<option value='add'>Add</option>";
		bodyHtml += "					<option value='delete'>Delete</option>";
		bodyHtml += "				</select>";
		bodyHtml += "				<input id='elstrAdminConsoleResourceHandlerInput' type='text' value='' size='50' style='margin:5px 0 10px 0;vertical-align:top;'>";
		bodyHtml += "				<select id='elstrAdminConsoleResourceHandlerType' style='margin:5px 0 10px 0;vertical-align:top;'>";
		bodyHtml += "					<option value='Application'>Application</option>";
		bodyHtml += "					<option value='Service'>Service</option>";
		bodyHtml += "					<option value='WidgetServer'>WidgetServer</option>";
		bodyHtml += "					<option value='Method'>Method</option>";
		bodyHtml += "				</select>";
		bodyHtml += "				<button id='elstrAdminConsoleResourceHandlerButton' type='button'>Go!</button>";
		bodyHtml += "			</div>";
		bodyHtml += "			<div id='elstrAdminConsoleResourceWidget'></div>";
		bodyHtml += "		</div>";
		bodyHtml += "	</div>";
		bodyHtml += "</div>";

		var handleClose = function() {
			consoleDialog.hide();
		};

		consoleDialog = new YAHOO.widget.Dialog("consoleDialog", {
			postmethod : "none",
			visible : false,
			fixedcenter : true,
			draggable : true,
			close : true,
			modal : true,
			width : document.body.offsetWidth - 20 + 'px',
			height : document.body.offsetHeight - 20 + 'px',
			buttons : [ {
				text : "<span textid='Close'>"+ELSTR.lang.text('Close')+"</span>",
				handler : handleClose
			} ]
		});
		consoleDialog.setHeader("<span textid='Admin Console'>"+ELSTR.lang.text('Admin Console')+"</span>");
		consoleDialog.setBody(bodyHtml);
		consoleDialog.render(document.body);

		var resourceHandlerButton = new YAHOO.widget.Button("elstrAdminConsoleResourceHandlerButton");
		resourceHandlerButton.on("click", _onResourceHandlerButtonClick);

		var roleHandlerButton = new YAHOO.widget.Button("elstrAdminConsoleRoleHandlerButton");
		roleHandlerButton.on("click", _onRoleHandlerButtonClick);
	};

	var _renderRoleWidget = function() {

		var oColumnDefs = [];
		oColumnDefs[oColumnDefs.length] = {
			key : 'name',
			label : 'Name',
			sortable : false,
			resizeable : true
		};

		roleDataTable = new YAHOO.widget.ScrollingDataTable("elstrAdminConsoleRoleWidget", oColumnDefs, datasource, {
			initialLoad : false,
			draggableColumns : true,
			selectionMode : "standard"
		});
		roleDataTable.subscribe("cellClickEvent",roleDataTable.onEventShowCellEditor);
		_loadRoleDataTable();
	};

	var _recreateResourceWidget = function(){
		resourceDataTable.destroy();
		_renderResourceWidget();
	};
	
	var _renderResourceWidget = function() {

		var oCallback = {
			// if our XHR call is successful, we want to make use
			// of the returned data and create child nodes.
			success : function(oRequest, oParsedResponse, oPayload) {
				var oColumnDefs = [];
				oColumnDefs[oColumnDefs.length] = {
					key : 'type',
					label : 'Type',
					sortable : false,
					resizeable : true
				};
				oColumnDefs[oColumnDefs.length] = {
					key : 'name',
					label : 'Name',
					sortable : false,
					resizeable : true
				};

				var cellFormatter = function(elCell, oRecord, oColumn, oData) {
					elCell.innerHTML = oData;
					if (oData == 'allow') {
						YDom.setStyle(elCell,'background-color', '#99ff99');
					} else if (oData == 'deny') {
						YDom.setStyle(elCell,'background-color', '#ff9999');
					}
				};

				for ( var i = 0; i < oParsedResponse.results.length; i++) {
					oColumnDefs[oColumnDefs.length] = {
						key : oParsedResponse.results[i].name,
						label : oParsedResponse.results[i].name,
						sortable : true,
						resizeable : true,
						formatter : cellFormatter,
						editor : new YAHOO.widget.RadioCellEditor( {
							radioOptions : [ "allow", "deny","inherit" ],
							asyncSubmitter : _updateAccessRight,
							disableBtns : true
						})
					};
				}

				resourceDataTable = new YAHOO.widget.ScrollingDataTable("elstrAdminConsoleResourceWidget", oColumnDefs,
					datasource, {
						initialLoad : false,
						draggableColumns : true,
						selectionMode : "standard"
					});
				resourceDataTable.subscribe("cellClickEvent",resourceDataTable.onEventShowCellEditor);
				_loadResourceDataTable();

			},
			failure : function(oRequest, oParsedResponse, oPayload) {
				ELSTR.error.requestFailure(oRequest, oParsedResponse, oPayload);
			},	
			scope : {},
			argument : {}
		};

		var oRequestPost = {
			"jsonrpc" : "2.0",
			"method" : "getRoleList",
			"params" : {},
			"id" : ELSTR.utils.uuid()
		};

		datasource.sendRequest(YAHOO.lang.JSON.stringify(oRequestPost),oCallback);
	};

	var _updateAccessRight = function(fnCallback, newValue) {

		var data = this.getRecord()._oData;
		var column = this.getColumn();

		var oCallback = {
			success : function(oRequest, oParsedResponse, oPayload) {
				fnCallback(true, newValue);
				_loadResourceDataTable();
			},
			failure : function(oRequest, oParsedResponse, oPayload) {
				ELSTR.error.requestFailure(oRequest, oParsedResponse, oPayload);
				fnCallback(false, newValue);
				_loadResourceDataTable();
			},
			scope : {},
			argument : {}
		};

		var oRequestPost = {
			"jsonrpc" : "2.0",
			"method" : "updateAccessRight",
			"params" : {
				resourceName : data.name,
				roleName : column.key,
				accessRight : newValue
			},
			"id" : ELSTR.utils.uuid()
		};
		datasource.sendRequest(YAHOO.lang.JSON.stringify(oRequestPost),oCallback);
	};

	var _loadResourceDataTable = function() {
		var oCallback = {
			success : resourceDataTable.onDataReturnInitializeTable,			
			failure : resourceDataTable.onDataReturnInitializeTable,
			argument : resourceDataTable.getState(),
			scope : resourceDataTable
		};

		// Show loading row
		resourceDataTable.deleteRows(0,resourceDataTable.getRecordSet()._records.length);
		resourceDataTable.addRow( {
			name : "<div class='loaderIcon'></div> Loading ..."
		}, 0);

		var oRequestPost = {
			"jsonrpc" : "2.0",
			"method" : "getResourceDataTable",
			"params" : {},
			"id" : ELSTR.utils.uuid()
		};
		datasource.sendRequest(YAHOO.lang.JSON.stringify(oRequestPost),oCallback);
	};

	var _loadRoleDataTable = function() {
		var oCallback = {
			success : roleDataTable.onDataReturnInitializeTable,
			failure : roleDataTable.onDataReturnInitializeTable,
			argument : roleDataTable.getState(),
			scope : roleDataTable
		};

		// Show loading row
		roleDataTable.deleteRows(0,	roleDataTable.getRecordSet()._records.length);
		roleDataTable.addRow( {
			name : "<div class='loaderIcon'></div> Loading ..."
		}, 0);

		var oRequestPost = {
			"jsonrpc" : "2.0",
			"method" : "getRoleList",
			"params" : {},
			"id" : ELSTR.utils.uuid()
		};

		datasource.sendRequest(YAHOO.lang.JSON.stringify(oRequestPost),	oCallback);
	};

	var _onResourceHandlerButtonClick = function() {
		var oCallback = {
			success : function(oRequest, oParsedResponse, oPayload) {
				_loadResourceDataTable();
			},
			failure : function(oRequest, oParsedResponse, oPayload) {
				ELSTR.error.requestFailure(oRequest, oParsedResponse, oPayload);
				_loadResourceDataTable();
			},
			scope : {},
			argument : {}
		};

		var mode = YDom.get("elstrAdminConsoleResourceHandlerMode").value;
		var type = YDom.get("elstrAdminConsoleResourceHandlerType").value;
		var resource = YDom.get("elstrAdminConsoleResourceHandlerInput").value;

		if (resource != '') {
			var oRequestPost = {
				"jsonrpc" : "2.0",
				"method" : "updateResource",
				"params" : {
					mode : mode,
					resourceName : resource,
					type : type
				},
				"id" : ELSTR.utils.uuid()
			};

			datasource.sendRequest(YAHOO.lang.JSON.stringify(oRequestPost),oCallback);
		}
	};

	var _onRoleHandlerButtonClick = function() {
		var oCallback = {
			success : function(oRequest, oParsedResponse, oPayload) {
				_loadRoleDataTable();
				_recreateResourceWidget();
			},
			failure : function(oRequest, oParsedResponse, oPayload) {
				ELSTR.error.requestFailure(oRequest, oParsedResponse, oPayload);
				_loadRoleDataTable();
				_recreateResourceWidget();
			},
			scope : {},
			argument : {}
		};

		var mode = YDom.get("elstrAdminConsoleRoleHandlerMode").value;
		var role = YDom.get("elstrAdminConsoleRoleHandlerInput").value;

		if (role != '') {
			var oRequestPost = {
				"jsonrpc" : "2.0",
				"method" : "updateRole",
				"params" : {
					mode : mode,
					roleName : role
				},
				"id" : ELSTR.utils.uuid()
			};

			datasource.sendRequest(YAHOO.lang.JSON.stringify(oRequestPost),	oCallback);
		}
	};
};
