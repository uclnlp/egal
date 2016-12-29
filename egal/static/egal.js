navBar = '\
<nav class="navbar navbar-light bg-faded"> \
  <ul class="nav navbar-nav contexts"> \
    <li class="nav-item dropdown">\
      <a class="nav-link dropdown-toggle" href="#" id="supportedContentDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Image</a>\
      <div class="dropdown-menu" aria-labelledby="supportedContentDropdown">\
        <a id="clear" class="dropdown-item" href="#">Clear</a>\
        <a id="save" class="dropdown-item" href="#">Save</a>\
      </div>\
    </li>\
    <li id="selectContext" class="nav-item active"> \
      <a class="nav-link" href="#">Select<span class="sr-only">(current)</span></a>\
    </li>\
    <li id="makeRect" class="nav-item">\
      <a class="nav-link" href="#">Rect</a>\
    </li>\
    <li id="makeCircle" class="nav-item">\
      <a class="nav-link" href="#">Circle</a>\
    </li>\
    <li id="makeLine" class="nav-item">\
      <a class="nav-link" href="#">Line</a>\
    </li>\
    <li id="makeConnect" class="nav-item">\
      <a class="nav-link" href="#">Connect</a>\
    </li>\
    <li id="makeText" class="nav-item">\
      <a class="nav-link" href="#">Text</a>\
    </li>\
    <li class="nav-item dropdown">\
      <a class="nav-link dropdown-toggle" href="#" id="supportedContentDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Order</a>\
      <div class="dropdown-menu" aria-labelledby="supportedContentDropdown">\
        <a id="toFront" class="dropdown-item" href="#">To Front</a>\
        <a id="toBack" class="dropdown-item" href="#">To Back</a>\
      </div>\
    </li>\
  </ul>\
  <form class="form-inline float-xs-right">\
    <div class="input-group">\
      <span class="input-group-addon" id="basic-addon1">Stroke</span>\
      <input id="stroke" style="width:80px" class="form-control" type="number" placeholder="12">\
    </div>\
    <div class="input-group">\
      <span class="input-group-addon" id="basic-addon1">Color</span>\
      <input id="color" style="width:100px" class="form-control" type="text" placeholder="red">\
    </div>\
    <div class="input-group">\
      <span class="input-group-addon" id="basic-addon1">Fill</span>\
      <input id="fill" style="width:100px" class="form-control" type="text" placeholder="red">\
    </div>\
  </form>\
</nav>';


function trimPX(string) {
    return string.substring(0, string.length - 2);
}

define(['jquery', './snap.svg'], function ($, snap) {

//view-source:https://viereck.ch/latex-to-svg/
//http://stackoverflow.com/questions/34924033/convert-latex-mathml-to-svg-or-image-with-mathjax-or-similar
    function Egal(container, drawName, options) {
        this.options = options;
        this.container = container;
        this.drawName = drawName;
        this.snap = null;
        this.drawing = container + ' div.drawing';
        this.svg = this.drawing + ' svg';
        this.menuSVG = container + ' div.menu svg';
        this.currentId = 0;
        var self = this;

        this.createNewId = function () {
            self.currentId += 1;
            return 'drup_elem_' + self.currentId;
        };

        console.log("Created Egal");

        this.makeCircle = new MakeCircleContext(this);
        this.makeRect = new MakeRectangleContext(this);
        this.selectionContext = new SelectionContext(this);
        this.textContext = new TextContext(this);
        this.lineContext = new LineContext(this);
        this.connectContext = new ConnectContext(this);
        this.currentContext = this.selectionContext;

        function linkContextButton(selector, context) {
            $(selector + ' a').click(function () {
                self.currentContext = context;
                $('.contexts li').removeClass("active");
                $(selector).addClass("active");
            })
        }


        // $(self.container).append(menuDiv);
        $(self.container).append($(navBar));
        $(self.container).append("<div class='drawing'></div>");
        $(self.container).append("<div class='hidden' style=''></div>");

        linkContextButton('#makeRect', this.makeRect);
        linkContextButton('#makeCircle', this.makeCircle);
        linkContextButton('#makeLine', this.lineContext);
        linkContextButton('#makeConnect', this.connectContext);
        linkContextButton('#makeText', this.textContext);
        linkContextButton('#selectContext', this.selectionContext);

        $("#toFront").click(function () {
            self.selectionContext.moveToFront();
        });
        $("#toBack").click(function () {
            self.selectionContext.moveToBack();
        });

        $("#clear").click(function () {
            $(self.svg).empty();
            $(self.drawing + ">div").remove();
            self.connectContext.clear();
            self.currentId = 0;

        });
        $("#save").click(function () {
            self.saveCurrentSVG();
        });

        $("#stroke").change(function () {
            var snapSelection = new Snap(self.selectionContext.currentSelection);
            snapSelection.attr({strokeWidth: $('#stroke').val()})
        });

        $("#fill").change(function () {
            var snapSelection = new Snap(self.selectionContext.currentSelection);
            snapSelection.attr({fill: $('#fill').val()})
        });

        $("#color").change(function () {
            var snapSelection = new Snap(self.selectionContext.currentSelection);
            snapSelection.attr({stroke: $('#color').val()})
        });

        this.selectionContext.onSelect(function (elem) {
            snapElem = new Snap(elem);
            console.log(snapElem.attr("fill"));
            $('#stroke').val(trimPX(snapElem.attr("strokeWidth")));
            $('#fill').val(Snap.color(snapElem.attr("fill")).hex);
            $('#color').val(Snap.color(snapElem.attr("stroke")).hex);
        });

        ;

        this.activateElement = function (elem) {
            elem.click(function (e) {
                if (self.currentContext.onClickElement) self.currentContext.onClickElement(e, this);
            });
            elem.mousedown(function (e) {
                console.log("MouseDown!");
                if (self.currentContext.onMouseDownElement) self.currentContext.onMouseDownElement(e, this);
            });
        };

        this.registerElement = function (elem) {
            elem.attr({id: self.createNewId()}).addClass("drupElem");
            this.activateElement(elem);
        };

        $.get('/draw/' + self.drawName, function (data, status) {
            $(self.drawing).html(data);
            $(self.svg).attr("height", self.options.height || 600);
            $(self.svg).attr("width", self.options.width || 400);
            self.snap = Snap($(self.svg).get(0));
            self.filter = self.snap.filter(Snap.filter.shadow(0, 2, 3));

            self.activateElement($(self.svg).find("*"));
            self.currentId = $(".drupElem").length;
            // $(self.svg).find("*").click(function (e) {
            //     if (self.currentContext.onClickElement) self.currentContext.onClickElement(e, this);
            // });
            $(self.drawing).click(function (e) {
                if (self.currentContext.onClick) self.currentContext.onClick(e, this);
            });
            $(self.drawing).mousemove(function (e) {
                if (self.currentContext.onMouseMove) self.currentContext.onMouseMove(e, this);
            });
            $(self.drawing).mousedown(function (e) {
                if (self.currentContext.onMouseDown) self.currentContext.onMouseDown(e, this);
            });
            $(self.drawing).mouseup(function (e) {
                if (self.currentContext.onMouseUp) self.currentContext.onMouseUp(e, this);
            });

            self.connectContext.loadConnectors();
            console.log("Set SVG");
            // MathJax.Hub.Queue(["Typeset", MathJax.Hub, self.svg])

        });


        this.saveCurrentSVG = function () {
            self.connectContext.saveConnectors();
            var cloned = $(self.drawing).clone();
            cloned.find(".transient").remove();
            $.ajax({
                type: 'POST',
                url: '/draw/' + drawName,
                data: cloned.html(),
                contentType: "text/xml",
                dataType: "text",
                success: function (data, status) {
                    console.log(data);
                }
            });
        };


    }

    function MakeCircleContext(drupyter) {
        this.drupyter = drupyter;
        var self = this;
        var centerX = -1;
        var centerY = -1;
        var circle = null;

        this.onClick = function (e, element) {
            if (circle) {
                console.log(circle.attr('cx'));
                var cx = Number(circle.attr('cx'));
                var cy = Number(circle.attr('cy'));
                var radius = Number(circle.attr('r'));
                var attr = {stroke: "#000", strokeWidth: 1, fill: '#fff'}; //fillOpacity: 0
                var group = drupyter.snap.group(circle);
                group.append(drupyter.snap.circle(cx, cy - radius, 5).attr(attr).addClass("endPoint up"));
                group.append(drupyter.snap.circle(cx, cy + radius, 5).attr(attr).addClass("endPoint down"));
                group.append(drupyter.snap.circle(cx - radius, cy, 5).attr(attr).addClass("endPoint left"));
                group.append(drupyter.snap.circle(cx + radius, cy, 5).attr(attr).addClass("endPoint right"));
                // var group = drupyter.snap.group(circle, upEndPoint, downEndPoint, leftEndPoint, rightEndPoint);
                console.log(group);
                drupyter.registerElement($(group.node));
                drupyter.saveCurrentSVG();
                circle = null;

            } else {
                var offset = $(element).offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                centerX = x;
                centerY = y;
                circle = drupyter.snap.circle(x, y, 0);

                circle.attr({
                    fill: "#fff",
                    stroke: "#000",
                    strokeWidth: 1,
                });
                // var remembered = circle.node;
                // $(circle.node).click(function (e) {
                //     if (drupyter.currentContext.onClickElement) drupyter.currentContext.onClickElement(e, remembered);
                // });
            }
        };

        this.onMouseMove = function (e, element) {
            if (circle) {
                var offset = $(element).offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                circle.attr({
                    r: Math.max(Math.abs(centerX - x), Math.abs(centerY - y))
                })
            }
        };

        this.onClickElement = function (e, element) {
            console.log("Selected in MakeCircle Mode");
        }


    }

    function SelectionContext(drupyter) {

        this.currentSelection = null;
        var startX = 0;
        var startY = 0;
        var oldMatrix = null;
        var moving = false;
        var listeners = [];
        var moveListeners = [];
        var self = this;

        this.onSelect = function (listener) {
            listeners.push(listener)
        };

        this.onMove = function (listener) {
            moveListeners.push(listener)
        };

        this.onClick = function (e, element) {
            // console.log("OnClick");
            // if (currentSelection) {
            //     currentSelection = null
            // }
        };

        this.selectElement = function (elem) {
            console.log(this.listeners);
            this.currentSelection = elem;
            $.each(listeners, function (index, value) {
                value(elem);
            });
        };


        this.onMouseMove = function (e, element) {
            console.log("Move");
            // console.log(currentSelection);
            if (moving) {
                var x = e.pageX;
                var y = e.pageY;
                newMatrix = new Snap.Matrix(1, 0, 0, 1, x - startX, y - startY);
                console.log(oldMatrix);
                if (oldMatrix.e && oldMatrix.f) {
                    console.log(oldMatrix.e);
                    newMatrix = new Snap.Matrix(
                        oldMatrix.a, oldMatrix.b, oldMatrix.c,
                        oldMatrix.d, oldMatrix.e + x - startX, oldMatrix.f + y - startY);
                    console.log(newMatrix)
                }
                new Snap(this.currentSelection).attr({
                    transform: newMatrix
                });
                $.each(moveListeners, function (index, listener) {
                    listener(self.currentSelection);
                });

            }

        };

        this.onMouseDownElement = function (e, element) {
            console.log("Clicked " + element);
            startX = e.pageX;
            startY = e.pageY;
            this.selectElement(element);
            var snapElement = new Snap(this.currentSelection);
            snapElement.attr({filter: drupyter.filter});
            oldMatrix = snapElement.attr("transform").localMatrix; //$(currentSelection).attr("transform");
            moving = true;
            // are we at the border of element?
            console.log("BBOX");
            console.log(snapElement);
            console.log(snapElement.getBBox());

        };

        this.moveToFront = function () {
            var detached = $(this.currentSelection).detach();
            $(drupyter.svg).append(detached);
        };

        this.moveToBack = function () {
            var detached = $(this.currentSelection).detach();
            $(drupyter.svg).prepend(detached);
        };

        this.onMouseUp = function (e, element) {
            console.log("MouseUp");
            moving = false;
            new Snap(this.currentSelection).attr({filter: null});
            // currentSelection = null;
        };

        this.onClickElement = function (e, element) {
            // console.log("Clicked " + element);
            // currentSelection = element;
        };
    }


    function LineContext(drupyter) {

        var line = null;

        this.onClick = function (e, element) {
            if (line) {
                line = null;
                drupyter.saveCurrentSVG();
            } else {
                var offset = $(element).offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                line = drupyter.snap.line(x, y, x, y).attr({
                    stroke: '#00ADEF'
                });
                drupyter.registerElement($(line.node));
                drupyter.selectionContext.selectElement(line.node);
            }
        };

        this.onClickElement = function (e, element) {

            console.log("Clicked " + element);
        };

        this.onMouseMove = function (e, element) {
            if (line) {
                console.log("Changing ...");
                var offset = $(element).offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                line.attr({
                    x2: x,
                    y2: y
                })
            }
        }
    }

    function ConnectContext(drupyter) {

        var line = null;
        var connectors = [];
        var currentStart = null;
        var elem2line = {};

        drupyter.selectionContext.onMove(function (elem) {
            var bbox = new Snap(elem).getBBox();
            console.log("Moved " + elem);
            // line.attr({x2: bbox.cx, y2: bbox.cy})
            var elemLine = elem2line[elem.id];
            console.log(elemLine);
            if (elemLine) {
                $.each(elemLine, function (index, elem) {
                    if (elem.start) {
                        elem.line.attr({x1: bbox.cx, y1: bbox.cy})
                    } else {
                        elem.line.attr({x2: bbox.cx, y2: bbox.cy})
                    }
                })
            }
        });

        this.clear = function () {
            connectors = [];
            elem2line = {};
        };

        this.saveConnectors = function () {
            var currentConnectors = $(drupyter.drawing).children(".connector");
            console.log(currentConnectors);
            if (currentConnectors) {
                currentConnectors.remove();
            }
            $.each(connectors, function (index, connector) {
                $(drupyter.drawing).append($("<div>", {class: "connector", n1: connector.n1, n2: connector.n2}));
            })
        };

        this.loadConnectors = function () {
            var connectors = $(drupyter.drawing).children(".connector");
            connectors.each(function (i, elem) {
                console.log(elem);
                console.log(typeof(elem));
                console.log($(elem));
                //    todo: set up line
                //     var line = drupyter.snap.line({})
                let id1 = elem.getAttribute("n1");
                let id2 = elem.getAttribute("n2");
                var n1 = drupyter.snap.select('#' + id1);
                var n2 = drupyter.snap.select('#' + id2);
                var b1 = n1.getBBox();
                var b2 = n2.getBBox();
                var line = drupyter.snap.line({
                    x1: b1.cx,
                    y1: b1.cy,
                    x2: b2.cx,
                    y2: b2.cy
                }).attr({stroke: '#000'}).addClass("transient").prependTo(drupyter.snap);
                if (!elem2line[id1]) elem2line[id1] = [];
                if (!elem2line[id2]) elem2line[id2] = [];
                elem2line[id1].push({line: line, start: true});
                elem2line[id2].push({line: line, start: false});
                connectors.push({n1: id1, n2: id2});
            });
        };


        this.onClickElement = function (e, element) {
            var id = $(element).attr('id');
            var bbox = new Snap(element).getBBox();
            if (currentStart == null) {
                currentStart = id;
                line = drupyter.snap.line(bbox.cx, bbox.cy, bbox.cx, bbox.cy).attr({
                    stroke: '#000',
                }).addClass("transient");
                line.prependTo(drupyter.snap);
                console.log("Clicked start: " + id);
                if (!elem2line[id]) elem2line[id] = [];
                elem2line[id].push({line: line, start: true});
            } else {
                console.log("Clicked end: " + id);
                line.attr({x2: bbox.cx, y2: bbox.cy});
                console.log(element.id);
                if (!elem2line[id]) elem2line[id] = [];
                elem2line[id].push({line: line, start: false});
                connectors.push({n1: currentStart, n2: element.id});
                currentStart = null;
                console.log(elem2line);
            }
        };

    }


    function TextContext(drupyter) {

        var num = 0;
        var field = null;
        var text = null;

        this.onClick = function (e, element) {
            if (field) {
                $(field).remove();
                $(text.node).remove();
            }
            var offset = $(element).offset();
            var x = e.pageX - offset.left;
            var y = e.pageY - offset.top;
            var text = drupyter.snap.text(0, 0, "");
            var textGroup = drupyter.snap.group(text);
            drupyter.registerElement($(textGroup.node));
            var svgns = "http://www.w3.org/2000/svg";
            var field = document.createElementNS(svgns, "foreignObject");
            field.setAttributeNS(null, "x", x);
            field.setAttributeNS(null, "y", y);
            field.setAttributeNS(null, "width", 50);
            field.setAttributeNS(null, "height", 30);
            var textInput = $("<input id='input" + num + "' type='text'>");
            $(field).append(textInput);
            // field.innerHTML = "<input type='text'>";
            // var textInput = $(field).children().get(0);
            $(drupyter.svg).append(field);
            console.log(textInput);
            textInput.focus();
            num += 1;


            $(field).keypress(function (e) {
                if (e.keyCode == 13) {
                    console.log($(textInput).val());
                    textGroup.attr({
                        transform: new Snap.Matrix(1, 0, 0, 1, x, y + $(textInput).height())
                    });

                    text.attr({
                        text: $(textInput).val()
                    });

                    // $(this).remove();
                    // field.innerHTML = "<div>" + $(textInput).val() + "</div>";
                    // var textDiv = $(field).children().get(0);
                    // var hidden = $(drupyter.container + ' div.hidden');
                    // hidden.text($(textInput).val());
                    // console.log(hidden);
                    $(field).remove();
                    // MathJax.Hub.Queue(["Typeset", MathJax.Hub, hidden.get(0)]);
                    // MathJax.Hub.Queue(function () {
                    //     console.log("Done!");
                    //     console.log(x);
                    //     console.log(y);
                    //     created_group = $(drupyter.container + ' div.hidden span svg g');
                    //
                    //     console.log(created_group);
                    //     $(drupyter.svg).append(created_group);
                    //     // snap_group = Snap(created_group.get(0));
                    //     // console.log(snap_group.node);
                    //     var myMatrix = new Snap.Matrix(0.05, 0, 0, -0.05, x, y);
                    //     created_group.attr({
                    //         transform: myMatrix
                    //     });
                    //     // // myMatrix.scale(0.05, -0.05);            // play with scaling before and after the rotate
                    //     // // myMatrix.translate(x, y);      // this translate will not be applied to the rotation
                    //     // // myMatrix.rotate(0);            // rotate
                    //     // snap_group.attr({transform: myMatrix});
                    //     // // var group = drupyter.snap.group(created_SVG.get(0));
                    //     // // console.log(group)
                    //     // $(drupyter.svg).append(snap_group.node);
                    //     drupyter.saveCurrentSVG();
                    // });

                }
            });

        };


    }

    function MakeRectangleContext(drupyter) {
        this.drupyter = drupyter;
        var self = this;
        var centerX = -1;
        var centerY = -1;
        var rect = null;

        this.onClick = function (e, element) {
            if (rect) {
                rect = null;
                drupyter.saveCurrentSVG();
            } else {
                var offset = $(element).offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                centerX = x;
                centerY = y;
                rect = drupyter.snap.rect(x, y, 0, 0);
                rect.attr({
                    fill: "#fff",
                    stroke: "#000",
                    strokeWidth: 1,
                });
                var remembered = rect.node;
                drupyter.registerElement($(rect.node));

                // $(rect.node).click(function (e) {
                //     if (drupyter.currentContext.onClickElement) drupyter.currentContext.onClickElement(e, remembered);
                // });
            }
        };

        this.onMouseMove = function (e, element) {
            if (rect) {
                console.log("Changing ...");
                var offset = $(element).offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                var top = Math.min(y, centerY);
                var left = Math.min(x, centerX);
                var width = Math.max(x, centerX) - left;
                var height = Math.max(y, centerY) - top;


                rect.attr({
                    x: left,
                    y: top,
                    height: height,
                    width: width,
                })
            }
        };

        this.onClickElement = function (e, element) {
            console.log("Selected in MakeCircle Mode");
        }


    }

    return {
        Egal: Egal
    }
});
