/**
 * Created by riedel on 29/12/2016.
 */
define(['./egal', 'base/js/namespace'], function (egal, Jupyter) {

    var load_ipython_extension = function () {
        console.log("Loading egal ...");
    };
    return {
        load_ipython_extension: load_ipython_extension
    }
});