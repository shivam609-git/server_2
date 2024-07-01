const mongoose= require("mongoose")
const bcrypt = require('bcryptjs');

const newSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
},
{
    collection: "User",
  })



// Hash the password before saving the user
newSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
  
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(this.password, salt);
      this.password = hashedPassword;
      next();
    } catch (error) {
      next(error);
    }
  });
  
  // Method to compare the entered password with the hashed password
  newSchema.methods.comparePassword = function(enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
  };

const User = mongoose.model("User",newSchema)



module.exports=User