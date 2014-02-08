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
		

		// 정보 구하기
		var fns = [
			fnObj.getUser,
			fnObj.getTeam,
			fnObj.getGame,
			fnObj.getGameConfig,
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
					fnObj.getGame();
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
		$("#game_AX_SVG_AX_editSpace").empty();
		$("#game_result_PRODUCT, #game_result_PLATFORM").fadeOut();
		
		var game_type = games.list[games.selectedIndex].game_type;
		apiCall("configs/stages", {param:"game_type="+game_type, method:"GET"}, function(result, Obj){
			if(result == "success"){
				gameConfig = Obj;
				$.each(gameConfig.stages, function(){
					$.each(this.items, function(){
						items[this.item_code] = AXUtil.copyObject(this);
					});
				});
				//trace(items);
				fnObj.setConfigGame();
				if(onLoad) onLoad();
				else{
					trace("item.get()");
					fnObj.item.get();
				}
			}else{
				
			}
		});
	},
	setConfigGame: function(){
		$("#stageNavigation").empty();
		
		var game_type = games.list[games.selectedIndex].game_type;
		var game_name = games.list[games.selectedIndex].game_name;
		$("#game_title").html(game_name);
		$("#game_result_"+game_type).fadeIn(
			function(){
				
				$("#game_result_stage").css({width:AXUtil.clientWidth(), height:AXUtil.clientHeight()-38});
				
				if(!fnObj.UIScroll){
					fnObj.UIScroll = new AXScroll(); // 스크롤 인스턴스 선언
					fnObj.UIScroll.setConfig({
						targetID:"game_result_stage",
						scrollID:"UIScroll_game_result_stage",
						xscroll:true
					});
				}
			}
		);
	},
	onScroll: function(){

	},
	onResize: function(){
		$("#game_result_stage").css({width:AXUtil.clientWidth(), height:AXUtil.clientHeight()-38});
		fnObj.drawLine();
		fnObj.onScroll();
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
	item: {
		get: function(onLoad){
			setTimeout(function(){
				fnObj.drawLine();
			}, 500);
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
			//if(AXgetId("item_value_AX_"+item_code)) $("#item_value_AX_"+item_code).val(value.dec());
			//if(AXgetId("qitem_value_AX_"+item_code)) $("#qitem_value_AX_"+item_code).val(value.dec());
			
			var game_type = games.list[games.selectedIndex].game_type.lcase();
			var itemID = game_type+"_item_"+item_code;
			if(AXgetId(itemID)){
				$("#"+itemID).find(".item_value").html(value.dec().crlf());
			}
			
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
	goGame: function(){
		location.href = "game.html";
	},
	drawLine: function(){
		//trace("drawLine");
		$("#game_AX_SVG").attr("height", $("#UIScroll_game_result_stage").outerHeight() - 100);
		
		var game_type = games.list[games.selectedIndex].game_type.lcase();
		
		var pathSpace = $("#game_AX_SVG_AX_editSpace");
		pathSpace.empty();
		
		//trace(gameConfig.relations);
		$.each(gameConfig.relations, function(ridx, R){
			//trace(this.parent_item_code, this.item_code);
			var newSVG;
			var drawingTargetID = "SVGREL_AX_" + this.parent_item_code + "_AX_" + this.item_code;
			var myCss = {
				strokeColor : "#000",
				strokeWidth: 3,
				strokeLinecap: "",
				strokeDashArray : "4,3",
				fillColor : "none"
			};
// && ridx == 11
			if(AXgetId(game_type+"_item_"+this.parent_item_code) && AXgetId(game_type+"_item_"+this.item_code)){
				
				var p_BBox = $("#"+game_type+"_item_"+this.parent_item_code);
				var c_BBox = $("#"+game_type+"_item_"+this.item_code);
				
				//trace(this);
				
				var p_BBoxPos =  { 
					x: p_BBox.position().left, 
					y: p_BBox.position().top,
					w: p_BBox.outerWidth(),
					h: p_BBox.outerHeight()
				};
				var c_BBoxPos = { 
					x: c_BBox.position().left, 
					y: c_BBox.position().top,
					w: c_BBox.outerWidth(),
					h: c_BBox.outerHeight()
				};
				
				//trace(p_BBoxPos);
				//trace(c_BBoxPos);
				
				/**************  points **/
				var ax, ay, bx, by;
				
				if(this.parent_line_position == "L"){
					ax = p_BBoxPos.x;
					ay = p_BBoxPos.y + p_BBoxPos.h / 2;
				}else if(this.parent_line_position == "R"){
					ax = p_BBoxPos.x + p_BBoxPos.w;
					ay = p_BBoxPos.y + p_BBoxPos.h / 2;
				}else if(this.parent_line_position == "T"){
					ax = p_BBoxPos.x + p_BBoxPos.w / 2;
					ay = p_BBoxPos.y;
				}else if(this.parent_line_position == "B"){
					ax = p_BBoxPos.x + p_BBoxPos.w / 2;
					ay = p_BBoxPos.y + p_BBoxPos.h;
				}
				
				if(this.line_position == "L"){
					bx = c_BBoxPos.x;
					by = c_BBoxPos.y + c_BBoxPos.h / 2;	
				}else if(this.line_position == "R"){
					bx = c_BBoxPos.x + c_BBoxPos.w;
					by = c_BBoxPos.y + c_BBoxPos.h / 2;
				}else if(this.line_position == "T"){
					bx = c_BBoxPos.x + c_BBoxPos.w / 2;
					by = c_BBoxPos.y;
				}else if(this.line_position == "B"){
					bx = c_BBoxPos.x + c_BBoxPos.w / 2;
					by = c_BBoxPos.y + c_BBoxPos.h;
				}
								
				var pointsObject = fnObj.getRelationPath(ax, ay, bx, by, this.parent_line_position, this.line_position);
				var s_arrowObject = fnObj.getArrow(this.start_point_type, ax, ay, this.parent_line_position, "S");
				var e_arrowObject = fnObj.getArrow(this.end_point_type, bx, by, this.line_position, "E");
		
				newSVG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
				newSVG.setAttributeNS(null, "id", drawingTargetID);
		
				var path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
				path.setAttributeNS(null, "id", drawingTargetID + "_AX_polyline");
		
				//path.setAttributeNS(null, "stroke", myCss.strokeColor);
				path.setAttributeNS(null, "stroke", this.line_color); /* line_color 적용 */
				
				path.setAttributeNS(null, "stroke-width", myCss.strokeWidth);
				path.setAttributeNS(null, "stroke-linecap", myCss.strokeLinecap);
				path.setAttributeNS(null, "stroke-dasharray", myCss.strokeDashArray);
				path.setAttributeNS(null, "fill", myCss.fillColor);
				path.setAttributeNS(null, "points", pointsObject.points.join(','));
				path.setAttributeNS(null, "class", "svgRel");
				newSVG.appendChild(path);
				
				var arrow;
				if(s_arrowObject){
					arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
					arrow.setAttributeNS(null, "id", drawingTargetID + "_AX_path");
					arrow.setAttributeNS(null, "stroke", this.line_color);
					arrow.setAttributeNS(null, "fill", this.line_color);
					arrow.setAttributeNS(null, "d", s_arrowObject.join(' '));
					arrow.setAttributeNS(null, "class", "svgRel");
					newSVG.appendChild(arrow);
				}
				
				if(e_arrowObject){
					arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
					arrow.setAttributeNS(null, "id", drawingTargetID + "_AX_path");
					arrow.setAttributeNS(null, "stroke", this.line_color);
					arrow.setAttributeNS(null, "fill", this.line_color);
					arrow.setAttributeNS(null, "d", e_arrowObject.join(' '));
					arrow.setAttributeNS(null, "class", "svgRel");
					newSVG.appendChild(arrow);	
				}
				
				pathSpace.append(newSVG);
			}else{
				//trace(this);
			}
			//return false;
		});
		
	},
	getRelationPath: function(ax, ay, bx, by, pl, ll){
		//trace(ax + ", " + ay + ", " + bx + ", " + by);

		var points = [];
		var d = 30;
		if ((ax - bx).abs() < 10) { // 위아래 같은 위치로 이동할 때
			// 1
			points.push(ax); //x
			points.push(ay); //y
			
			if(pl == "L" || pl == "R"){
				points.push(ax + d); //x
				points.push(ay); //y
	
				points.push(ax + d); //x
				points.push(by); //y
			}

			// E
			points.push(bx); //x
			points.push(by); //y
		}else if(ax > bx && (pl != "L")){
			//trace(111);
			// 1
			points.push(ax); //x
			points.push(ay); //y

			points.push(ax + d); //x
			points.push(ay); //y

			points.push(ax + d); //x
			points.push((ay + by) / 2); //y

			points.push(bx + d); //x
			points.push((ay + by) / 2); //y

			points.push(bx + d); //x
			points.push(by); //y

			// E
			points.push(bx); //x
			points.push(by); //y

		} else {
			//trace(222);
			// 1
			points.push(ax); //x
			points.push(ay); //y

			points.push((ax+bx)/2); //x
			points.push(ay); //y

			points.push((ax + bx) / 2); //x
			points.push(by); //y

			// E
			points.push(bx); //x
			points.push(by); //y

		}

		return {
			points: points
		}
	},
	getArrow: function(point_type, x, y, line_position, SE){
		if(point_type == "N") return false;
		
		var ad = 7;
		var arrow = [];
		arrow.push("M");
		
		if(line_position == "L"){
			arrow.push(x - ad); arrow.push(y - ad);
			arrow.push(x); arrow.push(y);
			arrow.push(x - ad); arrow.push(y + ad);
			arrow.push(x - ad); arrow.push(y - ad);
		}else if(line_position == "R"){
			arrow.push(x + ad); arrow.push(y - ad);
			arrow.push(x); arrow.push(y);
			arrow.push(x + ad); arrow.push(y + ad);
			arrow.push(x + ad); arrow.push(y - ad);
		}else if(line_position == "T"){
			arrow.push(x - ad); arrow.push(y - ad);
			arrow.push(x); arrow.push(y);
			arrow.push(x + ad); arrow.push(y - ad);
			arrow.push(x - ad); arrow.push(y - ad);			
		}else if(line_position == "B"){
			arrow.push(x - ad); arrow.push(y + ad);
			arrow.push(x); arrow.push(y);
			arrow.push(x + ad); arrow.push(y + ad);
			arrow.push(x - ad); arrow.push(y + ad);			
		}

		arrow.push("Z");
		
		return arrow;
		
	}
};

$(document.body).ready(fnObj.pageStart);
$(window).bind("scroll", fnObj.onScroll);
$(window).bind("resize", fnObj.onResize);