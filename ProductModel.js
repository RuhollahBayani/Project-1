const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
    productName: {
        type: String
    },
    productModel: {
        type: String
    },
    price: {
        type: Number
    },
    properties: {
        type: String
    }
}
);

const productModel = mongoose.model('products', productSchema);

module.exports = productModel;