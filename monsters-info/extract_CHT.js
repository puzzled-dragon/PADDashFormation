﻿var fs = require('fs');
var sourceFolder = "Download-pad.skyozora.com/pad.skyozora.com";
var outJSON = "custom/CHT.json";
var path = require('path');//解析需要遍历的文件夹

fs.access(outJSON,function(err){
	var monArr;
	if (err)
	{
		monArr = [];
	}else
	{
		var monArr = JSON.parse(fs.readFileSync(outJSON, 'utf-8'));//读取繁体中文数据避免重复工作
	}

	//根据文件路径读取文件，返回文件列表
	fs.readdir(sourceFolder,function(err,files){
		if(err){
			console.warn(err);
		}else{
			//遍历读取到的文件列表
			files.forEach(function(filename){
				var searchID = /^(\d+)\.html$/i.exec(filename);
				if (searchID && !monArr.some(function(cn){return cn.id == searchID[1];}))
				{
					var filepath = path.join(sourceFolder, filename);//合并当前文件的路径
					var htmlText = fs.readFileSync(filepath, 'utf-8'); //使用同步读取
					var searchName = /<h2 .+>\s*?([\s\S]+)\s*?<\/h2>/igm.exec(htmlText);
					try
					{
						var m = {
							id:searchID[1],
							name:searchName[1].replace("\n",""),
						}
						monArr.push(m);
						if (monArr.length % 100 == 0)
						{
							console.log("已添加 " + monArr.length + " 个数据");
						}
					}catch(e)
					{
						console.log(filename,e)
					}
				}
			});
			monArr.sort(function(a,b){
				return a.id - b.id;
			})
			var str = JSON.stringify(monArr);
			fs.writeFile(outJSON,str,function(err){
				if(err){
					console.error(err);
				}
				console.log("---繁体中文导出成功，共 " + monArr.length + " 个名称---");
			})
		}
	});
})

