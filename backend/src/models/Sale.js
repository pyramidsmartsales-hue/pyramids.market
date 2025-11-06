const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const SaleSchema = new Schema({
  items:[{
    product:{type:Schema.Types.ObjectId, ref:'Product'},
    name:String,
    qty:Number,
    price:Number
  }],
  subTotal:Number,
  tax:Number,
  discount:Number,
  total:Number,
  paymentMethod:{type:String, enum:['Cash','M-Pesa','Bank']},
  customer:{type:Schema.Types.ObjectId, ref:'Client'},
  timestamp:{type:Date, default:Date.now}
});
module.exports = mongoose.model('Sale', SaleSchema);
