//Rate
/*
Avaliable at
https://www.pge.com/tariffs/tm2/pdf/ELEC_SCHEDS_EV.pdf
*/
var summer_peak_rate = 0.45389;
var summer_part_peak_rate = 0.24986;
var summer_off_peak_rate = 0.12225;
var winter_peak_rate = 0.32018;
var winter_part_peak_rate = 0.19794;
var winter_off_peak_rate = 0.12503;

//Time in 24-hour clock
/*
Peak: 
2:00 p.m. to 9:00 p.m. Monday through Friday.
14 to 21
3:00 p.m. to 7:00 p.m. Saturday, Sunday and Holidays.
15 to 19

Partial-Peak: 
7:00 a.m. to 2:00 p.m. and 
7 to 14
9:00 p.m. to 11:00 p.m. Monday through Friday, except holidays.
21 to 23

Off-Peak: All other hours.
*/
var peak_mon_fri_start_time = 14;
var peak_mon_fri_end_time = 21;
var part_peak_mon_fri_start_time_morning = 7;
var part_peak_mon_fri_end_time_morning = 14;
var part_peak_mon_fri_start_time_afternoon = 21;
var part_peak_mon_fri_end_time_afternoon = 23;
var peak_sat_sun_start_time = 15;
var peak_sat_sun_end_time = 19;

//Season
/*
The summer season is 
May 1 through October 31 and the 
4 - 9
winter season is 
November 1 through April 30.
10-3
*/
var season_summer_start = 4;
var season_summer_end = 9;

//About the car
//Amps the car charges at
var max_current_supported_by_car = 7.2;

/*
parse_fule function parses the CSV file locally. No data is transfered through
the internet
*/
function parse_file() {
	//Global variables
	parsed_csv = [];
	
	var fileUpload = document.getElementById("file");
//	var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.csv|.txt)$/;
	if (/*regex.test(fileUpload.value.toLowerCase())*/ true) {
		if (typeof (FileReader) != "undefined") {
			var reader = new FileReader();
			reader.onload = function (e) {
				var table = document.createElement("table");
				var rows = e.target.result.split("\n");
				
				for (var i = 0; i < rows.length; i++) {
					
					var row = table.insertRow(-1);
					var cells = rows[i].split(",");
					
					var rate = rate_of_time(cells[2]);
					if(spans_multiple_rates(cells[2], null,  cells[3], null).response != 0){
						rate = "mixed";
					}
					
					parsed_csv.push({
						start: cells[2],
						end: cells[3],
						duration: cells[4],
						kwh: cells[5], 
						cost: calculate_cost(cells[2], cells[3], cells[5]),
						rate: rate
					});
					
					for (var j = 0; j < cells.length; j++) {
						var cell = row.insertCell(-1);
						cell.innerHTML = cells[j];
					}
					//For testing
					
					var cell = row.insertCell(-1);
					cell.innerHTML = rate;
					
					/*
					var cell = row.insertCell(-1);
					var season = season_of_time(cells[2]);
					cell.innerHTML = season;
					
					var cell = row.insertCell(-1);
					var cost_per_kwh = cost_schedule(season, rate);
					cell.innerHTML = cost_per_kwh;
					
					var cell = row.insertCell(-1);
					var next_time = next_rate(cells[2], null, season, rate);
					cell.innerHTML = next_time;
					
					var cell = row.insertCell(-1);
					var spans_multiple = spans_multiple_rates(cells[2], null,  cells[3], null);
					cell.innerHTML = spans_multiple;
					
					var cell = row.insertCell(-1);
					var start_parsed_time = new Date(cells[2]);
					var end_parsed_time = new Date(cells[3]);
					var spans_multiple = model_charge_rate(start_parsed_time, end_parsed_time, cells[5]);
					cell.innerHTML = spans_multiple;
					*/
					var cell = row.insertCell(-1);
					var cost =calculate_cost(cells[2], cells[3], cells[5]);
					cell.innerHTML = cost;
					
					//end of testing
				}
				var dvCSV = document.getElementById("response");
				dvCSV.innerHTML = "";
				dvCSV.appendChild(table);
			};
			reader.readAsText(fileUpload.files[0]);
		}
		else {
			alert("This browser does not support HTML5.");
		}
	}
	else {
		alert("Please upload a valid CSV file.");
	}
}
/*
rate_of_time function given the current time as a string calculates at that moment rate.
For example, given "4/29/2017 5:48:14 PM" the function will return "peak"
*/
function rate_of_time(time, parsed_time){
	//Sunday is 0, Monday is 1, and so on.
	if(parsed_time == null){
		parsed_time = new Date(time);
	}
	
	//Is it Monday-Friday
	if(parsed_time.getDay() >= 1 && parsed_time.getDay() <= 5 ){
		//Peak
		if(
			//2:00 p.m. to 9:00 p.m. Monday through Friday.
			parsed_time.getHours() >= peak_mon_fri_start_time && parsed_time.getHours() < peak_mon_fri_end_time
		){
			return 'peak';
		}
		//Partial-Peak
		else if (
			//7:00 a.m. to 2:00 p.m. Monday through Friday
			parsed_time.getHours() >= part_peak_mon_fri_start_time_morning && parsed_time.getHours() < part_peak_mon_fri_end_time_morning ||
			//9:00 p.m. to 11:00 p.m. Monday through Friday
			parsed_time.getHours() >= part_peak_mon_fri_start_time_afternoon && parsed_time.getHours() < part_peak_mon_fri_end_time_afternoon
		){
			return 'part-peak';
		}
		//Off-peak
		return 'off-peak';
	}
	//Is Saturday-Sunday
	else{
		//Peak
		if(
			//3:00 p.m. to 7:00 p.m. Saturday, Sunday and Holidays
			parsed_time.getHours() >= peak_sat_sun_start_time && parsed_time.getHours() < peak_sat_sun_end_time
		){
			return 'peak';
		}
		//Partial-Peak
		//No part-peak for saturday and sundays
		
		//Off-peak
		return 'off-peak';
	}
	
	return 'undefined';
}
/*
season_of_time given the time as a string will return what season that time is located in
For example "4/29/2017 5:48:14 PM" returns "summer"
*/
function season_of_time(time, parsed_time){
	if(parsed_time == null){
		parsed_time = new Date(time);
	}
	//Note: January is 0, February is 1, and so on.
	if(
		//May 1 through October 31 and the 
		//4 - 9
		parsed_time.getMonth() >= season_summer_start &&
		parsed_time.getMonth() <= season_summer_end
	){
		return 'summer';
	}
	return 'winter';
}
/*
rate_schedule function given the current season and rate will 
return the current cost per kWh
For example, rate_schedule("summer", "peak") will return the 
value of the variable summer_peak_rate or 0.45389
*/
function cost_schedule(season, time_rate){
	if(season == 'summer'){
		if (time_rate == 'peak'){
			return summer_peak_rate;
		}
		else if(time_rate == 'part-peak'){
			return summer_part_peak_rate;
		}
		return summer_off_peak_rate;
	}
	//Else winter
	else{
		if (time_rate == 'peak'){
			return winter_peak_rate;
		}
		else if(time_rate == 'part-peak'){
			return winter_part_peak_rate;
		}
		return winter_off_peak_rate;
	}
}
/*
next_rate function is used to calculate the next rate 
For example, say off-peak starts at 11PM. I started charging at 
10:30PM at part-peak rate I want to calculate when the next 
rate is in effect. This function will return the time when the next rate ends
With this information you can find out when the next period begins

This is usesful when charging times overlaps multiple charging rates
*/
function next_rate(time, parsed_time, season, rate){
	//Optimizations
	if(parsed_time == null){
		parsed_time = new Date(time);
	}
	if(season == null){
		season = season_of_time(time);
	}
	if(rate == null){
		rate = rate_of_time(time);
	}
	
	//E.g. Friday 11PM, our next rate change is at Saturday 6AM 
	if(rate == 'peak'){
		//next is 'part-peak_afternoon' or off-peak
		//Peak next rate is always on the same day
		
		//If Monday-Friday
		if(parsed_time.getDay() >= 1 && parsed_time.getDay() <= 5){
			var end_time = new Date(parsed_time);
			end_time.setHours(peak_mon_fri_end_time);
			end_time.setMinutes(0);
			end_time.setSeconds(0);
			end_time.setMilliseconds(0);
			return end_time;
		}
		//It's a saturday-sunday
		var end_time = new Date(parsed_time);
		end_time.setHours(peak_sat_sun_end_time);
		end_time.setMinutes(0);
		end_time.setSeconds(0);
		end_time.setMilliseconds(0);
		return end_time;
	}
	else if(rate == 'part-peak'){
		//If Monday-Friday
		if(parsed_time.getDay() >= 1 && parsed_time.getDay() <= 5){
			//There can be two part peaks. Are we in the morning or after noon part-peak?
			if(parsed_time.getHours() >= part_peak_mon_fri_start_time_morning && parsed_time.getHours() < part_peak_mon_fri_end_time_morning){
				var end_time = new Date(parsed_time);
				end_time.setHours(part_peak_mon_fri_end_time_morning);
				end_time.setMinutes(0);
				end_time.setSeconds(0);
				end_time.setMilliseconds(0);
				return end_time;
			}
			var end_time = new Date(parsed_time);
			end_time.setHours(part_peak_mon_fri_end_time_afternoon);
			end_time.setMinutes(0);
			end_time.setSeconds(0);
			end_time.setMilliseconds(0);
			return end_time;
		}
		//Else it's Saturday-Sunday
		//There are no part-peak on the weekeneds
	}
	//It's off-peak right now
	//next is part-peak or peak

	//Only Sunday-Thursday off-peaks change over to m-f starts
	if(parsed_time.getDay() >= 0 && parsed_time.getDay() <= 4){
		var end_time = new Date(parsed_time);
		end_time.setHours(part_peak_mon_fri_start_time_morning);
		end_time.setMinutes(0);
		end_time.setSeconds(0);
		end_time.setMilliseconds(0);
		end_time.setTime( end_time.getTime() + 1 * 86400000 );
		return end_time;
	}
	//It's a Friday night, next sat_sun start time
	//else(parsed_time.getDay() >= 5){
	var end_time = new Date(parsed_time);
	end_time.setHours(peak_sat_sun_start_time);
	end_time.setMinutes(0);
	end_time.setSeconds(0);
	end_time.setMilliseconds(0);
	end_time.setTime( end_time.getTime() + 1 * 86400000 );
	return end_time;
	//}
}
/*
spans_multiple_rates given start and end times and duration, this function checks 
if the charge spans between multiple rate schedules.
*/
function spans_multiple_rates(start_time, start_parsed_time, end_time, end_parsed_time){
	if(start_parsed_time == null){
		start_parsed_time = new Date(start_time);
	}
	if(end_parsed_time == null){
		end_parsed_time = new Date(end_time);
	}
	//if(season == null){
		var season = season_of_time(start_time, start_parsed_time);
	//}
	//if(rate == null){
		var rate = rate_of_time(start_time, start_parsed_time);
	//}
	//If duration is larger than the difference between start time and next rate schedule, return true
	var duration_in_ms = end_parsed_time-start_parsed_time;
	
	var next_rate_time = next_rate(start_time, start_parsed_time, season, rate);
	var time_difference = next_rate_time - start_parsed_time;
	if(duration_in_ms > time_difference){
		if(season != season_of_time(next_rate_time)){
			var new_time = new Date(start_parsed_time);
			new_time.setHours(0);
			new_time.setMinutes(0);
			new_time.setSeconds(0);
			new_time.setMilliseconds(0);
			new_time.setTime( new_time.getTime() + 1 * 86400000 );
			return {response: 2, value: new_time};
		}
		return {response: 1, value: time_difference};
	}
	//return false;
	return {response: 0, value: null};
}
function calculate_cost (start_time, end_time, kwh){
	var start_parsed_time = new Date(start_time);
	var end_parsed_time = new Date(end_time);
	
	var cost_sum = 0;
	
	var spans_multiple = spans_multiple_rates(start_time, null, end_time, null);
	
	if(spans_multiple.response == 0){
		cost_sum = kwh*cost_schedule(season_of_time(null, start_parsed_time));
	}
	else{
		var charge_rate_array = model_charge_rate(start_parsed_time, end_parsed_time, kwh);
		console.debug(charge_rate_array);
		for(var i = 0; i<charge_rate_array.length; i++){
			cost_sum += charge_rate_array[i].cost*charge_rate_array[i].kwh;
		}
	}
	
	return cost_sum;
}
function model_charge_rate (start_parsed_time, end_parsed_time, kwh){
	var charge_rate_array = [];
	var total_time = end_parsed_time - start_parsed_time;
	var charge_rate = kwh/total_time;
	var spans_multiple = spans_multiple_rates(null, start_parsed_time, null, end_parsed_time);
	var current_start = start_parsed_time;
	var current_end = end_parsed_time;
	var kwh_remaining = kwh;
	while(spans_multiple.response != 0){
		//Normally the value is duration
		var ms_difference = spans_multiple.value;
		//But is response = 2, then value is the end time and we know there is still more
		if (spans_multiple.response == 2){
			ms_difference = spans_multiple.value-start_parsed_time;
			current_end = spans_multiple.value;
		}
		var kwh_use_in_this_time = ms_difference * charge_rate;
		kwh_remaining -= kwh_use_in_this_time;
		
		charge_rate_array.push({
			cost: cost_schedule(
				season_of_time(null, current_start), 
				rate_of_time(null, current_start)
			), 
			kwh: kwh_use_in_this_time});
		current_start = end_parsed_time;
		if(spans_multiple.response == 2){
			current_end = end_parsed_time;
		}
		spans_multiple = spans_multiple_rates(null, current_start, null, current_end);
	}
	charge_rate_array.push({
		cost: cost_schedule(
			season_of_time(null, current_start), 
			rate_of_time(null, current_start)
		), 
		kwh: kwh_remaining});
	return charge_rate_array;
}
function download(filename, parsed_csv) {
	if(filename == null){
		filename = "calculated-cost.csv";
	}
	var string_csv = parsed_csv.forEach(function(infoArray, index){
		dataString = infoArray.join(",");
		csvContent += index < data.length ? dataString+ "\n" : dataString;
	}); 
	
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(string_csv));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}