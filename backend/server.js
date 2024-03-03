require('dotenv').config();

const mongoose = require('mongoose')
const express = require('express')

const User = require('./models/User.js')
const Prompt = require('./models/Prompt.js')

const cors = require('cors');

const app = express();

app.use(cors({ origin: true, credentials: true }));

app.use(express.json({ extended: false }));
app.use(express.urlencoded({ extended: true }));

const uri = 'mongodb+srv://pravir:WKvJ3k0eiHTfKZmx@maincluster.wmp8a5t.mongodb.net/?retryWrites=true&w=majority';

const conn = mongoose.createConnection(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.listen(8000,() => {
    console.log("Server started on port 8000")
})

async function connect(){

    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");
    } 
    
    catch (error){
        console.error(error);
    }
}

connect();


app.post('/login', async (req, res) => {

    try {
        console.log(req.body.username);
        let username = req.body.username;
        const tempUser = await User.findOne({username: req.body.username});
        if(!tempUser){
            User.create(req.body);
        }

        res.send({accessToken: username});

    }
    catch(err){
        console.log(err);
    }
});

app.post('/add-user', async (req,res)=>{
    User.create(req.body)
        .then((result) =>{
            res.send(result);
        })
        .catch((err)=>{
            console.log(err);
        });
})

app.get('/get-users', async (req, res) => {
    try {
        const potentialUsers = await User.find({});
        console.log(potentialUsers);
        console.log(potentialUsers.length)
        res.send(potentialUsers);
        
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/get-user', async(req, res) => {
    const userFound = await User.findOne({username: req.body.username});
    if(userFound){
        res.send(userFound);
    }
    else{
        console.log('User not found');
    }
});

app.delete('/delete-users', async (req,res) =>{

    try {
        const result = await(User.deleteMany())
        res.send(result)
    } catch (err) {
        console.log(err);
    }

})


app.post('/user/add-prompt', async (req, res) => {
    const { prompt, college, username } = req.body;

    try {
        const newPrompt = new Prompt({
            prompt,
            college,
            username
        });     
        const savedPrompt = await newPrompt.save();   
        const updatedUser = await User.findOneAndUpdate(
            { username: username },
            { $push: { essayPrompts: savedPrompt._id } },
            { new: true }
        ).populate('essayPrompts');

        if (!updatedUser) {
            return res.status(404).send({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Prompt added successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Error adding prompt to user in database', error: error.message });
    }
});