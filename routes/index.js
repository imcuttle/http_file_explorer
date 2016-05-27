
/*
 * GET home page.
 */
var fs = require('fs');
var Q = require('q');


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
function loadDir(root,rela,req,res) {
  fs.readdir(root,function (err,files) {
    if(err) throw err;
    Promise.all(files.map(x=>{return statPr(root,x);}))
        .then(function (values) {
          res.render('file',
              {
                title:'HTTP文件查看',
                dirname:rela,
                files : values.map(x=> {
                  return {
                    type: x.type,
                    name: x.name,
                    time: x.mtime.format(),
                    size: x.size+'字节'
                  };
                })
              }
          );
        });
  });
}
function loadFile(filename,rela,req,res){
    fs.readFile(filename,function (err,data) {
        if(err) throw err;
        res.end(data.toString());
    });
}
var root = fs.readFileSync('./root').toString();
exports.index = function(req, res){
    var r = decodeURIComponent(req.url);
    r=r==='/'?'':r;
    console.info(r);
    var state = fs.statSync(root+r);
    if(state.isDirectory())
        loadDir(root+r,r, req, res);
    else
        loadFile(root+r,r,req,res);
};

Date.prototype.format = function () {
  return [this.getUTCFullYear(),this.getUTCMonth()+1,this.getUTCDate()].join('/')+' '
    +[this.getUTCHours(),this.getUTCMinutes()].join(':');
};