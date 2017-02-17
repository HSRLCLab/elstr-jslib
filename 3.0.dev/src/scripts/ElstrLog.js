/**
 * Copyright 2014, Intelliact AG
 * Copyrights licensed under the New BSD License
 * Created by sahun@intelliact on 02.12.2014.
 *
 * TODO: allow console log proper line numbers.
 * https://gist.github.com/bgrins/5108712
 *
 */

var request = require('superagent');

// Privat data
var _options = {
    enabled: true,
    serverLevel: 0,
    traceEnabled: true
};

// Privat methods



/**
 * Saves a log in the server.
 * @param level Log level.
 * @param args
 * @private
 */
var _logToServer = function(level, args) {
    var oRequestPost = {
        "jsonrpc": "2.0",
        "method": "write",
        "params": {
            level: level,
            arguments: args
        },
        "id": "0"
    };
    request.post('services/ELSTR_LogServer')
        .send(oRequestPost)
        .type('json')
        .end(function(error, res) {});
};

/**
 * This is the class for IO used in Elstr projects
 *
 * options attributes:
 *     enabled: if the log is enabled in the browser (active by default)
 *     traceEnabled: when the log is enabled, we can turn the method tracing on or off. (active by default)
 *     serverLevel; error/ERR = 3, warn/WARN = 4, log/NOTICE = 5, info/INFO = 6, debug/DEBUG = 7
 *
 * @class ElstrIo
 */
var ElstrLog = {

    init: function(options) {

        if (options.enabled === true) {
            _options.enabled = true;
        } else if (options.enabled === false || options.enabled === "") {
            _options.enabled = false;
        }

        if (options.traceEnabled === true) {
            _options.traceEnabled = true;
        } else if (options.traceEnabled === false || options.traceEnabled === "") {
            _options.traceEnabled = false;
        }

        if (options.serverLevel) {
            _options.serverLevel = options.serverLevel;
        }

        if (options.justAConsoleAlias &&
            _options.enabled &&
            console && console.log &&
            Function.prototype.bind) {

            ElstrLog.log = Function.prototype.bind.call(console.log, console);

            // We will log if the specific console function doesn't exist
            ElstrLog.info = Function.prototype.bind.call((console.info) ? console.info : console.log, console);
            ElstrLog.debug = Function.prototype.bind.call((console.debug) ? console.debug : console.log, console);
            ElstrLog.warn = Function.prototype.bind.call((console.warn) ? console.warn : console.log, console);
            ElstrLog.error = Function.prototype.bind.call((console.error) ? console.error : console.log, console);
            ElstrLog.count = Function.prototype.bind.call((console.count) ? console.count : console.log, console);


        }

    },

    /**
     * Displays a message in the console.
     * You pass one or more objects to this method, each of which are evaluated and concatenated into a space-delimited string.
     * The first parameter you pass to log() may contain format specifiers, a string token composed of the percent sign (%) followed by a letter that indicates the formatting to be applied.
     */
    log: function() {
        if (console && _options.enabled) {
            console.log.apply(console, arguments);
        }
        if (_options.serverLevel && _options.serverLevel >= 5) {
            _logToServer("log", arguments);
        }
    },

    /**
     * This method is identical to console.log().
     * Info level log.
     * Chrome add an "info" icon to it.
     */
    info: function() {

        if (console && _options.enabled) {
            console.info.apply(console, arguments);
        }
        if (_options.serverLevel && _options.serverLevel >= 6) {
            _logToServer("info", arguments);
        }
    },

    /**
     * This method is identical to console.log().
     * Debug level log.
     */
    debug: function() {
        if (console && _options.enabled) {
            console.debug.apply(console, arguments);
        }
        if (_options.serverLevel && _options.serverLevel >= 7) {
            _logToServer("debug", arguments);
        }
    },

    /**
     * This method is identical to console.log().
     * Warning level log.
     */
    warn: function() {
        if (console && _options.enabled) {
            console.warn.apply(console, arguments);
        }
        if (_options.serverLevel && _options.serverLevel >= 4) {
            _logToServer("warn", arguments);
        }
    },

    /**
     * This method is identical to console.log().
     * Error level log.
     * Chrome add an "error" icon to it & trace.
     */
    error: function() {
        if (console && _options.enabled) {
            console.error.apply(console, arguments);
        }
        if (_options.serverLevel && _options.serverLevel >= 3) {
            _logToServer("error", arguments);
        }
    },

    /**
     * Writes the the number of times that count() has been invoked at the same line and with the same label.
     * @param label
     */
    count: function() {
        if (console && _options.enabled) {
            console.count.apply(console, arguments);
        }
    },

    /**

     */

    /**
     * Shows the current method name & arguments in the console.
     * The information in logged with "Info" level.
     * @param overrideFunctionName [optional]
     */
    trace: function( overrideFunctionName ) {

        if (_options.traceEnabled){

            var parentFunctionName;
            var parentFunctionArguments = arguments.callee.caller !== null ? arguments.callee.caller.arguments : null;


            if (overrideFunctionName){
                parentFunctionName = overrideFunctionName;

            }else{

                parentFunctionName = arguments.callee.caller !== null ? arguments.callee.caller.name : "";
                if (parentFunctionName === "") {
                    parentFunctionName = " Anonymous func ";
                }

            }

            ElstrLog.info("ELSTR Trace: ",
                parentFunctionName,
                parentFunctionArguments);

        }
    }
};

module.exports = ElstrLog;