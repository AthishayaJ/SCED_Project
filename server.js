//importing express framework
const dotenv = require('dotenv').config(); //For using env variables
const express = require('express');
const mongoose = require('mongoose'); //it's like a library to use mongoDB as easy
const {post_Item, get_Item,update_Item,delete_Item} = require('./Controllers/TodoController');

//Importing port number from the env file
const PORT = process.env.PORT || 3000;

//Creating an instance of the express
const app = express();
app.use(express.json()) //it will automatically decode json object in req

//connecting the mongoDB
mongoose.connect(process.env.MONGODB_URL)
.then(() =>{
    console.log("Data Base is Connected!");
})
.catch((err) =>{
    console.log(err);
})


//to post things and get things
app.route('/todos').post(post_Item).get(get_Item)

//to update and delete things
app.route('/todos/:id').put(update_Item).delete(delete_Item)

app.listen(PORT,() =>{
    console.log("Server is started on port: ",PORT);
})

//nodemon for automatically restart the server whenever there's a change in the file