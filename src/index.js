const express = require("express");
const app = express();
const path = require("path");
const hbs = require("hbs");
const {collection,collection1,collection2,collection3}=require("./mongodb");
const mongodb=require("mongodb")
const templatePath = path.join(__dirname, "../templates");
app.use(express.json());
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const moment = require("moment");


const exphbs = require('express-handlebars');



app.set("view engine", "hbs");
app.set("views", templatePath);
app.use(express.urlencoded({ extended: false }));
app.use(express.static('../public'));


app.get("/", (req, res) => {
    res.render("index");
});
app.get("/student", (req, res) => {
    res.render("student");
});
app.get("/faculty", (req, res) => {
    res.render("faculty");
});
app.get("/parent", (req, res) => {
    res.render("parent");
});
app.get("/viewattendance", async (req, res) => {
  const subject=req.query.subject;
  
  res.render("viewattendance",{subject})
});

app.get("/attendance", async (req, res) => {
  const subject = req.query.subject; 
  res.render("attendance", { subject }); 
});

app.get("/index",async(req,res)=>{
  res.render("index")
})

app.get("/editattendance",async (req, res) => {
  res.render("editattendance");
});




const dayjs = require('dayjs');



app.post("/viewattendance", async (req, res) => {
  try {
    const targetDate = dayjs(req.body.date, 'DD/MM/YYYY', true);
    if (!targetDate.isValid()) {
      throw new Error('Invalid date format');
    }
    const formattedDate = targetDate.format('DD/MM/YYYY');
    const subject=req.body.subject;
    const period=req.body.period;
    
    
    const attendanceRecords = await collection3.find({ date: formattedDate ,subject:subject ,period:period}, 'name attendance').sort({ name: 1 });
    
    res.render("viewattendance", { attendanceRecords,subject });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving attendance");
  }
});

  
app.get("/postattendance",async(req,res)=>{
  const subject = req.query.subject;
    const assignments=await collection.find({},'name').sort({ name: 1 });
    res.render("postattendance",{assignments ,subject});
})

app.get("/editattendance/:id", async (req, res) => {
    try {
      const id = req.params.id;
      
  
      const attendanceRecord = await collection3.findById(id);
      const subject=attendanceRecord.subject;
      
      if (!attendanceRecord) {
        res.status(404).send("Attendance record not found");
        return;
      }
  
      res.render("editattendance", { attendanceRecord ,subject});
    } catch (error) {
      console.error(error);
      res.status(500).send("Error retrieving attendance record");
    }
  });
  
  app.post("/editattendance/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const { attendance } = req.body;
  
      const attendanceRecord = await collection3.findById(id);
      
      const subject=attendanceRecord.subject;
      
      if (!attendanceRecord) {
        res.status(404).send("Attendance record not found");
        return;
      }
  
      attendanceRecord.attendance = attendance;
      await attendanceRecord.save();
      res.render("viewattendance",{subject})
    } catch (error) {
      console.error(error);
      res.status(500).send("Error updating attendance record");
    }
  });
  
 



  app.post("/postattendance", async (req, res) => {
    try {
        const attendanceRecords = req.body.present || [];
        const absentRecords = req.body.absent || [];
        const currentDate = moment().format("DD/MM/YYYY");
        const subject = req.body.subject;
        const period = req.body.period;

        if (attendanceRecords.length > 0 || absentRecords.length > 0) {
            const existingRecords = await collection3.find({
                subject: subject,
                period: period,
                date: currentDate,
            });

            if (existingRecords.length === 0) {
                await Promise.all(
                    attendanceRecords.map(async (name) => {
                        const attendanceRecord = new collection3({
                            name: name,
                            attendance: "present",
                            date: currentDate,
                            subject: subject,
                            period: period,
                        });
                        await attendanceRecord.save();
                    })
                );

                if (absentRecords.length > 0) {
                    await Promise.all(
                        absentRecords.map(async (name) => {
                            const absentRecord = new collection3({
                                name: name,
                                attendance: "absent",
                                date: currentDate,
                                subject: subject,
                                period: period,
                            });
                            await absentRecord.save();
                        })
                    );
                }

                
                res.send(`<script> window.location='/postattendance?subject=${subject}'; alert('Attendance recorded successfully!'); </script>`);
               
            } else {
                res.send(`<script> window.location='/postattendance?subject=${subject}'; alert('Attendance for this period and date already exists.');</script> `);
                
                
            }
        } else {
            res.send(` <script> window.location='/postattendance?subject=${subject}'; alert('No attendance records to process.');</script> `);
        }
    } catch (error) {
        console.error(error);
        res.send(`<script> window.location='/postattendance?subject=${subject}'; alert('Error recording attendance');</script>`);
    }
});






app.post("/student", async (req, res) => {
  try {
    const student = await collection.findOne({ name: req.body.name });
    
    if (student && student.password === req.body.password) {
      const studentData = await collection3.find({ name: student.name });

      const groupedData = {};
      studentData.forEach(data => {
        if (!groupedData[data.date]) {
          groupedData[data.date] = {};
        }
        
        const attendance = data.attendance === 'present' ? 'P' : 'A';
        groupedData[data.date][data.period] = attendance;
      });

      const studentname = student.name;

      
      const totalPeriods = 6; 
      let absentPeriods = 0;
      for (const date in groupedData) {
        for (const period in groupedData[date]) {
          if (groupedData[date][period] === 'A') {
            absentPeriods++;
          }
        }
      }
      const attendancePercentage = 100-(((absentPeriods / (totalPeriods * Object.keys(groupedData).length)) * 100).toFixed(2));

      res.render("studentview", { studentData: studentData, studentname, groupedData, attendancePercentage });
    } else {
      res.redirect('student');
    }
  } catch (error) {
    console.error(error);
    res.send("Invalid Student User");
  }
});





  

app.post("/faculty", async (req, res) => {
  try {
    const faculty = await collection1.findOne({ fname: req.body.fname });
    if (faculty.fpassword === req.body.fpassword) {
      const subject = faculty.subject; 
      res.redirect(`/attendance?subject=${subject}`); 
    } else {
      res.redirect("/faculty");
    }
  } catch {
    res.send("Invalid Faculty User");
  }
});




app.post("/parent", async (req, res) => {
  try {
    const student = await collection2.findOne({ pname: req.body.pname });
    
    if (student && student.ppassword === req.body.ppassword) {
      const studentname = student.pname.slice(0, -1);
      const studentData = await collection3.find({ name: studentname });

      const groupedData = {};
      studentData.forEach(data => {
        if (!groupedData[data.date]) {
          groupedData[data.date] = {};
        }
        const attendance = data.attendance === 'present' ? 'P' : 'A';
        groupedData[data.date][data.period] = attendance;
      });

      

      const totalPeriods = 6; 
      let absentPeriods = 0;
      for (const date in groupedData) {
        for (const period in groupedData[date]) {
          if (groupedData[date][period] === 'A') {
            absentPeriods++;
          }
        }
      }
      const attendancePercentage = 100-(((absentPeriods / (totalPeriods * Object.keys(groupedData).length)) * 100).toFixed(2));

      res.render("studentview", { studentData: studentData, studentname, groupedData, attendancePercentage });
    } else {
      res.redirect('student');
    }
  } catch (error) {
    console.error(error);
    res.send("Invalid Student User");
  }
});


app.listen(3000,()=>{
    console.log("Port Connected")
})