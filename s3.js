/*import dotenv from 'dotenv'
dotenv.config();


var albumBucketName = process.env.WEB_AWS_BUCKET_NAME;
var bucketRegion = process.env.WEB_AWS_REGION;
var IdentityPoolId = process.env.WEB_AWS_IDENTITY_POOL_ID;

alert('albumBucketName: '+albumBucketName);
*/

var albumBucketName = "uaz-unir-bucket";
var bucketRegion = "us-east-2";
var IdentityPoolId = "us-east-2:83b42f0e-5545-46f7-83eb-ec0959b66f14";


AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
  })
});

var s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: albumBucketName }
});

/************************************************* */
function listAlbums() {
    s3.listObjects({ Bucket: "uaz-unir-bucket", Delimiter: "/" }, function(err, data) {
      if (err) {
        return alert("There was an error listing your albums: " + err.message);
      } else {
        var albums = data.CommonPrefixes.map(function(commonPrefix) {
          var prefix = commonPrefix.Prefix;
          var albumName = decodeURIComponent(prefix.replace("/", ""));          
          if(albumName==='ANALYZE-DATASET') {
            return getHtml([
              "<li>",
              //"<span onclick=\"deleteAlbum('" + albumName + "')\" style='color:red;cursor:pointer;'>[Delete]</span>",
              //"<span onclick=\"viewAlbum('" + albumName + "')\" style='color:blue;cursor:pointer;'>",
              "<span onclick=\"viewAndLoadDatasets('" + albumName + "')\" style='color:blue;cursor:pointer;'>",            
              albumName,
              "</span>",
              "</li>"
            ]); 
          } else{
            return getHtml([
              ""
            ]);  
          }
        });
        var message = albums.length
          ? getHtml([
              "<p>This tool wants to help you to analyze structured datasets (Features and Models).</p>",
              //"<p>Click on the <span style='color:blue;'>Folder Name</span> to view it.</p>",
              //"<p>Click on the <span style='color:red;'>[Delete]</span> to delete the album.</p></br>"
            ])
          : "<p>You do not have any folders. Please create folder.";
        var htmlTemplate = [
          "<h3 class='title mx-auto'><b>Analysis of Datasets</b></h3>",
          message,
          "<ul>",
          getHtml(albums),
          "</ul>"
          /* 
          //Hidden logic, only enabled for deleting Albums
          ,
          "<button onclick=\"createAlbum(prompt('Enter Album Name:'))\" class='btn btn-danger btn-block btn-round'>",
          "Create New Album",
          "</button>"*/
        ];
        document.getElementById("app").innerHTML = getHtml(htmlTemplate);
      }
    });
  }

  function listSubAlbums(albumName) {
    s3.listObjects({ Bucket: "uaz-unir-bucket",Prefix:albumName, Delimiter: "/" }, function(err, data) {
      if (err) {
        return alert("There was an error listing your folder: " + err.message);
      } else {
        var albums = data.CommonPrefixes.map(function(commonPrefix) {
          var prefix = commonPrefix.Prefix;
          var albumName = decodeURIComponent(prefix.replace("/", ""));
          return getHtml([
            "<li>",
            //"<span onclick=\"deleteAlbum('" + albumName + "')\" style='color:red;cursor:pointer;'>[Delete]</span>",
            "<span onclick=\"viewAlbum('" + albumName + "')\" style='color:blue;cursor:pointer;'>",
            albumName,
            "</span>",
            "</li>"
          ]);
        });
        var message = albums.length
          ? getHtml([
              "<p>This tool wants to help you to analyze structured datasets (Features and Models).</p>",
              //"<p>Click on the <span style='color:blue;'>Folder Name</span> to view it.</p>",
              //"<p>Click on the <span style='color:red;'>[Delete]</span> to delete the album.</p></br>"
            ])
          : "<p>You do not have any folders. Please create folder.";
        var htmlTemplate = [
          "<h3 class='title mx-auto'><b>Analysis of Datasets</b></h3>",
          message,
          "<ul>",
          getHtml(albums),
          "</ul>"
          /* 
          //Hidden logic, only enabled for deleting Albums
          ,
          "<button onclick=\"createAlbum(prompt('Enter Album Name:'))\" class='btn btn-danger btn-block btn-round'>",
          "Create New Album",
          "</button>"*/
        ];
        document.getElementById("app").innerHTML = getHtml(htmlTemplate);
      }
    });
  }

  
  
  function createAlbum(albumName) {
      albumName = albumName.trim();      
    if (!albumName) {
      return alert("Album names must contain at least one non-space character.");
    }
    if (albumName.indexOf("/") !== -1) {
      return alert("Album names cannot contain slashes.");
    }
    //var albumKey = encodeURIComponent(albumName)+"/";    
    var albumKey = albumName.concat(albumName,"/");    
    s3.headObject({ Key: albumKey }, function(err, data) {
      if (!err) {
        return alert("Folder already exists.");
      }
      if (err.code !== "NotFound") {
        return alert("There was an error creating your folder: " + err.message);
      }
      s3.putObject({ Key: albumKey }, function(err, data) {
        if (err) {
          return alert("There was an error creating your folder: " + err.message);
        }
        alert("Successfully created folder.");
        viewAlbum(albumName);
      });
    });
  }

  function createMainDatasetAlbum(albumName) {       
    if (!albumName) {
      return alert("Album names must contain at least one non-space character.");
    }
    if (albumName.indexOf("/") !== -1) {
      return alert("Album names cannot contain slashes.");
    }
    var albumKey = encodeURIComponent(albumName)+"/";
    s3.headObject({ Key: albumKey }, function(err, data) {
      if (!err) {
        return alert("Folder already exists.");
      }
      if (err.code !== "NotFound") {
        return alert("There was an error creating your folder: " + err.message);
      }
      s3.putObject({ Key: albumKey }, function(err, data) {
        if (err) {
          return alert("There was an error creating your folder: " + err.message);
        }
        alert("Successfully created folder.");
        //Listar Folders
        viewAndLoadDatasets(albumName);
      });
    });
  }

  function uploadDatasetsTestLambda(albumName) {
    executeLambdaFunction(albumName);     
  }

  function uploadDatasets(albumName) {
    var timestamp = new Date().getTime();        
    var albumName = albumName.concat(timestamp);
    
    addPhoto(albumName);     
    //await new Promise(r => setTimeout(r, 30000));    
    //setTimeout(function() {}, (30 * 1000));
    //sleep(30000);
    alert('sleep')
    alert('albumName: '+albumName)
 //const sleep = (milliseconds) => {return new Promise(resolve => setTimeout(resolve, milliseconds))}
    executeLambdaFunction(timestamp.toString());     
  }

  function executeLambdaFunction(timestamp){
    $.ajax({
      url: "https://0r32io5uz5.execute-api.us-east-2.amazonaws.com/unir-uaz-stage-sandbox", 
      dataType: 'json',
      type: 'POST', 
      beforeSend: function(request) {
        request.setRequestHeader("Access-Control-Allow-Headers" , "Content-Type, Authorization"),
        request.setRequestHeader("Access-Control-Allow-Origin", "*"),
        //request.setRequestHeader("Access-Control-Allow-Methods", "OPTIONS,POST,GET"
        )
      },
      contentType: 'application/json', 
      data: JSON.stringify({
        'folder_name': timestamp}),
      success: function(data) {
        console.log(data);   
        /*if(data['error'] == null) {
              alert('Registro exitoso');              
          } else {
              alert('Ha ocurrido un error en la asignacion de tiempo: ' + data['error']);
          } */           
      },
      error: function() {
          alert('Ha ocurrido un error en la asignacion de tiempo');
      }
    });

    /*var apigateway = new AWS.APIGateway();
    var params = {
      httpMethod: 'POST',
      resourceId: 'vlfw419e94',
      restApiId: '0r32io5uz5',
      body: JSON.stringify({"folder_name":timestamp}),
      //clientCertificateId: 'STRING_VALUE',
      headers: {
        "content-type": "application/json"        
      }
    };
    apigateway.testInvokeMethod(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });*/

  }


  function viewAlbum(albumName) {
    //alert('albumName: '+albumName)
    var albumPhotosKey = encodeURIComponent(albumName) + "/";
    
    s3.listObjects({ Prefix: albumPhotosKey }, function(err, data) {
      if (err) {
        return alert("There was an error viewing your album: " + err.message);
      }
      // 'this' references the AWS.Response instance that represents the response
      var href = this.request.httpRequest.endpoint.href;
      var bucketUrl = href + albumBucketName + "/";
      var count = 0;
      var photos = data.Contents.map(function(photo) {
        var photoKey = photo.Key;
        var photoUrl = bucketUrl + encodeURIComponent(photoKey);        
        var pathFolder = photoKey.replace("/","");        
        pathFolder = bucketUrl+pathFolder+"%2F";        
        //alert("photoUrl " + photoUrl)
        //alert("pathFolder " + pathFolder)
        if(photoUrl != (pathFolder)){
          count = count+1;
          return getHtml([
            "<tr>",
            "<td>",
            //'<img style="width:128px;height:128px;" src="' + photoUrl + '"/>',
            '<img style="width:30px;height:23px;" src="./assets/img/csv_image.png"/>',
            "</td>",
            '<td>'+photoKey.replace(albumPhotosKey, "")+'</td>',
            "<td>",
            "<div>",
            "<span onclick=\"deletePhoto('" +
              albumName +
              "','" +
              photoKey +
              "')\" style='color:red;cursor:pointer;'>",
            "[Delete]&nbsp;&nbsp;",
            "</span>",            
            "</div>",
            "</td>",
            "</tr>"
          ]);
        } else {
          return getHtml([
            ""
          ]);
        }
      });
      //var message = photos.length
      var message = count>0
        ? ""
        //? "<p>Click on the <span style='color:red;'>[Delete]</span> to delete the file.</p></br>"
        : "<p>You do not have any files in this folder. Please add files.</p></br>";        
      var htmlTemplate = [
        "<h3 class='title mx-auto'>",
        "<b>" + albumName+'</b>',
        "</h3>",
        "<h4 class='title'>Upload a new Dataset</h4>",
        "<div class='custom-file mb-3'>",
        '<input id="photoupload" type="file" accept=".csv">',        
        //'<button id="addphoto" onclick="addPhoto(\'' + albumName + "')\" class='btn-primary'>",
        '<button id="addphoto" onclick="uploadDatasets(\'' + albumName + "')\" class='btn-primary'>",        
        "Add Dataset (Less than 250 MB)",
        "</button>",
        "</div></br>",        
        "<div>",
        "<h4 class='title'>List of Datasets</h4>",
        message,
        "<table class='table-responsive'>",
        "<tr><th></th><th>File Name&nbsp;&nbsp;&nbsp;&nbsp;</th><th>Operation&nbsp;&nbsp;&nbsp;&nbsp;</th></tr>",
        getHtml(photos),
        "</table></div></br>",                
        '<button onclick="listAlbums()" class="btn btn-danger btn-block btn-round">',
        "Back To Main Folders",
        "</button>"
      ];
      document.getElementById("app").innerHTML = getHtml(htmlTemplate);
    }); 
  }

  function viewAndLoadDatasets(albumName) { 
    //alert('INI: --'+albumName+'--')    
    albumName = encodeURIComponent(albumName) + "/";
    s3.listObjects({ Bucket: "uaz-unir-bucket",Prefix:albumName, Delimiter: "/" }, function(err, data) {      
      if (err) {
        return alert("There was an error viewing your album: " + err.message);
      }         

      // 'this' references the AWS.Response instance that represents the response      
      //var href = this.request.httpRequest.endpoint.href;      
      //var bucketUrl = href + albumBucketName + "/";
      var count = 0;
      
      //var subAlbums = decodeURIComponent(prefix.replace("/", ""));                
      var subAlbums = data.CommonPrefixes.map(function(commonPrefix) {                  
        var prefix = commonPrefix.Prefix;
        //alert('prefix: '+prefix)  
        var intAlbumName = prefix;
        //var intAlbumName = decodeURIComponent(prefix.replace("/", ""));
        //alert('intAlbumName: '+intAlbumName)
        //if(intAlbumName === albumName){
        //  return getHtml([""]);    
        //} else {
          count = count+1;
          return getHtml([
            "<tr>",
            "<td>",
            //"<span onclick=\"deleteAlbum('" + intAlbumName + "')\" style='color:red;cursor:pointer;'>[Delete]</span>",
            //"<span onclick=\"viewAlbum('" + intAlbumName + "')\" style='color:blue;cursor:pointer;'>",
            "<span onclick=\"viewDatasetFolder('" + intAlbumName + "')\" style='color:blue;cursor:pointer;'>",            
            intAlbumName,
            "</span>",
            "</td>",
            "<td>",
            "<span onclick=\"deleteAlbum('" + intAlbumName + "')\" style='color:red;cursor:pointer;'>[Delete]</span>",
            "</td>",
            "</tr>"
          ]);
        //}        
      });    
      //var message = photos.length
      var message = count>0
        ? ""
        //? "<p>Click on the <span style='color:red;'>[Delete]</span> to delete the file.</p></br>"
        : "<p>You do not have any files in this folder. Please add files.</p></br>";        
      var htmlTemplate = [
        "<h3 class='title mx-auto'>",
        "<b>" + albumName+'</b>',
        "</h3>",
        "<h4 class='title'>Upload a new Dataset</h4>",
        "<div class='custom-file mb-3'>",
        '<input id="photoupload" type="file" accept=".csv">',        
        //'<button id="addphoto" onclick="addPhoto(\'' + albumName + "')\" class='btn-primary'>",
        '<button id="addphoto" onclick="uploadDatasets(\'' + albumName + "')\" class='btn-primary'>",        
        "Add Dataset (Less than 250 MB)",
        "</button>",
        "</div></br>",        
        "<div>",
        "<h4 class='title'>List of Datasets</h4>",
        message,
        "<table class='table-responsive'>",
        "<tr><th>File Name&nbsp;&nbsp;&nbsp;&nbsp;</th><th>Operation&nbsp;&nbsp;&nbsp;&nbsp;</th></tr>",
        getHtml(subAlbums),
        "</table></div></br>",                
        '<button onclick="listAlbums()" class="btn btn-danger btn-block btn-round">',
        "Back To Main Folders",
        "</button>"
      ];
      document.getElementById("app").innerHTML = getHtml(htmlTemplate);
    }); 
  }
  
  function viewDatasetFolder(albumName) {
    //albumName = albumName.replace("%2F","/"); 
    //var albumPhotosKey = encodeURIComponent(albumName) + "/";
    albumPhotosKey = albumName;
    //alert("viewDatasetFolder albumName " + albumName)
    s3.listObjects({ Prefix: albumPhotosKey }, function(err, data) {
      if (err) {
        return alert("There was an error viewing your album: " + err.message);
      }
      // 'this' references the AWS.Response instance that represents the response
      var href = this.request.httpRequest.endpoint.href;
      var bucketUrl = href + albumBucketName + "/";
      var count = 0;
      var photos = data.Contents.map(function(photo) {
        var photoKey = photo.Key;
        var photoUrl = bucketUrl + encodeURIComponent(photoKey);        
               
        var pathAlbumphoto = bucketUrl+albumPhotosKey;        
        var pathPhotoUrl = bucketUrl+photoKey;
        //alert("viewDatasetFolder pathAlbumphoto " + pathAlbumphoto)
        //alert("viewDatasetFolder pathPhotoUrl " + pathPhotoUrl)
        if(pathAlbumphoto != (pathPhotoUrl)){
          count = count+1;
          return getHtml([
            "<tr>",
            "<td>",
            //'<img style="width:128px;height:128px;" src="' + photoUrl + '"/>',
            '<img style="width:30px;height:23px;" src="./assets/img/file.jpg"/>',
            "</td>",
            '<td><a href="' + photoUrl + '">'+photoKey.replace(albumPhotosKey, "")+'</a></td>',
            "<td>",
            "<div>",
            "<span onclick=\"deletePhoto('" +
              albumName +
              "','" +
              photoKey +
              "')\" style='color:red;cursor:pointer;'>",
            "[Delete]&nbsp;&nbsp;",
            "</span>",            
            "</div>",
            "</td>",
            "</tr>"
          ]);
        } else {
          return getHtml([
            ""
          ]);
        }
      });
      //var message = photos.length
      var message = count>0
        ? ""
        //? "<p>Click on the <span style='color:red;'>[Delete]</span> to delete the file.</p></br>"
        : "<p>You do not have any files in this folder. Please add files.</p></br>";        
      var htmlTemplate = [
        "<h3 class='title mx-auto'>",
        "<b>" + albumName+'</b>',
        "</h3>",               
        "<div>",
        "<h4 class='title'>List of Files</h4>",
        message,
        "<table class='table-responsive'>",
        "<tr><th></th><th>File Name&nbsp;&nbsp;&nbsp;&nbsp;</th><th>Operation&nbsp;&nbsp;&nbsp;&nbsp;</th></tr>",
        getHtml(photos),
        "</table></div></br>",                
        "<button onclick=\"viewAndLoadDatasets('ANALYZE-DATASET')\" class='btn btn-danger btn-block btn-round'>",
        "Back To Datasets",
        "</button>"
      ];
      document.getElementById("app").innerHTML = getHtml(htmlTemplate);
    }); 
  }
  
   

  function addPhoto(albumName) {
    //alert('Upload: '+ albumName);
    var files = document.getElementById("photoupload").files;
    if (!files.length) {
      return alert("Please choose a file to upload first.");
    }
    var file = files[0];
    var fileName = file.name;
    //var albumPhotosKey = encodeURIComponent(albumName) + "/"; //borrar
    var albumPhotosKey = albumName + "/";  //Lo bueno
  
    var photoKey = albumPhotosKey + fileName;
    //alert('photoKey: '+photoKey)
    /*//
    //alert('albumPhotosKey: '+ albumPhotosKey)
    //alert('fileName: '+fileName)

    //ANALYZE-DATASET/Report.csv
    var splitPhotoKey = photoKey.split(".");
    var newKey = splitPhotoKey[0]+"_"+new Date().getTime();
    photoKey = newKey+"."+splitPhotoKey[1];
    //alert('photoKey final: '+photoKey) */
    // Use S3 ManagedUpload class as it supports multipart uploads
    /*
    alert('fileName: '+fileName)
    alert('albumBucketName: '+albumBucketName)
    alert('photoKey: '+photoKey)
    */
    var upload = new AWS.S3.ManagedUpload({
      params: {
        Body: fileName, //** */
        Bucket: albumBucketName,
        Key: photoKey,
        Body: file
      }
    });
  
    var promise = upload.promise();
  
    promise.then(
      function(data) {
        alert("Successfully uploaded file.");
        viewDatasetFolder(albumName);
      },
      function(err) {
        return alert("There was an error uploading your photo: ", err.message);
      }
    );
  }

  

  function addPhotoReloadedNOUSADO(albumName) {
    //Create Album

    //Create File
    var files = document.getElementById("photoupload").files;
    if (!files.length) {
      return alert("Please choose a file to upload first.");
    }
    var file = files[0];
    var fileName = file.name;
    var albumPhotosKey = encodeURIComponent(albumName) + "/";
  
    var photoKey = albumPhotosKey + fileName;
    //alert('photoKey: '+photoKey)
    //alert('albumPhotosKey: '+ albumPhotosKey)
    //alert('fileName: '+fileName)

    //ANALYZE-DATASET/Report.csv
    var splitPhotoKey = photoKey.split(".");
    var newKey = splitPhotoKey[0]+"_"+new Date().getTime();
    photoKey = newKey+"."+splitPhotoKey[1];
    //alert('photoKey final: '+photoKey) 
    // Use S3 ManagedUpload class as it supports multipart uploads
    var upload = new AWS.S3.ManagedUpload({
      params: {
        Bucket: albumBucketName,
        Key: photoKey,
        Body: file
      }
    });
  
    var promise = upload.promise();
  
    promise.then(
      function(data) {
        alert("Successfully uploaded file.");
        viewAlbum(albumName);
      },
      function(err) {
        return alert("There was an error uploading your photo: ", err.message);
      }
    );
  }

  
  function deletePhoto(albumName, photoKey) {
    s3.deleteObject({ Key: photoKey }, function(err, data) {
      if (err) {
        return alert("There was an error deleting your file: ", err.message);
      }
      alert("Successfully deleted file.");
      viewAlbum(albumName);
    });
  }

  
  function deleteAlbum(albumName) {
    //var albumKey = encodeURIComponent(albumName) + "/";
    var albumKey = encodeURIComponent(albumName);
    s3.listObjects({ Prefix: albumKey }, function(err, data) {
      if (err) {
        return alert("There was an error deleting your album: ", err.message);
      }
      var objects = data.Contents.map(function(object) {
        return { Key: object.Key };
      });
      s3.deleteObjects(
        {
          Delete: { Objects: objects, Quiet: true }
        },
        function(err, data) {
          if (err) {
            return alert("There was an error deleting your folder: ", err.message);
          }
          alert("Successfully deleted folder.");
          listAlbums();
        }
      );
    });
  }
  