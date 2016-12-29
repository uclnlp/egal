from egal.handler import *
from notebook.utils import url_path_join


def _jupyter_server_extension_paths():
    return [{
        "module": "egal"
    }]


# Jupyter Extension points
def _jupyter_nbextension_paths():
    return [dict(
        section="notebook",
        # the path is relative to the `my_fancy_module` directory
        src="static",
        # directory in the `nbextension/` namespace
        dest="egal",
        # _also_ in the `nbextension/` namespace
        require="egal/main")]


def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    web_app = nb_server_app.web_app
    # web_app.log.info('My Extension Loaded')
    nb_server_app.log.info("egal enabled!")
    host_pattern = '.*$'
    download_pattern = url_path_join(web_app.settings['base_url'], '/draw/(.+)')
    web_app.add_handlers(host_pattern, [(download_pattern, DrawHandler)])
    print("Called")

    # https://github.com/ipython-contrib/jupyter_contrib_nbextensions/blob/8eb3f5fa24d37b4a20c25f08af39c481357b1150/src/jupyter_contrib_nbextensions/nbextensions/keyboard_shortcut_editor/main.js
    # https://github.com/ipython-contrib/jupyter_contrib_nbextensions/tree/master/src/jupyter_contrib_nbextensions/nbextensions
    # http://jupyter-notebook.readthedocs.io/en/latest/examples/Notebook/Distributing%20Jupyter%20Extensions%20as%20Python%20Packages.html
