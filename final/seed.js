require( {
	"packages": [ { "name": "ydn", "location": ".", "main": "ydn.db-iswu-core-e-qry-dev" } ] });

var seed = {
	schema: {
		stores: [ 
		{
			name: "active",  // store definition
			keyPath: "taskID"
		}, 
		{
			name: "completed",
			keyPath: "taskID"
		} ]
	},
	db: "",
	array: [],
	forward: true,
	ctr: 0,
	init: function()
	{	
		seed.db = new ydn.db.Storage( "seedDB", seed.schema );
		$( "#submit" ).click( seed.input );
		$( "#input" ).keypress( function( e )
		{
			// Enter key saves task
			if( e.which === 13 )
			{
				seed.input();
			}
		} );
		$( "#clear" ).click( seed.clear );
		$( "#back, #forward" ).click( seed.navigate );
		
		// random task
		$( "#random" ).click( seed.random );
		
		// Keyboard navigation: left arrow is back, right arrow is forward
		$( document ).on( "keydown", function( event )
		{
			var keyCode = event.which;
			$( "body" ).data( "source", keyCode );
			if( keyCode === 37 || keyCode === 39 )
			{
				seed.navigate();
			}
		} );
		
		$( "#input" ).focus();
		seed.readStorage( seed.array, function( array )
		{
			seed.dueDateSort( array );
			seed.taskDiv();
		} );
	},
	input: function()
	{
		'use strict';
			
		var task = $( "#input" ).val();
		if( task )
		{
			var newTask = {
				taskID: new Date().getTime(),
				task: task,
				createdDate: seed.getISODate(),
				duration: "00:00:00",
				dueDate: "0000-00-00",
				deadline: "false"
			};
			
			console.log( newTask );
			var req = seed.db.put( { name: "active" }, newTask );
			req.done( function( key )
			{
				console.log( key );
			} );
			req.fail( function( e )
			{
				throw e;
			} );
			$( "#input" ).val( "" );
			seed.array.push( newTask );
			
			$( "#input" ).focus();
			
			seed.ctr = seed.array.length-1;
			console.log( "seed.ctr is " + seed.ctr );
			seed.taskDiv();
		}
	},
	deleteEntry: function( id )
	{
		"use strict";
		var id = parseInt( id, 10 );
		var keys = seed.db.remove( "active", id );
	},
	readStorage: function( array, callback )
	{
		"use strict";
		seed.db.values( "active" ).done( function( records )
		{
			var len = records.length;
			for( var i = 0; i < len; i++ )
			{
				array.push( records[ i ] );
			}
			callback( array );
		} );
	},
	dueDateSort: function( array )
	{
		'use strict';
		
		// bubble sort adapted from 
		// http://www.contentedcoder.com/2012/09/bubble-sort-algorithm-in-javascript.html
		var len = array.length-1, isSwap = true;
		for( var i = 0; i < len; i++ )
		{
			isSwap = false;
			for( var j = 0, swap, lastIndex = len - i; j < lastIndex; j++ )
			{
				if( Date.parse( array[ j ].dueDate ) > Date.parse( array[ j+1 ].dueDate ) )
				{
					swap = array[ j ];
					array[ j ] = array[ j+1 ];
					array[ j+1 ] = swap;
					isSwap = true;
				}
			}
			if( !isSwap )
			{
				break;
			}
		}
	},
	navigate: function()
	{
		'use strict';
		seed.stopTimer();
		
		var btnId = this.id;
		
		if( $( "#delete" ).is( ":checked" ) )
		{
			var req = seed.db.put( { name: "completed" }, seed.array[ seed.ctr ] );
			req.done( function( key )
			{
				console.log( key );
			} );
			req.fail( function( e )
			{
				throw e;
			} );
			
			seed.deleteEntry( seed.array[ seed.ctr ].taskID );
			
			// array moves down
			seed.array.splice( seed.ctr, 1 );
			
			// back button or left arrow key
			if( btnId === "back" || $( "body" ).data( "source" ) === 37 )
			{
				// When splicing from an array, the elements will move down, and the current index
				// will be pointing at the previously next element. So, the counter doesn't need to
				// be incremented after a splice.
				seed.forward = false;
				seed.ctr--;
			}
		}
		else
		{
			// forward button or right arrow key
			if( btnId === "forward" || $( "body" ).data( "source" ) === 39 )
			{
				seed.forward = true;
				seed.ctr++;
			}
			else
			{
				// If all else fails, go back. I think it's a good idea to have a default case,
				// although I don't see how this code would ever be run.
				seed.forward = false;
				seed.ctr--;
			}
		}
		
		if( seed.ctr >=	seed.array.length )
		{
			seed.ctr = 0;
		}
		if( seed.ctr < 0 )
		{
			seed.ctr = seed.array.length-1;
		}

		seed.taskDiv();
		$( "body" ).data( "source", 0 );
	},
	taskDiv: function()
	{
		'use strict';
		var setDirection = "";
		setDirection = seed.forward ? "left" : "right";
		
		if( $( "#task" ).length )
		{
			$( "#task" ).hide( "slide", {direction: setDirection}, 400, function()
			{
				$( "#task" ).html( "" );
				seed.taskDisplay();
				setDirection = setDirection === "left" ? "right" : "left";
				$( "#task" ).show( "slide", {direction: setDirection}, 400 );
			} );
		}
		else
		{
			$( "form" ).prepend( "<div id='task'></div>" );
			seed.taskDisplay();
		}
	},
	taskDisplay: function()
	{
		'use strict';
		if( seed.array.length )
		{
			$( "#task" ).append( 
						"<p><input type='checkbox' name='task' id='delete' value='' />" + seed.array[ seed.ctr ].task + 			"</p><p id='breakMsg'></p><img src='img/arrow-right.png' id='timerArrow' alt='arrow' /><span id='runner'>" + seed.array[ seed.ctr ].duration + "</span><p>Due: <input type='text' id='datepicker' /></p><p>Created on: " + seed.array[ seed.ctr ].createdDate );
			
			$( "#datepicker" ).val( seed.array[ seed.ctr ].dueDate );
			
			console.log( "deadline is " + seed.array[ seed.ctr ].deadline );
			
			var numDaysLeft = ( Date.parse( seed.array[ seed.ctr ].dueDate ) - Date.parse( seed.getISODate() ) ) / 86400000;
			
			if( numDaysLeft <= 3 && seed.array[ seed.ctr ].deadline === "true" )
			{
				$( "#reminder" ).html( "One or more tasks are due in 2 days or less!" );
				$( "#datepicker" ).addClass( "upcoming" );
				$( "#task p" ).addClass( "overdue" );
			}

			// icon from http://openiconlibrary.sourceforge.net/
			// under CC-by-SA http://creativecommons.org/licenses/by-sa/3.0/
			var duration = seed.array[ seed.ctr ].duration;
			var start = seed.stringToMilliseconds( duration );
			
			$( "#runner" ).runner({
				milliseconds: false,
				startAt: start,
				
				// stop after 25 minutes
				stopAt: 1500000,
				
				// http://pastebin.com/WZ1BA2nD
				format: function millisecondsToString(milliseconds) 
				{
					var oneHour = 3600000;
					var oneMinute = 60000;
					var oneSecond = 1000;
					var seconds = 0;
					var minutes = 0;
					var hours = 0;
					var result;

					if (milliseconds >= oneHour) {
						hours = Math.floor(milliseconds / oneHour);
					}

					milliseconds = hours > 0 ? (milliseconds - hours * oneHour) : milliseconds;

					if (milliseconds >= oneMinute) {
						minutes = Math.floor(milliseconds / oneMinute);
					}

					milliseconds = minutes > 0 ? (milliseconds - minutes * oneMinute) : milliseconds;

					if (milliseconds >= oneSecond) {
						seconds = Math.floor(milliseconds / oneSecond);
					}

					milliseconds = seconds > 0 ? (milliseconds - seconds * oneSecond) : milliseconds;

					if (hours > 0) {
						result = (hours > 9 ? hours : "0" + hours) + ":";
					} else {
						result = "00:";
					}

					if (minutes > 0) {
						result += (minutes > 9 ? minutes : "0" + minutes) + ":";
					} else {
						result += "00:";
					}

					if (seconds > 0) {
						result += (seconds > 9 ? seconds : "0" + seconds);
					} else {
						result += "00";
					}
					
					return result;
				}
			}).on( "runnerFinish", function( evt, info )
			{
				// Ask if they want to take a break.
				$( "#breakMsg" ).html( "Time for a break?" );
				$( "#runner" ).runner( "reset" );
				$( "#timerArrow" ).attr( "src", "img/pause.png" );
			} );
			$( "#timerArrow" ).toggleFunc( seed.startTimer, seed.stopTimer );
			$( "#datepicker" ).datepicker( {
				dateFormat: "yy-mm-dd",
				gotoCurrent: "true",
				onSelect: function()
				{
					var index = seed.array[ seed.ctr ].taskNum;
					
					seed.array[ seed.ctr ].dueDate = $( "#datepicker" ).val();
					seed.db.from( "active", "=", seed.array[ seed.ctr ].taskID ).patch( {dueDate: $( "#datepicker" ).val()} );
					
					seed.array[ seed.ctr ].deadline = "true";					
					seed.db.from( "active", "=", seed.array[ seed.ctr ].taskID ).patch( {deadline: "true"} );
					
					console.log( "datepicker val is " + $( "#datepicker" ).val() );
				}
			} );
		}
	},
	startTimer: function()
	{
		"use strict";
		$( "#runner" ).runner( "start" );
		$( "#timerArrow" ).attr( "src", "img/pause.png" );
		$( "#breakMsg" ).html( "" );
		// icon from http://openiconlibrary.sourceforge.net/
		// under CC-by-SA http://creativecommons.org/licenses/by-sa/3.0/
	},
	stopTimer: function()
	{
		'use strict';
		$( "#runner" ).runner( "stop" );
		$( "#timerArrow" ).attr( "src", "img/arrow-right.png" );
		
		// icon from http://openiconlibrary.sourceforge.net/
		// under CC-by-SA http://creativecommons.org/licenses/by-sa/3.0/
		
		if( seed.array.length )
		{
			seed.array[ seed.ctr ].duration = $( "#runner" ).html();
			seed.db.from( "active", "=", seed.array[ seed.ctr ].taskID ).patch( {duration: $( "#runner" ).html()} );
		}
	},
	clear: function()
	{
		'use strict';
		while( seed.array.length > 0 )
		{
			seed.array.pop();
		}
		seed.db.clear( "active" );
		seed.ctr = 0;
		seed.taskNum = 0;
		if( $( "#task" ) )
		{
			$( "#task" ).remove();
		}
	},
	random: function()
	{
		'use strict';
		seed.ctr = 1 + Math.floor( Math.random() * seed.array.length-1 );
		seed.taskDiv();
	},
	stringToMilliseconds: function( theString )
	{
		'use strict';
		var theArray = theString.split( ":" );
		var total = 0, multiplier = 3600000;
		$( theArray ).each( function( i, val )
		{
			total += val * multiplier;
			multiplier /= 60;
		} );
		return total;
	},
	getISODate: function()
	{
		'use strict';
		var dateObj = new Date();
		var month = dateObj.getMonth() + 1;
		var day = dateObj.getDate();
		var date = dateObj.getFullYear() + "-" + ( month < 10 ? "0" : "" ) + month + "-" + ( day < 10 ? "0" : "" ) + day;
		return date;
	}
};
seed.init();
