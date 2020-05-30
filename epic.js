//making express available::::::::::::::::::::::::::::::::::::::::::::::::
var express = require('express');
const epic = express();

//connecting to locahost::::::::::::::::::::::::::::::::::::::::::::::::::
// myPort = epic.listen(port = 3000 || env.process.PORT  , '192.168.43.57', ()=>{
//     console.log("EPIC is listening to port "+port+" sir!");
// });
myPort = epic.listen(3000, 'LOCALHOST', ()=>{
    console.log("My Application is listening to port 3000 sir!");
});

//setting engine to ejs::::::::::::::::::::::::::::::::::::::::::::::::::
epic.set('view engine', 'ejs');

//middlewares:::
epic.use(express.static(__dirname+'/public'));

//requiring formidable and fs::::::::::::::::::::::::::::::::::::::::::::
var fm = require('formidable');
var fs = require('fs');

//requiring body-parser::::::::::::::::::::::::::::::::::::::::::::::::::::
var bodyParser = require('body-parser');
epic.use(bodyParser.json());
epic.use(bodyParser.urlencoded({extended:true}));


//requiring mysql::::::::::::::::::::::::::::::::::::::::::::::::::::::
var mysql = require('mysql');

//seting connection:::::::::::::::::::::::::::::::::::::::::
let connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "spa_db"
    // host: "remotemysql.com",
    // user: "1JTq39QISa",
    // password: "wO8zfGSyqY",
    // database: "1JTq39QISa"
});

//index - onload::::::::::::::::::::::::;:::::::::::::::::::::::::::::::::
epic.get('/', (req, res)=>{
    res.render('index', { status: null, id: null, firstname: null, lastname: null });
});

//routing into signup page::::::::::::::::::::::::::::::::::::::::::::::::
epic.get('/signup.epic', (req,res)=>{
    res.render('signup', {status: null, firstname: null, lastname: null, mobile: null, id: null});
});

//submitting sign-up data:::::::::::::::::::::::::::::::::::::::::::::::::
epic.post('/signup', (req, res)=>{
    //creating a method from formidable class::::::::::::::::::::::::::::::
    var form = new fm.IncomingForm();
    
    //submitting files and fields to database:::::::::::::::::::::::
    form.parse(req, (err, fields, files)=>{
        if(fields.firstname !="" && fields.lastname !=""  && fields.mobile !="" && fields.cpassword !="" && fields.password != ""){
            //checking passowrd and confirm passowrd are equal::::::::::::::::::::
            if(fields.cpassword == fields.password){
                
                let tmp = files.file.path;
                let pix = files.file.name;
                let img = pix;
                let imgLink = "public/userImages/"+pix;

                let newUserInfo = {
                    firstname: fields.firstname,
                    lastname: fields.lastname,
                    mobile: fields.mobile,
                    password: fields.password,
                    file: img
                }
                // console.log(newUserInfo)
        
                //putting into database and sending from temporary location to permanent location::::::::::::::::::::::::::::::::::::
                fs.rename(tmp, imgLink, ()=>{
                    sql_insert = `INSERT into profile_tb (firstname, lastname, mobile, password, file) values('${newUserInfo.firstname}', '${newUserInfo.lastname}', '${newUserInfo.mobile}','${newUserInfo.password}','${newUserInfo.file}')`;
                    connection.query(sql_insert, (err,data)=>{
                        if(err) {
                            throw err;
                        }
                        else{
                            sql_select_id = `SELECT id FROM profile_tb where mobile = '${newUserInfo.mobile}' AND password = '${newUserInfo.password}'`;
                            connection.query(sql_select_id, (err, data)=>{
                                // console.log(data[0].id)
                                res.render('index', { status: 'signedIn', id: data[0].id, mobile: null});
                            })
                        }
                    });
                
                });
            }
        else{
            res.render('signup', { status: 'password_err', firstname: fields.firstname, mobile: fields.mobile, lastname: fields.lastname })
        }
    }
    else{
        res.render('signup', { status: 'fillform_err', firstname: fields.firstname, mobile: fields.mobile, lastname: fields.lastname })
    }     
})
})

//rendering into dashborad if requirement is being met or reload login if otherwise
epic.post('/login', (req, res)=>{
    sql_syntax = `SELECT * FROM profile_tb where id = '${req.body.id}' AND password = '${req.body.password}'`;
    connection.query(sql_syntax, (err, data)=>{
        if(data.length!=0){
            res.render('dashboard', { status: 'loggedIn', data: data[0], mobile: null});
        }
        else {
            res.render('index', { status: 'password_err', id: req.body.id, mobile: null});
        }
        // console.log(data[0])
    })
});

//rendering into profile edit
epic.post('/detail_info', (req, res)=>{
    firstname = req.body.firstname
    lastname = req.body.lastname
    mobile = req.body.mobile
    id = req.body.id

    sql_update_syntax = `UPDATE profile_tb SET firstname = '${firstname}', lastname = '${lastname}', mobile = '${mobile}' WHERE id='${id}'`;
    connection.query(sql_update_syntax, (err, data)=>{
        console.log(err)

        // select data updated
        sql_syntax = `SELECT * FROM profile_tb where id = '${id}' `;
        connection.query(sql_syntax, (err, data)=>{
        // console.log(data[0])
        res.render('dashboard', { status: 'updated', data: data[0]});
    })
        
    })
});

// logout
epic.get('/logout', (req, res)=>{
    res.redirect('/')
});
