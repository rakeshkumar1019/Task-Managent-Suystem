var express=require('express')
var mysql=require('mysql')
var bodyParser=require('body-parser')
var nodemailer=require('nodemailer')
var session=require('express-session')
var path=require('path')
var app=express()
app.use(express.static("css"));
app.use(express.static("uploads"));
app.use(express.static("images"));
app.use(express.static("videos"));
app.use(express.static("js"));
var multer = require('multer');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine','ejs');
var PORT=process.env.PORT || 8080

var connection=mysql.createConnection({
	host:'localhost',
	user:'root',
	password:'',
	database:'todo'
})
connection.connect(function(err){
	if(err) throw err
		console.log('database is connected')
})

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}))

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var transporter = nodemailer.createTransport({
	service: 'gmail',
	host: 'smtp.gmail.com',
	port:587,
	secure: false,
	auth: {
	  user: 'srakeshkumar1019@gmail.com',
	  pass: 'rakesh@786G'
	}
  });


var storage1 = multer.diskStorage({
	destination: function (req, file, callback) {
		callback(null, 'uploads/');
	},
	filename: function (req, file, callback) {
		callback(null, Date.now() + file.originalname);
	}
});

var upload = multer({ storage: storage1 });

app.get('/',function(req,res){
	res.sendFile('index.html',{root:__dirname})
}) 

app.post('/register',function(req,res){
	let username=req.body.username
	let password=req.body.password
	let gender=req.body.gender
	let email=req.body.email
	let phone=req.body.phone
	let noimage = "noimage.png";
	let verify="false";
	let otp=Math.floor(100000+Math.random()*900000)
    var mailOptions = {
		from: 'srakeshkumar1019@gmail.com',
		to:email,
		subject: 'Welcome to TodoApp',
		text: ` Hey ${username}!
${otp} is your TodoApp Verification Code
Please do not share it with anyone.`
		// html: '<h1>Hi Smartherd</h1><p>Your Messsage</p>'        
	  };

	  transporter.sendMail(mailOptions, function(error, info){
		if (error) {
		  console.log(error);
		} else {
		  console.log('Email sent: ' + info.response);
		}
	  })



	let sql='insert into registration values(null,"'+username+'","'+password+'","'+gender+'","'+email+'","'+phone+'")'
	connection.query(sql,function(err){
		if(err) throw err
			let otpsql='insert into verifyotp values("'+email+'","'+otp+'","'+verify+'")'
		    connection.query(otpsql,function(err){
		    	if(err) throw err
		    		var imagesql = "insert into userprofileimages values('" + noimage + "','" + email + "')"
		    	    connection.query(imagesql,function(err){
		    	    	if(err) throw err
		    	    		res.redirect('/otp')

		    	    })

		    		
		    })
			

	})
})

app.get('/otp',function(req,res){
	res.sendFile('otp.html',{root:__dirname});
})

app.post('/otp/verify',function(req,res){
	var otp=req.body.otp;
	connection.query('SELECT * FROM verifyotp WHERE BINARY  otp = ? ', [otp], function (error, results, fields) {
	if (results.length > 0) {
		var verify="true";
		var verifyed = " UPDATE verifyotp SET verify ='" +verify+ "'  WHERE otp = '" +otp+ "' "
		connection.query(verifyed, function (err) {
		   if (err) throw err;
		}); 
		res.redirect('/login');
	
	} else {
		res.send('Wrong verification Code ');
	}
	res.end();

})

})

app.get('/login',function(req,res){
	res.sendFile('login.html',{root:__dirname})
})

app.post('/login/verification',function(req,res){
	 var email = req.body.email;
	 var password = req.body.password;
	

	if (email && password) {
		connection.query('SELECT * FROM registration WHERE BINARY  email = ? AND  BINARY  password = ?', [email, password], function (error, results, fields) {
			if (results.length > 0) {

				        req.session.loggedin = true;
				        req.session.email = email;
				       
					
				res.redirect('/dashboard');
				
			} else {
				res.send('Incorrect email and/or Password!');
			}
			res.end();
		});
	} else {
		res.send('Please enter email and Password!');
		res.end();
	}


})
var userCount = 0;
app.get('/dashboard',function(req,res){
	if (req.session.loggedin) {
	   var  email=req.session.email ;
	   var vv="select * from verifyotp where  email='"+email+"' ";
	    connection.query(vv,function(err,verfy,fields){
		   if (err) throw err;
		        if(verfy[0].verify!=="true"){
			    res.redirect('/otp');
		        }else{	
		        	var dash='select * from registration where email="'+email+'"'
		        	connection.query(dash,function(err,users,fields){
		        		if(err) throw err
		        			var imgsql='select * from userprofileimages where email="'+email+'"'
		        		    connection.query(imgsql,function(err,imgsrc,fields){
		        		    	if(err) throw err
                                    
		        		    		res.render('dashboard',{user:users[0],imagesrc:imgsrc[0] })


		        		    })
		        	})
		        }

        });	 
	} else {

		res.redirect('/login');
	}
	
})

app.post('/profile/update/username',function(req,res){
 if (req.session.loggedin) {
	     let username=req.body.username
	     var sql="UPDATE registration SET username='"+username+"'  WHERE email='" + req.session.email + "' "
	     connection.query(sql,function(err){
	     	if(err) throw err
	     	  	res.redirect('/dashboard');
	     })
  }else{
  	res.redirect('/login');
   }

})

app.post('/profile/update/email',function(req,res){
 if (req.session.loggedin) {
	     let email=req.body.email
	     var sql="UPDATE registration SET email='"+email+"'  WHERE email='" + req.session.email + "' "
	     connection.query(sql,function(err){
	     	if(err) throw err
	 		   res.redirect('/dashboard');
	     })
  }else{
  	res.redirect('/login');
   }

})

app.post('/profile/update/phone',function(req,res){
 if (req.session.loggedin) {
	     let phone=req.body.phone
	     var sql="UPDATE registration SET phone='"+phone+"'  WHERE email='" + req.session.email + "' "
	     connection.query(sql,function(err){
	     	if(err) throw err
	 		   res.redirect('/dashboard');
	     })
  }else{
  	res.redirect('/login');
   }

})

app.post('/profile/update/password',function(req,res){
 if (req.session.loggedin) {
	     let password=req.body.password
	     var sql="UPDATE registration SET password='"+password+"'  WHERE email='" + req.session.email + "' "
	     connection.query(sql,function(err){
	     	if(err) throw err
	 		   res.redirect('/dashboard');
	     })
  }else{
  	res.redirect('/login');
   }

})

app.post('/profile/update/gender',function(req,res){
 if (req.session.loggedin) {
	     let gender=req.body.gender
	     var sql="UPDATE registration SET gender='"+gender+"'  WHERE email='" + req.session.email + "' "
	     connection.query(sql,function(err){
	     	if(err) throw err
	 		   res.redirect('/dashboard');
	     })
  }else{
  	res.redirect('/login');
   }

})


app.post('/update/profile/images', upload.single('updateprofileimgage'), function (req, res, next) {
	if (req.session.loggedin) {
		var fileinfo = req.file.filename;
		var s = "select * from  userprofileimages where email='" + req.session.email + "' ";
		connection.query(s, function (error, results, fields) {
			if (results == '') {
				var sql = "insert into userprofileimages values('" + fileinfo + "','" + req.session.email + "')";
				connection.query(sql, function (err) {
					if (err) throw err;
					res.redirect('/dashboard');
				});
			} else {
				var fileinfo = req.file.filename;
				sa = "UPDATE userprofileimages  SET src='" + fileinfo + "' WHERE email='" + req.session.email + "';"
				     connection.query(sa, function (err) {
					if (err) throw err;
					res.redirect('/dashboard');
				});
			}
		});
	} else {
      res.redirect('/login');
	}
})


app.get('/add/task',function(req,res){
	if (req.session.loggedin) {
	    res.render('task',{success:''})

	} else {
      res.redirect('/login');
	}
})

let ts = Date.now();
let date_ob = new Date(ts);
let date = date_ob.getDate();
let month = date_ob.getMonth() + 1;
let year = date_ob.getFullYear();
// prints date & time in YYYY-MM-DD format
// current hours
let hours = date_ob.getHours();
// current minutes
let minutes = date_ob.getMinutes();

 


app.post('/post/task/',function(req,res){
 if (req.session.loggedin) {	
   let title=req.body.title
   let content=req.body.content
   let completedDate=req.body.completedDate
   let createdDate=year + "-" + month + "-" + date
   let time=hours+":"+minutes
   let isDone="Pending"
   let email= req.session.email
   var mailOptions = {
		from: 'srakeshkumar1019@gmail.com',
		to:email,
		subject: 'Welcome to TodoApp',
		text: ` New Task is successfully  created 
Title:${title}
Content:${content}
Created on:${createdDate} ${time} 
Complet by:${completedDate}


Thank You
visit:https://todoapp.com
`
		// html: '<h1>Hi Smartherd</h1><p>Your Messsage</p>'        
	  };

	  transporter.sendMail(mailOptions, function(error, info){
		if (error) {
		  console.log(error);
		} else {
		  console.log('Email sent: ' + info.response);
		}
	  })

   sql='insert into task values(null,"'+createdDate+'","'+title+'","'+content+'","'+completedDate+'","'+email+'","'+isDone+'","'+time+'")'
   connection.query(sql,function(err){
   	if(err) throw err

   		 res.render('task',{success:"Task created "})


   })

  } else {
      res.redirect('/login')
  }

})

app.get('/see/task/all',function(req,res){
	if (req.session.loggedin) {
		let sql='select * from task where email= "' + req.session.email + '"  '
		connection.query(sql,function(err,tasks,fields){
			 res.render('alltask',{tasks:tasks})
		})
	 
	} else {
      res.redirect('/login')
    }
})


app.get('/all/task/update',function(req,res){
	if (req.session.loggedin) {
	     res.render('updatetask',{success:''})
	} else {
      res.redirect('/login')
    }
})

app.post('/post/all/taskUpdate',function(req,res){
 if (req.session.loggedin) {
 	 let id=req.body.id
 	 let type=req.body.typeData
 	 let sql=''
 	 if(type=="title"){
 	  sql= ' update task set title="'+req.body.title+'"  where id="'+id+'" AND email="' + req.session.email + '" '	   
 	 }else if(type=="content"){
 	  sql= ' update task set content="'+req.body.content+'"  where id="'+id+'" AND email="' + req.session.email + '"  '
 	 }else if(type=="completedDate"){
 	  sql= ' update task set completedDate="'+req.body.completedDate+'"  where id="'+id+'" AND email="' + req.session.email + '" '	 
 	 }else if(type=="isDone"){
 	  sql= ' update task set isDone="'+req.body.isDone+'"  where id="'+id+'" AND email="' + req.session.email + '" '	
 	 } 
     let checkIfExist='select count(*) AS total from task '
 	 connection.query(sql,function(err){
 	 	if(err) throw err
 	 		connection.query(checkIfExist,function(err,data,fields){
 	 			if(err) throw err
 	 				if(data[0].total >=id && id!=0){
 	 					  console.log(data[0].total)
 	 				      res.render('updatetask',{success:'Task Successfull Updated'})
 	 				 }else{
 	 				     res.render('updatetask',{success:'Please Enter valid ID '})	
 	 				 }
 	 				

 	 		})
 	 		 
 	 })
 	  

	  
	 

 } else {
      res.redirect('/login')
 }

})



app.get("/logout",function(req,res){
    req.session.loggedin =false;
    res.redirect('/');
});

app.listen(PORT,function(err){
	if(err) throw err
		console.log(`server is running at port:${PORT}`)
})