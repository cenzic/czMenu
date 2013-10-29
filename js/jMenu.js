/**
* Copyright © Quoc Quach 2013-2014
* Author: Quoc Quach
* Email: quoc_cooc@yahoo.com
* Released under the MIT license
* Date: 10/29/2013
*/
(function ($) {
	var defaultOptions = {
		trigger: "click", //rightClick
		items: [],
		conditional: null, // conditional function, return true to show false to not show.
		position: "auto", // "auto", right, left, bottom, top
		//make it simple only on level.
		clearDelay: 250
	};
	function getMenuPos(x, y, orgItem, w, h, position) {
		console.log("position: %s", position);
		switch (position) {
			case "auto": return autoPosition(x, y, w, h);
			case "top-right": return topRightPosition(orgItem, w, h);
			case "top-left": return topLeftPosition(orgItem, w, h);
			case "bottom-right": return bottomRightPosition(orgItem, w, h);
			case "bottom-left": return bottomLeftPosition(orgItem, w, h);
			default: return { top: y, left: x, position: "auto" };
		}
	};
	function topRightPosition(orgItem, w, h) {
		var offset = orgItem.position();
		var top = offset.top - h + orgItem.outerHeight(true);
		var left = orgItem.outerWidth(true);
		return { top: top, left: left, position: "auto" };
	}
	function topLeftPosition(orgItem, w, h) {
		var offset = orgItem.position();
		var top = offset.top - h + orgItem.outerHeight(true);
		var left = -w;
		return { top: top, left: left, position: "auto" };
	}
	function bottomRightPosition(orgItem, w, h) {
		var offset = orgItem.position();
		var top = offset.top;
		var left = orgItem.outerWidth(true);
		return { top: top, left: left, position: "auto" };
	}
	function bottomLeftPosition(orgItem, w, h) {
		var offset = orgItem.position();
		var top =offset.top;
		var left = -w;
		return { top: top, left: left, position: "auto" };
	}
	function autoPosition(x, y, w, h) {
		var windowWidth = $(window).innerWidth();
		var windowHeight = $(window).innerHeight();
		var offset = 5;
		var left;
		var position;
		if (x + w + offset >= windowWidth) {
			left = x - w - offset;
			position = "left";
		} else {
			left = x + offset;
			position = "right";
		}
		var scrollTop = document.documentElement.scrollTop
				|| document.body.scrollTop;
		var top;
		if (y - h - offset < scrollTop) {
			if (y - scrollTop + offset + h > windowHeight) {
				top = scrollTop + Math.abs(windowHeight - h) / 2;
			} else {
				top = y + offset;
			}
		} else {
			top = y - h - offset;
		}
		return {
			top: top,
			left: left,
			position: position
		};
	}

	//definition for item.
	var MenuItem = {
		label: "", //text displayed in the menu
		tooltip: "", //title of the element        		
		handlers: {}, //list of all handler for each list items. "eventType":handler
		href: "", //if it a hyper link
		subMenu: [],
		/**
		* function called before rendering to do some pre computation for render label, test or link
		* return false to skip render.
		*/
		beforeRender: function () {
			return true;
		},
		contextItem: null //context item that context menu open for, default to the jObj generate the option.
	};
	function clearMenu() {
		$(".jMenuList").remove();
	}
	var menuShowed = false;
	$.fn.jMenu = function (opts) {
		var options = $.extend({}, defaultOptions, opts);
		if (!options.items || options.items.length == 0) {
			console.warn("no item defined");
			return;
		}
		options.items = initializeItems(options.items);

		this.each(function (i, e) {
			var jObj = $(e);
			jObj.addClass("jMenuContextItem");
			options.contextItem = options.contextItem == null ? jObj : $(options.contextItem);
			generateMenu(jObj, options);
		});
		if (options.mode == "standard") {
			renderMenuItems(100, 100, options.items, this);
		} else {
			$(document).click(function () {
				if (!menuShowed) return;
				clearMenu();
				menuShowed = false;
			});
		}
	};

	function initializeItems(items, mode) {
		var outItems = [];
		for (var i = 0; i < items.length; i++) {
			var tmp;
			if (mode == "standard") {
				tmp = { label: i, href: items[i] };

			} else {
				tmp = items[i];
			}
			outItems.push($.extend(true, {}, MenuItem, tmp));
		}
		return outItems;
	}

	function generateMenu(jObj, options) {
		if (options.trigger == "click" || options.trigger == "rightClick") {
			var mouseButton = options.trigger == "rightClick" ? 3 : 1;
			var target;
			jObj.bind("mousedown", function (e) {
				target = e.target;
			});

			jObj.bind("mouseup", function (e) {
				if (!options.conditional || options.conditional(jObj)) {
					if (e.target.nodeName.toLowerCase() == "a") return;
					if (target == e.target && e.which == mouseButton) {
						//set delay as work around for right click;
						var orgItem = options.contextItem;
						console.log("orgItem nodeName: %s", orgItem.get(0).nodeName);
						setTimeout(function () {
							renderMenuItems(e.pageX, e.pageY, options.items, orgItem, options.position);
						});
					}
					else {
						clearMenu();
					}
				}
				else {
					clearMenu();
				}
			});
			if (options.trigger == "rightClick") {
				jObj.bind("contextmenu", function (e) {
					if (e.target.nodeName.toLowerCase() != "a") {
						e.stopPropagation();
						return false;
					}
				});
			}
			else {
				jObj.bind("click", function (e) {
					e.stopPropagation();
					return false;
				});
			}
		}
		else { //assume it mouse over
			jObj.mouseover(function () {
				var offset = jObj.offset();
				var mainMenu = renderMenuItems(offset.left + jObj.width()/2, offset.top + jObj.height() / 2, options.items, options.contextItem, options.position, false, jObj);
				mainMenu.mouseover(function (e) {
					//console.log("mouse over main");
					if (jObj.timeout) {
						//console.log("clear timeout");
						clearTimeout(jObj.timeout);
						jObj.timeout = null;
					}				
				});
				mainMenu.mouseout(function(){
					jObj.timeout = setTimeout(clearMenu, defaultOptions.clearDelay);
				});
			});
			jObj.mouseout(function () {
				//console.log("mouse out jobj");
				jObj.timeout = setTimeout(clearMenu, defaultOptions.clearDelay);
			});
			
		}
	};
	function renderMenuItems(x, y, items, orgItem, position, isSubMenu, parentItem) {
		//this is for context menu
		if (menuShowed && !isSubMenu) {
			clearMenu();
		}

		var ul = $('<ul class="jMenuList"/>');
		if(!isSubMenu) ul.addClass("jMenuMain");
		var liArr = [];
		var count = 0;
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			//check for beforeRender handler
			if (item.beforeRender && !item.beforeRender.call(item, orgItem)) {
				continue;
			}
			count++;
			var li = $('<li class="jMenuItem">');
			liArr.push(li);
			if (i == 0)
				li.css("border-top", "none");
			if (item.href) {
				var a = $('<a/>');
				var href = (typeof (item.href) == 'function') ? item.href.call(item) : item.href;
				a.attr("href", href);
				a.attr("class", "jItemLabel");
				a.html(item.label);
				li.append(a);
			} else {
				li.append('<span class="jItemLabel">' + item.label + '</span>');
			}
			if (item.tooltip)
				li.get(0).title = item.tooltip;
			var handlers = item.handlers;
			// bind event to menu item.
			for (var j in handlers) {
				(function (eventType, handler, item) {
					li.bind(eventType, function (e) {
						handler(e, item);
						if (eventType == "click")
							clearMenu();
						e.stopPropagation();
						return false;
					});
				})(j, handlers[j], orgItem);

			}
			ul.append(li);
		}
		//there is no menu item visible
		if (count == 0) {
			return null;
		}
		//adding menu to document.

		if (isSubMenu) {
			parentItem.append(ul);
		} else {
			$(document.body).append(ul);
		}

		var parent = parentItem || orgItem;
		console.log("parent item: %s, orgItem: %s", parentItem, orgItem.get(0).nodeName);
		var pos = getMenuPos(x, y, parent, ul.outerWidth(true), ul.outerHeight(true), position);
		ul.css("top", pos.top);
		ul.css("left", pos.left);
		menuShowed = true;

		//handling for subMenu
		var subUl = null;
		var timeout = null;
		var trigger = null;
		for (var i = 0; i < items.length; i++) {
			(function (k) {
				var li = liArr[k];
				if (items[k].subMenu && items[k].subMenu.length > 0) {
					li.mouseover(function () {
						console.log("item k: %d, li.text: %s, top: %d, left: %d", k, li.text(), li.offset().top, li.offset().left);
						var subPos = (k > items.length / k) ? "top-" : "bottom-";						
						var maxWidth = li.offset().left + 2*li.outerWidth(true);
						subPos += maxWidth > $(document).width() ? "left" : "right";
						if (subUl === null) {
							subUl = renderMenuItems(0, 0, items[k].subMenu, orgItem, subPos, true, li);
							trigger = li;
						} else {
							if (trigger != li) {
								subUl.remove();
								subUl = renderMenuItems(0, 0, items[k].subMenu, orgItem, subPos, true, li);
								trigger = li;
							}
						}						

						if (timeout) {
							clearTimeout(timeout);
							timeout = null;
						}
					});
					li.mouseout(function () {
						timeout = setTimeout(function () {
							console.log("remove submenu");
							if (subUl) {
								subUl.remove();
								subUl = null;
							}
							timeout = null;
						}, defaultOptions.clearDelay);

					});
				}
			})(i);
		}
		return ul;
	};
})(jQuery)