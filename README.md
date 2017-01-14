# egal
easy SVG drawing in jupyter and elsewhere...

### Example
![](screenshot.png)

### Instructions
Click on the "brush" icon in the jupyter toolbar to create an SVG cell below the current selection.
### Features

egal's focus is on drawing simple graphs:  

* Basic Shapes (circles, rectangles, lines)
* Connectors
* Labels, with support for Latex
* Alignment hints when dragging and resizing
* Multiple Selection
* Copy & Paste

### How Does it Work?
egal creates a `raw` jupyter cell and stores the edited SVG in the source code field of that cell. 

### Installation

#### Get the Python Package

Manually by cloning and changing the python path:
```bash
git clone https://github.com/uclmr/egal.git
cd egal
export PYTHONPATH=. 
```

**or** (experimental) install python package directly:
```bash
pip3 install git+https://github.com/uclmr/egal.git
```

#### Install and Enable Extension
```bash
jupyter nbextension install --py egal 
jupyter nbextension enable --py egal 
```

#### Optional: Server Extension 
If you want to use egal outside of a notebook you need to install the server extensions (which allows clients to 
save the SVG on the jupyter server):

```bash
jupyter serverextension enable --py egal 
```

Then you can edit an SVG on the server via accessing http://localhost:8888/files/draw.html (assuming you run
`jupyter notebook` locally).

