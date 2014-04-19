/**
 * jQuery GoogleMultiFeed plugin
 *  - Loading multiple feeds with Google AJAX Feed API
 *
 * The MIT License
 * 
 * Copyright (c) 2010 Takayuki Miwa
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

google.load("feeds", "1");

with({ init: null }) {

    /*
     Initializes the plugin.
     */
    init = function () {
	var $ = jQuery;

	// Public API
	jQuery.fn.googleMultiFeed = function(options) {
	    var feed = new GoogleMultiFeed(this, options || {});
	    feed.load();
	    return this;
	}

	// Formatter methods
	var Formatter = {
	    format: function(entry, feed) {
		
		var link = $('<a />').
			    attr({href: entry.link, title: entry.title +" | "+ feed.title, target:"_blank"});
			
		var title = $('<div />').
		    attr({class:"entry-title"}).
		    text(entry.title 
				// +' ['+ feed.title +']'
		);
		
		link.append(title);
		
		link.append(this.formatDate(entry.publishedDate));
			
		var contentSnippet = $('<p />').text(entry.contentSnippet);
		
		link.append(contentSnippet);
			
		return $('<div />').attr({class:"entry-item"}).append(link);
	    },

	    formatDate: function(str) {
		var date = new Date(str),
	        y = date.getFullYear(),
	        m = date.getMonth() + 1,
	        d = date.getDate();
		return $('<span class="entry-date"/>')
		    .text(y +"-"+ (m < 10 ? "0" + m : m) +"-"+ (d < 10 ? "0" + d : d));
	    },

	    output: function(container, all, completed) {
		container.empty();
		$.each(all, function() { container.append(this); });
	    },

	    loadCompleted: function() {
	    }
	};

	// Class
	var GoogleMultiFeed = function() {
	    this.init.apply(this, arguments);
	};

	GoogleMultiFeed.prototype = {
	    init: function(container, options) {
		this.container = container;
		this.urls = [];
		this.timeout = 5000;
		this.renderPeriod = 200;
		this.numEntries = 4;
		$.extend(this, options || {});

		this._loaded = 0;
		this._renderedEntries = [];
		this._loadedEntries = [];

		this._proxy = {
		    onLoad: $.proxy(this, "onLoad"),
		    render: $.proxy(this, "render"),
		    cleanup: $.proxy(this, "cleanup")
		};
	    },
	    onLoad: function(result) {
		this._loaded++;
		if(result.error) {
		    return;
		}
		var formatted = $.map(result.feed.entries, this._entryFormatter(result));
		this._loadedEntries = this._loadedEntries.concat(formatted);
	    },
	    _entryFormatter: function(result) {
		var self = this;
		return function(entry) {
		    return { html: self.format(entry, result.feed),
			     date: (new Date(entry.publishedDate)).getTime() };
		}
	    },
	    render: function() {
		var completed = this._loaded == this.urls.length;

		if(this._loadedEntries.length > 0) {
		    var all = this._renderedEntries.concat(this._loadedEntries);
		    all.sort(function(x, y) {
				 return x.date > y.date ? -1 :
				     (x.date == y.date ? 0 : 1);
			     });
		    this.output(this.container,
				$.map(all, function(e){ return e.html; }),
				completed);

		    this._loadedEntries = [];
		    this._renderedEntries = all;
		}

		if(completed) {
		    this.loadCompleted();
		    this._renderedEntries = [];
		} else {
		    setTimeout(this._proxy.render, this.renderPeriod);
		}
	    },
	    cleanup: function() {
		this._loaded = this.urls.length;
	    },
	    load: function() {
		for(var i=0; i<this.urls.length; ++i) {
		    var feed = new google.feeds.Feed(this.urls[i]);
		    feed.setNumEntries(this.numEntries);
		    feed.load(this._proxy.onLoad);
		}
		setTimeout(this._proxy.render, this.renderPeriod);
		setTimeout(this._proxy.cleanup, this.timeout);
	    }
	};
	$.extend(GoogleMultiFeed.prototype, Formatter);
    };

    if(typeof jQuery == 'function') {
	//jQuery is already loaded, and then initializes the plugin.
	init();
    } else {
	//jQuery is not yet loaded (may be loaded by google.load),
	//and developers must initialize the plugin by calling initGoogleMultiFeed()
	//in their google.setOnLoadCallback.
	this.initGoogleMultiFeed = init;
    }
}
