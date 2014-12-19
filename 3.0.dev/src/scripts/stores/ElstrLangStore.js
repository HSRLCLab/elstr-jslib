/**
 * Copyright 2014, Intelliact AG
 * Copyrights licensed under the New BSD License
 * Created by egli@intelliact on 11.12.2014.
 */

var mcFly = require('../libs/mcFly.js');

var EventEmitter = require('events').EventEmitter;
var ElstLangConstants = require('../constants/ElstrLangConstants');

// http://airbnb.github.io/polyglot.js/
var Polyglot = require('../libs/polyglot/build/polyglot.js');
var _polyglot = new Polyglot();

var ElstrConfigStore = require("../stores/ElstrConfigStore");

var ElstrLog = require("../ElstrLog");

var _translations = {};
var _currentLanguage = null;
var _loadedModules = [];

/**
 * This is the class for storing Elstr lang
 * @class ElstrLangStore
 */
var ElstrLangStore = mcFly.createStore({
    init: function() {
        _translations = window.ELSTR.applicationData.language.translations;
        _currentLanguage = window.ELSTR.applicationData.language.current;
        _loadedModules = [window.ELSTR.applicationData.language.modules];

        // Remove global ELSTR values after configuration
        window.ELSTR.applicationData.language = null;

        _polyglot = new Polyglot();
        _polyglot.extend(_translations);

        ElstrLog.info("ElstrLangStore initialized");
    },
    getLoadedModules: function() {
        return _loadedModules;
    },
    getCurrentLanguage: function() {
        return _currentLanguage;
    },
    text: function(key, options) {
        return _polyglot.t(key, options);
    }

}, function(payload) {

    switch (payload.actionType) {
        case ElstLangConstants.ELSTR_LANG_DID_LOAD:
            _translations = payload.translations;
            _currentLanguage = payload.lang;
            _polyglot.replace(_translations);
            ElstrLog.log("ELSTR_LANG_DID_LOAD");
            break;
    }

    ElstrLog.trace('ElstrLangStore.emitChange');
    ElstrLangStore.emitChange();


    return true;
});

module.exports = ElstrLangStore;