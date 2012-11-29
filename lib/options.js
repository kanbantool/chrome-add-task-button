if(typeof KanbanTool == "undefined"){ KanbanTool = {}; }
if(typeof KanbanTool.Chrome == "undefined"){ KanbanTool.Chrome = {}; }

KanbanTool.Chrome.Options = function(){
  return {

    ready : function(){

      $("#login_with_api").bind('click', function() {
        KanbanTool.Chrome.Options.loginFormSubmit()
        return false;
      });

      $("#logout_with_api").bind('click', function() {
        KanbanTool.Chrome.Options.logoutFormSubmit();
        return false;
      });

      $("#board_select_submit").bind('click', function() {
        KanbanTool.Chrome.Options.saveOptions();
        return false;
      });

      if( KanbanTool.Chrome.isAuthenticated() ){
        $('.activity').hide(); $('#options_activity').show();
        KanbanTool.Chrome.flash( '#options_form_flash', 'spinner', 'Loading account details, please wait...');
        KanbanTool.api = new KanbanTool.Api( localStorage['auth_subdomain'], localStorage['auth_api_token']);
        KanbanTool.api.call('GET', 'boards', {}, KanbanTool.Chrome.boardsLoaded,  KanbanTool.Chrome.error );
        if( window.location.hash == '#as-popup'){
          $('#header, .activity, #footer').hide();
          $('#popup_activity').show();
        }
      } else {
        // Show the login screen and focus the first field
        $('.activity').hide(); $('#login_activity').show();
        $('#account_subdomain').focus();
      }
    },

    logoutFormSubmit : function(){
      // Remove the subdomain and API token in localStorage
      localStorage.clear();

      $('#options_activity').hide();
      $('#login_activity').show();
      $('#account_subdomain').focus();
      $('#login_form_flash').html("Logged out.").show().removeClass('spinner').removeClass('error').addClass('success');

      return false;
    },

    loginFormSubmit : function(){
      var subdomain = $('#account_subdomain').val(),
          api_token = $('#api_token').val(),
          api = null;
          

      $('#login_form_flash').html("Logging in, please wait...").show().removeClass('success error').addClass('spinner');
      api = new KanbanTool.Api( subdomain, api_token );

      // Save the subdomain and API token in localStorage
      localStorage['auth_subdomain'] = subdomain;
      localStorage['auth_api_token'] = api_token;

      api.call('GET', 'boards', null, KanbanTool.Chrome.Options.loginFormSuccess, KanbanTool.Chrome.Options.loginFormFailure );
      return false;
    },

    loginFormSuccess : function(){
      $('#login_form_flash').html("Login successful").show().removeClass('spinner').addClass('success');
      KanbanTool.Chrome.Options.ready();
      return false;
    },

    loginFormFailure : function(){
      $('#login_form_flash').html("Invalid domain or API token").show().removeClass('spinner').addClass('error');
      localStorage.clear();
      return false;
    },

    saveOptions : function(){
      KanbanTool.Chrome.saveBoardSelect();
      KanbanTool.Chrome.flash( '#options_form_flash', 'success', '<strong>Options saved</strong><br/>You can now use the toolbar button<br/>to add new tasks.')
      $('#board_select_submit').attr('disabled', true);
      return false;
    }

  }
}();

$(document).ready( function(){ KanbanTool.Chrome.Options.ready() } );
