
/*
 * GET home page.
 */
var fs = require('fs');
var Q = require('q');
var url = require('url');
var archiver = require('archiver');

function loadZip(file,rela,req,res) {
    var state = fs.statSync(file);
    var filename = rela.substring(rela.lastIndexOf('/')+1);
    var archive = archiver('zip');
    archive.on('error', function(err){throw err;});
    archive.pipe(res);
    if(state.isDirectory()) archive.directory(file,filename);
    else archive.file(file,{name:filename});
    archive.finalize();
}

var statPr = function (root,file) {
  var deferred = Q.defer();
  fs.stat(root+'/'+file,function (err, stats) {
    if(err) deferred.reject(err);
    else {
        stats.name = file;
        stats.type = stats.isDirectory()?'文件夹':'文件';
        deferred.resolve(stats, root);
    }
  });
  return deferred.promise;
};


function loadDir(r,rela,req,res) {
  fs.readdir(r,function (err,files) {
    if(err) throw err;
    if(r!==root){
        var d = r.substring(0,r.lastIndexOf('/'));
        Q.nfcall(fs.readdir,d)
            .then(function (list) {
                fn(list,r.substring(r.lastIndexOf('/')+1));
            })
    }else {
        fn();
    }
    function fn(list,f) {
        var o ={};
        if(list){
            var i = list.indexOf(f);
            if(i>=0) {
                o.prev = list[i - 1];
                o.next = list[i + 1];
            }
        }
        console.log('o',o);
        Promise.all(files.map((x,i,a)=>{return statPr(r,x);}))
            .then(function (values) {
                res.render('file',Object.extend(o,
                    {
                        title:'HTTP文件查看',
                        dirname:rela,
                        files : values.map(x=> {
                            return {
                                type: x.type,
                                name: x.name,
                                time: x.mtime.format(),
                                size: x.size.toSize()
                            };
                        })
                    })
                );
            }).catch(function (err) {
                console.error(err);
            });
    }
  });
}
Number.prototype.toSize = function () {
    if(this<1024){
        return this+"B";
    }else if(this<1024<<10){
        return (this/1024).toFixed(2)+"KB";
    }else if(this<1024<<20){
        return (this/(1024<<10)).toFixed(2)+"MB";
    }else{
        return (this/(1024<<20)).toFixed(2)+"GB";
    }
}
Object.extend = function (src) {
    Array.prototype.slice.call(arguments,1)
        .forEach(x=>{
            for(var k in x)
                src[k]=x[k];
        })
    return src;
}
function loadFile(file,rela,raw,res){
    if(!raw){
        if(file!==root){
            var d = file.substring(0,file.lastIndexOf('/'));
            Q.nfcall(fs.readdir,d)
                .then(function (list) {
                    fn(list,file.substring(file.lastIndexOf('/')+1));
                }).catch(function (err) {
                    console.error(err);
                })
        }else fn();
        function fn(list,f) {
            var o ={};
            if(list){
                var i = list.indexOf(f);
                if(i>=0) {
                    o.prev = list[i - 1];
                    o.next = list[i + 1];
                }
            }
            o = Object.extend(o,{
                dirname:rela,
                title:f,
                src:f+'?raw=true'
            });
            if(f.match(/\.(avi|mp4|mkv|rmvb|mpg|rm|wma)$/i)){
                res.render('video',o);
            }else if(f.match(/\.(jpg|png|bmp|jepg|gif)$/i)){
                res.render('img',o);
            }else if(f.match(/\.(mp3|wma|aac)$/i)){
                res.render('audio',o);
            }else {
                fs.createReadStream(file).pipe(res);
            }
        }
    }else{
        fs.createReadStream(file).pipe(res);
    }

}
var root = fs.readFileSync('./root').toString();
exports.index = function(req, res){
    var arg = url.parse(req.url,true),
        query = arg.query;
    var r = decodeURIComponent(arg.pathname);
    r=r==='/'?'':r;
    console.info(r,query);
    if(!query.compress){
        var state = fs.statSync(root+r);
        if(state.isDirectory())
            loadDir(root+r,r, req, res);
        else
            loadFile(root+r,r,query.raw,res);
    }else{
        loadZip(root+r,r,req,res);
    }
};

Date.prototype.format = function (fmt) { //author: meizz
    fmt = fmt || 'yyyy/MM/dd hh:mm';
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}