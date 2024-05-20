const mongoose=require("mongoose")
const mongoURI = 'mongodb://127.0.0.1:27017/attendance';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(()=>{
    console.log("Mongo db connected")
})
.catch(()=>{
    console.log("failed")
})

const LoginSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
    
   
})

const facultySchema=new mongoose.Schema({
    fname:{
        type:String,
        required:true
    },
    fpassword:{
        type:String,
        required:true
    },
    subject:{
        type:String,
        required:false
    }
})

const parentSchema=new mongoose.Schema({
    pname:{
        type:String,
        required:true
    },
    ppassword:{
        type:String,
        required:true
    }
})


const attendanceSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    attendance: {
        type: String,
        required: true
      },
      
      date: {
        type: String,
        required: true
      },
      subject:{
        type:String,
        required:true
      },
      period:{
        type:String,
        required:false
      }
    

  });
  



const collection=new mongoose.model("student",LoginSchema)
const collection1=new mongoose.model("faculty",facultySchema)
const collection2=new mongoose.model("parent",parentSchema)
const collection3=new mongoose.model("attendance",attendanceSchema)

module.exports={collection,collection1,collection2,collection3}
