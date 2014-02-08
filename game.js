var user = {};
var teams = {};
var games = {};
var gameConfig = {};
var quicks = {};
var items = {};
var itemQScroll = {};
var stagePosition = [];
var myProgress = new AXProgress();
var myModal = new AXModal();

var fnObj = {
	pageStart: function(){
		
		if(user_id == ""){
			location.href = "index.html";
			return;	
		}
		
		fnObj.quick.resetSize();

				
		// 정보 구하기
		var fns = [
			fnObj.getUser,
			fnObj.getTeam,
			fnObj.getGame,
			fnObj.getGameConfig,
			fnObj.quick.get,
			fnObj.item.get
		];
		
		myProgress.setConfig({
			totalCount:fns.length, 
			width:300, 
			top:100, 
			title:"AXProgress BAR",
			duration:10 // 프로세스바의 애니메이션 속도 값 입니다. (필수 값 아님)
		});

		mask.open();
		myProgress.start();
		
		var fidx = 0;
		var nextFn = function(){
			fns[fidx](function(){
				fidx++;
				if(fidx >= fns.length){
					myProgress.close();
					mask.close();
					return;
				}else{
					myProgress.update();
				}
				nextFn();
			});
		};
		myProgress.update();
		nextFn();
	},
	getUser: function(onLoad){
		apiCall("users/"+user_id, {param:"{}", method:"GET"}, function(result, Obj){
			if(result == "success"){
				user = AXUtil.copyObject(Obj);
				
				$("#user_icon").css({
					"background":"url(http://graph.facebook.com/"+Obj.sns_id+"/picture) no-repeat",
					"background-size":"contain"
				});
				$("#user_name").html(user.user_name);
				$("#userEmail").html(user.email);

				if(onLoad) onLoad();
			}else{
				location.href = "index.html";
				return;
			}
		});
	},
	getTeam: function(onLoad, team_id){
		
		$("#mygames").empty();
		
		if( team_id === undefined ){
			team_id = selectedTeamId;
		}
		
		apiCall("teams", {param:"user_id="+user_id, method:"GET"}, function(result, Obj){
			if(result == "success"){
				//trace(Obj);
				if(Obj.teams.length == 0){
					teams.list = [];
					teams.selectedIndex = null;
					teams.team_id = null;
					fnObj.frmOpenTeam();
					myProgress.close();
				}else{
					teams.list = Obj.teams;
					if( AXUtil.isEmpty(team_id) ){
						teams.selectedIndex = 0;
					}else{
						$.each(teams.list, function(idx, T){
							if(T.team_id == team_id){
								teams.selectedIndex = idx;
								return false;
							}
						});
					}
					/* trace("11"); */
					teams.team_id = teams.list[teams.selectedIndex].team_id;
					AXUtil.setCookie("selectedTeamId", teams.team_id);
					/* trace(teams.team_id); */
					
					if(onLoad) onLoad();
					else fnObj.getGame();
					fnObj.setTeamList();
				}
			}else{
				
			}
		});
	},
	frmOpenTeam: function(team_id, tidx){
		if(teams.team_id == null){
			$("#teamFrm").find(".isFirstFrm").show();
			$("#teamFrm").find(".isSecondFrm").hide();
		}else{
			$("#teamFrm").find(".isFirstFrm").hide();
			$("#teamFrm").find(".isSecondFrm").show();
		}
		
		var frm = document.teamform;
		if(team_id != undefined){
			frm.team_id.value = team_id;
			frm.team_name.value = teams.list[tidx].team_name;
			$("#teamFrm").find(".signInTitle").html("수정할 팀 이름을 입력해주세요.");
		}else{
			frm.team_id.value = "";
			frm.team_name.value = "";
			$("#teamFrm").find(".signInTitle").html("팀이름을 입력해주세요");
		}
		
		myModal.openDiv({
			modalID:"modal_t0",
			targetID:"teamFrm",
			width:300,
			top:100
		});
	},
	makeTeam: function(){
		var frm, modalID;
		frm = document.teamform;
		modalID = "modal_t0";

		if(frm.team_name.value == ""){
			alert("팀 이름을 입력하세요");
			frm.team_name.focus();
			return;	
		}
		
		if(frm.team_id.value == ""){ // 등록
			var pars = {
				team_name:frm.team_name.value,
				user_id:user_id
			};
			apiCall("teams", {param:Object.toJSON(pars), method:"POST"}, function(result, Obj){
				if(Obj.error){
					toast.push({type:"Caution", body:Obj.error.error_name});
					return;
				}
				if(result == "success"){
					myModal.close(modalID);
					fnObj.getTeam(null, Obj.team_id);
				}else{
					
				}
			});
		}else{ // 수정
			var pars = {
				team_name: frm.team_name.value,
				team_id: frm.team_id.value
			};
			apiCall("teams", {param:Object.toJSON(pars), method:"PUT"}, function(result, Obj){
				if(Obj.error){
					toast.push({type:"Caution", body:Obj.error.error_name});
					return;
				}
				if(result == "success"){
					myModal.close(modalID);
					fnObj.getTeam(null, Obj.team_id);
				}else{
					
				}
			});
		}
		return false;
	},
	cancelTeam: function(){
		myModal.close("modal_t0");
	},
	setTeamList: function(){
		var po = [];
		$.each(teams.list, function(tidx, T){
			po.push('<div class="popmenuItemBlock">');
				if(teams.selectedIndex == tidx) po.push('<a href="#axexec" class="popmenuItem selected"');
				else po.push('<a href="#axexec" class="popmenuItem"');
				po.push(' onclick="fnObj.changeTeam(\''+ T.team_id +'\')">');
				po.push(this.team_name + '</a>');
				po.push('<div class="buttons">');
					po.push('<button class="AXButtonSmall Classic" onclick="fnObj.frmOpenTeam(\''+ T.team_id +'\', \'' + tidx + '\');">Edit</button>');
					po.push('&nbsp;');
					po.push('<button class="AXButtonSmall Classic" onclick="fnObj.removeTeam(\''+ T.team_id +'\');">Del</button>');
				po.push('</div>');
			po.push('</div>');
		});
		$("#myteams").html(po.join(''));
	},
	changeTeam: function(team_id){
		if( team_id === undefined ){
			teams.selectedIndex = 0;
		}else{
			$.each(teams.list, function(idx, T){
				if(T.team_id == team_id){
					teams.selectedIndex = idx;
					return false;
				}
			});
		}
		teams.team_id = teams.list[teams.selectedIndex].team_id;
		AXUtil.setCookie("selectedTeamId", teams.team_id);
		fnObj.getGame();
		fnObj.setTeamList();
	},
	removeTeam: function(team_id){
		if(!confirm("정말 삭제 하시겠습니까?")) return;
		apiCall("teams/" + team_id, {param:"{}", method:"DELETE"}, function(result, Obj){
			if(Obj.error){
				//trace(Obj);
				toast.push({type:"Caution", body:Obj.error.error_name});
				return;
			}
			if(result == "success"){
				fnObj.getTeam();
			}else{
				
			}
		});
	},
	getGame: function(onLoad, game_id){
		apiCall("games", {param:"team_id="+teams.team_id, method:"GET"}, function(result, Obj){
			if(result == "success"){
			
				//trace(Obj);
				if(Obj.games.length == 0){
					games.list = [];
					games.selectedIndex = null;
					games.game_id = null;
					fnObj.frmOpenGame();
					myProgress.close();
				}else{
					
					if( game_id === undefined ){
						game_id = selectedGameId;
					}
					
					games.list = Obj.games;
					games.selectedIndex = 0;
					if( AXUtil.isEmpty(game_id) ){
						games.selectedIndex = 0;
					}else{
						$.each(games.list, function(idx, T){
							if(T.game_id == game_id){
								games.selectedIndex = idx;
								return false;
							}
						});
					}
					games.game_id = games.list[games.selectedIndex].game_id;
					AXUtil.setCookie("selectedGameId", games.game_id);
					/*trace(games.game_id);*/
					
					fnObj.setGameList();
									
					if(onLoad) onLoad();
					else{
						fnObj.getGameConfig();
					}
				}
			}else{
				
			}
		});
	},
	frmOpenGame: function(game_id, gidx){
		if(games.game_id == null){
			$("#gameFrm").find(".isFirstFrm").show();
			$("#gameFrm").find(".isSecondFrm").hide();
		}else{
			$("#gameFrm").find(".isFirstFrm").hide();
			$("#gameFrm").find(".isSecondFrm").show();
		}
		
		var frm = document.gameform;
		if(game_id != undefined){
			frm.game_id.value = game_id;
			frm.game_name.value = games.list[gidx].game_name;
			frm.game_type.value = games.list[gidx].game_type;
			$("#gameFrm").find(".signInTitle").html("게임정보수정");
		}else{
			frm.game_id.value = "";
			frm.game_name.value = "";
			$("#gameFrm").find(".signInTitle").html("게임만들기");
		}
		
		myModal.openDiv({
			modalID:"modal_g0",
			targetID:"gameFrm",
			width:310,
			top:100
		});
	},
	cancelGame: function(){
		myModal.close("modal_g0");
	},
	makeGame: function(){
		var frm, modalID;
		frm = document.gameform;
		modalID = "modal_g0";

		if(frm.game_name.value == ""){
			alert("게임이름을 입력하세요");
			frm.game_name.focus();
			return;
		}
		
		if(frm.game_id.value == ""){ // 등록
			var pars = {
				game_name:frm.game_name.value,
				team_id:teams.team_id,
				game_type:frm.game_type.value
			}
	
			apiCall("games", {param:Object.toJSON(pars), method:"POST"}, function(result, Obj){
				if(result == "success"){
					myModal.close(modalID);
					fnObj.getGame(null, Obj.game_id);
				}else{
					
				}
			});	
		}else{
			var pars = {
				game_name:frm.game_name.value,
				game_id:frm.game_id.value,
				team_id:teams.team_id,
				game_type:frm.game_type.value
			};
	
			apiCall("games", {param:Object.toJSON(pars), method:"PUT"}, function(result, Obj){
				if(result == "success"){
					myModal.close(modalID);
					fnObj.getGame();
				}else{
					
				}
			});
		}		
		return false;
	},
	setGameList: function(){
		var game_types = {
			PLATFORM:"플랫폼(양면시장) 유형",
			PRODUCT:"일반 제품-서비스 유형"
		};
		var po = [];
		$.each(games.list, function(gidx, G){
			po.push('<div class="popmenuItemBlock">');
				if(games.selectedIndex == gidx) po.push('<a href="#axexec" class="popmenuItem selected"');
				else po.push('<a href="#axexec" class="popmenuItem"');
				po.push(' onclick="fnObj.changeGame(\'' + G.game_id + '\');">');
				po.push( '<div>[' + game_types[G.game_type] +']</div>');
				po.push( G.game_name + '</a>');
				po.push('<div class="buttons">');
					po.push('<button class="AXButtonSmall Classic" onclick="fnObj.frmOpenGame(\''+ G.game_id +'\', \'' + gidx + '\');">Edit</button>');
					po.push('&nbsp;');
					po.push('<button class="AXButtonSmall Classic" onclick="fnObj.removeGame(\''+ G.game_id +'\');">Del</button>');
				po.push('</div>');
			po.push('</div>');
		});
		$("#mygames").html(po.join(''));
	},
	changeGame: function(game_id){
		if( game_id === undefined ){
			games.selectedIndex = 0;
		}else{
			$.each(games.list, function(idx, T){
				if(T.game_id == game_id){
					games.selectedIndex = idx;
					return false;
				}
			});
		}
		items = {};
		games.game_id = games.list[games.selectedIndex].game_id;
		AXUtil.setCookie("selectedGameId", games.game_id);
		fnObj.setGameList();
		fnObj.getGameConfig();
	},
	removeGame: function(game_id){
		if(!confirm("정말 삭제 하시겠습니까?")) return;
		apiCall("games/" + game_id, {param:"{}", method:"DELETE"}, function(result, Obj){
			if(Obj.error){
				toast.push({type:"Caution", body:Obj.error.error_name});
				return;
			}
			if(result == "success"){
				fnObj.getGame();
			}else{
				
			}
		});
	},
	getGameConfig: function(onLoad){
		var game_type = games.list[games.selectedIndex].game_type;
		apiCall("configs/stages", {param:"game_type="+game_type, method:"GET"}, function(result, Obj){
			if(result == "success"){
				gameConfig = Obj;
				fnObj.setConfigGame();
				
				if(onLoad) onLoad();
				else{
					fnObj.quick.get();	
					fnObj.item.get();	
				}
			}else{
				
			}
		});
	},
	setConfigGame: function(){
		$("#stageNavigation").empty();
		
		items = {};
		
		var game_type = games.list[games.selectedIndex].game_type;
		var game_name = games.list[games.selectedIndex].game_name;
		$("#game_title").html(game_name);

		//trace(gameConfig.stages);
		
		fnObj.game_stages = $("#game_stages");
		fnObj.game_stages.empty();
		
		$.each(gameConfig.stages, function(sidx, STG){
			var spo = [];			
			spo.push('<div id="stage'+(sidx+1)+'" class="stages">');
			spo.push('	<div class="stageTitle">' + STG.stage_name.lcase() + '</div>');
			spo.push('	<div class="stageBody">');
			spo.push('	');
			spo.push('	</div>');
			spo.push('	<div class="stageEndLine"><div class="stageEnd"></div></div>');
			spo.push('</div>');
			fnObj.game_stages.append(spo.join(''));
			
			$("#stageNavigation").append('<a href="#axexec" onclick="fnObj.focusStage(' + sidx + ')" class="stageMenu stage' + (sidx+1) + '">' + (sidx+1) + '</a>');
			
			var po = [];
			var dispSeq = 0;
			$.each(STG.items, function(itemIndex, item){
				if(this.is_display){
					
					items[item.item_code] = {};
					
					if((sidx == 0 || sidx == 3 || sidx == 4) && game_type == "PLATFORM"){
						if(dispSeq % 2 == 0 && dispSeq > 0){
							po.push('<div style="clear:both;"></div>');
						}
					}
					dispSeq++;

					po.push('<div class="item seq' + this.icon_name + '" id="item_'+ this.item_code +'">');
					
					po.push('	<a href="#axexec" class="item_help" onclick="fnObj.openHelp();">help</a>');
					po.push('	<a href="#axexec" class="item_quick" onclick="fnObj.quick.add(\''+ this.item_code +'\');">quick</a>');
					
					po.push('	<div class="item_code seq' + this.icon_name + '">' + this.item_code + '</div>');
					po.push('	<div class="item_name seq' + this.icon_name + '">' + this.item_name + '</div>');
					if(this.item_type != "LINK"){
						po.push('	<div class="item_questions" id="UIScrollCT_' + this.item_code + '">');
						po.push('		<div class="inBox" id="UIScroll_' + this.item_code + '">');
						po.push('			<ul>');
						$.each(this.questions, function(){
						po.push('				<li>' + this.question + '</li>');	
						});
						po.push('			</ul>');
						po.push('		</div>');
						po.push('	</div>');
					}
					if(this.item_type == "TEXT"){
						po.push('	<div class="item_value">');
						po.push('		<textarea placeholder="" id="item_value_AX_' + this.item_code + '"></textarea>	');
						po.push('	</div>');
					}else if(this.item_type == "LINK"){
						po.push('	<div class="item_questions link">');
						po.push('		' + this.item_desc + '	');
						po.push('	</div>');	
					}else if(this.item_type == "IMAGE"){
						po.push('	<div class="item_value">');
						po.push('		<textarea placeholder="" id="item_value_AX_' + this.item_code + '"></textarea>	');
						po.push('	</div>');
					}else{
						po.push('	<div class="item_value">');
						po.push('		<textarea placeholder="" id="item_value_AX_' + this.item_code + '"></textarea>	');
						po.push('	</div>');
					}
					po.push('</div>');
				}
			});
			fnObj.game_stages.find("#stage"+(sidx+1)+" .stageBody").append(po.join(''));
			
			$.each(STG.items, function(){
				if(this.item_type != "LINK"){
					if(!itemQScroll[this.item_code]) itemQScroll[this.item_code] = {};
					itemQScroll[this.item_code].UIScroll = new AXScroll(); // 스크롤 인스턴스 선언
					itemQScroll[this.item_code].UIScroll.setConfig({
						targetID:"UIScrollCT_" + this.item_code,
						scrollID:"UIScroll_" + this.item_code
					});
				}
			});
		});
		fnObj.game_stages.append('<div class="resultTitle">Go Result Page...</div>');
		fnObj.game_stages.append('<div class="AXHspace20"></div>');
		fnObj.game_stages.append('<div style="text-align:center"><button class="AXButtonLarge Classic" onclick="fnObj.goResult();">View Result</button></div>');

		fnObj.game_stages.find(".stages").each(function(){
			stagePosition.push($(this).position().top);
		});
		fnObj.game_stages.find(".item_value TEXTAREA").bind("keyup", function(){
			if(fnObj.itemValueKeyUp) clearTimeout(fnObj.itemValueKeyUp);
			var itemId = this.id;
			fnObj.itemValueKeyUp = setTimeout(function(){
				fnObj.item.update(itemId);
			}, 3000);			
		});
		fnObj.game_stages.find(".item_value TEXTAREA").bind("blur", function(){
			if(fnObj.itemValueKeyUp) clearTimeout(fnObj.itemValueKeyUp);
			fnObj.item.update(this.id);
		});
	},
	onScroll: function(){
		var scrollTop = $(window).scrollTop() + 48;
		var positionStage = null;
		$.each(stagePosition, function(idx, P){
			if(P.number() >= (scrollTop-1).number()) {
				positionStage = idx;
				return false;
			}
		});
		if(positionStage == null) positionStage = 8;
		$("#stageNavigation").attr("class", "navigation stage"+(positionStage+1));
	},
	focusStage: function(index){
		$(window).scrollTop(stagePosition[index] - 48 - 30);
	},
	onResize: function(){
		stagePosition.clear();
		fnObj.game_stages.find(".stages").each(function(){
			stagePosition.push($(this).position().top);
		});
		fnObj.onScroll();
		fnObj.quick.resetSize();
	},
	logout: function(){
		if(!confirm("정말 로그아웃 하시겠습니까?")) return;
		AXUtil.setCookie("user_id", "");
		AXUtil.setCookie("user_name", "");
		AXUtil.setCookie("user_token", "");
		location.href = "/";
	},
	openHelp: function(){
		dialog.push("도움말 컨텐츠가 준비되지 않았습니다.");
	},
	quick: {
		resetSize: function(){
			$("#quickBody").css({height:AXUtil.clientHeight() - 200});
			if(quicks.UIScroll) quicks.UIScroll.resizeScroll();
		},
		add: function(item_code){
			var pars = {
				game_id: games.game_id,
				user_id: user_id,
				item_code: item_code
			};
			apiCall("users/quicks", {param:Object.toJSON(pars), method:"POST"}, function(result, Obj){
				if(Obj.error){
					toast.push({type:"Caution", body:Obj.error.error_name});
					return;
				}
				if(result == "success"){
					toast.push(item_code + "을(를) 퀵메뉴에 추가 하였습니다.");
					fnObj.quick.get();
					//trace(Obj);
				}else{
					
				}
			});
		},
		remove: function(item_code, quick_id){
			if(!confirm("정말 삭제 하시겠습니까?")) return;
			
			var pars = {};
			apiCall("users/"+user_id+"/quicks/"+quick_id, {param:Object.toJSON(pars), method:"DELETE"}, function(result, Obj){
				if(Obj.error){
					toast.push({type:"Caution", body:Obj.error.error_name});
					return;
				}
				if(result == "success"){
					toast.push(item_code + "을(를) 퀵메뉴에서 삭제 하였습니다.");
					fnObj.quick.get();
					//trace(Obj);
				}else{
					
				}
			});
		},
		get: function(onLoad){
			
			$("#quickBody").empty();
			apiCall("users/" + user_id + "/quicks", {param:"game_id="+games.game_id, method:"GET"}, function(result, Obj){
				if(result == "success"){
					//trace(Obj);
					
					quicks.list = Obj.quicks;
					/* 퀵 개체 등록 */
					
					var po = [];
					po.push('<div class="inBox" id="UIScroll_quickBody"><div style="padding-right:3px;">');
						$.each(quicks.list, function(){
							//this.icon_name = "01";
							//this.item_name = this.item_code;
							po.push('<div class="item seq' + this.icon_name + '" id="qitem_'+ this.item_code +'">');
							po.push('	<a href="#axexec" class="item_quick" onclick="fnObj.quick.remove(\''+ this.item_code +'\',\''+ this.quick_id +'\');">quick</a>');
							
							//po.push('	<div class="item_code seq' + this.icon_name + '">' + this.item_code + '</div>');
							po.push('	<div class="item_name seq' + this.icon_name + '">' + this.item_name + '</div>');
							
							var quick_value = "";
							if(items[this.item_code] && items[this.item_code].item_value != undefined){
								quick_value = items[this.item_code].item_value.dec();
							}
							
							if(this.item_type == "TEXT"){
								po.push('	<div class="item_value">');
								po.push('		<textarea placeholder="" id="qitem_value_AX_' + this.item_code + '">'+ quick_value + '</textarea>	');
								po.push('	</div>');
							}else if(this.item_type == "LINK"){
								po.push('	<div class="item_questions link">');
								po.push('		' + this.item_desc + '	');
								po.push('	</div>');	
							}else if(this.item_type == "IMAGE"){
								po.push('	<div class="item_value">');
								po.push('		<textarea placeholder="" id="qitem_value_AX_' + this.item_code + '">'+ quick_value + '</textarea>	');
								po.push('	</div>');
							}else{
								po.push('	<div class="item_value">');
								po.push('		<textarea placeholder="" id="qitem_value_AX_' + this.item_code + '">'+ quick_value + '</textarea>	');
								po.push('	</div>');
							}
							po.push('</div>');
						});
					po.push('</div></div>');
					$("#quickBody").append(po.join(''));
					$("#quickBody").find(".item_value TEXTAREA").bind("keyup", function(){
						if(fnObj.qitemValueKeyUp) clearTimeout(fnObj.qitemValueKeyUp);
						var itemId = this.id;
						fnObj.qitemValueKeyUp = setTimeout(function(){
							fnObj.item.update(itemId);
						}, 3000);
					});
					$("#quickBody").find(".item_value TEXTAREA").bind("blur", function(){
						if(fnObj.qitemValueKeyUp) clearTimeout(fnObj.qitemValueKeyUp);
						fnObj.item.update(this.id);
					});
					quicks.UIScroll = new AXScroll(); // 스크롤 인스턴스 선언
					quicks.UIScroll.setConfig({
						targetID:"quickBody",
						scrollID:"UIScroll_quickBody"
					});					
				}else{
					
				}
				if(onLoad) onLoad();
			});
		}
	},
	item: {
		get: function(onLoad){
			apiCall("games/"+ games.game_id +"/items", {param:"", method:"GET"}, function(result, Obj){
				if(result == "success"){
					//trace(Obj);
					//items.list = Obj.items;
					$.each(Obj.items, function(){
						items[this.item_code] = AXUtil.overwriteObject(items[this.item_code], this, true);
						fnObj.item.setValue(this.item_code, this.item_value);
					});
				}
				if(onLoad) onLoad();
			});
		},
		setValue: function(item_code, value){
			//alert(value.search("0016"));
			if(AXgetId("item_value_AX_"+item_code)) $("#item_value_AX_"+item_code).val(value.dec());
			if(AXgetId("qitem_value_AX_"+item_code)) $("#qitem_value_AX_"+item_code).val(value.dec());
		},
		update: function(updateID){
			var ids = updateID.split(/_AX_/g);
			var item_code = ids.last();
			//trace(items[item_code]);
			
			var jQuery_updateID = $("#"+updateID);
			fnObj.item.setValue(item_code, jQuery_updateID.val());
			
			if(items[item_code].item_id === undefined){
				
				var pars = {
					item_value: jQuery_updateID.val().enc(),
					item_code: item_code,
					item_type: "T",
					game_id: games.game_id
				};
				apiCall("games/items", {param:Object.toJSON(pars), method:"POST"}, function(result, Obj){
					if(result == "success"){
						toast.push("update : " + item_code);
						items[item_code] = AXUtil.overwriteObject(items[item_code], Obj, true);
					}else{
						
					}
				});

			}else{
				if($("#"+updateID).val() != items[item_code].item_value.dec()){
						
					var pars = {
						item_id: items[item_code].item_id,
						item_value: jQuery_updateID.val().enc(),
						item_code: item_code,
						item_type: "T",
						game_id: games.game_id
					};
					apiCall("games/items", {param:Object.toJSON(pars), method:"PUT"}, function(result, Obj){
						if(result == "success"){
							toast.push("update : " + item_code);
							items[item_code] = AXUtil.overwriteObject(items[item_code], Obj, true);
						}else{
							
						}
					});
					
				}
			}
		}
	},
	goResult: function(){
		location.href = "gameResult.html";
	}
};

$(document.body).ready(fnObj.pageStart);
$(window).bind("scroll", fnObj.onScroll);
$(window).bind("resize", fnObj.onResize);