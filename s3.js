//import dotenv from 'dotenv'
//dotenv.config()
//var albumBucketName = process.env.AWS_BUCKET_NAME;
//var bucketRegion = process.env.AWS_REGION;
//var IdentityPoolId = process.env.AWS_IDENTITY_POOL_ID;

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
          return getHtml([
            "<li>",
            "<span onclick=\"deleteAlbum('" + albumName + "')\" style='color:red;cursor:pointer;'>[Delete]</span>",
            "<span onclick=\"viewAlbum('" + albumName + "')\" style='color:blue;cursor:pointer;'>",
            "&nbsp;&nbsp;Folder Name: "+albumName,
            "</span>",
            "</li>"
          ]);
        });
        var message = albums.length
          ? getHtml([
              "<p>Click on the <span style='color:blue;'>Folder Name</span> to view it.</p>",
              "<p>Click on the <span style='color:red;'>[Delete]</span> to delete the album.</p></br>"
            ])
          : "<p>You do not have any albums. Please Create album.";
        var htmlTemplate = [
          "<h3 class='title mx-auto'>Analysis of Datasets</h3>",
          message,
          "<ul>",
          getHtml(albums),
          "</ul>",
          "<button onclick=\"createAlbum(prompt('Enter Album Name:'))\" class='btn btn-danger btn-block btn-round'>",
          "Create New Album",
          "</button>"
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
    var albumKey = encodeURIComponent(albumName)+"/";
    s3.headObject({ Key: albumKey }, function(err, data) {
      if (!err) {
        return alert("Album already exists.");
      }
      if (err.code !== "NotFound") {
        return alert("There was an error creating your album: " + err.message);
      }
      s3.putObject({ Key: albumKey }, function(err, data) {
        if (err) {
          return alert("There was an error creating your album: " + err.message);
        }
        alert("Successfully created album.");
        viewAlbum(albumName);
      });
    });
  }

  function viewAlbum(albumName) {
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
            "<span>",
            "<div>",
            '<img style="width:128px;height:128px;" src="' + photoUrl + '"/>',
            "</div>",
            "<div>",
            "<span onclick=\"deletePhoto('" +
              albumName +
              "','" +
              photoKey +
              "')\" style='color:red;cursor:pointer;'>",
            "[Delete]&nbsp;&nbsp;",
            "</span>",
            "<span>",
            photoKey.replace(albumPhotosKey, ""),
            "</span>",
            "</div>",
            "</span>"
          ]);
        } else {
          return getHtml([
            ""
          ]);
        }
      });
      //var message = photos.length
      var message = count>0
        ? "<p>Click on the <span style='color:red;'>[Delete]</span> to delete the file.</p></br>"
        : "<p>You do not have any files in this folder. Please add files.</p></br>";        
      var htmlTemplate = [
        "<h2>",
        "Album: " + albumName,
        "</h2>",
        message,
        "<div>",
        getHtml(photos),
        "</div></br>",        
        "<div class='custom-file mb-3'>",
        '<input id="photoupload" type="file" accept=".csv" class="btn-primary">',        
        '<button id="addphoto" onclick="addPhoto(\'' + albumName + "')\" class='btn'>",        
        "Add Photo",
        "</button>",
        "</div></br>",
        '<button onclick="listAlbums()" class="btn btn-danger btn-block btn-round">',
        "Back To Albums",
        "</button>"
      ];
      document.getElementById("app").innerHTML = getHtml(htmlTemplate);
    });
  }
   

  function addPhoto(albumName) {
    var files = document.getElementById("photoupload").files;
    if (!files.length) {
      return alert("Please choose a file to upload first.");
    }
    var file = files[0];
    var fileName = file.name;
    var albumPhotosKey = encodeURIComponent(albumName) + "/";
  
    var photoKey = albumPhotosKey + fileName;
  
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
        alert("Successfully uploaded photo.");
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
        return alert("There was an error deleting your photo: ", err.message);
      }
      alert("Successfully deleted photo.");
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
            return alert("There was an error deleting your album: ", err.message);
          }
          alert("Successfully deleted album.");
          listAlbums();
        }
      );
    });
  }
  