import mongoose, { mongo } from "mongoose";
import { config } from "./app.config";
const connectDatabase=async()=>{
    try{
        
        await mongoose.connect(config.MONGO_URI);
        console.log("Connected to the Database");
    }
    catch(error){
        console.log("Error connecting to the database");
        process.exit(1);
    }
};
export default connectDatabase;
