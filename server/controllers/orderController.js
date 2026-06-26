import Order from '../models/Order.js';
import Brand from '../models/Brand.js';
import Setting from '../models/Setting.js';
import Product from '../models/Product.js';
import Stripe from 'stripe';
import { sendOrderConfirmationEmail, sendNewOrderNotification } from '../utils/emailService.js';

// Remove global stripe init to support dynamic keys
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create order
export const createOrder = async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress, paymentMethod } = req.body;

    const normalizedItems = items.map(item => ({
      productId: item.productId || item.id || item._id,
      quantity: item.quantity || item.qty || 1,
      price: typeof item.price === 'string' ? parseFloat(item.price.replace(/[Rs. ,]/g, "")) : item.price
    }));

    const order = new Order({
      userId: req.user._id,
      items: normalizedItems,
      totalAmount,
      shippingAddress,
      paymentMethod,
    });

    await order.save();
    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user orders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).populate('items.productId');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.productId');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update order status (admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus, paymentStatus },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order updated successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: 'cancelled' },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// STRIPE: Create Checkout Session
export const createCheckoutSession = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    console.log('createCheckoutSession called by user:', req.user?.email || req.user?._id);
    console.log('Payload items:', JSON.stringify(items));
    console.log('Payload shippingAddress:', JSON.stringify(shippingAddress));
    const origin = req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173';

    if (!items || items.length === 0) {
      console.warn('createCheckoutSession: no items provided');
      return res.status(400).json({ message: 'No items in cart' });
    }

    // 1. Enrich items with data from DB if name/price is missing (handles stale cart data)
    for (const [idx, item] of items.entries()) {
      if (!item.name || (!item.price && item.price !== 0)) {
        const productId = item.id || item._id || item.productId;
        if (productId) {
          try {
            const dbProduct = await Product.findById(productId);
            if (dbProduct) {
              if (!item.name) item.name = dbProduct.name;
              if (!item.price && item.price !== 0) item.price = dbProduct.price;
              if (!item.image && dbProduct.images?.length > 0) {
                item.image = dbProduct.images[0];
              }
            }
          } catch (lookupErr) {
            console.warn(`Could not look up product for item ${idx}:`, lookupErr.message);
          }
        }
      }
    }

    // 2. Validate items after enrichment
    for (const [idx, item] of items.entries()) {
      if (!item.name) {
        console.warn(`Item at index ${idx} missing name:`, item);
        return res.status(400).json({ message: `Item at index ${idx} is missing a name` });
      }
      if (!item.price && item.price !== 0) {
        console.warn(`Item at index ${idx} missing price:`, item);
        return res.status(400).json({ message: `Item at index ${idx} is missing a price` });
      }
    }

    const lineItems = items.map((item) => {
      // Safe price parsing
      const priceVal = typeof item.price === 'string'
        ? parseFloat(item.price.replace(/[Rs. ,]/g, ""))
        : item.price;

      const imageUrl = item.image || (item.images && item.images[0]) || "";
      const finalImage = imageUrl && imageUrl.startsWith('http') ? imageUrl : (imageUrl ? `http://localhost:5005/uploads/${imageUrl}` : "");
      const itemQty = item.qty || item.quantity || 1;

      return {
        price_data: {
          currency: 'pkr',
          product_data: {
            name: item.name,
            images: [finalImage || "https://via.placeholder.com/150"],
          },
          unit_amount: Math.round((priceVal || 0) * 100), // Stripe expects amounts in cents
        },
        quantity: itemQty,
      };
    });

    // 2. Create a 'pending' order in our DB first
    const order = new Order({
      userId: req.user._id,
      items: items.map(i => {
        const p = typeof i.price === 'string' ? parseFloat(i.price.replace(/[Rs. ,]/g, "")) : i.price;
        const q = i.qty || i.quantity || 1;
        return {
          productId: i.id || i._id,
          quantity: q,
          price: p || 0
        };
      }),
      totalAmount: items.reduce((sum, item) => {
        const p = typeof item.price === 'string' ? parseFloat(item.price.replace(/[Rs. ,]/g, "")) : item.price;
        const q = item.qty || item.quantity || 1;
        return sum + (p || 0) * q;
      }, 0),
      shippingAddress,
      paymentMethod: 'credit_card',
      paymentStatus: 'pending',
    });

    await order.save();


    // 3. Get Stripe Key from Database
    const settings = await Setting.findOne();
    if (!settings || !settings.stripeSecretKey) {
      return res.status(500).json({ message: "Stripe is not configured. Please contact support." });
    }

    const stripe = new Stripe(settings.stripeSecretKey);

    // 4. Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
      cancel_url: `${origin}/checkout/payment?cancelled=true`,
      metadata: {
        orderId: order._id.toString(),
      },
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error('Stripe Session Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// STRIPE: Verify Payment
export const verifyPayment = async (req, res) => {
  try {
    const { session_id, order_id } = req.query;

    if (!session_id || !order_id) {
      return res.status(400).json({ message: 'Session ID and Order ID are required' });
    }


    // 1. Get Stripe Key
    const settings = await Setting.findOne();
    if (!settings || !settings.stripeSecretKey) {
      return res.status(500).json({ message: "Stripe configuration missing." });
    }
    const stripe = new Stripe(settings.stripeSecretKey);

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      const order = await Order.findByIdAndUpdate(
        order_id,
        { paymentStatus: 'completed', orderStatus: 'processing' },
        { new: true }
      ).populate('items.productId').populate('userId', 'email name');

      // 📧 SEND CONFIRMATION EMAIL TO CUSTOMER
      if (order && order.userId?.email) {
        await sendOrderConfirmationEmail(order.userId.email, order);
      }

      // 📧 SEND NOTIFICATION TO ADMIN
      await sendNewOrderNotification('221400060@gift.edu.pk', order, 'admin');

      // 📧 SEND NOTIFICATION TO BRAND OWNERS
      // 1. Group items by Brand ID
      const brandItems = {};
      order.items.forEach(item => {
        if (item.productId?.brand) {
          const brandId = item.productId.brand.toString();
          if (!brandItems[brandId]) brandItems[brandId] = [];
          brandItems[brandId].push(item);
        }
      });

      // 2. Fetch Brand details (email) & Send
      for (const brandId in brandItems) {
        const brand = await Brand.findById(brandId);
        if (brand && brand.businessEmail) {
          // Send only items relevant to this brand
          const brandOrder = { ...order.toObject(), items: brandItems[brandId] };
          await sendNewOrderNotification(brand.businessEmail, brandOrder, 'brand');
        }
      }

      // 📉 DECREMENT STOCK
      if (order && order.items) {
        for (const item of order.items) {
          if (item.productId) {
            await Product.findByIdAndUpdate(item.productId._id || item.productId, {
              $inc: { stock: -item.quantity }
            });
          }
        }
      }

      return res.json({ success: true, order });
    } else {
      return res.json({ success: false, message: 'Payment not completed' });
    }

  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ message: error.message });
  }
};
