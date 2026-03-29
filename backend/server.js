require("dotenv").config()
const app = require('./src/app');
const connectDB = require('./src/db/db');


const PORT =  3000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("connected to server");
    });
});