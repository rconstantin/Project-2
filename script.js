var hashtagPlot = document.getElementById('hashtag-plot');
var scrubBar = document.getElementById('scrub-bar');
var scrubBarPrev = document.getElementById('scrub-bar-preview');
var SOTUvideo = document.getElementById('sotu-video');
var videoOffset = 306;
scrubBarPrev.offsetTop = scrubBar.offsetTop;
var svgOffset = 40;

// Pull out all the transcript timestamps for use throughout
var transcript = document.getElementById('sotu-transcript');
var timestamps = extractTimestamps();
function extractTimestamps() {
	var timestamps = [];
	var stampedDivs = transcript.querySelectorAll('div');

	for (var i = 0; i < stampedDivs.length; i++) {
		timestamps[i] = parseInt(stampedDivs[i].id.split('-')[2], 10);
      //  stampedDivs[i].addEventListener('wheel',transcriptWheel,false);
	}

	return timestamps;
}

// Initialize these for loading later, after window.onload
var nation = null;
var statePaths = null;
var stateAbbreviations = [];

// Hardcoded colors for each hashtag, grabbed from the twitter site with https://en.wikipedia.org/wiki/DigitalColor_Meter
var hashtagColors = {
	"energy": "rgb(50,160,44)",
	"jobs": "rgb(255,127,0)",
	"education": "rgb(178,223,138)",
	"fairness": "rgb(252,154,153)",
	"healthcare": "rgb(227,25,27)",
	"defense": "rgb(30,120,180)",
};

////////////////////////////////////////////////////////////////////////////////
// Handling the hashtagPlot and scrubBar

// Run hashtagMousemove every time the mouse moves above the hashtagPlot
hashtagPlot.addEventListener('click', hashtagClick, false);

function hashtagClick(e) {
	updateScrubBar(e);
	updateVideo(e);
	updateTranscript(e);
    hashtagPlot.addEventListener('mouseout', playVideo, false);

}

// Run hashtagMousemove every time the mouse moves above the hashtagPlot
hashtagPlot.addEventListener('mouseover', hashtagMouseover, false);

function hashtagMouseover(e) {
    
    scrubBarPrev.style.visibility = 'visible';
 
    scrubBarPrev.style.left = e.clientX - position(hashtagPlot).x; // e.clientX is the mouse position

}

var syncScrollCount = 0;
function playVideo(e) {
	SOTUvideo.play();
	videoPlaying();
    hashtagPlot.removeEventListener('mouseout', playVideo, false);
    scrubBarPrev.style.visibility = "hidden";


}
// this is needed in case user just hits the start video at startup
SOTUvideo.addEventListener('play', playVideo,false);
// this is needed in case user just hits the start video at startup
/********** TBD
SOTUvideo.addEventListener('click', toggleVideo,false);
function toggleVideo(e)
{
    console.log(e);
    console.log(SOTUvideo.paused);
    if (SOTUvideo.paused == true) {
        playVideo(e);
    }
    else {
        SOTUvideo.paused = true;
        webkitCancelAnimationFrame(animationFrame);
        // scrubBar.style.visibility = "hidden";
        animationFrame = null;
    }
}
***************/

// Handling the scroll event in the sotu-transcript div

transcript.addEventListener('wheel',transcriptWheel,false);

function transcriptWheel(e) {
    syncScroll = false; // reset to avoid conflict
    syncScrollCount = 10;
    webkitCancelAnimationFrame(animationFrame);

    SOTUvideo.muted = 1;

    var ts = parseInt(e.srcElement.parentNode.id.split('-')[2]);
    if (ts >= videoOffset) {
        scrubBar.fractionScrubbed = (ts - videoOffset)/SOTUvideo.duration;
        scrubBar.style.left = scrubBar.fractionScrubbed * hashtagPlot.offsetWidth;
        SOTUvideo.currentTime = SOTUvideo.duration * scrubBar.fractionScrubbed;
        if (animationFrame != null) {
            webkitCancelAnimationFrame(animationFrame);
            // scrubBar.style.visibility = "hidden";
            animationFrame = null;
        }
        playVideo(e);
    }
}

// function to display scrubBar moving along with video
var animationFrame = null;
var syncScroll = true;
function videoPlaying() {
	if (syncScrollCount > 0) {
        syncScrollCount--;
    }
    else {
        syncScroll = true;
        SOTUvideo.muted = 0;
    }
	animationFrame = webkitRequestAnimationFrame(videoPlaying);
    
	scrubBar.style.visibility = 'visible';
	var curScrubBarFraction = SOTUvideo.currentTime/SOTUvideo.duration;
	scrubBar.style.left = curScrubBarFraction * hashtagPlot.offsetWidth;
    if (syncScroll == true) {
        scrollToTimestamp(nearestStamp(curScrubBarFraction));
    }
	if (SOTUvideo.ended == true) {
		webkitCancelAnimationFrame(animationFrame);
		scrubBar.style.visibility = "hidden";
        animationFrame = null;
        prevTarget.style.backgroundColor = null;
	}
}

function updateScrubBar(e) {
	// A function to make the scrubBar follow the mouse

	scrubBar.style.visibility = 'visible';
	scrubBar.style.left = e.clientX - position(hashtagPlot).x; // e.clientX is the mouse position

	scrubBar.fractionScrubbed = parseInt(scrubBar.style.left, 10)/hashtagPlot.offsetWidth;
}

function updateVideo(e) {
	SOTUvideo.currentTime = SOTUvideo.duration * scrubBar.fractionScrubbed;
}

////////////////////////////////////////////////////////////////////////////////
// Handling the scrolling transcript

function updateTranscript(e) {
	scrollToTimestamp(nearestStamp(scrubBar.fractionScrubbed));
}
var prevTarget = null;
function scrollToTimestamp(timestamp) {
	var target = transcript.querySelector('#transcript-time-' + timestamp);
    if (prevTarget != null) {
        prevTarget.style.backgroundColor = null;
    }
    prevTarget = target;
    target.style.backgroundColor = 'yellow';
    
 	document.getElementById('sotu-transcript').scrollTop = target.offsetTop;
}

function nearestStamp(fractionScrubbed) {
	// Figure out what the closest timestamp we have is to the current amount of scrubbing
	var timestampEquivalent = fractionScrubbed * SOTUvideo.duration + videoOffset; // IF we had a timestamp, what would it be?
	for (var i = 1; i < timestamps.length - 1; i++) {
		if ( timestamps[i] > timestampEquivalent ) { // Find teh first timestamp our guess is greater than
            return timestamps[i-1];
		}
	}
	return timestamps[timestamps.length - 1];
}


////////////////////////////////////////////////////////////////////////////////
// Adding the nav functionality for the video

var hashtagNav = document.getElementsByTagName('li');
for (var i = 0; i < hashtagNav.length; i++) {
	hashtagNav[i].addEventListener('click', navClick, false);
}

function navClick(e) {
	var timestamp = parseInt(this.getAttribute('data-timestamp'), 10);
	scrubBar.fractionScrubbed = (timestamp-videoOffset)/SOTUvideo.duration;
	updateVideo(e);
	updateTranscript(e);
}


////////////////////////////////////////////////////////////////////////////////
// Adding the map coloring functionality

window.onload = function () {
	// We have to make sure that we have the nation and the states 
	// But because of the size and loading time of the SVG, we have to attach it to an event handler for window.onload to make sure it's fully loaded 
	nation = document.getElementsByTagName('object')[0].contentDocument.getElementsByTagName('svg')[0];
	statePaths = nation.querySelectorAll('.state');
	
	// Go through and get all the state abbreviations used
	stateAbbreviations = [];
	for (var i = 0; i < statePaths.length; i++ ) {
		if (statePaths[i].id.length == 2) {
			stateAbbreviations.push(statePaths[i].id);
		}
	}

	recolorNation(dominantHashtagAt(SOTUvideo.currentTime)); // This is where the action happens: recolor the states for the current time of the video.
};

// Set up the video so that the chart is updated and the nation recolored every time the time changes
document.getElementById('sotu-video').addEventListener("timeupdate", updatePage);
function updatePage() {
	var dominantHashtag = dominantHashtagAt(SOTUvideo.currentTime);
	recolorNation(dominantHashtag);
	updateChart();
}

function dominantHashtagAt(time) {
	// A function to figure out the dominant hashtag at a given time

	// Hardcoded by looking at the plot--
	var dominantHashtags = [
		[1266, 'energy'],
		[1615, 'jobs'],
		[1861, 'education'],
		[2124, 'fairness'],
		[2681, 'healthcare'],
		[3592, 'defense']
	];


	// Go backwards through the hashtags looking for the first which predates the time we're looking for
	var dominantHashtag = null;
	for ( var j = dominantHashtags.length - 1; j >= 0; j-- ) {
		var timestamp = dominantHashtags[j][0];
		var hashtag = dominantHashtags[j][1];
		timestamp -= videoOffset;

		if (time > timestamp) {
			return hashtag;
		}
	}

	// Otherwise, if going backwards hasn't found one that's before the time we're looking for, return the first
	return dominantHashtags[0][1];
}


function recolorNation(hashtag) {
	// A function to go through every state and color it correctly for a given hashtag

	for ( var k = 0; k < stateAbbreviations.length; k++ ) {
		var stateAbbreviation = stateAbbreviations[k];
		var state = nation.getElementById(stateAbbreviation);
		colorState(state, getIntervalAt(SOTUvideo.currentTime), hashtag);
	}
}

function getIntervalAt(seconds) {
	// A function to get the nearest Interval we have from twitter for a given time
	return UTCtoNearestAvailableIntervalData(videoTimeToUTC(seconds));
}

function UTCtoNearestAvailableIntervalData(UTCdate) {
	// Go from a UTC date/time to the nearest available Interval we have from twitter

	// Get all the tweetIntervals from the tweetValues we loaded from values.json
	var tweetIntervals = Object.keys(tweetValues);
	for (var i = 0; i < tweetIntervals.length; i++) {
		// Tweets are indexed by interval (e.g. 2014-01-29 02:15:::2014-01-29 02:15), and we just want the start of the interval
		var tweetIntervalStart = new Date(tweetIntervals[i].split(':::')[0]);
		// As we go through, check if the time we just converted is after the time we're looking fo
		if (UTCdate < tweetIntervalStart) {
			return tweetValues[tweetIntervals[i-1]];
		}
	}
}

function videoTimeToUTC(seconds){
	// From a certain number of seconds after the SOTU started, get the absolute time in UTC
	var SOTUstart = new Date(2014, 0, 28, 21, 15, 0); // the date of the SOTH
	UTCOffset = 5*60*60; // in seconds
	return new Date(SOTUstart.getTime() + 1000*(UTCOffset + seconds)); // *1000 b/c Date expects milliseconds
}

function colorState(statePath, interval, hashtag) {
	// A function to color a given state, at a given interval, for a given hashtag
	statePath.style.opacity = 0.1; // Default to 10% opacity
	statePath.style.fill = hashtagColors[hashtag]; // Figure out what color we should use

	if (Object.keys(interval).indexOf(statePath.id) != -1) { // If a state was sufficiently engaged in this interval to have data
		var range = engagementRange(interval, hashtag); // Figure out the max and min of engagement overall so we can color proportionally
		var stateEngagements = interval[statePath.id]; // And then pull out this one state's engagements with different hashtags

		for (var i = 0; i < stateEngagements.length; i++) { // Iterate over the hashtags
			if ( stateEngagements[i][0] == '#' + hashtag ) { // And when we find the one we're coloring for
				var myEngagement = parseFloat(stateEngagements[i][1], 10);
				var newOpacity = interpolate(myEngagement, range, [0.1,1]);
				statePath.style.opacity = newOpacity; // set the opacity to be proportional to our state's relative engagement
				return; // and stop iterating
			}
		}
	}
}

function engagementRange(interval, hashtag) {
	// A function getting the min (range[0]) and max (range[1]) engagement for a given hashtag in a given interval across the country
	var range = [0,0];
	for ( var state in interval ) {
		var stateData = interval[state];
		for ( var i = 0; i < stateData.length; i++ ) {
			if ('#' + hashtag == stateData[i][0]) {
				var frequency = stateData[i][1];
				range[0] = Math.min(range[0], frequency);
				range[1] = Math.max(range[1], frequency);
			}
		}
	}

	return range;
}
// dictionary containing tweetIntervalStart, tweetIntervalEnd, AllStatesTweets
var taxesTweetCollection = [];
var energyTweetCollection = [];
var jobsTweetCollection = [];
var immigrationTweetCollection = [];
var educationTweetCollection = [];
var fairnessTweetCollection = [];
var healthcareTweetCollection = [];
var defenseTweetCollection = [];
var budgetTweetCollection = [];
var tweetCollection = [];
var tweetIntervalStart = [];
var hashtagList = ['taxes','jobs','immigration',
                    'healthcare',
                    'fairness',
                    'energy',
                    'education',
                    'defense','budget'];
var dominantTweet = [];
for (var i = 0; i < hashtagList.length; i++)
{
    dominantTweet[i] = [0,0];
}
function tweetsAggregate() {
    // build tweet value collection per interval by adding state values per hashtag

    // Get all the tweetIntervals from the tweetValues we loaded from values.json
    var tweetIntervals = Object.keys(tweetValues);
    
    for (var i = 0; i < tweetIntervals.length; i++) {
        // Tweets are indexed by interval (e.g. 2014-01-29 02:15:::2014-01-29 02:15), and we just want the start of the interval
        tweetIntervalStart[i] = new Date(tweetIntervals[i].split(':::')[0] + ' GMT');
      //  var tweetIntervalEnd = new Date(tweetIntervals[i].split(':::')[1]) + ' GMT');
        var perStateValues = tweetValues[tweetIntervals[i]];
     
        taxesTweetCollection[i] = engagementTotal(perStateValues,'taxes');
        jobsTweetCollection[i] = engagementTotal(perStateValues,'jobs');
        if (dominantTweet[1][1] < jobsTweetCollection[i]) {
            dominantTweet[1][0] = i;
            dominantTweet[1][1] = jobsTweetCollection[i];
        }
        immigrationTweetCollection[i] = engagementTotal(perStateValues,'immigration');
        healthcareTweetCollection[i] = engagementTotal(perStateValues,'healthcare');
        if (dominantTweet[3][1] < healthcareTweetCollection[i]) {
            dominantTweet[3][0] = i;
            dominantTweet[3][1] = healthcareTweetCollection[i];
        }
        fairnessTweetCollection[i] = engagementTotal(perStateValues,'fairness');
        if (dominantTweet[4][1] < fairnessTweetCollection[i]) {
            dominantTweet[4][0] = i;
            dominantTweet[4][1] = fairnessTweetCollection[i];
        }        
        energyTweetCollection[i] = engagementTotal(perStateValues,'energy');
        if (dominantTweet[5][1] < energyTweetCollection[i]) {
            dominantTweet[5][0] = i;
            dominantTweet[5][1] = energyTweetCollection[i];
        }
        educationTweetCollection[i] = engagementTotal(perStateValues,'education');
        if (dominantTweet[6][1] < educationTweetCollection[i]) {
            dominantTweet[6][0] = i;
            dominantTweet[6][1] = educationTweetCollection[i];
        }
        defenseTweetCollection[i] = engagementTotal(perStateValues,'defense');
        if (dominantTweet[7][1] < defenseTweetCollection[i]) {
            dominantTweet[7][0] = i;
            dominantTweet[7][1] = defenseTweetCollection[i];
        }
        budgetTweetCollection[i] = engagementTotal(perStateValues,'budget');
    }
    dominantTweet[1][1] -= (healthcareTweetCollection[dominantTweet[1][0]]+immigrationTweetCollection[dominantTweet[1][0]]);
    dominantTweet[3][1] -= fairnessTweetCollection[dominantTweet[3][0]];
    dominantTweet[4][1] = dominantTweet[1][1] + 2 * jobsTweetCollection[dominantTweet[4][0]];
    dominantTweet[5][1] -= educationTweetCollection[dominantTweet[5][0]];
    dominantTweet[6][1] -= jobsTweetCollection[dominantTweet[6][0]];
    dominantTweet[7][0] -= 7;
    dominantTweet[7][1] = dominantTweet[5][1];
    return ([taxesTweetCollection,jobsTweetCollection, immigrationTweetCollection,healthcareTweetCollection, 
    fairnessTweetCollection,energyTweetCollection, educationTweetCollection, defenseTweetCollection,budgetTweetCollection]);
}

function engagementTotal(interval, hashtag) {
    // A function getting the total engagement across all state for a hashtag at an interval
    var total = 0;
    for (var state in interval) {
        var stateData = interval[state];
        for (var i = 0; i < stateData.length; i++) {
            if ('#' + hashtag == stateData[i][0]) {
                total += stateData[i][1];
            }
        }
    }
    return total;
}

function updateChart() {
	// Now that we have all the needed data, actually redraw the chart

	var currentInterval = getIntervalAt(SOTUvideo.currentTime);
	var numbers = document.querySelectorAll('#hashtag-chart li div.bar'); // Get all the bar chart divs

	var rawTotals = {};
	for (var i = 0; i < numbers.length; i++) {
		// Total engagement for a given hashtag across the nation
		rawTotals[numbers[i].id] = getTotalEngagement(currentInterval, numbers[i].id);
	}

	// Figure out the range of engagement
	var maxEngagement = 0;
	var totalEngagement = 0;
	for ( var eachHashtag in rawTotals ) {
		maxEngagement = Math.max(maxEngagement, rawTotals[eachHashtag]);
		totalEngagement += rawTotals[eachHashtag];
	}

	// For each hashtag, calculate how to scale the bars so that the largest is '1'
	for (var hashtag in rawTotals) {
		var newWidth = interpolate(rawTotals[hashtag], [0, maxEngagement], [0,1])*65 + '%';
		var bar = document.querySelector('li div#' + hashtag);
		bar.style.width = newWidth;

		// Color the dominant hashtag, make the rest gray
		var sibling = null; // Holds the text next to each bar
		if (hashtag == dominantHashtagAt(SOTUvideo.currentTime)) {
			bar.style.backgroundColor = hashtagColors[hashtag];
			sibling = bar.parentNode.getElementsByClassName('hashtag')[0];
			sibling.style.color = hashtagColors[hashtag];
		}
		else {
			sibling = bar.parentNode.getElementsByClassName('hashtag')[0];
			sibling.style.color = '#d3d3d3';
			bar.style.backgroundColor = '#d3d3d3';
		}

	}
}


function getTotalEngagement(interval, hashtag) {
	// A function to sum up total engagement so we can plot things proportionally
	var sum = 0;
	for ( var state in interval ) {
		var stateData = interval[state];
		for ( var i = 0; i < stateData.length; i++ ) {
			if ('#' + hashtag == stateData[i][0]) {
				sum += stateData[i][1];
			}
		}
	}

	return sum;
}


////////////////////////////////////////////////////////////////////////////////
// Utility functions

function position(element) {
	// A function which takes an element and returns a dictionary with its x and y position
    for (var lx=0, ly=0;
         element !== null;
         lx += element.offsetLeft, ly += element.offsetTop, element = element.offsetParent);

    return {x: lx, y: ly};
}

function interpolate(value, from, to) {
	// A function that lets us scale a value from one scale to another-- e.g. 5 : [0, 10] to 0.5 for [0, 1]
	var fromSpread = from[1] - from[0];
	var toSpread = to[1] - to[0];
	
	var ratio = toSpread/fromSpread;

	return (value - from[0])*ratio + to[0];
}