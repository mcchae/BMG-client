var apiServer = "api.bmg.name:9000";
//var apiServer = "192.168.0.8:9000";
var apiheaders = {
	"X-Service-Type":"AXBrain/BMG",
	"X-BMG-AccessToken":"AXBrain",
	"X-User-Token":user_token	
};
var apiCallStop = false;
var apiCall = function(_url, options, callBack){
	if(!_url){
		trace("url이 없습니다.");
		return;
	}
	if(apiCallStop) return;
	new AXReq("http://" + apiServer + "/" + _url, 
	{
		debug: false, 
		pars: (options.param || "{}"), 
		type: (options.method || "GET"),
		contentType: "application/json",
		async:true,
		headers: apiheaders,
		onsucc: function (res) {
			if(res.session_eror){
				//trace(res);
				//alert(res.session_eror.error_name);
				if(apiCallStop) return;
				alert("세션이 만료되었습니다. 로그인을 다시해주세요");
				apiCallStop = true;
				AXReqAbort();
				location.href = "index.html";
				return;
			}
			if(res.error){
				toast.push({type:"Caution", body:res.error.error_name});
				//callBack("error", res);
				return;
			}
			callBack("success", res);
		},
		onerr: function(e){
			callBack("error", e);
		}
	});	
};

var selectedTeamId = AXUtil.getCookie("selectedTeamId"), selectedGameId = AXUtil.getCookie("selectedGameId");

var fcObj = {
	popInit: function(){
		/*AXUtil.readyMobileConsole();*/
		
		fcObj.popmenu = $("#popmenu");
		fcObj.popusermenu = $("#popusermenu");
		
		if(AXUtil.browser.mobile){
			$("#popMenuHandle").bind("click", function(){
				fcObj.popmenu.toggle();
				fcObj.popusermenu.hide();
			});
			$("#user_icon, #user_name").bind("click", function(){
				fcObj.popusermenu.toggle();
				fcObj.popmenu.hide();
			});
			
		}else{
			$("#popMenuHandle").bind("mouseover", function(){
				if(fcObj.popmenuObs) clearTimeout(fcObj.popmenuObs);
				fcObj.popmenu.show();
				fcObj.popusermenu.hide();
			});
			$("#popMenuHandle").bind("mouseout", function(){
				if(fcObj.popmenuObs) clearTimeout(fcObj.popmenuObs);
				fcObj.popmenuObs = setTimeout(fcObj.popmenuClose, 1000);
			});
			$("#popmenu").bind("mouseover", function(){
				if(fcObj.popmenuObs) clearTimeout(fcObj.popmenuObs);
				fcObj.popmenu.show();
				fcObj.popusermenu.hide();
			});
			$("#popmenu").bind("mouseout", function(){
				if(fcObj.popmenuObs) clearTimeout(fcObj.popmenuObs);
				fcObj.popmenuObs = setTimeout(fcObj.popmenuClose, 1000);
			});
			
			//------------
			$("#user_icon, #user_name").bind("mouseover", function(){
				if(fcObj.popmenuObs) clearTimeout(fcObj.popmenuObs);
				fcObj.popusermenu.show();
				fcObj.popmenu.hide();
			});
			$("#user_icon, #user_name").bind("mouseout", function(){
				if(fcObj.popmenuObs) clearTimeout(fcObj.popmenuObs);
				fcObj.popmenuObs = setTimeout(fcObj.popmenuClose, 1000);
			});
			$("#popusermenu").bind("mouseover", function(){
				if(fcObj.popmenuObs) clearTimeout(fcObj.popmenuObs);
				fcObj.popusermenu.show();
				fcObj.popmenu.hide();
			});
			$("#popusermenu").bind("mouseout", function(){
				if(fcObj.popmenuObs) clearTimeout(fcObj.popmenuObs);
				fcObj.popmenuObs = setTimeout(fcObj.popmenuClose, 1000);
			});
		}
	},
	popmenuClose: function(){
		fcObj.popmenu.hide();
		fcObj.popusermenu.hide();
	}
};

$(document.body).ready(fcObj.popInit);