import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type:String,
            required: true,
        },
        email:{
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            minlength:6,
        },
        bio: {
            type: String,
            default: "",
        },
        profilePic: {
            type: String,
            default: "",
        },
        nativeLanguage: {
            type: String,
            default: "",
        },
        learningLanguage: {
            type: String,
            default: "",
        }, 
        location: {
            type: String,
            default: "",
        },
        isOnboarded: {
            type: Boolean,
            default: false,
        },
        friends: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ]   // Yeh ek list hai jisme user ke friends ka ID save hoga (yeh bhi User hi honge).
}, {timestamps:true});

//pre hook
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next(); // nhi hua
    try { // hua hai
        const salt = await bcrypt.genSalt(10);  
        this.password = await bcrypt.hash(this.password, salt);
        next(); //Thik hai bhai, ab user ko DB me save kar do
    } catch (error) {
        next(error);
    }
});

// this checks entered password is correct or matches with db password.
userSchema.methods.matchPassword = async function (enteredPassword) {
    const isPasswordCorrect = await bcrypt.compare(enteredPassword, this.password);
    return isPasswordCorrect;
}

const User = mongoose.model("User", userSchema); // model ka nam diya "User => users ab isse CRUD kr skte ho"

export default User;