const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require("mongoose");
const { Schema, model} = mongoose;
const bodyParser = require("body-parser");
const res = require('express/lib/response');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}
);

const userSchema = new Schema({
  username: {type: String, required: true},

})

const exerciseSchema = new Schema({
  description: String,
  duration: Number,
  date: Date,
  id: String
});

const Exercise = model("Exercise", exerciseSchema);
const User = model("User", userSchema);
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(bodyParser.urlencoded({extended: true}));
app.post("/api/users", (req, res) => {
  const newUser =  new User({username: req.body.username});
  newUser.save().then(({username, _id}) => res.json({username, _id})).catch(err => console.log(err));
})

app.get("/api/users", (req, res) => {
  User.find({}).then(data => {
    const array = [];
    data.forEach(i => {
      const {username, _id} = i; 
      array.push({username, _id});
    })
    res.json(array);
  })
})

app.post("/api/users/:_id/exercises", async (req, res) => {
  const user = await User.findOne({_id: req.params._id});
  const {username, _id} = user;
  if (!req.body.date)
  {
    const exercise = new Exercise({description: req.body.description, duration: parseInt(req.body.duration), date: new Date(), id: req.params._id});
    exercise.save().then(() => 
        {res.json({username, description: req.body.description, duration: parseInt(req.body.duration), date: new Date().toDateString(), _id});}
    );
  }
  else
  {
    const exercise = new Exercise({description: req.body.description, duration: parseInt(req.body.duration), date: new Date(req.body.date), id: req.params._id});
    exercise.save().then(() => {
    res.json({username, description: req.body.description, duration: parseInt(req.body.duration), date: new Date(req.body.date).toDateString(), _id});
    });
  }
  user.save();
})

app.get("/api/users/:_id/logs", async (req, res) => {
  const {from, to, limit} = req.query;
  let conditions = {id: req.params._id};
  if (from || to)
  {
    conditions.date = {};
    if (from) conditions.date.$gte = new Date(from);
    if (to) conditions.date.$lte = new Date(to);
  }
  const number = await (await Exercise.find({id: req.params._id})).length;
  console.log(number);
  console.log(conditions)
  console.log(limit);
  User.findOne({_id: req.params._id}).then(data => {
    Exercise.find(conditions).limit(+limit ?? 50).then(info => {
      res.json({
        username: data.username,
        _id: data._id,
        count: number,
        log: info.map(e => {
          return {
            description: e.description,
            duration: e.duration,
            date: e.date.toDateString()
          }
        })
      })
    }).catch(err => console.log(err))
}).catch(err => console.log(err))
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
