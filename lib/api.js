/**
 * A javascript library for interacting with KanbanTool (kanbantool.com)
 * see http://kanbantool.com/about/api for more details
 * @prerequisite jQuery
 * @version 0.1
 *
 * Sample usage:
 * KanbanTool.api = new KanbanTool.Api( 'subdomain', 'api-token' );
 * KanbanTool.api.onError = function(){ alert('API error'); }
 * KanbanTool.api.createTask( 1234, {name:'Lorem ipsum'} );
 *
 * Copyright (C) 2011 by Shore Labs for kanbantool.com
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

if(typeof KanbanTool == "undefined"){ KanbanTool = {}; }
if(typeof KanbanTool.Cache == "undefined"){ KanbanTool.Cache = {}; }

/*
 * Javascript API binding for kanbantool.com
 * see http://kanbantool.com/about/api for more details
 */
KanbanTool.Api = function( subdomain, api_token ){
  this.subdomain = subdomain;
  this.api_token = api_token;

  // Helper method to be used by loadCardTypes
  var cardTypesLoaded = function( resp ){
    var data, card_type_options='<option value="">- default - </option>';
    for( i in resp.board.card_types ){
      if( resp.board.card_types[i].is_disabled ){ continue }
      card_type_options += $('<option></option>').attr({'value': resp.board.card_types[i].id}).text(resp.board.card_types[i].name).wrap('<div/>').parent().html();
    }

    data = {obj:resp.board.card_types, options_html:card_type_options, mtime:new Date()};
    if( KanbanTool.Cache ){ KanbanTool.Cache.card_types = data; }

    if( this.onCardTypesLoaded ){ this.onCardTypesLoaded( data ); }
    $(window).triggerHandler('KanbanTool:Api:onCardTypesLoaded', data);
  };

  // Helper method to be used by loadBoardUsers
  var boardUsersLoaded = function( resp ){
    var data, user_options='<option value="">- none - </option>';
    for( i in resp ){
      user_options += $('<option></option>').attr({'value': resp[i].shared_item_user.user.id}).text(resp[i].shared_item_user.user.initials + ' ('+ resp[i].shared_item_user.user.name + ')').wrap('<div/>').parent().html();
    }

    data = {obj:resp, options_html:user_options, mtime: new Date()};
    if( KanbanTool.Cache ){ KanbanTool.Cache.board_users = data; }

    if( this.onBoardUsersLoaded ){ this.onBoardUsersLoaded( data ); }
    $(window).triggerHandler('KanbanTool:Api:onBoardUsersLoaded', data);
  };

  // Helper method to be called by createTask
  var taskCreated = function( resp ){
    var data = {obj:resp, mtime: new Date()};

    if( this.onTaskCreated ){ this.onTaskCreated( data ); }
    $(window).triggerHandler('KanbanTool:Api:onTaskCreated', data);
  };


  /**
   * Helper method returning api endpoint URL based on the remembered subdomain
   * @param {string} API method relative URL
   */
  this.api_endpoint = function( url ){
    return "https://" + this.subdomain + ".kanbantool.com/api/v1/" + url + '.json';
  };

  /**
   * Helper method handling low-level AJAX JSON api calls
   * @param {string} method     - GET or POST
   * @param {string} url        - relative api method URL like "tasks/show"
   * @param {hash} data         - data to pass to the API method
   * @param {function} success  - success callback function
   * @param {function} error    - error callback function
   */
  this.call = function( method, url, data, success, error ){
    $.ajax({
      'type'    : method,
      'url'     : this.api_endpoint(url),
      'headers' : {'X-KanbanToolToken':this.api_token},
      'success' : success,
      'error'   : error,
      'data'    :data,
      'dataType': 'json'
    })
  };

  /**
   * Default error handler triggering the KanbanTool:Api:onError event
   * It can be overloaded if needed
   */
  this.error = function(jqXHR, textStatus, errorThrown){
    if( this.onError ){ this.onError(e); }
    $(window).triggerHandler('KanbanTool:Api:onError', {'jqXHR':jqXHR, 'textStatus':textStatus, 'errorThrown':errorThrown});
  }

  /**
   * Loads card types for given board
   * triggering the KanbanTool:Api:onCardTypesLoaded event on success
   * Triggered event's data is in format:
   * {
   *    mtime:Sun Jul 03 2011 22:14:56 GMT+0200 (CEST),
   *    obj: [{board_id:23, color_ref:"yellow", id:123, is_defaut:true, :is_disabled:false, name:"yellow card", position: 1},...],
   *    options_html: "<option value="">- default - </option><option value="123">yellow card</option>...."
   * }
   */
  this.loadCardTypes = function( board_id, cache_timeout ){
    if( cache_timeout && KanbanTool.Cache && KanbanTool.Cache.card_types && (new Date() - KanbanTool.Cache.card_types.mtime < timeout) ){
      if( this.onCardTypesLoaded ){ this.onCardTypesLoaded(KanbanTool.Cache.card_types); }
      $(window).triggerHandler('KanbanTool:Api:onCardTypesLoaded', KanbanTool.Cache.card_types);
    } else {
      this.call('GET', 'boards/' + board_id, {}, cardTypesLoaded,  this.error );
    }
  };

  /**
   * Loads users for given board
   * triggering the KanbanTool:Api:onBoardUsersLoaded event on success
   * Triggered event's data is in format:
   * {
   *    mtime:Sun Jul 03 2011 22:14:56 GMT+0200 (CEST),
   *    obj: [{shared_item_user: {id:123, user_id:456, can_create_tasks:true, can_read_tasks:true, can_delete_tasks:true, can_move_tasks:true, can_update_tasks:true, user:{id:456, initials:"JB", name:"Johny Bravo" }} },...],
   *    options_html: "<option value="">- none - </option><option value="123">JB (Johny Bravo)</option>...."
   * }
   */
  this.loadBoardUsers = function( board_id, cache_timeout ){
    if( cache_timeout && KanbanTool.Cache && KanbanTool.Cache.board_users && (new Date() - KanbanTool.Cache.board_users.mtime < timeout) ){
      if( this.onBoardUsersLoaded ){ this.onBoardUsersLoaded( KanbanTool.Cache.board_users ); }
      $(window).triggerHandler('KanbanTool:Api:onBoardUsersLoaded', KanbanTool.Cache.board_users);
    } else {
      KanbanTool.api.call('GET', 'boards/' + board_id + '/users', {}, boardUsersLoaded,  this.error );
    }
  };

  /**
   * Creates task on given board and triggers the KanbanTool:Api:onTaskCreated event
   * @param {int} board_id - Board identifier
   * @param {hash} params - Task parameters serialized to hash
   */
  this.createTask = function( board_id, params ){
    this.call('POST', 'boards/' + board_id + '/tasks', params, taskCreated,  this.error );
  };

};

