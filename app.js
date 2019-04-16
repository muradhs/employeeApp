const express = require('express');
const cors = require('cors');
const multer  = require('multer');
const app =express();
const path =require('path');
const bodyParser = require('body-parser');
const fs =require('fs');
app.use(cors());
app.use(express.static('public'));
const currentUrl="http://192.168.9.189:3000";//Change this url to a the url where the app is running
const sqlite3 = require('sqlite3').verbose();
const empdb ='./database/remcoEmployee.db';
const itDB ='./database/remcoIt.db';
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
 
//Image storage

let modifiedName;
let uploadedFileName;
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images')
  },
  filename: function (req, file, cb) {
    modifiedName =Date.now()+'-'+file.originalname;
    uploadedFileName =file.originalname;
    cb(null,modifiedName )
  }
})
 
const upload = multer({ storage: storage });


//The root page
app.get('/',(req,res)=>{
  
  

    res.render(__dirname + '/public/index.html');

});
//Admin page 
app.get('/admin',(req,res)=>{
  
  

  res.sendFile(path.join(__dirname + '/public/admin.html'));

});

// /employees returns all employees
app.get("/employees2", (req,res)=>{

  let sql=`SELECT  e.id , e.firstName, e.lastName,e.extension,e.phone,e.position,
  d.deptName,l.locName ,e.email,e.imgUrl,e.fullName FROM Employee as e
  INNER JOIN Department as d on e.department = d.deptId 
  INNER JOIN Location as l on e.location =locId`;

  let db = new sqlite3.Database(empdb);

   
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.log(err);
    }
    rows.forEach(function(row) {
      row.imgUrl=currentUrl+'/images/'+row.imgUrl;// building the static url for images
  });
    res.send(rows);
  });
   
  // close the database connection
  db.close();

});


//show create employee page 
app.get('/createEmployees',(req,res)=>{
   
    res.sendFile(path.join(__dirname + '/public/create.html'));
    });

//Delete an employee
 app.post('/delete',(req,res)=>{
 // open a database connection
let db = new sqlite3.Database(empdb, (err) => {
  if (err) {
    console.error(err.message);
  }
});
 

// delete a row based on id
db.run(`DELETE FROM Employee WHERE id=?`, req.body.id, function(err) {
  if (err) {
    return console.error(err.message);
    
  }
  console.log(`Row(s) deleted ${this.changes}`);
});
 
// close the database connection
db.close((err) => {
  if (err) {
    return console.error(err.message);
  }
});

//delete the image file too 
//get the disk path of image
let f= req.body.imgUrl.split('/');
let filePath ='./public/'+f[f.length-2]+'/'+f[f.length-1];
fs.unlink(filePath, function (err) {
  if (err) console.log(filePath +"Could not be found");
  // if no error, file has been deleted successfully
  console.log('File deleted!');
}); 
console.log(req.body.id);
res.redirect("/admin");

 });
// Edit an employee 
app.post('/edit',upload.single('avatar'),(req,res) =>{

const _firstName = req.body.firstName;
const _lastName=req.body.lastName; 
const _middleName =req.body.middleName;
const _department =req.body.department;
const _location =req.body.location;
const _extension =req.body.extension;
const _phone =req.body.phone;
const _email =req.body.email;
let _imgUrl;
const _position =req.body.position;
const _id =req.body.id;
const _oldImage=req.body.imgUrl;
let f= _oldImage.split('/');
let filePath ='./public/'+f[f.length-2]+'/'+f[f.length-1];
let oldImageName='/'+f[f.length-1];
//Delete old image 
if(modifiedName){

fs.unlink(filePath, function (err) {
  if (err) console.log("Error Occured");
  // if no error, file has been deleted successfully
  console.log('Old File deleted!');
})
_imgUrl =modifiedName;
}
else // if no file is selected retain the original file
_imgUrl=oldImageName;
//connect to data base 

let db = new sqlite3.Database(empdb, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the Remco Employee database.');
});

let data=[_firstName,_lastName,_middleName,_extension,_phone,_position,_department,_location,_imgUrl,_email,_id];
let sql=`UPDATE Employee SET firstName=?,lastName=?,middleName=?,extension=?,phone=?,position=?,department=?,location=?,imgUrl=?,email=? WHERE id=?`
// update user 
db.run(sql
, data, function(err) {
  if (err) {
    return console.log(err.message);
  }
  // get the last insert id
  console.log(`A row has been updated with rowid ${this.lastID}`);
});

// close the database connection
db.close();   
uploadedFileName=null;
modifiedName=null;
res.redirect('/admin');
});
app.post('/create',upload.single('avatar'),(req,res) =>{

  const _firstName = req.body.firstName;
  const _lastName=req.body.lastName; 
  const _middleName =req.body.middleName;
  const _department =req.body.department;
  const _location =req.body.location;
  const _extension =req.body.extension;
  const _phone =req.body.phone;
  const _email =req.body.email;
  const _imgUrl =modifiedName;
  const _position =req.body.position;
    
  
  
  //connect to data base 
  
  let db = new sqlite3.Database(empdb, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the Remco Employee database.');
  });
  
  
  // create employee 
  db.run(`INSERT INTO Employee(firstName,lastName,middleName,extension,phone,position,department,location,imgUrl,email) 
  VALUES(?,?,?,?,?,?,?,?,?,?)`, [_firstName,_lastName,_middleName,_extension,_phone,_position,_department,_location,_imgUrl,_email], function(err) {
    if (err) {
      return console.log(err.message);
    }
    // get the last insert id
    console.log(`A row has been inserted with rowid ${this.lastID}`);
  });
  uploadedFileName=null;
  modifiedName=null;
  // close the database connection
  db.close();   
  
  res.sendFile(path.join(__dirname + '/public/record_created.html'));
  });

  app.post('/createComputer',(req,res) =>{

    const _assetId = req.body.assetId;
    const _isActive=req.body.isActive; 
    const _catagory =req.body.catagory;
    const _serial  =req.body.serial;
    const _make=req.body.make;
    const _model =req.body.model;
    const _location=req.body.location;
    const _department=req.body.department;
    const _date =req.body.date;
    const _enteredBy =req.body.enteredBy;
    const _assignedTo= req.body.assignedTo;
    const _replacedWith =req.body.replacedWith
      
    
    
    //connect to data base 
    
    let db = new sqlite3.Database(itDB, sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        console.error(err.message);
      }
      console.log('Connected to the Remco IT database.');
    });
    
    
    // create employee 
    db.run(`INSERT INTO computers(assetId,isActive,catagory,serial,make,model,location,department,date,enteredby,assignedTo,replacedWith) 
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`, [_assetId,_isActive,_catagory,_serial,_make,_model,_location,_department,_date,_enteredBy,_assignedTo,_replacedWith], function(err) {
      if (err) {
        return res.send(err.message);
      }
      // get the last insert id
      console.log(`A row has been inserted with rowid ${this.lastID}`);
      res.redirect("/inventoryComp");
    });
    
    // close the database connection
    db.close();   
   
   // res.sendFile(path.join(__dirname + '/public/record_created.html'));
    });
  
app.get("/allComputers",(req,res)=>{

  let db = new sqlite3.Database(itDB);
 
  let sql = `SELECT *  FROM computers`;
   
  db.all(sql, [], (err, rows) => {
    if (err) {
      throw err;
    }
    
    res.send(rows);
  });
   
  // close the database connection
  db.close();



  });
app.get("/inventoryComp",(req,res)=>{

res.sendFile(path.join(__dirname + '/public/computer.html'));
});
  
app.get("/displayComp",(req,res)=>{

  res.sendFile(path.join(__dirname + '/public/ComputersDisplay.html'));
  });
const port = process.env.PORT || 3000;

app.listen(port,()=>console.log(`Server listening in port ${port}`));