import { AsyncDatabase } from "promised-sqlite3";

let db;
async function getDb() {
  if (!db) db = await AsyncDatabase.open("./pizza.sqlite");
  return db;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const db = await getDb();
  const { cart } = req.body;

  const now = new Date();
  const time = now.toLocaleTimeString("en-US", { hour12: false });
  const date = now.toISOString().split("T")[0];

  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    res.status(400).json({ error: "Invalid order data" });
    return;
  }

  try {
    await db.run("BEGIN TRANSACTION");
    const result = await db.run(
      "INSERT INTO orders (date, time) VALUES (?, ?)",
      [date, time]
    );
    const orderId = result.lastID;
    const mergedCart = cart.reduce((acc, item) => {
      const id = item.pizza.id;
      const size = item.size.toLowerCase();
      if (!id || !size) {
        throw new Error("Invalid item data");
      }
      const pizzaId = `${id}_${size}`;
      if (!acc[pizzaId]) {
        acc[pizzaId] = { pizzaId, quantity: 1 };
      } else {
        acc[pizzaId].quantity += 1;
      }
      return acc;
    }, {});
    for (const item of Object.values(mergedCart)) {
      const { pizzaId, quantity } = item;
      await db.run(
        "INSERT INTO order_details (order_id, pizza_id, quantity) VALUES (?, ?, ?)",
        [orderId, pizzaId, quantity]
      );
    }
    await db.run("COMMIT");
    res.status(200).json({ orderId });
  } catch (error) {
    await db.run("ROLLBACK");
    res.status(500).json({ error: "Failed to create order" });
  }
}
