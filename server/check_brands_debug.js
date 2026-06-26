import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

const Product = mongoose.model('Product', new mongoose.Schema({
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    name: String
}));

const Brand = mongoose.model('Brand', new mongoose.Schema({ name: String }));

const allIds = [
    '698c5af687ca5e644d31f761','698c5b5a87ca5e644d31f771','698c5bc887ca5e644d31f77d',
    '698c6a4e985bd238ffd99da2','698c6b1c985bd238ffd99dc6','698d851e17a1427b5924fa9e',
    '698d85e517a1427b5924faaa','698d869b17a1427b5924fab6','69906ae53dd704b3d33d2777',
    '69906c323dd704b3d33d2783','69906d273dd704b3d33d278f','69906e093dd704b3d33d279b',
    '69906e783dd704b3d33d27a7','69906f293dd704b3d33d27b3','69906fc73dd704b3d33d27bf',
    '6992d59efc27d031c6bf010e','6992eb3154166ac16388401b','6992ec0d54166ac16388403f',
    '6992ed7654166ac16388404b','6992ee8954166ac163884057','6992f4c220a4f81caecc479f',
    '6992f59520a4f81caecc47ab','6992f5fc20a4f81caecc47b7','699a105d703fa8904f2fb7cb',
    '699d3938b6d3e98d225ed3b2','699d39e4b6d3e98d225ed3be','699d43ca7dd0442d89b3b865',
    '699e7ab316ec692d54dde476','699e9cf376ae50254b136ec3','699e9dd376ae50254b136ef6',
    '699eb8f468aedb6487facfa8','69eb9cfe618001547b03aba1','69eb9f6c618001547b03abad',
    '69eba013618001547b03abb9','69eba2df618001547b03ac7e','69eba3cb618001547b03ac8a',
    '69eba45e618001547b03ac96','69eba4cc618001547b03aca2'
];

const products = await Product.find({ _id: { $in: allIds } })
    .populate('brand', 'name')
    .lean();

console.log(`Found ${products.length} / ${allIds.length} products`);
const nullBrands = products.filter(p => !p.brand);
const withBrands = products.filter(p => p.brand);
console.log(`With brand: ${withBrands.length}, Without brand: ${nullBrands.length}`);
console.log('\n--- NULL brand products ---');
nullBrands.forEach(p => console.log(p._id.toString(), p.name));
console.log('\n--- With brand products ---');
withBrands.forEach(p => console.log(p._id.toString(), p.name, '->', p.brand.name));

await mongoose.disconnect();
