var width = 1200,
    padding = 20;
    height = 300;

var tweets = [];
tweets = [[0,   100],
        [100, 200],
        [200, 300],
        [300, 110],
        [400, 10],
        [500, 60],
        [600, 100],
        [700, 50],
        [800, 40],
        [900, 105],
        [1000, 30],
        [1100, 120],
        [1200, 60]];

var hashtagNames = [
    "#energy",
    "#jobs",
    "#education",
    "#fairness",
    "#healthcare",
    "#defense",
];

tweets = tweetsAggregate();


tweets = tweets.map(function (d) {
    return d.map(function (p, i) {
        return {
            x: i,
            y: p,
            y0: 0
        };
    });
});

var n = 6, // number of layers
    m = 63; // number of samples per layer

var stack = d3.layout.stack().offset("wiggle"),
    layers = stack(tweets);
//    layers = stack(nest.entries(function(d) { return getLayers(tweets); }));

var customPalette = ["rgb(50,160,44)", "rgb(255,127,0)", "rgb(178,223,138)", "rgb(252,154,153)", 
                        "rgb(227,25,27)", "rgb(30,120,180)"];   

var color = d3.scale.ordinal().range(customPalette);


var name = d3.scale.ordinal().range(function(d,i) {return "#"+hashtagList[i]});


var x = d3.scale.linear()
    .domain([0, tweets[0].length])
    .range([0, width]);

var y = d3.scale.linear()
    .domain([0, d3.max(layers, function(layer) { return d3.max(layer, function(d) 
        { return d.y0 + d.y; }); })])
    .range([0, height]);
       
var xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom");

var area = d3.svg.area()
    .interpolate('cardinal')
    .x(function(d,i) { return x(i); })
    .y0(function(d) { return y(d.y0); })
    .y1(function(d) { return y(d.y0 + d.y); });

var svg = d3.select("#hashtag-plot").append("svg")
    .attr("width", width+padding)
    .attr("height", height+padding);

svg.selectAll("path")
    .data(layers)
    .enter().append("path")
    .attr("class", "layer")
    .attr("d", function (d) {
    return area(d)})
    .style("fill", function(d,i) { return color(i); })
    ;
svg.selectAll("text")
    .data(layers)
    .enter()
    .append("text")
    .text(function(d,i) {return hashtagNames[i];})
    .attr("x", function(d, i) {
        return i * (width / layers.length) + (width / layers.length - padding) / 2;
    })
    .attr("y", function(d,i) {
        return height/2;
    })
    .attr("text-anchor", "middle")
    .attr("font-family", "sans-serif")
    .attr("font-size", "16px")
    .attr("fill", "white")
;
svg.append("g")
    .attr("class", "axis")  //Assign "axis" class
    .attr("transform", "translate(0," + (height - padding) + ")")
    .call(xAxis)
    ;


function getLayers(tweets,m) {
    //return a.map(function(d, i) { return {x: i, y: Math.max(0, d)}; });

    return tweets.map(function(d, i) { return {x: tweets[i][0], y: tweets[i][1] }});

}