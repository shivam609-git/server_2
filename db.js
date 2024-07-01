const mongoose = require("mongoose")

const ImageDetailsScehma = new mongoose.Schema(
    {
     image:String,
     text:  String ,
     boldWords: [String],
    },
    {
      collection: "ImageDetails",
    }
  );
  
  const ImageDetails = mongoose.model("ImageDetails", ImageDetailsScehma);

  module.exports = ImageDetails;