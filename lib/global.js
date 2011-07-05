if(typeof KanbanTool == "undefined"){ KanbanTool = {}; }
KanbanTool.Chrome = function(){
  return {

    ready : function(){},

    error : function(){
      alert('There was an error while communicating with kanbantool.com.\nPlease check your internet connection and try again.');
    },

    flash : function( e, type, message ){
     $(e).html(message).removeClass('spinner error success').addClass(type).show();
    },

    isAuthenticated : function(){
      return (localStorage['auth_subdomain'] && localStorage['auth_api_token']);
    },

    showActivity : function(name){
      $('.activity').hide();
      $('#' + name + '_activity').show().find('input:visible:first').focus();
    },

    boardsLoaded : function(boards){
      var i, current_folder, html='<option value="">- please select - </option>';

      $('#options_form_flash').hide();

      for(i in boards){
        if( current_folder != boards[i].board.folder_id ){
          if( current_folder )
            html += '</optgroup>';
          current_folder = boards[i].board.folder_id;
          if( boards[i].board.folder_id )
            html += '<optgroup label="' + boards[i].board.folder.name + '">';
        }
        html += '<option value="' + boards[i].board.id + '">' + boards[i].board.name + '</option>'
      }
      if( current_folder ){ html += '</optgroup>'; }

      $('#board_select').html(html).change(function(){
        $('#board_select_submit').attr('disabled', true);
        if( $('#board_select').val() != '' ){
          KanbanTool.Chrome.flash( '#options_form_flash', 'spinner', 'Loading board details, please wait...');
          KanbanTool.api.call('GET', 'boards/' + $('#board_select').val(), {}, KanbanTool.Chrome.boardStructureLoaded,  KanbanTool.Chrome.error );
        } else {
          $('#swimlane_select, #workflow_stage_select').parent().hide();
        }
      });

      // Select remembered option
      if(localStorage['board_id']){
        $('#board_select').val(localStorage['board_id']).change();
      }

      $('#swimlane_select, #workflow_stage_select').change(function(e){
        $('#options_form_flash').hide();
        $('#board_select_submit').attr('disabled', false);
      });

      $('#swimlane_select, #workflow_stage_select').parent().hide();
      
    },

    boardStructureLoaded : function( resp ){
      var i, tmp, swimlanes_html='<option value="">- please select - </option>',
          stages={}, last_parent_id,
          stages_html='<option value="">- please select - </option>',
          card_types_html='<option value="">- default - </option>';

      // Hide flash and enable the save button
      $('#options_form_flash').hide();
      $('#board_select_submit').attr('disabled', false);

      ////
      // Update swimlanes select

      for( i in resp.board.swimlanes ){
        swimlanes_html += '<option value="' + resp.board.swimlanes[i].id + '">' + resp.board.swimlanes[i].name + '</option>';
      }
      $('#swimlane_select').html(swimlanes_html);
      if( resp.board.swimlanes.length <= 1){
        $('#swimlane_select').val( resp.board.swimlanes[0] ? resp.board.swimlanes[0].id : null ).parent().hide();
      } else {
        $('#swimlane_select').parent().show();
      }

      // Select remembered option
      if(localStorage['swimlane_id']){
        $('#swimlane_select').val(localStorage['swimlane_id']).change();
      }


      ////
      // Update workflow stage (column) select

      // Build information about stages
      for( i in resp.board.workflow_stages ){
        if( ! stages[ resp.board.workflow_stages[i].id ] ){ stages[ resp.board.workflow_stages[i].id ] = {} }
        stages[ resp.board.workflow_stages[i].id ].node = resp.board.workflow_stages[i];
        if( resp.board.workflow_stages[i].parent_id ){
          stages[resp.board.workflow_stages[i].parent_id].has_children = true;
        }
      }

      // Build select with leaf nodes only
      for( i in resp.board.workflow_stages ){
        // Skip node if it has children
       if( stages[ resp.board.workflow_stages[i].id ].has_children ){ continue; }

        // Build the HTML select
        stages_html += '<option class="level-' + stages[ resp.board.workflow_stages[i].id ].level + '" value="' + resp.board.workflow_stages[i].id + '">' + resp.board.workflow_stages[i].name + '</option>'
      }
      $('#workflow_stage_select').html(stages_html).parent().show();

      // Select remembered option
      if(localStorage['workflow_stage_id']){
        $('#workflow_stage_select').val(localStorage['workflow_stage_id']).change();
      }

    },

    saveBoardSelect : function(){
      localStorage['board_id'] = $('#board_select').val();
      localStorage['board_name'] = $('#board_select option:selected').html();
      localStorage['folder_name'] = $('#board_select option:selected').parent()[0].tagName == "OPTGROUP" ? $('#board_select option:selected').parent().attr('label') : null;
      localStorage['swimlane_id'] = $('#swimlane_select').val();
      localStorage['workflow_stage_id'] = $('#workflow_stage_select').val();
    }

  }
}();

$(document).ready( function(){ KanbanTool.Chrome.ready() } );
