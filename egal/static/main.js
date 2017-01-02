/**
 * Created by riedel on 29/12/2016.
 */
define(['./egal', 'base/js/namespace', 'jquery'], function (egal, Jupyter, $) {

    "use strict";

    var old_color = null;

    var toggle_selected_input = function () {
        // Find the selected cell
        var cell = Jupyter.notebook.get_selected_cell();
        // Toggle visibility of the input div
        cell.element.find("div.input").toggle('slow');
        cell.metadata.hide_input = !cell.metadata.hide_input;
    };
    var toggle_egal = function () {
        // Find the selected cell
        var cell = Jupyter.notebook.get_selected_cell();
        // Toggle visibility of the input div
        cell.element.find("div div.input_area > *").toggle();
        var inputArea = cell.element.find("div div.input_area");
        var cellToolBar = cell.element.find(".celltoolbar");
        if (!cell.metadata.hide_input) {
            old_color = inputArea.css("background-color");
            inputArea.append($("<div id='pups'></div>"));
            var canvas = new egal.Egal('#pups', 'blah', {
                width: '100%',
                height: '400'
            });
            inputArea.css("background-color", "white");
            inputArea.css("border-style", "none");
            cellToolBar.css("border-bottom", "thin solid #CFCFCF");

        } else {
            cell.element.find("div div.input_area #pups").remove();
            inputArea.css("background-color", old_color);
            inputArea.css("border-style", "solid");
            cellToolBar.css("border-bottom", "none");

        }
        // cell.element.find("div .prompt").toggle();
        cell.metadata.hide_input = !cell.metadata.hide_input;
        console.log(cell);
    };

    var update_input_visibility = function () {
        Jupyter.notebook.get_cells().forEach(function (cell) {
            if (cell.metadata.hide_input) {
                cell.element.find("div.input").hide();
            }
        })
    };

    var load_ipython_extension = function () {
        console.log("Loading egal ...");
        Jupyter.toolbar.add_buttons_group([{
            id: 'btn-hide-input',
            label: 'Toggle selected cell input display',
            icon: 'fa-chevron-up',
            callback: function () {
                toggle_egal();
                setTimeout(function () {
                    $('#btn-hide-input').blur();
                }, 500);
            }
        }]);
        // Collapse all cells that are marked as hidden
        if (typeof Jupyter.notebook === 'undefined') {
            // notebook not loaded yet. add callback for when it's loaded.
            require(['base/js/events'], function (events) {
                events.on("notebook_loaded.Notebook", update_input_visibility)
            });
        }
        else {
            // notebook already loaded. Update directly
            update_input_visibility();
        }
    };
    return {
        load_ipython_extension: load_ipython_extension
    }
});