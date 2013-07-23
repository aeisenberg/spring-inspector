/*jslint browser:true */
/*global d3 */
var AMT = 6;
d3.xml("http://localhost:8081/sinspctr/configs/anythin", "application/xml", function(err, xml) {
	var w = 1280,
		h = 800,
		r = AMT,
		z = d3.scale.category20c();  // use for coloring later

	var cluster = d3.layout.cluster().separation(function separation(a, b) {
		return 1;
	}).nodeSize([24, 200]).children(function(beanNode) {
		// return all direct descendants of current node
		var children = beanNode.childNodes;
		var realChildren = [];
		for (var i = 0; i < children.length; i++) {
			if (children[i] instanceof Element) {
				realChildren.push(children[i]);
			}
		}
		return realChildren;
	}).sort(function(l, r) {
		return d3.ascending(l.nodeName, r.nodeName);
	});
	var diagonal = d3.svg.diagonal().projection(function(d) {
		return [d.y, d.x+h/4];
	});

	var svg = d3.select("#graph").append("svg:svg").attr("width", w).attr("height", h).append("svg:g")
		.attr("transform", "translate(" + w/4 + "," + h/3 + ")");

	svg.append("svg:rect").attr("width", w).attr("height", h).style("stroke", "#000");

	
	var beansXML = xml.getElementsByTagName("beans")[0];
	var beansNodes = cluster.nodes(beansXML),
		beanLinks = cluster.links(beansNodes);
	var svgLinks = svg.selectAll(".link").data(beanLinks).enter().append("path").attr("class", "link").attr("d", diagonal);

	var svgNodes = svg.selectAll(".node").data(beansNodes).enter().append("g").attr("class", "node")
		.attr("transform", function(d) {
			return "translate(" + d.y + "," + (d.x+h/4) + ")";
		});

	svgNodes.append("rect").attr("width", 300).attr("height", 24);
	svgNodes.append("text").attr("dy", "20").attr("dx", "3").attr('font-size', '24').text(function(d) {
		return d.localName;
	});
});
