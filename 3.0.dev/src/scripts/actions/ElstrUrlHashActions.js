"use strict";
/**
 * CommentActions
 */

var mcFly = require('../libs/mcFly.js');
var ElstrUrlHashConstants = require('../constants/ElstrUrlHashConstants');

var ElstrLog = require("../ElstrLog");
var hasher = require('hasher');

/**
 * Transforms an object into a string with the proper hash format (Ej: foo=1&cow=2&candy=true)
 * @param obj
 * @returns {string}
 * @private
 */
function _serialize(obj) {

    var str = [];
    for(var p in obj)
        if (obj.hasOwnProperty(p)) {

            if (_avoidScapingValues){
                str.push(p + "=" + obj[p]);
            }else{
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }

        }
    return str.join("&");
}

/**
 * Updates the Hash URL from an object.
 * Replaces the existing attributes and add the new ones.
 * @param obj
 * @returns {string}
 * @private
 */
function _updateHashObject( newObject ){

    var ElstrUrlHashStore = require('../stores/ElstrUrlHashStore');
    var hashObject =  ElstrUrlHashStore.get();

    for(var i in newObject){
        hashObject[i] = newObject[i];
    }

    var newHash = _serialize(hashObject);

    hasher.setHash(newHash);
}

/**
 * Sets the new URL hash from the given object.
 * @param newObject
 * @param updateHistory boolean - Controls if the browser history is updated
 * @param throwEvent - Controls if and event will be raised.
 * @private
 */
function _setHashObject( newObject , updateHistory, throwEvent){

    var newHash = _serialize(newObject);

    //disable changed signal
    if (!throwEvent) hasher.changed.active = false;

    if (updateHistory){
        hasher.setHash(newHash);
    }else{
        hasher.replaceHash(newHash);
    }

    //disable changed signal
    if (!throwEvent) hasher.changed.active = true;
}

var _avoidScapingValues = false;

var ElstrUrlHashActions = mcFly.createActions({

    init : function(avoidScapingValues) {

        if (avoidScapingValues && avoidScapingValues===true){
            _avoidScapingValues = true;
        }

        return {
            actionType: "ElstrUrlHashActions.init"
        };
    },

    /**
     * Updates the URL hash WITH event AND history record based in the given object
     * @param object
     */
    add: function( object ){
        _updateHashObject(object);

        return {
            actionType: "ElstrUrlHashActions.add"
        };
    },

    /**
     * Replaces the URL hash WITH event AND history record based in the given object
     * @param object
     */
    set: function( object ){
        var updateHistory = true;
        var throwEvent = true;
        _setHashObject(object, updateHistory, throwEvent);

        return {
            actionType: "ElstrUrlHashActions.set"
        };
    },

    /**
     * Replaces the URL hash without event or history record based in the given object
     * @param object
     */
    replace: function( object ){
        var updateHistory = false;
        var throwEvent = false;
        _setHashObject(object, updateHistory, throwEvent);

        return {
            actionType: "ElstrUrlHashActions.replace"
        };
    },


    /**
     * Replaces the URL based in the given object
     * @param object
     * @param boolean updateHistory (If the browser history is updated)
     * @param boolean throwEvent (If fires a url change event)
     */
    setWithOptions: function( object, updateHistory, throwEvent ){
        _setHashObject(object, updateHistory, throwEvent);

        return {
            actionType: "ElstrUrlHashActions.setWithOptions"
        };
    },


    /**
     * Called when the URL Hash changes.
     * Emits a flux URL_HASH_CHANGE event with parameters:
     * newHash: the new hash
     * oldHash: the old hash that has been replaced
     */
    hashChange: function(newHash, oldHash) {
        return {
            actionType: ElstrUrlHashConstants.URL_HASH_CHANGE,
            newHash: newHash,
            oldHash: oldHash
        };
    }
});

module.exports = ElstrUrlHashActions;