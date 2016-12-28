from notebook.base.handlers import IPythonHandler
import os
import os.path

__UPLOADS__ = "drawings"

os.makedirs(__UPLOADS__, exist_ok=True)


def filename_for_drawing(drawing_name):
    filename = __UPLOADS__ + '/' + drawing_name + '.svg'
    return filename


class DrawHandler(IPythonHandler):
    def get(self, draw_name):
        filename = filename_for_drawing(draw_name)
        if os.path.isfile(filename):
            f = open(filename, 'rb')
            content = f.read()
            self.finish(content)
        else:
            result = """<svg></svg>"""
            self.finish(result)

    def post(self, draw_name):
        body = self.request.body
        f = open(filename_for_drawing(draw_name), 'wb')
        # f.write(str(body))
        f.write(body)
        f.close()
        self.finish('Saved as {file}'.format(file=f.name))
