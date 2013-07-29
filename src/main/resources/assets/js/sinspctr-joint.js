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

joint.shapes.sinspctr = {};

joint.shapes.sinspctr.IntNode = joint.shapes.basic.Generic.extend({

    markup: '<g class="rotatable"><g class="scalable">' +
    		'<image class="image" /><rect class="border-white"/>' +
    		'<rect class="border"/>' +
    		'<circle class="input" /><circle class="output" />' +
//    		'<polygon class="input" /><polygon class="output" />' +
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
//            	points: '0, 0 10, 5 0, 10',
            	stroke: 'lightgray',
            	fill: 'red',
            	transform: 'translate(' + (IMAGE_W/2) + ',' + (IMAGE_H) + ')'
            },
            '.output': {
            	magnet: true,
            	width: 15,
            	height: 15,
            	r: 5,
//            	points: '0, 0 10, 5 0, 10',
            	stroke: 'lightgray',
            	fill: 'green',
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
        },
    }, joint.dia.Link.prototype.defaults)
});

function closeConfigList() {
	var configList = $('#config-list');
	configList.fadeOut(function() {
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
function clearGraph() {
	if (window.graph) {
		graph.clear();
		
		// should go in separate fn
		var details = $('#details');
		details.addClass('details-off');
    	details.removeClass('details-on');
    	details.text('');

	}
}

function loadGraph(url) {
	$.ajax('/sinspctr/configs' + url).done(function(xml) {
		var xmlDoc = $(xml);
		var beansXML = xmlDoc.find('*');
		createGraph(beansXML);
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

	var edgesArr = [];
	var nodes = {};
	
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
			if (!nodes[toKey]) {
				console.warn('Node named ' + toKey + ' does not exist');
			}
			edgesArr.push(link(node, nodes[toKey]));
		});
		links.from.forEach(function(fromKey) {
			if (!nodes[fromKey]) {
				console.warn('Node named ' + fromKey + ' does not exist');
			}
			edgesArr.push(link(nodes[fromKey], node));
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
		edgesArr.forEach(function(edge) {
			var sx = edge.source.joint.attributes.position.x + IMAGE_W;
			var sy = edge.source.joint.attributes.position.y + IMAGE_H;
			var tx = edge.target.joint.attributes.position.x + IMAGE_W;
			var ty = edge.target.joint.attributes.position.y + IMAGE_H;
			
			// make a nice spline
			var mids = [];
			mids.push({x: ((tx-sx)/32*15) + sx, y: ((ty-sy)/8*2) + sy});
			mids.push({x: ((tx-sx)/32*16) + sx, y: ((ty-sy)/8*4) + sy});
			mids.push({x: ((tx-sx)/32*17) + sx, y: ((ty-sy)/8*6) + sy});
			edge.link.set('vertices', mids);
		});
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

function link(nodeFrom, nodeTo) {
	var l = {
			source: nodeFrom, 
			target: nodeTo, 
			link: new joint.shapes.sinspctr.Link({
				source: { id: nodeFrom.joint.id, selector: '.output' },
				target: { id: nodeTo.joint.id, selector: '.input' }
			})
	};
	l.link.set('smooth', true);
	return l;
}

function findLinks(elt) {
	var links = { from: [], to: [] };
	function traverseChilren(children) {
		if (children && children.length) {
			for (var i = 0; i < children.length; i++) {
				var childKey = getKey(children[i]);
				if (childKey) {
					links.to.push(childKey);
				} else if (children[i].localName === 'interceptors') {
					traverseChilren(children[i].childNodes);
				}
			}
		}
	}
	
	traverseChilren(elt.childNodes);
	var channel = elt.getAttribute('channel');
	if (channel) {
		links.to.push(channel);
	}
	var inputChannel = elt.getAttribute('input-channel');
	if (inputChannel) {
		links.from.push(inputChannel);
	}
	var outputChannel = elt.getAttribute('output-channel');
	if (outputChannel) {
		links.to.push(outputChannel);
	}
	var defaultOutputChannel = elt.getAttribute('default-output-channel');
	if (defaultOutputChannel) {
		links.to.push(defaultOutputChannel);
	}
	var ref = elt.getAttribute('ref');
	if (ref) {
		links.to.push(ref);
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

