var ms = null;
var memberTeamObj = function(){
	return {id:0,level:0,awoken:0,plus:[0,0,0],latent:[]};
}
var memberAssistObj = function(){
	return {id:0,level:0,awoken:0,plus:[0,0,0]};
}
var teamObj = function(){
	return [
		[
			new memberTeamObj(),
			new memberTeamObj(),
			new memberTeamObj(),
			new memberTeamObj(),
			new memberTeamObj(),
			new memberTeamObj(),
		],
		[
			new memberAssistObj(),
			new memberAssistObj(),
			new memberAssistObj(),
			new memberAssistObj(),
			new memberAssistObj(),
			new memberAssistObj(),
		],
	];
}
var formation = {
	title:"",
	team:[
		new teamObj(),//队伍A
		new teamObj(),//队伍B
	]
};
window.onload = function()
{
	GM_xmlhttpRequest({
		method: "GET",
		url:"monsters-info/mon.json",
		onload: function(response) {
			ms = JSON.parse(response.response);
			initialize();//初始化
			test(); //测试代码
		},
		onerror: function(response) {
			console.error("怪物数据获取错误",response);
		}
	});
}
//初始化
function initialize()
{
	var monstersList = document.querySelector("#monsters-list");
	ms.forEach(function(m){
		var opt = monstersList.appendChild(document.createElement("option"));
		opt.value = m.id;
		opt.label = m.id + " | " +  m.name["ja"] + " | " + m.name["en"] + " | " + m.name["ko"];
	});

	//队伍框
	var formationBox = document.querySelector(".formation-box");
	formationBox.formationBox = formation;

	//编辑框
	var editBox = document.querySelector(".edit-box");
	editBox.latent = []; //储存潜在觉醒
	editBox.assist = false; //储存是否为辅助宠物
	editBox.monsterBox = null;
	editBox.latentBox = null;
	editBox.member = null;

	var settingBox = editBox.querySelector(".setting-box")
	//id搜索
	var monstersSearch = editBox.querySelector(".edit-box .m-id");
	monstersSearch.onchange = function(){
		if (/^\d+$/.test(this.value))
		{
			editBoxChangeMonId(parseInt(this.value));
		}
	}
	monstersSearch.oninput = monstersSearch.onchange;
	//觉醒
	var monEditAwokens = Array.prototype.slice.call(settingBox.querySelectorAll(".m-awoken-ul>.awoken-icon"));
	monEditAwokens.forEach(function(akDom,idx,domArr){
		akDom.onclick = function(){
			if (idx >= domArr.filter(function(d){return !d.classList.contains("display-none")}).length-1)
				domArr[0].innerHTML = "★";
			else
				domArr[0].innerHTML = idx;
			for(var ai=1;ai<domArr.length;ai++)
			{
				if(ai<=idx)
				{
					if(domArr[ai].classList.contains("unselected-awoken"))
						domArr[ai].classList.remove("unselected-awoken");
				}
				else
				{
					if(!domArr[ai].classList.contains("unselected-awoken"))
						domArr[ai].classList.add("unselected-awoken");
				}
			}
		}
	})
	//等级
	var monEditLv = settingBox.querySelector(".m-level");
	var monEditLvMax = settingBox.querySelector(".m-level-btn-max");
	monEditLvMax.onclick = function(){
		monEditLv.value = this.value;
	}
	//加蛋
	var monEditAddHp = settingBox.querySelector(".m-plus-hp");
	var monEditAddAtk = settingBox.querySelector(".m-plus-atk");
	var monEditAddRcv = settingBox.querySelector(".m-plus-rcv");
	var monEditAddHp99 = settingBox.querySelector(".m-plus-hp-btn-99");
	monEditAddHp99.onclick = function(){monEditAddHp.value = this.value}
	var monEditAddAtk99 = settingBox.querySelector(".m-plus-atk-btn-99");
	monEditAddAtk99.onclick = function(){monEditAddAtk.value = this.value}
	var monEditAddRcv99 = settingBox.querySelector(".m-plus-rcv-btn-99");
	monEditAddRcv99.onclick = function(){monEditAddRcv.value = this.value}
	var monEditAdd297 = settingBox.querySelector(".m-plus-btn-297");
	monEditAdd297.onclick = function(){monEditAddHp.value = monEditAddAtk.value = monEditAddRcv.value = 99}
	//潜觉
	var monEditLatentUl = settingBox.querySelector(".m-latent-ul");
	var monEditLatents = Array.prototype.slice.call(monEditLatentUl.querySelectorAll("li"));
	var monEditLatentAllowableUl = settingBox.querySelector(".m-latent-allowable-ul");
	var monEditLatentsAllowable = Array.prototype.slice.call(monEditLatentAllowableUl.querySelectorAll("li"));
	function refreshLatent(latent) //刷新潜觉
	{
		if (this.value<0) return;
		var usedHoleN = usedHole(latent);
		for (var ai=0;ai<6;ai++)
		{
			if (latent[ai])
			{
				monEditLatents[ai].className = "latent-icon latent-icon-" + latent[ai];
				monEditLatents[ai].value = ai;
			}
			else if(ai<(6-usedHoleN+latent.length))
			{
				monEditLatents[ai].className = "latent-icon";
				monEditLatents[ai].value = -1;
			}
			else
			{
				monEditLatents[ai].className = "display-none";
				monEditLatents[ai].value = -1;
			}
		}
	}
	editBox.refreshLatent = refreshLatent;
	//已有觉醒的去除
	monEditLatents.forEach(function(l){
		l.onclick = function(){
			var aIdx = parseInt(this.value);
			editBox.latent.splice(aIdx,1);
			refreshLatent(editBox.latent);
		}
	})
	//可选觉醒的添加
	monEditLatentsAllowable.forEach(function(la){
		la.onclick = function(){
			if (this.classList.contains("unselected-latent")) return;
			var lIdx = parseInt(this.value);
			var usedHoleN = usedHole(editBox.latent);
			if (lIdx >= 12 && usedHoleN<=4)
				editBox.latent.push(lIdx);
			else if (lIdx < 12 && usedHoleN<=5)
				editBox.latent.push(lIdx);
			refreshLatent(editBox.latent);
		}
	})
	
	var btnCancel = editBox.querySelector(".button-cancel");
	var btnDone = editBox.querySelector(".button-done");
	btnCancel.onclick = function(){
		btnDone.classList.remove("cant-assist");
		btnDone.disabled = false;
		editBox.member = null;
		editBox.classList.add("display-none");
	}
	btnDone.onclick = function(){
		var mD = editBox.member;
		mD.id = parseInt(monstersSearch.value);
		mD.level = parseInt(monEditLv.value);
		mD.awoken = monEditAwokens.filter(function(akDom){
			return !akDom.classList.contains("unselected-awoken") && !akDom.classList.contains("display-none") 
		}).length - 1;
		mD.plus[0] = parseInt(monEditAddHp.value);
		mD.plus[1] = parseInt(monEditAddAtk.value);
		mD.plus[2] = parseInt(monEditAddRcv.value);
		if (!editBox.assist)
		{
			mD.latent = editBox.latent.concat();
		}

		changeid(mD,editBox.monsterBox,editBox.latentBox);
		editBox.classList.add("display-none");
	}
}
function usedHole(latent) //计算用了多少潜觉格子
{
	return latent.reduce(function(previous,current){
		return previous + (current>= 12?2:1);
	},0);
}

function changeid(mon,monDom,latentDom)
{
	var md = ms[mon.id]; //怪物固定数据
	if (mon.id>-1) //如果提供了id
	{
		monDom.className = "monster";
		monDom.classList.add("pet-cards-" + Math.ceil(mon.id/100)); //添加图片编号
		var idxInPage = (mon.id-1) % 100; //获取当前页面的总序号
		monDom.classList.add("pet-cards-index-x-" + idxInPage % 10); //添加X方向序号
		monDom.classList.add("pet-cards-index-y-" + parseInt(idxInPage / 10)); //添加Y方向序号
		monDom.querySelector(".property").className = "property property-" + md.ppt[0]; //主属性
		monDom.querySelector(".subproperty").className = "subproperty subproperty-" + md.ppt[1]; //副属性
		monDom.title = "No." + mon.id + " " + md.name["ja"];
		monDom.href = "http://pad.skyozora.com/pets/" + mon.id;
	}
	if (mon.level>0) //如果提供了等级
	{
		var levelDom = monDom.querySelector(".level");
		levelDom.innerHTML = mon.level;
		if (mon.level == 99 || (mon.level >= md.maxLevel && md.maxLevel <=99))
		{
			levelDom.classList.add("max");
		}else
		{
			levelDom.classList.remove("max");
		}
		if (md.maxLevel>99 && mon.level>=99)
			levelDom.classList.add("_110");
		else
			levelDom.classList.remove("_110");
	}
	if (mon.awoken>-1) //如果提供了觉醒
	{
		var awokenIcon = monDom.querySelector(".awoken-count");
		if (mon.awoken == 0 || md.awoken.length < 1) //没觉醒
		{
			awokenIcon.classList.add("display-none");
			awokenIcon.innerHTML = "";
		}else
		{
			awokenIcon.classList.remove("display-none");
			if (mon.awoken < md.awoken.length) //觉醒没满直接写数字
			{
				awokenIcon.innerHTML = mon.awoken;
				awokenIcon.classList.remove("allowable-assist");
			}else //满觉醒打星星
			{
				awokenIcon.innerHTML = "★";
				if (md.assist)
					awokenIcon.classList.add("allowable-assist");
			}
		}
	}
	if (mon.plus) //如果提供了加值
	{
		monDom.querySelector(".plus .hp").innerHTML = mon.plus[0];
		monDom.querySelector(".plus .atk").innerHTML = mon.plus[1];
		monDom.querySelector(".plus .rcv").innerHTML = mon.plus[2];
		if (mon.plus[0]+mon.plus[1]+mon.plus[2] >= 297)
		{
			monDom.querySelector(".plus").classList.add("has297");
		}else
		{
			monDom.querySelector(".plus").classList.remove("has297");
		}
	}
	if (latentDom && mon.latent) //如果提供了潜觉
	{
		var latent = mon.latent.sort(function(a,b){return b-a;});
		var latentDoms = Array.prototype.slice.call(latentDom.querySelectorAll("li"));
		var usedHoleN = usedHole(latent);
		for (var ai=0;ai<6;ai++)
		{
			if (latent[ai])
			{
				latentDoms[ai].className = "latent-icon latent-icon-" + latent[ai];
			}
			else if(ai<(6-usedHoleN+latent.length))
			{
				latentDoms[ai].className = "latent-icon";
			}
			else
			{
				latentDoms[ai].className = "display-none";
			}
		}
	}
}
//点击怪物头像，出现编辑框
function editMon(AorB,isAssist,tempIdx)
{
	//数据
	var mD = formation.team[AorB][isAssist][tempIdx];
	//对应的Dom
	var formationBox = AorB?document.querySelector(".formation-box .formation-B-box"):document.querySelector(".formation-box .formation-A-box");
	var teamBox = isAssist?formationBox.querySelector(".formation-assist"):formationBox.querySelector(".formation-team");
	var memberBox = teamBox.querySelector(".member-" + (tempIdx+1));

	var editBox = document.querySelector(".edit-box");
	var monsterBox = memberBox.querySelector(".monster");

	editBox.classList.remove("display-none");
	editBox.assist = isAssist;
	editBox.monsterBox = monsterBox;
	editBox.member = mD;
	editBox.assist = isAssist;
	if (!isAssist)
	{
		var latentBox = formationBox.querySelector(".formation-latents .latents-"+(tempIdx+1)+" .latent-ul");
		editBox.latentBox = latentBox;
	}

	var monstersSearch = editBox.querySelector(".search-box .m-id");
	monstersSearch.value = mD.id;
	monstersSearch.onchange();
	var settingBox = editBox.querySelector(".setting-box");
	var monEditAwokens = settingBox.querySelectorAll(".m-awoken-ul .awoken-icon");
	monEditAwokens[mD.awoken].onclick();
	var monEditLv = settingBox.querySelector(".m-level");
	monEditLv.value = mD.level;
	var monEditAddHp = settingBox.querySelector(".m-plus-hp");
	var monEditAddAtk = settingBox.querySelector(".m-plus-atk");
	var monEditAddRcv = settingBox.querySelector(".m-plus-rcv");
	monEditAddHp.value = mD.plus[0];
	monEditAddAtk.value = mD.plus[1];
	monEditAddRcv.value = mD.plus[2];
	if (!isAssist)
	{
		editBox.latent = mD.latent.concat();
		editBox.refreshLatent(editBox.latent);
	}
}

function editBoxChangeMonId(id)
{
	var md = ms[id]; //怪物固定数据
	if (!md){
		id = 0;
		md = ms[0]
	}
	var editBox = document.querySelector(".edit-box");
	var monInfoBox = editBox.querySelector(".monsterinfo-box");
	var me = monInfoBox.querySelector(".monster");
	changeid({id:id,},me); //改变图像
	var mId = monInfoBox.querySelector(".monster-id");
	mId.innerHTML = id;
	var mRare = monInfoBox.querySelector(".monster-rare");
	mRare.className = "monster-rare rare-" + md.rare;
	var mName = monInfoBox.querySelector(".monster-name");
	mName.innerHTML = md.name["ja"];
	var mType = monInfoBox.querySelectorAll(".monster-type li");
	for (var ti=0;ti<mType.length;ti++)
	{
		if (md.type[ti])
		{
			mType[ti].className = "type-name type-name-" + md.type[ti];
			mType[ti].firstChild.className = "type-icon type-icon-" + md.type[ti];
		}else
		{
			mType[ti].className = "display-none";
		}
	}

	var settingBox = editBox.querySelector(".setting-box");
	var mAwoken = settingBox.querySelectorAll(".m-awoken-ul li");
	mAwoken[0].innerHTML = md.awoken.length?"★":"0";
	for (var ai=1;ai<mAwoken.length;ai++)
	{
		if (md.awoken[ai-1])
		{
			mAwoken[ai].className = "awoken-icon awoken-" + md.awoken[ai-1];
		}else
		{
			mAwoken[ai].className = "display-none";
		}
	}

	var monEditLvMax = settingBox.querySelector(".m-level-btn-max");
	monEditLvMax.innerHTML = monEditLvMax.value = md.maxLevel;
	var monEditLv = settingBox.querySelector(".m-level");
	monEditLv.value = md.maxLevel>99?99:md.maxLevel;

	var monLatentAllowUl = settingBox.querySelector(".m-latent-allowable-ul");
	//该宠Type允许的杀
	var allowLatent = uniq(md.type.reduce(function (previous, t, index, array) {
		return previous.concat(type_allowable_latent[t]);
	},[]));
	for(var li=17;li<=24;li++)
	{
		var latentDom = monLatentAllowUl.querySelector(".latent-icon-" + li);
		if (allowLatent.indexOf(li)>=0)
		{
			if(latentDom.classList.contains("unselected-latent"))
				latentDom.classList.remove("unselected-latent");
		}else
		{
			if(!latentDom.classList.contains("unselected-latent"))
				latentDom.classList.add("unselected-latent");
		}
	}

	if (editBox.assist)
	{
		var btnDone = editBox.querySelector(".button-done");
		if (!md.assist)
		{
			btnDone.classList.add("cant-assist");
			btnDone.disabled = true;
		}else
		{
			btnDone.classList.remove("cant-assist");
			btnDone.disabled = false;
		}
	}
	editBox.latent.length = 0;
	editBox.refreshLatent(editBox.latent);
}




function test()
{
var m1 = document.querySelector(".formation-A-box .formation-team .member-1 .monster");
var a1 = document.querySelector(".formation-A-box .formation-latents .latents-1 .latent-ul");

var m = formation.team[0][0][0];
m.id=5209;
m.level=36;
m.awoken=5;
m.plus[0]=98;
m.plus[1]=96;
m.plus[2]=95;
m.latent=[11,11,16,11,11];
changeid(m,m1,a1);
//editBoxChangeMonId(3264);
}