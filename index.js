require('dotenv').config()
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const venom = require('venom-bot');

//APP config
const app = express()
app.use(express.json())
app.use(express.urlencoded())
app.use(cors())

const PORT = process.env.PORT || 9000;


//DB config
mongoose.connect('mongodb+srv://wareminder12345:wareminder12345@cluster0.tzhfk.mongodb.net/wa_reminder?retryWrites=true&w=majority', {
    useNewUrlParser:true,
    useCreateIndex:true,
    useUnifiedTopology:true,
    useFindAndModify:false
}, () => console.log("DB connected"))
const reminderSchema = new mongoose.Schema({
    reminderMsg: String,
    remindAt: String,
    isReminded: Boolean
})
const Reminder = new mongoose.model("reminder", reminderSchema)

//Whatsapp reminding functionality

venom
.create()
.then((client) => start(client))
.catch((erro) => {
    console.log(erro);
});

function start(client) {
setInterval(() => {
    console.log("here");
    Reminder.find({}, (err, reminderList) => {
        if(err) {
            console.log(err)
        }
        if(reminderList){
            reminderList.forEach(reminder => {
                if(!reminder.isReminded){
                    const now = new Date()
                    if((new Date(reminder.remindAt) - now) < 0) {
                        Reminder.findByIdAndUpdate(reminder._id, {isReminded: true}, (err, remindObj)=>{
                            if(err){
                                console.log(err)
                            }
                            client.sendText('923352999478@c.us', reminder.reminderMsg).then((result) => {
                                console.log('Result: ', result); //return object success
                              })
                              .catch((erro) => {
                                console.error('Error when sending: ', erro); //return object error
                              });
                        })
                    }
                }
            })
        }
    })
},1000);

}


//API routes
app.get("/getAllReminder", (req, res) => {
    Reminder.find({}, (err, reminderList) => {
        if(err){
            console.log(err)
        }
        if(reminderList){
            res.send(reminderList)
        }
    })
})
app.post("/addReminder", (req, res) => {
    const { reminderMsg, remindAt } = req.body
    const reminder = new Reminder({
        reminderMsg,
        remindAt,
        isReminded: false
    })
    reminder.save(err => {
        if(err){
            console.log(err)
        }
        Reminder.find({}, (err, reminderList) => {
            if(err){
                console.log(err)
            }
            if(reminderList){
                res.send(reminderList)
            }
        })
    })

})
app.post("/deleteReminder", (req, res) => {
    Reminder.deleteOne({_id: req.body.id}, () => {
        Reminder.find({}, (err, reminderList) => {
            if(err){
                console.log(err)
            }
            if(reminderList){
                res.send(reminderList)
            }
        })
    })
})

app.listen(PORT, () => console.log("Be started"))
