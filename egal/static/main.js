/**
 * Created by riedel on 29/12/2016.
 */
define(['./egal', 'base/js/namespace', 'jquery'], function (egal, Jupyter, $) {

    "use strict";

    var old_color = null;

    var setup_egal_cell = function (cell) {
        var divId = 'egal_' + cell.cell_id;
        var hasBeenSetup = cell.element.find("div div.input_area #" + divId).length > 0;
        var inputArea = cell.element.find("div div.input_area");
        var cellToolBar = cell.element.find(".celltoolbar");
        if (!hasBeenSetup) {
            // console.log(cellToolBar);
            // console.log(divId);
            // console.log(cell.element.find("div div.input_area #" + divId));
            // console.log(hasBeenSetup);
            if (cell.metadata.is_egal && cell.cell_type === "raw") {
            cell.element.find("div div.input_area > *").toggle();
                old_color = inputArea.css("background-color");
                inputArea.append($("<div id='" + divId + "'></div>"));

                var canvas = new egal.Egal('#' + divId, {
                    width: '100%',
                    content: cell.get_text()
                });
                if (cell.metadata.hide_egal) canvas.toggleMenuBar();
                canvas.onMenuBarToggle(function () {
                    console.log("Toggled!");
                    cell.metadata.hide_egal = !cell.metadata.hide_egal;
                });
                canvas.onSaveContent(function (content) {
                    cell.set_text(content);
                });
                inputArea.css("background-color", "white");
                inputArea.css("border-style", "none");
                cellToolBar.css("border-bottom", "thin solid #CFCFCF");
                cell.element.click(function () {
                    // console.log("Clicked on Egal!");
                    cell.keyboard_manager.disable();

                    cell.edit_mode();
                    // console.log(cell.mode);
                    // cell.element.get(0).focus();
                });
                // cell.cell_type = "raw";
            }

        } else if (!(cell.metadata.is_egal && cell.cell_type === "raw")) {
            cell.element.find("div div.input_area #" + divId).remove();
            inputArea.css("background-color", old_color);
            inputArea.css("border-style", "solid");
            cellToolBar.css("border-bottom", "none");
        }
    };

    var toggle_egal = function () {
        // Find the selected cell
        var cell = Jupyter.notebook.get_selected_cell();
        cell.metadata.is_egal = !cell.metadata.is_egal;
        setup_egal_cell(cell);
    };

    var create_egal = function () {
        // Find the selected cell
        var cell = Jupyter.notebook.insert_cell_below("raw");
        cell.set_text("<svg height='250'></svg>");
        cell.metadata.is_egal = true;
        setup_egal_cell(cell);
    };


    var update_egal_cells = function () {
        Jupyter.notebook.get_cells().forEach(function (cell) {
            if (cell.metadata.is_egal) {
                setup_egal_cell(cell);
            }
        });
    };

    var load_ipython_extension = function () {
        // console.log("Loading egal ...");
        Jupyter.toolbar.add_buttons_group([{
            id: 'btn-hide-input',
            label: 'Insert Egal Cell',
            icon: 'fa-paint-brush',
            callback: function () {
                create_egal();
                // toggle_egal();
                setTimeout(function () {
                    $('#btn-hide-input').blur();
                }, 500);
            }
        }]);
        // Collapse all cells that are marked as hidden
        if (typeof Jupyter.notebook === 'undefined') {
            // notebook not loaded yet. add callback for when it's loaded.
            require(['base/js/events'], function (events) {
                events.on("notebook_loaded.Notebook", update_egal_cells);
                events.on("pre_run_cell", function () {
                    console.log("Cell created!");
                });
            });
        } else {
            // notebook already loaded. Update directly
            // console.log("Already loaded! ");
            require(['base/js/events'], function (events) {
                events.on("create.Cell", function (e, cell) {
                    // console.log("Cell created!");
                    // console.log(cell);
                    // console.log(e);
                    // console.log(cell.cell.metadata);
                    // console.log(cell.cell._metadata);
                    if (cell.cell.metadata.is_egal) {
                        setup_egal_cell(cell.cell);
                    }
                });
                events.on("select.Cell", function (e, cell) {
                    // console.log("Select edit mode!");
                    // console.log(cell);
                    // console.log(e);
                    // console.log(cell.cell.metadata);
                    // console.log(cell.cell._metadata);
                    if (cell.cell.metadata.is_egal) {
                        setup_egal_cell(cell.cell);
                    }
                })
            });
            update_egal_cells();
        }
    };
    return {
        load_ipython_extension: load_ipython_extension
    };
});