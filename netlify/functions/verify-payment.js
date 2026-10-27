const crypto = require("crypto");
exports.handler = async (event) => {
  try {
    const { razorpay_order_id: o, razorpay_payment_id: p, razorpay_signature: s } = JSON.parse(event.body || "{}");
    const exp = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(o + "|" + p).digest("hex");
    const ok = !!s && exp.length === s.length && crypto.timingSafeEqual(Buffer.from(exp), Buffer.from(s));
    return { statusCode: ok ? 200 : 400, body: JSON.stringify({ verified: ok }) };
  } catch (e) { return { statusCode: 400, body: JSON.stringify({ verified: false }) }; }
};
