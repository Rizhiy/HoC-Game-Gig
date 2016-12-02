(function(){
	
	var xhr = new XMLHttpRequest();
	
	xhr.addEventListener("load", function(data){
		console.log("Done loading!");
	});
	
	xhr.addEventListener("progress", function(p){
		var el = document.getElementById("loadingbar")
		el.style.width = (100 * p.loaded / p.total) + "%";
	});
	
	xhr.open("GET", "emoji.png");
	xhr.send();
	
})();
