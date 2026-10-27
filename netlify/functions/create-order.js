// Prices live on the SERVER so customers can't change them in the browser.
// Keep ids/prices in sync with the product list in index.html (const P).
const PRODUCTS = {
  1:["Sunday Cook's Paradox",1299],2:["3 PM Slump",1299],3:["Post-Lunch Coma",1199],4:["Chutney Commitment",1199],
  5:["The Golgappa Game",1299],6:["The Art of Chai",1199],7:["Biryani Bliss",1299],8:["Vada Pav Vibe",1199],
  9:["Pav Bhaji Power",1299],10:["Lassi Love",1199],11:["The Coffee Hustle",1199],12:["Spice War",1299],
  13:["Midnight Fridge Raid",1299],14:["Maggi Takes 10 Minutes",1399],15:["Carb Therapy Club Hoodie",2499],16:["Cozy Spice Hoodie",2699]
};
const reply = (code, obj) => ({ statusCode: code, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return reply(405, { error: "Method not allowed" });
  try {
    const { items, customer } = JSON.parse(event.body || "{}");
    if (!Array.isArray(items) || !items.length || items.length > 30) throw new Error("Invalid cart");
    let amount = 0; const lines = [];
    for (const i of items) {
      const p = PRODUCTS[i.id], q = parseInt(i.q, 10);
      if (!p || !(q > 0 && q <= 10)) throw new Error("Invalid item in cart");
      amount += p[1] * q; lines.push(`${p[0]} (${String(i.s).slice(0, 4)}) x${q}`);
    }
    const c = customer || {};
    const notes = {
      name: String(c.name || "").slice(0, 100), phone: String(c.phone || "").slice(0, 15), email: String(c.email || "").slice(0, 100),
      address: `${c.address || ""}, ${c.city || ""} ${c.pincode || ""}`.slice(0, 250), items: lines.join("; ").slice(0, 250)
    };
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
    const r = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify({ amount: amount * 100, currency: "INR", receipt: "ftm_" + Date.now(), notes })
    });
    const o = await r.json();
    if (!r.ok) throw new Error((o.error && o.error.description) || "Razorpay error");
    return reply(200, { orderId: o.id, amount: o.amount, key: process.env.RAZORPAY_KEY_ID });
  } catch (e) { return reply(400, { error: e.message }); }
};
