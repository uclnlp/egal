# egal
easy SVG drawing in jupyter and elsewhere...

### Installation

#### Get the Python Package

Manually by cloning and changing the python path:
```bash
git clone https://github.com/uclmr/egal.git
cd egal
export PYTHONPATH=. 
```

#### Install and Enable Extension
```bash
jupyter nbextension install --py egal 
jupyter nbextension enable --py egal 
```

#### Optional: Server Extension 
If you want to use the server extensions (which allows clients to 
save the SVG on the jupyter server), run:

```bash
jupyter serverextension enable --py egal 
```