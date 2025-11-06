const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ProductSchema = new Schema({
  name:{type:String, required:true},
  description:String,
  price:{type:Number, required:true},
  category:String,
  imageId:String,
  stock:{type:Number, default:0},
  active:{type:Boolean, default:true},
  createdAt:{type:Date, default:Date.now}
});
module.exports = mongoose.model('Product', ProductSchema);
