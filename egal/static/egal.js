function trimPX(string) {
    return string.substring(0, string.length - 2);
}

function appendToList(dict, key, value) {
    if (!dict[key]) dict[key] = [];
    dict[key].push(value)
}

define(['jquery', './snap.svg', './text!./menu.html'], function ($, snap, menuTxt) {

    // MathJax.Hub.Config({
    //     jax: ["input/TeX", "output/SVG", "output/PreviewHTML"],
    // });

    function my$each(elements, f) {
        if (elements) {
            $.each(elements, f)
        }
    }

    function addClass(selector, classes) {
        $(selector).each(function (index, elem) {
            elem.classList.add(classes);
        })
    }

    function removeClass(selector, classes) {
        $(selector).each(function (index, elem) {
            elem.classList.remove(classes);
        })
    }

    function toggleClass(selector, classes) {
        $(selector).each(function (index, elem) {
            elem.classList.toggle(classes);
        })
    }


    /**
     * This creates an Egal editor within the specified container.
     * @param container a CSS selector to specify the container in which the editor will live.
     * @param options a set of options:
     * <ul>
     *     <li>width: the desired width of the SVG (100% by default), if not specified by SVG content</li>
     *     <li>height: the desired height of the SVG (400 by default), if not specified by SVG content</li>
     *     <li>content: a string containing an SVG image, can be empty. Only used if `drawName` is not set.</li>
     *     <li>drawName: a name of the drawing used to save and load the drawing on the notebook server.
     *     When not set content will load from `content` option.</li>
     * </ul>
     *
     * @constructor
     */
    function Egal(container, options) {
        this.options = options;
        this.container = container;
        this.snap = null;
        this.drawing = container + ' div.drawing';
        this.svg = this.drawing + ' svg';
        this.jsvg = null;
        this.jcontainer = $(this.container);
        this.menuSVG = container + ' div.menu svg';
        this.currentId = 0;
        this.menuBarListeners = [];
        this.currentFirstFrame = 1;
        this.currentLastFrame = 1;
        var self = this;

        this.createNewId = function () {
            self.currentId += 1;
            return 'drup_elem_' + self.currentId;
        };

        // console.log("Created Egal");

        this.makeCircle = new MakeCircleContext(this);
        this.makeRect = new MakeRectangleContext(this);
        this.selectionContext = new SelectionContext(this);
        this.textContext = new TextContext(this);
        // this.lineContext = new LineContext(this);
        this.connectContext = new ConnectContext(this);
        this.lineContext = new MakeLineContext(this);
        this.poylineContext = new MakePolyLineContext(this);
        this.currentContext = this.selectionContext;

        function linkContextButtonNew(selector, context, update) {
            $(selector).click(function () {
                self.currentContext = context;
                // console.log("Button Clicked!");
                $(self.container + " .egal-menu li").removeClass("active");
                $(selector).addClass("active");
                self.selectionContext.selectElement(null);
                update && update();

            })
        }

        function linkActionButton(selector, action) {
            $(selector).click(function () {
                action();
            });
            $(selector).mousedown(function () {
                $(selector).addClass("active");
            });
            $(selector).mouseup(function () {
                $(selector).removeClass("active");
            });
        }

        function linkToggleButton(selector, action) {
            $(selector).click(function () {
                action();
            });
        }


        // $(self.container).append(menuDiv);
        $(self.container).append($(menuTxt));
        $(self.container).append("<div class='drawing'></div>");

        linkContextButtonNew(self.container + " .select", this.selectionContext);
        $(self.container + " .select").addClass("active");
        $(self.container + " .style-menu").hide();

        linkContextButtonNew(self.container + " .makeRect", this.makeRect);
        linkContextButtonNew(self.container + " .makeCircle", this.makeCircle);
        linkContextButtonNew(self.container + " .makeText", this.textContext);
        linkContextButtonNew(self.container + " .makeArrow", this.connectContext, function () {
            self.connectContext.arrow = true;
            // console.log("Blah");
        });
        linkContextButtonNew(self.container + " .makeLine", this.lineContext);
        linkContextButtonNew(self.container + " .makePolyline", this.poylineContext);

        // $(self.container + " .toggle-visible").click(function() {
        //     $(self.container + " .toggle-visible i").toggleClass("fa-toggle-on");
        //     $(self.container + " .toggle-visible i").toggleClass("fa-toggle-off");
        //     $(self.container + " .egal-menu").toggle();
        // });

        this.onMenuBarToggle = function (l) {
            self.menuBarListeners.push(l);
        };

        this.toggleMenuBar = function () {
            $(self.container + " .toggle-visible i").toggleClass("fa-toggle-on");
            $(self.container + " .toggle-visible i").toggleClass("fa-toggle-off");
            $(self.container + " .hideable").toggle();
            my$each(self.menuBarListeners, function (index, l) {
                l();
            })
        };

        linkToggleButton(self.container + " .toggle-visible", this.toggleMenuBar);

        linkActionButton(self.container + " .clear", function () {
            // $(self.svg).empty();
            // $(self.drawing + ">div").remove();
            $(self.snap.node).find(".drupElem").remove();
            self.selectionContext.selectElement(null);
            self.connectContext.clear();
            self.currentId = 0;
        });
        linkActionButton(self.container + " .save", function () {
            self.saveCurrentSVG();
        });
        linkActionButton(self.container + " .cut", function () {
            // $(self.svg).empty();
            // $(self.drawing + ">div").remove();
            self.selectionContext.cutSelection();
        });
        linkActionButton(self.container + " .paste", function () {
            // $(self.svg).empty();
            // $(self.drawing + ">div").remove();
            self.selectionContext.pasteSelection();
        });

        // $(self.container + " .style").click(function () {
        //     console.log($(self.container + " .style-modal"));
        //     $(self.container + " .style-modal").modal('show');
        // });


        $(self.container + " .toFront").click(function () {
            self.selectionContext.moveToFront();
        });
        $(self.container + " .toBack").click(function () {
            self.selectionContext.moveToBack();
        });

        $(self.container + " .wi").change(function () {
            self.jsvg.find(".egal-select .core").css({strokeWidth: $(self.container + " .wi").val()});
            self.saveCurrentSVG();
        });
        $(self.container + " .fg").change(function () {
            self.jsvg.find(".egal-select .core").attr({stroke: $(self.container + " .fg").val()});
            self.saveCurrentSVG();
        });
        $(self.container + " .bg").change(function () {
            // var snapSelection = new Snap(self.selectionContext.currentSelection);
            self.jsvg.find(".egal-select .core").attr({fill: $(self.container + " .bg").val()});
            self.saveCurrentSVG();
        });
        $(self.container + " .height").change(function () {
            self.snap.attr({height: $(self.container + " .height").val()});
            self.saveCurrentSVG();
        });
        $(self.container + " .firstFrameShow").change(function () {
            self.currentFirstFrame = parseInt($(self.container + " .firstFrameShow").val());
            if (self.currentFirstFrame < 0) {
                self.currentFirstFrame = 0;
                $(self.container + " .firstFrameShow").val(self.currentFirstFrame);
            }
            if (self.currentFirstFrame > self.currentLastFrame) {
                self.currentLastFrame = self.currentFirstFrame;
                $(self.container + " .lastFrameShow").val(self.currentLastFrame);
            }
            self.hideOutsideFrames();
        });
        $(self.container + " .lastFrameShow").change(function () {
            self.currentLastFrame = parseInt($(self.container + " .lastFrameShow").val());
            if (self.currentLastFrame < 0) {
                self.currentLastFrame = 0;
                $(self.container + " .lastFrameShow").val(self.currentLastFrame);
            }
            if (self.currentFirstFrame > self.currentLastFrame) {
                self.currentFirstFrame = self.currentLastFrame;
                $(self.container + " .firstFrameShow").val(self.currentFirstFrame);
            }
            self.hideOutsideFrames();
        });
        linkActionButton(self.container + " .stepForward", function () {
            // console.log("Stepping forward!");
            self.currentFirstFrame += 1;
            $(self.container + " .firstFrameShow").val(self.currentFirstFrame);
            if (self.currentLastFrame < self.currentFirstFrame) {
                self.currentLastFrame = self.currentFirstFrame;
                $(self.container + " .lastFrameShow").val(self.currentLastFrame);
            }
            self.hideOutsideFrames();

        });
        linkActionButton(self.container + " .stepBackward", function () {
            self.currentLastFrame -= 1;
            $(self.container + " .lastFrameShow").val(self.currentLastFrame);
            if (self.currentLastFrame < self.currentFirstFrame) {
                self.currentFirstFrame = self.currentLastFrame;
                $(self.container + " .firstFrameShow").val(self.currentFirstFrame);
            }
            self.hideOutsideFrames();

        });

        $(self.container + " .endArrow").change(function () {
            // var snapSelection = new Snap(self.selectionContext.currentSelection);
            var checked = $(self.container + " .endArrow").prop('checked');
            var marker = checked ? "url(#" + self.marker.attr('id') + ")" : '';
            self.jsvg.find(".egal-select .egal-line").css({"marker-end": marker});
            self.saveCurrentSVG();
        });
        $(self.container + " .startArrow").change(function () {
            // var snapSelection = new Snap(self.selectionContext.currentSelection);
            var checked = $(self.container + " .startArrow").prop('checked');
            var marker = checked ? "url(#" + self.startMarker.attr('id') + ")" : '';
            self.jsvg.find(".egal-select .egal-line").css({"marker-start": marker});
            self.saveCurrentSVG();
        });
        $(self.container + " .firstFrame").change(function () {
            self.jsvg.find(".egal-select").attr({"first-frame": parseInt($(self.container + " .firstFrame").val())});
            self.hideOutsideFrames();
            self.saveCurrentSVG();
        });
        $(self.container + " .lastFrame").change(function () {
            self.jsvg.find(".egal-select").attr({"last-frame": parseInt($(self.container + " .lastFrame").val())});
            self.hideOutsideFrames();
            self.saveCurrentSVG();
        });


        this.selectionContext.onSelect(function (snapElem) {
            if (snapElem) {
                var core = snapElem.select(".core");
                // console.log(snapElem.attr("fill"));
                $(self.container + " .generic-style").show();
                $(self.container + " .wi").val(trimPX(core.attr("strokeWidth")));
                $(self.container + " .bg").val(Snap.color(core.attr("fill")).hex);
                $(self.container + " .fg").val(Snap.color(core.attr("stroke")).hex);
                $(self.container + " .firstFrame").val(snapElem.attr("first-frame"));
                $(self.container + " .lastFrame").val(snapElem.attr("last-frame"));
                if (core.hasClass("egal-line")) {
                    $(self.container + " .line-style").show();
                    $(self.container + " .startArrow").prop('checked',
                        self.jsvg.find(".egal-select .egal-line").css('marker-start') != "none");
                    $(self.container + " .endArrow").prop('checked',
                        self.jsvg.find(".egal-select .egal-line").css('marker-end') != "none");
                } else {
                    $(self.container + " .line-style").hide();
                }
            } else {
                $(self.container + " .generic-style").hide();
                $(self.container + " .line-style").hide();

            }
        });


        this.hideOutsideFrames = function () {
            var elems = self.snap.selectAll(".drupElem")
            for (var i = 0; i < elems.length; i++) {
                var elem = $(elems[i].node);
                // console.log(elem);
                // console.log(elem.attr("first-frame"));
                // console.log(elem.attr("last-frame"));
                var firstFrame = elem.attr("first-frame") === undefined ? 1 : elem.attr("first-frame");
                var lastFrame = elem.attr("last-frame") === undefined ? 10000 : elem.attr("last-frame");

                if (lastFrame < self.currentFirstFrame || firstFrame > self.currentLastFrame) {
                    elem.hide();
                } else {
                    elem.show();
                }
            }

        };

        this.activateElement = function (elem) {
            elem.click(function (e) {
                if (self.currentContext.onClickElement) self.currentContext.onClickElement(e, this);
            });
            elem.dblclick(function (e) {
                if (self.currentContext.onDblClickElement) self.currentContext.onDblClickElement(e, this);
                // this.node.focus();
            });
            elem.mousedown(function (e) {
                // console.log("MouseDown!");
                if (self.currentContext.onMouseDownElement) self.currentContext.onMouseDownElement(e, this);
            });
            elem.mouseover(function (e) {
                if (self.currentContext.onMouseOver) self.currentContext.onMouseOver(e, this);
            });
            elem.selectAll(".endPoint").forEach(function (endPoint) {
                endPoint.drag(
                    function (dx, dy, x, y, event) {
                        if (self.currentContext.onDragEndPoint) self.currentContext.onDragEndPoint(dx, dy, x, y, event, this);
                    },
                    function (x, y, event) {
                        if (self.currentContext.onDragEndPointStart) self.currentContext.onDragEndPointStart(x, y, event, this);
                    },
                    function (x, y, event) {
                        if (self.currentContext.onDragEndPointEnd) self.currentContext.onDragEndPointEnd(x, y, event, this);
                    }
                );
                endPoint.click(function (event) {
                    if (self.currentContext.onClickEndPoint) self.currentContext.onClickEndPoint(event, this);
                });
            });
            elem.selectAll(".core").forEach(function (core) {
                core.drag(
                    function (dx, dy, x, y, event) {
                        if (self.currentContext.onDragCore) self.currentContext.onDragCore(dx, dy, x, y, event, this);
                    },
                    function (x, y, event) {
                        if (self.currentContext.onDragCoreStart) self.currentContext.onDragCoreStart(x, y, event, this);
                    },
                    function (event) {
                        if (self.currentContext.onDragCoreEnd) self.currentContext.onDragCoreEnd(event, this);
                    }
                );
                core.click(function (e) {
                    if (self.currentContext.onClickCore) self.currentContext.onClickCore(e, this);
                });
            })

        };

        this.registerAndDecorateElement = function (elem) {
            this.registerElement(elem);
            var bbox = elem.getBBox();
            var label = self.snap.text(bbox.cx, bbox.cy, "").addClass("egal-label sub").attr({
                'font-size': 20,
                "text-anchor": "middle",
                "alignment-baseline": "central",
                text: "|",
                opacity: 0.0,
                "data-src": ""
            });
            elem.append(label);
        };

        this.registerElement = function (elem) {
            elem.attr({id: self.createNewId()}).addClass("drupElem");
            elem.attr({
                "first-frame": self.currentFirstFrame,
                "last-frame": self.currentLastFrame
            });
            elem.selectAll(".endPoint").forEach(function (endPoint, index) {
                endPoint.attr({id: elem.attr("id") + "_endpoint_" + index})
            });
            this.activateElement(elem);
        };

        this.convertLatexBack = function (selector) {
            selector.each(function (i, label) {
                var snapLabel = new Snap(label);
                if (snapLabel.hasClass("mathjax_text")) {
                    var bbox = self.snap.select('#' + snapLabel.parent().attr("id")).getBBox();
                    // console.log(snapLabel.parent());
                    // console.log(snapLabel.parent().attr("id"));

                    // console.log(bbox);
                    var textVal = snapLabel.attr("data-src");
                    var newLabel = snapLabel.paper.text(bbox.cx, bbox.cy, textVal).attr({
                        'font-size': 20,
                        "text-anchor": "middle",
                        "alignment-baseline": "central",
                        "data-src": textVal,
                    }).addClass("egal-label sub");
                    $(snapLabel.node).replaceWith(newLabel.node);
                    // console.log("Removed!");
                }
            })
        };

        this.convertLatex = function (selector) {
            var fontSize = 20;
            // position: fixed; top: 0; left:0;
            var height = Number(self.jsvg.attr("height"));
            var tmpLatex = $("<div class='temp-latex' style='position: relative; top: " + (-height) + "px; visibility: hidden;'></div>").appendTo(self.jcontainer);
            // collect all text elements and create sub divs
            var div2text = {};
            selector.each(function (i, text) {
                // console.log("Processing text element");
                if (!$(text).hasClass("mathjax_text")) {
                    // console.log(text);
                    var source = text.getAttribute("data-src");
                    var id = 'egal-latex' + i;
                    //position: fixed; top: 0; left:0;
                    var div = $("<div class='temp-latex-text' style='width: 100%; position: absolute; top: 0; left:0; font-size: " + fontSize + "px'; id='" + id + "'>" + source + "</div>")
                        .appendTo(tmpLatex);
                    div2text[id] = text;
                }
            });
            // console.log("What");
            // console.log(tmpLatex.children()[0]);
            //
            MathJax.Hub.Queue(
                ["Typeset", MathJax.Hub, tmpLatex[0]],
                function () {
                    //for SVG output
                    // console.log(tmpLatex.find("svg"));
                    tmpLatex.find("svg").each(function (i, mj) {
                        // console.log(mj);
                        var jmj = $(mj);
                        var text = div2text[mj.parentNode.parentNode.parentNode.id];
                        var bbox = new Snap(text).getBBox();
                        // var foreign = $(createForeignInput(
                        //     bbox.cx - (jmj.width() / 2),
                        //     bbox.cy - (jmj.height() / 2), jmj.width(), jmj.height()));
                        // foreign.append(mj);
                        var group = drupyter.snap.group(new Snap(mj));// );
                        var gbbox = group.getBBox();
                        // group.addClass("")
                        group.addClass("sub mathjax_text egal-label"); //todo change to be more generic
                        group.attr("data-src", text.getAttribute("data-src"));
                        group.transform("t" + (bbox.cx - gbbox.width / 2) + "," + (bbox.cy - gbbox.height / 2));
                        // console.log(text);
                        // console.log($(text).parent());
                        new $(text).replaceWith(group.node);
                    });
                    //for HTML-CSS output
                    tmpLatex.find(".MathJax").each(function (i, mj) {
                        var jmj = $(mj);
                        // console.log(jmj);
                        var span = jmj.find("> nobr > span");
                        var text = div2text[mj.parentNode.parentNode.id];
                        var bbox = new Snap(text).getBBox();
                        var foreign = $(createForeignInput(
                            bbox.cx - (span.width() / 2),
                            bbox.cy - (span.height() / 2), span.width(), span.height()));
                        // console.log(span);
                        // console.log(span.width());
                        // console.log(bbox);
                        foreign.append(mj);
                        foreign.attr("class", "sub-foreign mathjax_text egal-label");
                        foreign.attr("style", "color: black; font-size: " + fontSize + "px");
                        // foreign.addClass("sub-foreign mathjax_text label"); //todo change to be more generic
                        foreign.attr("data-src", text.getAttribute("data-src"));
                        new $(text).replaceWith(foreign);
                    });


                    tmpLatex.remove();
                    // console.log("Done!");
                }
            );
            //Call MathJax.Hub.Queue(["Typeset",..], copy)
            //where copy is a function that takes the converted div texts and inserts them into the svg text
        };


        this.loadContent = function (data) {
            $(self.drawing).html(data);
            var height = self.options.height || $(self.svg).attr("height") || 400;
            var width = self.options.width || 400;
            $(self.svg).attr("height", height);
            $(self.svg).attr("width", width);
            self.snap = Snap($(self.svg).get(0));
            self.jsvg = $(self.svg);
            $(self.container + " .height").val(self.snap.attr("height"));
            $(self.container + " .firstFrameShow").val(self.currentFirstFrame);
            $(self.container + " .lastFrameShow").val(self.currentLastFrame);

            self.background = self.snap.rect(0, 0, width, height)
                .attr({opacity: 0.0})
                .attr({id: "egal_background"}).prependTo(self.snap);
            self.filter = self.snap.filter(Snap.filter.shadow(0, 2, 3));

            self.arrow = self.snap.polygon([0, 0, 0, 6, 9, 3, 0, 0]).attr({fill: '#323232', id: "arrow"});//.transform('r90');
            self.marker = self.arrow.marker(0, 0, 10, 10, 9, 3).attr({id: 'arrowEndMarker'});
            self.startArrow = self.snap.polygon([0, 3, 9, 0, 9, 6, 0, 3]).attr({fill: '#323232', id: "startArrow"});//.transform('r90');
            self.startMarker = self.startArrow.marker(0, 0, 10, 10, 0, 3).attr({id: 'arrowStartMarker'});

            self.convertLatex(self.jsvg.find(".egal-label"));

            // self.activateElement($(self.svg).find("*"));
            var elements = self.snap.selectAll(".drupElem");
            // console.log(elements);
            elements.forEach(function (elem) {
                self.activateElement(new Snap(elem));
            });

            self.currentId = elements.length;
            // $(self.svg).find("*").click(function (e) {
            //     if (self.currentContext.onClickElement) self.currentContext.onClickElement(e, this);
            // });
            // $(self.container).attr({tabindex:1});

            // $(self.container).keypress(function (e) {
            //     console.log("Key pressed");
            // });
            // $(self.container).click(function (e) {
            //     this.focus();
            // });


            self.snap.click(function (e) {
                if (self.currentContext.onClick) self.currentContext.onClick(e, this);
            });
            self.background.click(function (e) {
                if (self.currentContext.onClickBackground) self.currentContext.onClickBackground(e, this);
            });
            self.background.drag(
                function (dx, dy, x, y, event) {
                    if (self.currentContext.onDragBackground) self.currentContext.onDragBackground(dx, dy, x, y, event, this);
                },
                function (x, y, event) {
                    if (self.currentContext.onDragBackgroundStart) self.currentContext.onDragBackgroundStart(x, y, event, this);
                },
                function (event) {
                    if (self.currentContext.onDragBackgroundEnd) self.currentContext.onDragBackgroundEnd(event, this);
                }
            );

            self.snap.mousemove(function (e) {
                if (self.currentContext.onMouseMove) self.currentContext.onMouseMove(e, this);
            });
            self.snap.mouseout(function (e) {
                if (self.currentContext.onMouseOut) self.currentContext.onMouseOut(e, this);
            });
            self.snap.mousedown(function (e) {
                if (self.currentContext.onMouseDown) self.currentContext.onMouseDown(e, this);
            });
            self.snap.mouseup(function (e) {
                if (self.currentContext.onMouseUp) self.currentContext.onMouseUp(e, this);
            });

            self.connectContext.loadConnectors();
            // console.log("Set SVG");
            // MathJax.Hub.Queue(["Typeset", MathJax.Hub, self.svg])

            self.hideOutsideFrames();
        };

        if (self.options.drawName) {
            $.get('/draw/' + self.options.drawName, function (data, status) {
                self.loadContent(data);
            });
        } else {
            this.loadContent(this.options.content);
        }

        this.onSaveContent = function (saver) {
            self.saveContent = saver;
        };

        this.saveContent = function (content) {
            $.ajax({
                type: 'POST',
                url: '/draw/' + self.options.drawName,
                data: content,
                contentType: "text/xml",
                dataType: "text",
                success: function (data, status) {
                    // console.log(data);
                }
            })
        };

        this.saveCurrentSVG = function () {
            self.connectContext.saveConnectors();
            var cloned = $(self.drawing).clone();
            self.convertLatexBack(cloned.find(".mathjax_text"));
            cloned.find(".transient").remove();
            cloned.find(".endPoint").css("opacity", 0.0);
            cloned.find("#egal_background").remove();
            cloned.find(".egal-select .core").css({filter: ''});
            self.saveContent(cloned.html());
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
                // console.log(circle.attr('cx'));
                var cx = Number(circle.attr('cx'));
                var cy = Number(circle.attr('cy'));
                var radius = Number(circle.attr('r'));
                var attr = {stroke: "#000", strokeWidth: 1, fill: '#fff', opacity: 0.0}; //fillOpacity: 0
                circle.addClass("core alignable sub");
                var group = drupyter.snap.group(circle);
                group.append(drupyter.snap.circle(cx, cy - radius, 5).attr(attr).addClass("endPoint up sub"));
                group.append(drupyter.snap.circle(cx, cy + radius, 5).attr(attr).addClass("endPoint down sub"));
                group.append(drupyter.snap.circle(cx - radius, cy, 5).attr(attr).addClass("endPoint left sub"));
                group.append(drupyter.snap.circle(cx + radius, cy, 5).attr(attr).addClass("endPoint right sub"));
                // var group = drupyter.snap.group(circle, upEndPoint, downEndPoint, leftEndPoint, rightEndPoint);
                // console.log(group);
                drupyter.registerAndDecorateElement(group);
                drupyter.saveCurrentSVG();
                circle = null;

            } else {
                var offset = $(element.node).offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                centerX = x;
                centerY = y;
                circle = drupyter.snap.circle(x, y, 0).attr({"vector-effect": "non-scaling-stroke"});

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
                var offset = $(element.node).offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                circle.attr({
                    r: Math.max(Math.abs(centerX - x), Math.abs(centerY - y))
                })
            }
        };

        this.onClickElement = function (e, element) {
            // console.log("Selected in MakeCircle Mode");
        }

    }


    function SelectionContext(drupyter) {

        this.currentSelection = [];
        var listeners = [];
        var moveListeners = [];
        var dragging = false;
        var dragged = false;
        var self = this;
        var y2Bboxes = {};
        var y1Bboxes = {};
        var x2Bboxes = {};
        var x1Bboxes = {};
        var cxBboxes = {};
        var cyBboxes = {};
        var widthBboxes = {};
        var heightBboxes = {};

        this.onSelect = function (listener) {
            listeners.push(listener)
        };

        this.onMove = function (listener) {
            moveListeners.push(listener)
        };

        this.onClickElement = function (e, element) {
        };

        this.onDblClickElement = function (e, element) {
            // console.log("OnDblClick");
            // console.log(element);
            var bbox = element.getBBox();
            // console.log(bbox);
            var label = element.select(".egal-label");
            var init = label.attr("data-src") === "|" ? "" : label.attr("data-src");
            label.attr({
                visibility: "hidden"
            });
            self.selectElement(null);
            createForeignTextInput(element, bbox.cx - (bbox.width - 20) / 2, bbox.cy - 15, bbox.width - 20, 20,
                init, 20,
                function (textVal) {
                    // console.log(textVal);
                    drupyter.convertLatexBack($(label.node));
                    label = element.select(".egal-label"); //conversion may have replaced the label.
                    label.attr({
                        // "text-anchor": "middle",
                        // "alignment-baseline": "central",
                        text: textVal === "" ? "|" : textVal,
                        opacity: textVal === "" ? 0.0 : 1.0,
                        "data-src": textVal,
                        visibility: "visible"
                    });
                    drupyter.convertLatex($(label.node));
                    self.selectElement(element);
                    drupyter.saveCurrentSVG();
                    // var labelBbox = label.getBBox();
                    // label.attr({
                    //     // x: bbox.cx - (labelBbox.width / 2),
                    //     // y: bbox.cy + (labelBbox.height / 2)
                    // })
                });
        };


        this.onClickBackground = function (e, element) {
            // console.log("OnClick Paper");
            var elems = drupyter.snap.selectAll(".drupElem");
            // var elems = drupyter.jsvg.find(".drupElem");
            var offset = $(element.node).offset();
            var x = e.pageX - offset.left;
            var y = e.pageY - offset.top;
            // console.log(offset);
            // console.log([x, y]);
            for (var i = 0; i < elems.length; i++) {
                var elem = elems[i];
                var bbox = elem.getBBox();
                if (elem.node.style.display !== "none") {
                    if (x >= bbox.x && x <= bbox.x + bbox.width && y >= bbox.y && y <= bbox.y + bbox.height) {
                        // console.log("Selected");
                        // console.log(elem);
                        // console.log("Selected");
                        // blurb = elem;
                        this.selectElement(elem);
                        return
                    }
                }
            }
            // console.log(elems);
            this.selectElement(null);
        };

        this.cutSelection = function () {
            if (this.currentSelection) {
                drupyter.snap.selectAll(".egal-select .endPoint").forEach(function (ep) {
                    // console.log(drupyter.svg + " [data-n1='" + ep.attr("id") + "']");
                    $(drupyter.svg + " [data-n1='" + ep.attr("id") + "']").remove();
                    $(drupyter.svg + " [data-n2='" + ep.attr("id") + "']").remove();
                });
                drupyter.jsvg.find(".egal-select").remove();
                this.selectElement(null);
                drupyter.saveCurrentSVG();

            }
        };

        this.pasteSelection = function () {
            if (this.currentSelection.length > 0) {
                // console.log("Yo!");
                var created = [];
                my$each(this.currentSelection, function (i, elem) {
                    // console.log(elem);
                    var cloned = elem.clone();
                    // $(cloned.node).find("*").unbind();
                    cloned.selectAll(".sub").forEach(function (e) {
                        // e.removeData();
                        e.transform(e.transform().globalMatrix.toTransformString() + "T10,10");
                        e.paper = drupyter.snap;
                    });
                    cloned.selectAll(".sub-foreign").forEach(function (e) {
                        // e.removeData();
                        e.attr("x", Number(e.attr("x")) + 10);
                        e.attr("y", Number(e.attr("y")) + 10);
                        e.paper = drupyter.snap;
                    });

                    created.push(cloned);
                    // console.log(cloned.parent());
                    drupyter.registerElement(cloned);
                });
                drupyter.saveCurrentSVG();
                self.selectElements(created);
            }
        };

        function mergeBBoxes(snapSet) {
            // console.log(snapSet);
            var bbox = null;
            // console.log(snapSet);
            snapSet.forEach(function (c) {
                var cbbox = c.getBBox();
                if (bbox) {
                    bbox.x = Math.min(bbox.x, cbbox.x);
                    bbox.y = Math.min(bbox.y, cbbox.y);
                    bbox.x2 = Math.max(bbox.x2, cbbox.x2);
                    bbox.y2 = Math.max(bbox.y2, cbbox.y2);
                } else {
                    bbox = c.getBBox();
                }
            });
            bbox.width = bbox.x2 - bbox.x;
            bbox.height = bbox.y2 - bbox.y;
            bbox.cx = bbox.x + bbox.width / 2;
            bbox.cy = bbox.y + bbox.height / 2;
            return bbox;
        }

        this.createSelectionHandles = function () {
            drupyter.jsvg.find(".selection_artifact").remove();
            if (this.currentSelection.length == 0) return;
            var bbox = mergeBBoxes(drupyter.snap.selectAll(".egal-select .core"));

            // var core = elem.select(".core");
            // var bbox = core.getBBox();
            var handleSize = 6;
            var handleAttr = {
                fill: "white",
                stroke: "black"
            };
            var selectionBox = drupyter.snap.rect(bbox.x, bbox.y, bbox.width, bbox.height).attr({
                fill: "none",
                stroke: "black",
                "vector-effect": "non-scaling-stroke"
            }).addClass("selection_box selection_artifact transient");

            function createHandle(handle_x, handle_y, classes, keepX, keepY) {
                var handle = drupyter.snap.rect(handle_x - handleSize / 2, handle_y - handleSize / 2, handleSize, handleSize)
                    .attr(handleAttr)
                    .addClass("selection_handle selection_artifact transient")
                    .addClass(classes);
                // var selectionBBox = selectionBox.getBBox();
                handle.data("ox", handle_x);
                handle.data("oy", handle_y);

                handle.drag(
                    function (dx, dy, x, y, event) {
                        // console.log("Dragging...");
                        var fixed_x = handle.data("hx") - 2 * (handle.data("hx") - handle.data("sx"));
                        var fixed_y = handle.data("hy") - 2 * (handle.data("hy") - handle.data("sy"));

                        if (event.shiftKey) {
                            //project point to diagonals
                            var target_x = handle.data("hx") - fixed_x;
                            var target_y = handle.data("hy") - fixed_y;
                            // var target_x = handle.hasClass("east") ? 1 : -1;
                            // var target_y = handle.hasClass("north") ? -1 : 1;
                            var norm = Math.sqrt(target_x * target_x + target_y * target_y);
                            var scale = (dx * target_x + dy * target_y) / norm;
                            dx = scale * target_x / norm;
                            dy = scale * target_y / norm;
                            // var hasNorth = handle.hasClass("north") ? 1 : 0;
                            // var hasEast = handle.hasClass("east") ? 1 : 0;
                            // dx = hasNorth * hasEast * sign_x * sign_y * max_d * x_bigger_y;
                            // dy = -hasNorth * hasEast * sign_y * sign_y * max_d * x_bigger_y;
                            // // dx = dy = max_d;
                            // if (handle.hasClass("east")) {
                            //     dx = sign_x * max_d * hasNorth;
                            //     dy = sign_y * max_d * hasNorth;
                            // }
                            // if (handle.hasClass("west")) {
                            //     dx = sign_x * sign_y * max_d;
                            //     dy = sign_x * sign_y * (handle.hasClass("north") ? -max_d : max_d);
                            // }

                        }


                        function newPosition(x, y) {
                            return {x: newX(x), y: newY(y)};
                        }

                        function newX(x) {
                            return keepX ? x : x + dx * (x - fixed_x) / (handle.data("hx") - fixed_x)
                        }

                        function newY(y) {
                            return keepY ? y : y + dy * (y - fixed_y) / (handle.data("hy") - fixed_y)
                        }

                        //move the handles
                        drupyter.snap.selectAll(".selection_handle").forEach(function (h) {
                            var new_pos = newPosition(h.data("hx"), h.data("hy"));
                            h.transform(h.data("orig_transform") + "t" +
                                (new_pos.x - h.data("hx")).toFixed(4) + "," + (new_pos.y - h.data("hy")).toFixed(4));
                            // console.log(h.data("orig_transform") + "t" +
                            //     (new_pos.x - h.data("hx")).toFixed(4) + "," + (new_pos.y - h.data("hy")).toFixed(4));
                        });
                        drupyter.snap.selectAll(".egal-select .sub").forEach(function (h) {
                            var new_pos = newPosition(h.data("x"), h.data("y"));
                            h.transform(h.data("orig_transform") + "t" +
                                (new_pos.x - h.data("x")).toFixed(4) + "," + (new_pos.y - h.data("y")).toFixed(4));
                        });
                        drupyter.snap.selectAll(".egal-select .sub-foreign").forEach(function (h) {
                            var new_pos = newPosition(h.data("x"), h.data("y"));
                            h.attr("x", new_pos.x.toFixed(4));
                            h.attr("y", new_pos.y.toFixed(4));
                        });
                        var scale_x = keepX ? 1 : (handle.data("hx") - fixed_x + dx) / (handle.data("hx") - fixed_x);
                        var scale_y = keepY ? 1 : (handle.data("hy") - fixed_y + dy) / (handle.data("hy") - fixed_y);
                        selectionBox.transform(selectionBox.data("orig_transform") +
                            "S" + scale_x + "," + scale_y + "," + fixed_x + "," + fixed_y);
                        // console.log(selectionBox.data("orig_transform") +
                        //     "S" + scale_x + "," + scale_y + "," + fixed_x + "," + fixed_y);
                        // var core = elem.select(".core");
                        drupyter.snap.selectAll(".egal-select .core").forEach(function (core) {
                            core.transform(core.data("orig_transform") +
                                "S" + scale_x + "," + scale_y + "," + fixed_x + "," + fixed_y);
                        });


                        drupyter.snap.selectAll(".egal-select .sub").forEach(function (e) {
                            my$each(moveListeners, function (index, listener) {
                                listener(e);
                            });
                        });

                        //scale and move selectionBox
                        //move label and end points
                        //scale core

                        drawAlignables(drupyter.snap.select(".selection_box").getBBox());


                    },
                    function (x, y, event) {
                        //save: current handle position, current selection center, current fixed_pos
                        drupyter.snap.selectAll(".selection_handle").forEach(function (h) {
                            h.data("hx", h.getBBox().cx);
                            h.data("hy", h.getBBox().cy);
                            h.data("sx", selectionBox.getBBox().cx);
                            h.data("sy", selectionBox.getBBox().cy);
                        });
                        drupyter.snap.selectAll(".selection_artifact").forEach(function (h) {
                            h.data("orig_transform", h.transform().globalMatrix.toTransformString())
                        });
                        // console.log(elem.selectAll("*"));
                        drupyter.snap.selectAll(".egal-select .sub").forEach(function (sub) {
                            sub.data("orig_transform", sub.transform().globalMatrix.toTransformString());
                            sub.data("x", sub.getBBox().cx);
                            sub.data("y", sub.getBBox().cy);
                        });
                        drupyter.snap.selectAll(".egal-select .sub-foreign").forEach(function (ep) {
                            ep.data("x", Number(ep.attr("x")));
                            ep.data("y", Number(ep.attr("y")));
                        });


                        cacheAlignables();


                    },
                    function (event) {
                        removeAlignLines();
                        drupyter.saveCurrentSVG();

                        // self.selectElement(elem)
                    }
                )
            }

            createHandle(bbox.x2, bbox.cy, "east", false, true);
            createHandle(bbox.x, bbox.cy, "west", false, true);
            createHandle(bbox.cx, bbox.y, "north", true, false);
            createHandle(bbox.cx, bbox.y2, "south", true, false);

            createHandle(bbox.x2, bbox.y, "north east");
            createHandle(bbox.x, bbox.y, "north west");
            createHandle(bbox.x2, bbox.y2, "south east");
            createHandle(bbox.x, bbox.y2, "south west");

        };


        this.toggleSelection = function (elem) {
            if (elem.hasClass("egal-select")) {
                elem.select(".core").attr({filter: ""});
                this.currentSelection.splice(this.currentSelection.indexOf(elem), 1);
            } else {
                this.currentSelection.push(elem);
                elem.select(".core").attr({filter: "url(#" + drupyter.filter.attr("id") + ")"});
            }
            elem.toggleClass("egal-select");
            self.createSelectionHandles();
            my$each(listeners, function (i, l) {
                l(elem);
            });

            // drupyter.jsvg.find(".egal-select .core").attr({filter: "url(#" + drupyter.filter.attr("id") + ")"});
        };

        this.selectElements = function (elems) {
            this.currentSelection = elems;
            drupyter.jsvg.find(".egal-select .core").css({filter: ''});
            removeClass(drupyter.jsvg.find(".egal-select"), "egal-select");
            my$each(elems, function (i, elem) {
                elem.addClass("egal-select");
                elem.select(".core").attr({filter: "url(#" + drupyter.filter.attr("id") + ")"});
                my$each(listeners, function (i, l) {
                    l(elem);
                });

            });
            self.createSelectionHandles();
        };

        this.selectElement = function (elem) {
            drupyter.jsvg.find(".egal-select .core").css({filter: ''});
            removeClass(drupyter.jsvg.find(".egal-select"), "egal-select");

            if (elem) {
                // console.log("Selecting ...");
                this.currentSelection = [elem];
                elem.addClass("egal-select");
                elem.select(".core").attr({filter: "url(#" + drupyter.filter.attr("id") + ")"});

            } else {
                // drupyter.jsvg.find(".selection_artifact").remove();
                this.currentSelection = [];
            }
            self.createSelectionHandles();
            my$each(listeners, function (i, l) {
                l(elem);
            });


        };


        this.onDragBackground = function (dx, dy, x, y, event, core) {
            // console.log("dragging");
            dragging = true;
            if (core.hasClass("connector")) return;
            drupyter.snap.selectAll(".egal-select .sub").forEach(function (ep) {
                ep.transform(ep.data("orig_transform") + "T" + dx + "," + dy);
                my$each(moveListeners, function (index, listener) {
                    listener(ep);
                });
            });
            drupyter.snap.selectAll(".egal-select .sub-foreign").forEach(function (ep) {
                ep.attr("x", dx + ep.data("ox"));
                ep.attr("y", dy + ep.data("oy"));
                my$each(moveListeners, function (index, listener) {
                    listener(ep);
                });
            });
            drupyter.snap.selectAll(".selection_artifact").forEach(function (e) {
                e.transform(e.data("orig_transform") + "T" + dx + "," + dy);
            });

            drawAlignables(drupyter.snap.select(".selection_box").getBBox());

        };

        this.onDragCore = this.onDragBackground;

        this.onDragBackgroundStart = function (x, y, event, core) {
            drupyter.snap.selectAll(".egal-select .sub").forEach(function (ep) {
                ep.data("orig_transform", ep.transform().globalMatrix.toTransformString());
            });
            drupyter.snap.selectAll(".egal-select .sub-foreign").forEach(function (ep) {
                ep.data("ox", Number(ep.attr("x")));
                ep.data("oy", Number(ep.attr("y")));
            });
            // core.data("orig_transform", core.transform().globalMatrix.toTransformString());
            // parent.selectAll(".endPoint").forEach(function (ep) {
            //     ep.data("orig_transform", ep.transform().globalMatrix.toTransformString());
            // });
            // parent.selectAll(".egal-label").forEach(function (label) {
            //     label.data("orig_transform", label.transform().globalMatrix.toTransformString());
            // });
            drupyter.snap.selectAll(".selection_artifact").forEach(function (h) {
                h.data("orig_transform", h.transform().globalMatrix.toTransformString())
            });
            cacheAlignables();
        };

        this.onDragCoreStart = function (x, y, event, core) {
            // console.log("drag start");
            var parent = core.parent();
            // dragging = true;
            if (this.currentSelection.indexOf(parent) == -1 && !event.shiftKey) {
                this.selectElement(parent);
            }
            this.onDragBackgroundStart(x, y, event, core);

        };

        this.onDragBackgroundEnd = function (event, core) {
            removeAlignLines();
            dragging = false;
            dragged = true;
            drupyter.saveCurrentSVG();

        };

        this.onDragCoreEnd = function (event, core) {
            var parent = core.parent();
            if (!dragging || this.currentSelection.indexOf(parent) == -1) {
                if (event.shiftKey) this.toggleSelection(parent);
                else this.selectElement(parent);
            }
            this.onDragBackgroundEnd(event, core);
        };

        function removeAlignLines() {
            $(drupyter.snap.node).find(".align-line").remove();

        }

        function drawAlignables(bbox) {
            $(drupyter.snap.node).find(".align-line").remove();

            var alignLineAttr = {stroke: "lightblue", "stroke-dasharray": "5, 5"};

            function createAlignLine(x1, y1, x2, y2, attr) {
                var line = drupyter.snap.line(x1.toFixed(0), y1.toFixed(0), x2.toFixed(0), y2.toFixed(0))
                    .attr(attr)
                    .addClass("align-line selection_artifact");
                drupyter.snap.append(line);
            }

            my$each(cxBboxes[bbox.cx.toFixed(0)], function (index, otherBbox) {
                createAlignLine(bbox.cx, bbox.cy, otherBbox.cx, otherBbox.cy, alignLineAttr)
            });
            my$each(cyBboxes[bbox.cy.toFixed(0)], function (index, otherBbox) {
                createAlignLine(bbox.cx, bbox.cy, otherBbox.cx, otherBbox.cy, alignLineAttr)
            });
            my$each(y2Bboxes[bbox.y2.toFixed(0)], function (index, otherBbox) {
                createAlignLine(bbox.cx, bbox.y2, otherBbox.cx, bbox.y2, alignLineAttr)
            });
            my$each(y1Bboxes[bbox.y.toFixed(0)], function (index, otherBbox) {
                createAlignLine(bbox.cx, bbox.y, otherBbox.cx, bbox.y, alignLineAttr)
            });
            // console.log(x1Bboxes);
            my$each(x1Bboxes[bbox.x.toFixed(0)], function (index, otherBbox) {
                createAlignLine(bbox.x, bbox.cy, bbox.x, otherBbox.cy, alignLineAttr)
            });
            my$each(x2Bboxes[bbox.x2.toFixed(0)], function (index, otherBbox) {
                createAlignLine(bbox.x2, bbox.cy, bbox.x2, otherBbox.cy, alignLineAttr)
            });

            var dimLineAttr = {stroke: "lightblue"};
            my$each(widthBboxes[bbox.width.toFixed(0)], function (index, otherBbox) {
                createAlignLine(otherBbox.x, otherBbox.y - 10, otherBbox.x2, otherBbox.y - 10, dimLineAttr);
                createAlignLine(otherBbox.x, otherBbox.y - 15, otherBbox.x, otherBbox.y - 5, dimLineAttr);
                createAlignLine(otherBbox.x2, otherBbox.y - 15, otherBbox.x2, otherBbox.y - 5, dimLineAttr);
                createAlignLine(bbox.x, bbox.y - 10, bbox.x2, bbox.y - 10, dimLineAttr);
                createAlignLine(bbox.x, bbox.y - 15, bbox.x, bbox.y - 5, dimLineAttr);
                createAlignLine(bbox.x2, bbox.y - 15, bbox.x2, bbox.y - 5, dimLineAttr);
            });
            my$each(heightBboxes[bbox.height.toFixed(0)], function (index, otherBbox) {
                createAlignLine(otherBbox.x - 10, otherBbox.y, otherBbox.x - 10, otherBbox.y2, dimLineAttr);
                createAlignLine(otherBbox.x - 5, otherBbox.y, otherBbox.x - 15, otherBbox.y, dimLineAttr);
                createAlignLine(otherBbox.x - 5, otherBbox.y2, otherBbox.x - 15, otherBbox.y2, dimLineAttr);
                createAlignLine(bbox.x - 10, bbox.y, bbox.x - 10, bbox.y2, dimLineAttr);
                createAlignLine(bbox.x - 5, bbox.y, bbox.x - 15, bbox.y, dimLineAttr);
                createAlignLine(bbox.x - 5, bbox.y2, bbox.x - 15, bbox.y2, dimLineAttr);
            });

        }

        function cacheAlignables() {
            //collect all core bounding boxes and index by different points
            y2Bboxes = {};
            y1Bboxes = {};
            x1Bboxes = {};
            x2Bboxes = {};
            cxBboxes = {};
            cyBboxes = {};
            widthBboxes = {};
            heightBboxes = {};
            drupyter.snap.selectAll(".alignable").forEach(function (otherCore) {
                if (!otherCore.parent().hasClass("egal-select")) {
                    var bbox = otherCore.getBBox();
                    appendToList(cxBboxes, bbox.cx.toFixed(0), bbox);
                    appendToList(cyBboxes, bbox.cy.toFixed(0), bbox);
                    appendToList(y2Bboxes, bbox.y2.toFixed(0), bbox);
                    appendToList(y1Bboxes, bbox.y.toFixed(0), bbox);
                    appendToList(x2Bboxes, bbox.x2.toFixed(0), bbox);
                    appendToList(x1Bboxes, bbox.x.toFixed(0), bbox);
                    appendToList(widthBboxes, bbox.width.toFixed(0), bbox);
                    appendToList(heightBboxes, bbox.height.toFixed(0), bbox);
                }

            });

        }


        this.moveToFront = function () {
            my$each(this.currentSelection, function (i, elem) {
                elem.appendTo(elem.paper);
            });
            drupyter.saveCurrentSVG();
        };

        this.moveToBack = function () {
            my$each(this.currentSelection, function (i, elem) {
                drupyter.background.after(elem);
            });
            drupyter.saveCurrentSVG();
            // this.currentSelection.prependTo(this.currentSelection.paper);
        };


    }


    function ConnectContext(drupyter) {

        var line = null;
        this.arrow = false;
        var elem2lineN1 = {};
        var elem2lineN2 = {};

        this.onClick = function (e, element) {
            // console.log("Paper clicked!");
            // console.log(element);
            // if (line) {
            //     line = null;
            //     drupyter.saveCurrentSVG();
            // } else {
            //     var offset = $(element).offset();
            //     var x = e.pageX - offset.left;
            //     var y = e.pageY - offset.top;
            //     line = drupyter.snap.line(x, y, x, y).attr({
            //         stroke: '#00ADEF'
            //     });
            //     drupyter.registerElement(line);
            //     drupyter.selectionContext.selectElement(line.node);
            // }
        };

        drupyter.selectionContext.onMove(function (elem) {
            var bbox = elem.getBBox();
            // console.log(elem);
            // console.log(elem.paper.selectAll("[data-n1='" + elem.attr("id") + "'"));

            // elem.paper.selectAll("[data-n1='" + elem.attr("id") + "'").forEach(function (connector) {
            //     connector.attr({x1: bbox.cx, y1: bbox.cy})
            // });
            // elem.paper.selectAll("[data-n2='" + elem.attr("id") + "'").forEach(function (connector) {
            //     connector.attr({x2: bbox.cx, y2: bbox.cy})
            // });

            my$each(elem2lineN1[elem.attr("id")], function (index, connector) {
                connector.attr({x1: bbox.cx, y1: bbox.cy})
            });
            my$each(elem2lineN2[elem.attr("id")], function (index, connector) {
                connector.attr({x2: bbox.cx, y2: bbox.cy})
            });

            // // line.attr({x2: bbox.cx, y2: bbox.cy})
            // var elemLine = elem2line[elem.id];
            // console.log(elemLine);
            // if (elemLine) {
            //     $each(elemLine, function (index, elem) {
            //         if (elem.start) {
            //             elem.line.attr({x1: bbox.cx, y1: bbox.cy})
            //         } else {
            //             elem.line.attr({x2: bbox.cx, y2: bbox.cy})
            //         }
            //     })

        });

        this.onMouseOver = function (e, element) {
            element.selectAll(".endPoint").forEach(function (endPoint) {
                endPoint.attr({opacity: 1.0})
            });
        };
        this.onMouseOut = function (e, element) {
            // console.log("Out");
            // console.log(dragging);
            element.selectAll(".endPoint").forEach(function (endPoint) {
                endPoint.attr({opacity: 0.0})
            });
        };


        this.onMouseMove = function (e, element) {
            if (line) {
                // console.log("Changing ...");
                var offset = $(element.node).offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                // var dx = x - Number(line.attr("x1"))
                // var dy =
                line.attr({
                    x2: x,
                    y2: y
                })

            }
        };

        this.onClickEndPoint = function (event, endPoint) {
            // console.log("Starting line at Endpoint");
            var bbox = endPoint.getBBox();
            if (!line) {
                line = drupyter.snap.line(bbox.cx, bbox.cy, bbox.cx, bbox.cy).attr({
                    stroke: '#000',
                }).addClass("connector egal-line");
                line.attr("data-n1", endPoint.attr("id"));
                if (this.arrow) {
                    line.attr({"marker-end": drupyter.marker});
                    // console.log(drupyter.marker);
                }
                line.prependTo(line.paper);
                // console.log("Arrow: " + this.arrow);
                // line.remove();
                // drupyter.snap.before(line);
            } else {
                line.attr({
                    x2: bbox.cx,
                    y2: bbox.cy
                });
                line.attr("data-n2", endPoint.attr("id")).addClass("core");
                var group = drupyter.snap.g(line);
                drupyter.registerAndDecorateElement(group);

                var id1 = line.attr("data-n1");
                var id2 = line.attr("data-n2");

                if (!elem2lineN1[id1]) elem2lineN1[id1] = [];
                if (!elem2lineN2[id2]) elem2lineN2[id2] = [];

                elem2lineN1[id1].push(line);
                elem2lineN2[id2].push(line);
                drupyter.saveCurrentSVG();
                line = null
            }
        };

        this.saveConnectors = function () {
        };

        this.loadConnectors = function () {
            drupyter.snap.selectAll(".connector").forEach(function (line) {
                var id1 = line.attr("data-n1");
                var id2 = line.attr("data-n2");
                if (!elem2lineN1[id1]) elem2lineN1[id1] = [];
                if (!elem2lineN2[id2]) elem2lineN2[id2] = [];

                elem2lineN1[id1].push(line);
                elem2lineN2[id2].push(line);
            });

        };

        this.clear = function () {

        };


    }

    function createForeignInput(x, y, width, height) {
        var svgns = "http://www.w3.org/2000/svg";
        var field = document.createElementNS(svgns, "foreignObject");
        field.setAttributeNS(null, "x", x);
        field.setAttributeNS(null, "y", y);
        field.setAttributeNS(null, "width", width);
        field.setAttributeNS(null, "height", height);
        return field;
    }

    function createForeignTextInput(parent, x, y, width, height, init, fontSize, acceptFunction) {
        var field = createForeignInput(x, y, width, height);
        var textInput = $("<input type='text' style='font-size: " + fontSize + "px;width: " + width + "px; text-align: center'>");
        var removed = false;
        textInput.val(init);
        $(field).append(textInput);
        $(field).focusout(function (e) {
            // console.log(parent);
            // console.log($(field).parent());
            var text = textInput.val();
            field.saveRemove();
            acceptFunction(text);

        });
        $(field).keypress(function (e) {
            if (e.keyCode == 13) {
                var text = textInput.val();
                field.saveRemove();
                acceptFunction(text);
            }
        });
        field.saveRemove = function () {
            if (!removed) {
                removed = true;
                $(field).remove();
            }
        };
        parent.append(field);
        textInput.get(0).focus();
        return field;
    }

    function TextContext(drupyter) {

        var num = 0;
        var field = null;
        var text = null;

        this.onClick = function (e, element) {
            if (field) {
                // $(field).remove();
                // $(text.node).remove();
            }
            var offset = $(element.node).offset();
            var x = e.pageX - offset.left;
            var y = e.pageY - offset.top;
            text = drupyter.snap.text(x, y, "").addClass("core alignable sub egal-label").attr({
                "text-anchor": "middle",
                "alignment-baseline": "central",
            });
            var textGroup = drupyter.snap.group(text);
            drupyter.registerElement(textGroup);
            if (field) field.saveRemove();

            field = createForeignTextInput($(drupyter.svg), x - 100, y, 200, 30, "", 20, function (textVal) {
                // console.log(textVal);
                text.attr({
                    y: y + 20,
                    text: textVal,
                    'font-size': 20,
                    'data-src': textVal
                });
                drupyter.convertLatex($(text.node));
                drupyter.saveCurrentSVG();
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
                var bbox = rect.getBBox();
                var cx = bbox.cx;
                var cy = bbox.cy;
                var halfWidth = bbox.width / 2.0;
                var halfHeight = bbox.height / 2.0;
                var attr = {stroke: "#000", strokeWidth: 1, fill: '#fff', opacity: 0.0}; //fillOpacity: 0
                rect.addClass("core alignable sub");
                var group = drupyter.snap.group(rect);
                group.append(drupyter.snap.circle(cx, cy - halfHeight, 5).attr(attr).addClass("endPoint up sub"));
                group.append(drupyter.snap.circle(cx, cy + halfHeight, 5).attr(attr).addClass("endPoint down sub"));
                group.append(drupyter.snap.circle(cx - halfWidth, cy, 5).attr(attr).addClass("endPoint left sub"));
                group.append(drupyter.snap.circle(cx + halfWidth, cy, 5).attr(attr).addClass("endPoint right sub"));
                group.append(drupyter.snap.circle(cx - halfWidth, cy - halfHeight, 5).attr(attr).addClass("endPoint left-up sub"));
                group.append(drupyter.snap.circle(cx - halfWidth, cy + halfHeight, 5).attr(attr).addClass("endPoint left-down sub"));
                group.append(drupyter.snap.circle(cx + halfWidth, cy - halfHeight, 5).attr(attr).addClass("endPoint right-up sub"));
                group.append(drupyter.snap.circle(cx + halfWidth, cy + halfHeight, 5).attr(attr).addClass("endPoint right-down sub"));
                // var group = drupyter.snap.group(circle, upEndPoint, downEndPoint, leftEndPoint, rightEndPoint);
                // console.log(group);
                drupyter.registerAndDecorateElement(group);
                drupyter.saveCurrentSVG();
                rect = null;
            } else {
                var offset = $(element.node).offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                centerX = x;
                centerY = y;
                rect = drupyter.snap.rect(x, y, 0, 0);
                rect.attr({
                    fill: "#fff",
                    stroke: "#000",
                    strokeWidth: 1,
                    "vector-effect": "non-scaling-stroke"
                });
                // $(rect.node).click(function (e) {
                //     if (drupyter.currentContext.onClickElement) drupyter.currentContext.onClickElement(e, remembered);
                // });
            }
        };

        this.onMouseMove = function (e, element) {
            if (rect) {
                // console.log("Changing ...");
                var offset = $(element.node).offset();
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
                    width: width
                })
            }
        };

        this.onClickElement = function (e, element) {
            // console.log("Selected in MakeCircle Mode");
        };


    }

    function MakeLineContext(drupyter) {
        var line = null;

        this.onClick = function (e, element) {
            if (line) {
                line.addClass("core alignable sub egal-line");
                var group = drupyter.snap.group(line);
                drupyter.registerAndDecorateElement(group);
                drupyter.saveCurrentSVG();
                line = null;
            } else {
                var offset = $(element.node).offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                line = drupyter.snap.line(x, y, x, y);
                line.attr({
                    fill: "#fff",
                    stroke: "#000",
                    strokeWidth: 1,
                    "vector-effect": "non-scaling-stroke"
                });
            }
        };

        this.onMouseMove = function (e, element) {
            if (line) {
                // console.log("Changing ...");
                var offset = $(element.node).offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                line.attr({
                    x2: x,
                    y2: y
                })
            }
        };

        this.onClickElement = function (e, element) {
            // console.log("Selected in MakeCircle Mode");
        };


    }

    function MakePolyLineContext(drupyter) {
        var line = null;
        var lastLine = null;
        var lastLineTime = 0;
        var continuing = false;

        this.onMouseDown = function (e, element) {
            if (!line) {
                var d = new Date();
                var now = d.getTime();
                if (now - lastLineTime > 1000) {
                    var offset = $(element.node).offset();
                    var x = e.pageX - offset.left;
                    var y = e.pageY - offset.top;
                    line = drupyter.snap.path("M" + x + "," + y);
                    line.attr({
                        fill: "none",
                        stroke: "#000",
                        strokeWidth: 1,
                        "vector-effect": "non-scaling-stroke"
                    });
                }
                else {
                    line = lastLine;
                    continuing = true;
                }
            }
        };

        this.onMouseUp = function (e, element) {
            if (line) {
                line.addClass("core alignable sub egal-line");
                var group = drupyter.snap.group(line);
                drupyter.registerElement(group);
                drupyter.saveCurrentSVG();
                lastLine = line;
                line = null;
                var d = new Date();
                lastLineTime = d.getTime();
            }
        };

        this.onMouseMove = function (e, element) {
            if (line) {
                // console.log("Changing ...");
                var offset = $(element.node).offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                var points = line.attr("d");
                if (continuing) {
                    points += "M" + x + "," + y;
                    continuing = false;
                }
                else
                    points += "L" + x + "," + y;
                line.attr({"d": points});
            }
        };

        this.onClickElement = function (e, element) {
            // console.log("Selected in MakeCircle Mode");
        };


    }


    return {
        Egal: Egal
    }
});
