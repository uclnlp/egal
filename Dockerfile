FROM jupyter/minimal-notebook

MAINTAINER Sebastian Riedel <sebastian.riedel@gmail.com>

RUN pip install \
    git+git://github.com/uclmr/egal.git@0.1.3

RUN jupyter nbextension install egal --py --sys-prefix

RUN jupyter nbextension enable egal --py --sys-prefix

RUN jupyter serverextension enable egal --py

COPY example.ipynb .