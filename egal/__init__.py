from egal.handler import *
from notebook.utils import url_path_join


def _jupyter_server_extension_paths():
    return [{
        "module": "egal"
    }]


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
