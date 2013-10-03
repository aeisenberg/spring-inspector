/*jslint browser:true */
/*global $ joint */

var X_SCALE = 2, 
	Y_SCALE = 1, 
	X_TRANSLATE = 0, 
	Y_TRANSLATE = 0, 
	FLIP_AXES = true, 
	IMAGE_W = 90, 
	IMAGE_H = 70, 
	TRANSLATE = 'translate(' + (IMAGE_W/2) + ',' + (IMAGE_H/2) + ')',
	EDIT_PREFIX = '/sinspctr/edit';

// TODO BAD!!!!!!  global var
var edgesArr = [];

joint.shapes.sinspctr = {};

joint.shapes.sinspctr.IntNode = joint.shapes.basic.Generic.extend({

    markup: '<g class="rotatable"><g class="scalable">' +
    		'<image class="image" /><rect class="border-white"/>' +
    		'<rect class="border"/>' +
    		'<circle class="input" /><circle class="output" />' +
    		'</g><text class="label"/></g>',

    defaults: joint.util.deepSupplement({

        type: 'sinspctr.IntNode',
        size: { width: IMAGE_W, height: IMAGE_H },
        attrs: {
            '.': { magnet: false },
            // rounded edges around image
            '.border': {
                width: IMAGE_W,
                height: IMAGE_H,
                rx: 10,
                ry: 10,
                fill: 'white',
                stroke: 'lightgray',
                'stroke-width': 3,
                transform: TRANSLATE
            },
            // use this to cover the image sticking out past the rounded edge
            '.border-white': {
            	width: IMAGE_W,
            	height: IMAGE_H,
            	fill: 'white',
            	stroke: 'white',
            	'stroke-width': 3,
            	transform: TRANSLATE
            },
            '.input': {
            	magnet: true,
            	width: 15,
            	height: 15,
            	r: 5,
            	stroke: 'lightgray',
            	fill: 'red',
            	transform: 'translate(' + (IMAGE_W/2) + ',' + (IMAGE_H) + ')'
            },
            '.output': {
            	magnet: true,
            	width: 15,
            	height: 15,
            	r: 5,
            	stroke: 'lightgray',
            	fill: 'black',
            	transform: 'translate(' + (IMAGE_W*3/2) + ',' + (IMAGE_H) + ')'
            },
            '.label': {
                'text-anchor': 'middle',
                'ref-x': .5,
                'ref-y': -12,
                ref: '.border',
                fill: 'black',
                'font-size': 12
            },
            '.image': {
                width: IMAGE_W,
                height: IMAGE_H,
            	transform: TRANSLATE
            }
        },
    }, joint.shapes.basic.Generic.prototype.defaults)
});

joint.shapes.sinspctr.Link = joint.dia.Link.extend({
    defaults: joint.util.deepSupplement({
    	type: 'sinspctr.Link',
        attrs: { 
        	'.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' },
        	// links should not be manipulable by user
        	'.marker-vertices': { display : 'none' },
        	'.marker-arrowheads': { display: 'none' },
//        	'.link-tools': { display : 'none' },
//        	'.connection-wrap': { display: 'none' }
        }
    }, joint.dia.Link.prototype.defaults)
});
joint.shapes.sinspctr.LinkView = joint.dia.LinkView.extend({
	
	// copied from parent just so that we can change an offset of 40 to 100
    updateToolsPosition: function() {

        // Move the tools a bit to the target position but don't cover the `sourceArrowhead` marker.
        // Note that the offset is hardcoded here. The offset should be always
        // more than the `this.$('.marker-arrowhead[end="source"]')[0].bbox().width` but looking
        // this up all the time would be slow.
        var offset = 70; // CHANGE
        var toolPosition = this.getPointAtLength(offset);

        this._toolCache.attr('transform', 'translate(' + toolPosition.x + ', ' + toolPosition.y + ')');
    },

	defaults: joint.util.deepSupplement({
		type: 'sinspctr.LinkView'
	}, joint.dia.LinkView.prototype.defaults)
});



function closeConfigList() {
	var configList = $('#config-list');
	configList.fadeOut(100, function() {
		configList.addClass('details-off');
		$('#configs').empty();
	});
}

var graph, paper;
$(document).ready(function() {
	 graph = new joint.dia.Graph();
	 paper = new joint.dia.Paper({
	 	el: $('#paper'),
	 	gridSize: 10,
	 	model: graph,
	 	height: 600,
	 	width: 1280
	 });

	
	// clicking anywhere outside of the dialog should close the dialog
	$(document).click(function() {
		closeConfigList();
	});
	$('#config-list').click(function(evt) {
		evt.stopPropagation();
	});
	
	// open the choose config dialog
	$('#open-file').click(function(evt) {
		// so that document doesn't handle the click
		evt.stopPropagation();

		var configList = $('#config-list');
		if (!configList.hasClass('details-off')) {
			// dialog already open. Can ignore
			return;
		}
		
		// remove the details-off class after fade-in otherwise 
		// all hell breaks loose
		configList.fadeIn(function() {
			configList.removeClass('details-off');
		});
		// next---bind the escape key to close the widget
		$(document).keyup(function(e) {
			if (e.keyCode == 27) {
				closeConfigList();
			} 
		});
		
		// get all configs in the project
		$.ajax("/sinspctr/configs/").done(function(json) {
			if (Array.isArray(json)) {
				var configsLoc = $('#configs');
				var str = '<ul>\n';
				json.forEach(function(config) {
					var lastSlash = config.lastIndexOf('/');
					var file = config.substring(lastSlash+1);
					if (file === 'pom.xml' || file === 'log4j.xml') {
						// ignore well-known non-configs
						return;
					}
					var path = config.substring(0, lastSlash+1);
					str+='<li class="config-item" path="' + config + '"><div class="file-name">' + file + '</div><div class="file-path">' + path + '</div></li>';
				});
				str += '</ul>\n';
				configsLoc.append(str);
				
				$('.config-item').click(function(evt) {
					clearGraph();
					// "/sinspctr/configs/META-INF/spring/integration/spring-integration-context.xml"
					var path = evt.currentTarget.getAttribute('path');
					location.pathname = EDIT_PREFIX + path;
					loadGraph(path);
					closeConfigList();
				});
			}
		});
	});
	
	// we shouldn't really be using the hash, but ok for now
	var configPath = location.pathname;
	if (configPath && configPath.slice(0, EDIT_PREFIX.length) === EDIT_PREFIX && configPath.slice(-4) === '.xml') {
		configPath = configPath.substring(EDIT_PREFIX.length);
		loadGraph(configPath);
	}
});

function removeLink(link) {
	for (var i = 0; i < edgesArr.length; i++) {
		if (edgesArr[i].link === link) {
			edgesArr.splice(i, 1);
		}
	}
	
	// now remove the xml node/attribute corresponding to the link
	var key = link.get('originates');
	var prop = link.get('originatesProperty');
	if (typeof prop === 'object') {
		// link is to a child node, not an attribute
		// remove the child
		$(prop).remove();
	} else {
		nodes[key].xml.removeAttribute(prop);
	}
}

function clearGraph() {
	if (window.graph) {
		graph.off('remove', removeLink);
		graph.clear();
		graph.on('remove', removeLink);
		
		// should go in separate fn
		var details = $('#details');
		details.addClass('details-off');
    	details.removeClass('details-on');
    	details.text('');

		// TODO make sure to remove this event handler on clear graph
    	$('#save-file');
	}
}

function loadGraph(url) {
	$.ajax('/sinspctr/configs' + url).done(function(xml) {
		var xmlDoc = $(xml);
		var beansXML = xmlDoc.find('*');
		createGraph(beansXML);
		
		console.log("original");
		console.log(xml);
		
		// TODO make sure to remove this event handler on clear graph
		$('#save-file').click(function doSave(evt) {
			var text = new XMLSerializer().serializeToString(xml);
			// do a post to the server!!!
			console.log("on save");
			console.log(text);
			
			$.ajax({ url : '/sinspctr/configs' + url, data : { xml : text }, type : "POST"}).done(function(xml) {
				console.log("Saved!!!");
				console.log(xml);
			})
		}
);
	});
}

function createGraph(rawElements) {
	paper.on('cell:pointerdown blank:pointerdown', function(evt, x, y) { 
		// now, show the xml in the textarea
	    var xmlElt = evt.model && evt.model.get && evt.model.get('xml');
	    // jquery can't handle add/remove class on svg elements
	    $('.border-selected').attr('class', 'border');
	    var details = $('#details');
	    if (xmlElt) {
	    	var text = new XMLSerializer().serializeToString(xmlElt);
	    	evt.$el.find('.border').attr('class', 'border border-selected');
	    	details.text(text);
	    	details.addClass('details-on');
	    	details.removeClass('details-off');
	    } else {
	    	details.addClass('details-off');
	    	details.removeClass('details-on');
	    	details.text('');
	    }
	});
	
	var g = dagre.graph();

	var nodes = {};
	
	graph.on('remove', removeLink);

	// convert raw elements into a nodes
	rawElements.each(function(i, elt) {
		var key = getKey(elt);
		if (key) {
			nodes[key] = {
					xml: elt,
					height: IMAGE_H, width: IMAGE_W,
					joint: new joint.shapes.sinspctr.IntNode({ 
						attrs: { '.label': { text: key }, '.image': {'xlink:href': extractImage(elt) }  } })
			};
			nodes[key].joint.set('xml', elt);
			nodes[key].joint.on('change:position', function() {
				// TODO shouldn't have to mess with all the splines
				reticulateSplines();
			});
		}
	});
	
	Object.keys(nodes).forEach(function(key) {
		var node = nodes[key];
		var links = findLinks(node.xml);
		links.to.forEach(function(toKey) {
			if (!nodes[toKey.key]) {
				console.warn('Node named ' + toKey.key + ' does not exist');
			}
			edgesArr.push(link(node, nodes[toKey.key], key, toKey.prop));
		});
		links.from.forEach(function(fromKey) {
			if (!nodes[fromKey.key]) {
				console.warn('Node named ' + fromKey.key + ' does not exist');
			}
			edgesArr.push(link(nodes[fromKey.key], node, key, fromKey.prop));
		});
	});
	
	// determine the location of the nodes
	dagre.layout()
      .nodes(_.values(nodes))
      .edges(edgesArr)
      .run();
	
	// scale the values
	_.values(nodes).forEach(function(node) {
		var rawX = FLIP_AXES ? node.dagre.y : node.dagre.x;
		var rawY = FLIP_AXES ? node.dagre.x : node.dagre.y;
		var newX = rawX * X_SCALE + X_TRANSLATE;
		var newY = rawY * Y_SCALE + Y_TRANSLATE;
		
		node.joint.attributes.position = {x: newX, y: newY};
	});
	
	function reticulateSplines() {
		edgesArr.forEach(recalculateVertices);
	};
	reticulateSplines();
	
	graph.addCell(_.pluck(_.values(nodes), 'joint'));
	graph.addCell(_.pluck(edgesArr, 'link'));
}


// should be supplied by implementation
function getKey(elt) {
	return (elt.getAttribute && elt.getAttribute('id')) || 
			(elt.getAttribute && elt.getAttribute('channel') && ("channel:" + elt.getAttribute('channel')))
			null;
}

function link(nodeFrom, nodeTo, originatesKey, originatesProperty) {
	var l = {
			source: nodeFrom, 
			target: nodeTo, 
			link: new joint.shapes.sinspctr.Link({
				source: { id: nodeFrom.joint.id, selector: '.output' },
				target: { id: nodeTo.joint.id, selector: '.input' }
			})
	};
//	l.link.set('smooth', true);
	l.link.set('originates', originatesKey);
	l.link.set('originatesProperty', originatesProperty);
	l.link.on('change:vertices', recalculateVertices);
	return l;
}

function findLinks(elt) {
	var links = { from: [], to: [] };
	function traverseChilren(children) {
		if (children && children.length) {
			for (var i = 0; i < children.length; i++) {
				var childKey = getKey(children[i]);
				if (childKey) {
					links.to.push({prop: children[i], key: childKey });
				} else if (children[i].localName === 'interceptors') {
					traverseChilren(children[i].childNodes);
				}
			}
		}
	}
	
	traverseChilren(elt.childNodes);
	var channel = elt.getAttribute('channel');
	if (channel) {
		links.to.push({prop: 'channel', key: channel });
	}
	var inputChannel = elt.getAttribute('input-channel');
	if (inputChannel) {
		links.from.push({prop: 'input-channel', key: inputChannel });
	}
	var outputChannel = elt.getAttribute('output-channel');
	if (outputChannel) {
		links.to.push({prop: 'output-channel', key: outputChannel });
	}
	var defaultOutputChannel = elt.getAttribute('default-output-channel');
	if (defaultOutputChannel) {
		links.to.push({prop: 'default-output-channel', key: defaultOutputChannel });
	}
	var ref = elt.getAttribute('ref');
	if (ref) {
		links.to.push({prop: 'ref', key: ref });
	}
	return links;
}

function extractImage(elt) {
	var imgName;
	switch (elt.localName) {
	case 'transformer':
		imgName = 'transformer.png';
		break;
	case 'channel':
		imgName = 'channel.png';
		break;
	case 'inbound-channel-adapter':
		imgName = 'inbound-adapter.png';
		break;
	case 'outbound-channel-adapter':
	case 'logging-channel-adapter':
		imgName = 'outbound-adapter.png';
		break;
	case 'header-value-router':
		imgName = 'router.png';
		break;
	case 'bean':
		imgName = 'spring-bean.jpg';
		break;
	default:
		imgName = 'not-here.jpg';
		break;
	}
	return '/sinspctr/assets/images/integration/' + imgName;
}

function recalculateVertices(edge) {
	var source = edge.source.joint;
	var target = edge.target.joint;
	
	var sx = source.attributes.position.x + IMAGE_W;
	var sy = source.attributes.position.y + IMAGE_H;
	var tx = target.attributes.position.x + IMAGE_W;
	var ty = target.attributes.position.y + IMAGE_H;

	// make a nice spline
	var mids = [];
	mids.push({x: ((tx-sx)/32*13) + sx, y: ((ty-sy)/8*0) + sy});
//	mids.push({x: ((tx-sx)/32*15) + sx, y: ((ty-sy)/8*2) + sy});
//	mids.push({x: ((tx-sx)/32*16) + sx, y: ((ty-sy)/8*4) + sy});
//	mids.push({x: ((tx-sx)/32*17) + sx, y: ((ty-sy)/8*6) + sy});
	mids.push({x: ((tx-sx)/32*19) + sx, y: ((ty-sy)/8*8) + sy});
	
	edge.link.off('change:vertices');
	edge.link.set('vertices', mids);
	edge.link.on('change:vertices', recalculateVertices);
}

