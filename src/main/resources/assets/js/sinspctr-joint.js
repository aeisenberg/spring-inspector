/*jslint browser:true */
/*global $ joint */
$(document).ready(function() {
	var graph = new joint.dia.Graph();

	var paper = new joint.dia.Paper({
	    el: $('#paper'),
	    width: 800,
	    height: 350,
	    gridSize: 10,
	    perpendicularLinks: true,
	    model: graph
	});

	$.ajax("http://localhost:8081/sinspctr/configs/anythin").done(function(xml) {
		var xmlDoc = $(xml);
		var beansXML = xmlDoc.find('*');
		var g = dagre.graph();

		function link(keyFrom, keyTo) {
			var l = {
					source: nodes[keyFrom], 
					target: nodes[keyTo], 
					link: new joint.shapes.pn.Link({
						source: { id: nodes[keyFrom].joint.id, selector: '.root' },
						target: { id: nodes[keyTo].joint.id, selector: '.root' }
					})
			};
			return l;
			}
		
		
		var nodesArr = [];
		var edgesArr = [];
		var nodes = {};
		beansXML.each(function(i, elt) {
			var key = getKey(elt);
			if (key) {
				var node = new joint.shapes.pn.Place({ 
					position: { x: 500, y: 50 }, 
					attrs: { '.label': { text: key }  }, tokens: 1 });
				nodes[key] = {xml: elt, joint: node, height: 50, width: 50};
				nodesArr.push(nodes[key]);
			}
		});

		Object.keys(nodes).forEach(function(key) {
			var node = nodes[key];
			var children = node.xml.childNodes;
			for (var i = 0; i < children.length; i++) {
				var childKey = getKey(children[i]);
				if (childKey) {
					edgesArr.push(link(key, childKey));
				}
			}
		});
		
		dagre.layout()
	      .nodes(nodesArr)
	      .edges(edgesArr)
	      .run();
		
		graph.addCell(nodesArr.map(function(node) {
			node.joint.attributes.position = {x: node.dagre.x, y: node.dagre.y + 200};
			return node.joint;
		}));
		graph.addCell(edgesArr.map(function(edge) {
			return edge.link;
		}));
	});
});


function getKey(elt) {
	return (elt.getAttribute && elt.getAttribute('id')) || 
			(elt.localName === 'beans' && elt.localName) ||
			(elt.getAttribute && elt.getAttribute('channel') && ("channel:" + elt.getAttribute('channel')))
			null;
}