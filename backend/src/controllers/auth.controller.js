import { upsertStreamUser } from '../lib/stream.js';
import User from './../models/User.js';
import jwt from "jsonwebtoken";


// SignUp 🛑
export async function signup(req,res) {
   const {email, password,fullName} =  req.body

   try {
    if(!email || !password || !fullName) {
        return res.status(400).json({message: "All fields are required"});
    }

    if (password.length < 6) {
        return res.status(400).json({message: "Password must be atleast 6 characters"});
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(email)) {
  return res.status(400).json({ message: "Invalid email format" });
}

const existingUser = await User.findOne({email});
if(existingUser) {
    return res.status(400).json({message: "Email already exists, please use a different one"});
}

const idx = Math.floor(Math.random() * 100) + 1;  // generate a num. b/w 1-100
const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`

const newUser = await User.create({
    email,
    fullName,
    password,
    profilePic:randomAvatar,
})

// TODO : Create The User In Stream As Well  =  done in stream.js file ✅

try {
    await upsertStreamUser ({
    id: newUser._id.toString(),
    name: newUser.fullName,
    image: newUser.profilePic || "",
});
 console.log(`Stream user created for ${newUser.fullName}`);
} catch (error) {
    console.log("Error creating Stream user:", error);
}
  

const token = jwt.sign({userId:newUser._id}, process.env.JWT_SECRET_KEY, {
    expiresIn: "7d"   // created token for authentication and payload we got userId for using it later on . to know which user has which token
    })

    res.cookie("jwt",token,{ // added token in response
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true, // prevent XSS attacks
        sameSite: "strict", // prevent CSRF attacks
        secure: process.env.NODE_ENV === "production"
    })

    res.status(201).json({success:true, user:newUser}) // send response back to user 
 

   } catch (error) {
    console.log("Error in Signup Controller", error); 
    res.status(500).json({message: "Internal Server Error"});
   } 
} 


// Login 🛑
export async function login(req,res) {
   try {
    const {email,password} = req.body; //when user login they need this

    if(!email || !password) {
        return res.send(400).json({message: "All the fields are required"}); // providing both the fields for login
    }

    // is password and email are valid or not
    const user = await User.findOne({email});
    if(!user) return res.status(401).json({message: "Invalid email or password"});

    // check password is correct or not
    const isPasswordCorrect = await user.matchPassword(password);
    if(!isPasswordCorrect) return res.status(401).json({ message: "Invalid email or password."})


        const token = jwt.sign({userId:user._id}, process.env.JWT_SECRET_KEY, {
    expiresIn: "7d"   // created token for authentication and payload we got userId for using it later on . to know which user has which token
    })

    res.cookie("jwt",token,{ // added token in response
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true, // prevent XSS attacks
        sameSite: "strict", // prevent CSRF attacks , strict = Cookie is only sent if the request is coming from the same site.
        secure: process.env.NODE_ENV === "production"
    });

    res.status(200).json({success: true, user});  
     
   } catch (error) {
    console.log("Error in login controller" , error.message);
    res.status(500).json({message: "Internal server error"});
   }
}

// Logout 🛑
export function logout(req,res) {
    res.clearCookie("jwt");
    res.status(200).json({success: true , message: "Logout Successfully"})
}

//onboard 🛑
export async function onboard (req,res) {
    try {
        const userId = req.user._id

        const {fullName, bio, nativeLanguage, learningLanguage, location} = req.body

        if(!fullName || !bio || !nativeLanguage || !learningLanguage || !location) {
            
            return res.status(400).json({    
                message: "All fields are required",
                missingFields : [
                    !fullName && "fullName",
                    !bio && "bio",
                    !nativeLanguage && "nativeLanguage",
                    !learningLanguage && "learningLanguage",
                    !location && "location",
                ].filter(Boolean),
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            {
            ...req.body,
            isOnboarded: true,
        },
        {new : true}
    );

    if(!updatedUser) return res.status(404).json({message: "Updated User not found"});

    try {
        await upsertStreamUser({
            id: updatedUser._id.toString(),
            name: updatedUser.fullName,
            image: updatedUser.profilePic || "",
        })
        console.log(`Stream user updated after onboarding for ${updatedUser.fullName}`);

    } catch (streamError) {
        console.log("Error updating Stream user during onboarding:", streamError.message);

    }

    res.status(200).json({success: true, user: updatedUser});
    } catch (error) {
        console.log("Onboarding error:", error);
        res.status(500).json({message: "Internal Server Error"});
    }
}