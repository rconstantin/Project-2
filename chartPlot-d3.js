var width = 1240,
    padding = 20;
    w_padding = 0;
    height = 300;

var hashtagNames = [
    "#taxes",
    "#jobs",
    "#immigration",
    "#healthcare",
    "#fairness",
    "#energy",
    "#education",
    "#defense",
    "#energy"
];

var tweets = tweetsAggregate();


tweets = tweets.map(function (d) {
    return d.map(function (p, i) {
        return {
            x: i,
            y: p,
            y0: 0
        };
    });
});

var n = 9, // number of layers
    m = 63; // number of samples per layer

var stack = d3.layout.stack().offset("wiggle"),
    layers = stack(tweets);

var customPalette = ["rgb(187,166,204)","rgb(255,127,0)", "rgb(245,178,98)","rgb(227,25,27)","rgb(252,154,153)",
                        "rgb(50,160,44)","rgb(178,223,138)","rgb(30,120,180)","rgb(155,195,219)"];   

var color = d3.scale.ordinal().range(customPalette);

var name = d3.scale.ordinal().range(function(d,i) {return "#"+hashtagList[i]});

var x = d3.time.scale()
    .domain([tweetIntervalStart[0], tweetIntervalStart[62]])
    .range([0,width]);
//var x = d3.scale.linear()
//    .domain([0, tweets[0].length])
//    .range([0, width]);

var y = d3.scale.linear()
    .domain([0, d3.max(layers, function(layer) { return d3.max(layer, function(d) 
        { return d.y0 + d.y; }); })])
    .range([0, height]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var area = d3.svg.area()
    .interpolate('basis')
    .x(function(d,i) { return x(tweetIntervalStart[i]); })
    .y0(function(d) { return y(d.y0); })
    .y1(function(d) { return y(d.y0 + d.y); });

var svg = d3.select("#streamgraph").append("svg")
    .attr("width", width)
    .attr("height", height+padding)
    ;

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
        return dominantTweet[i][0]* (width / m);
    })
    .attr("y", function(d,i) {
        return dominantTweet[i][1]*height;
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

