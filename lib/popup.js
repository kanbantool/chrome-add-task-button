if(typeof KanbanTool == "undefined"){ KanbanTool = {}; }
if(typeof KanbanTool.Chrome == "undefined"){ KanbanTool.Chrome = {}; }

KanbanTool.Chrome.Popup = function(){
  return {

    ready : function(){

      $("#new_task_submit").bind('click', function() {
        KanbanTool.Chrome.Popup.onTaskFormSubmit();
        return false;
      });

      $("#show_board_select").bind('click', function() {
        KanbanTool.Chrome.Popup.showBoardSelect();
        return false;
      });

      $(".back_link").bind('click', function() {
        KanbanTool.Chrome.Popup.showTaskForm();
        return false;
      });

      $("#board_select_submit").bind('click', function() {
        KanbanTool.Chrome.Popup.saveBoardSelect();
        return false;
      });

      KanbanTool.api = new KanbanTool.Api( localStorage['auth_subdomain'], localStorage['auth_api_token']);

      // If user is logged in and options are configured
      if( KanbanTool.Chrome.isAuthenticated() && localStorage['board_id'] ){
        var board_link, board_id;

        board_id   = 1 * localStorage['board_id'];
        board_link = $('<a></a>').
                    attr('href', 'http://' + localStorage['auth_subdomain'] + '.kanbantool.com/boards/' + (board_id+20)).
                    attr('target', '_blank').
                    html(localStorage['board_name']);
        $('#board_link').html(board_link);

        // Bind API callbacks
        $(window).bind('KanbanTool:Api:onTaskCreated', KanbanTool.Chrome.Popup.onTaskCreated );
        $(window).bind('KanbanTool:Api:onError', KanbanTool.Chrome.Popup.onError );

        // Load card types
        $(window).bind('KanbanTool:Api:onCardTypesLoaded', function(e, data){
          $('#card_type_select').html(data.options_html);
        })
        KanbanTool.api.loadCardTypes( localStorage['board_id'], 10000 );

        // Load users for assigned to select
        $(window).bind('KanbanTool:Api:onBoardUsersLoaded', function(e, data){
          $('#assigned_user_select').html(data.options_html);
        })
        KanbanTool.api.loadBoardUsers( localStorage['board_id'], 10000 );


        // Go to the new_task activity
        KanbanTool.Chrome.showActivity('new_task');

      // If user is authenticated but no board has been choosen yet
      } else if( KanbanTool.Chrome.isAuthenticated() ){
        chrome.tabs.create({
          url: chrome.extension.getURL('options.html'),
          selected: true
        });
        $('body').hide();
        alert('Please select the default board first');

      // Probably the first run when everything is not configured yet
      } else {
        chrome.tabs.create({
          url: chrome.extension.getURL('options.html'),
          selected: true
        });
        $('body').hide();
        alert('Please configure login details first');
      }
    },

    onTaskFormSubmit : function(){
      $('#task_created_flash').hide(); $('#new_task_submit').attr('disabled', true);
      $('#task_workflow_stage_id').val( localStorage['workflow_stage_id'] );
      $('#task_swimlane_id').val( localStorage['swimlane_id'] );
      
      KanbanTool.api.createTask( localStorage['board_id'], $('#task_form').serialize() );
      return false;
    },

    onTaskCreated : function(){
      $('.form_row input, .form_row textarea').val('');
      $('#new_task_submit').attr('disabled', false);
      $('.flash').hide();
      $('#task_created_flash').slideDown('fast').delay(1500).slideUp('fast');
    },

    onError : function(e,data){
      $('#new_task_submit').attr('disabled', false);
      if( data.errorThrown == '' ){
        $('#connection_error_flash').slideDown('fast').delay(10000).slideUp('fast');
      } else {
        $('#task_error_flash').slideDown('fast').delay(10000).slideUp('fast');
      }
    },

    showBoardSelect : function(){
      $('.activity').hide(); $('#board_select_activity').show();
      KanbanTool.api.call('GET', 'boards', {}, KanbanTool.Chrome.boardsLoaded,  KanbanTool.Chrome.error );
    },

    saveBoardSelect : function(){
      KanbanTool.Chrome.saveBoardSelect();
      window.location = "/popup.html";
    },

    showTaskForm : function(){
      KanbanTool.Chrome.showActivity('new_task');
    }

  }
}();

$(document).ready( function(){ KanbanTool.Chrome.Popup.ready() } );
