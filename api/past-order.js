import { AsyncDatabase } from "promised-sqlite3";

let db;
async function getDb() {
  if (!db) db = await AsyncDatabase.open("./pizza.sqlite");
  return db;
}

export default async function handler(req, res) {
  const orderId = req.query.order_id;
  try {
    const db = await getDb();
    const order = await db.get(
      "SELECT order_id, date, time FROM orders WHERE order_id = ?",
      [orderId]
    );
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    const orderItems = await db.all(
      `SELECT 
        t.pizza_type_id as pizzaTypeId, t.name, t.category, t.ingredients as description, o.quantity, p.price, o.quantity * p.price as total, p.size
      FROM 
        order_details o
      JOIN
        pizzas p
      ON
        o.pizza_id = p.pizza_id
      JOIN
        pizza_types t
      ON
        p.pizza_type_id = t.pizza_type_id
      WHERE 
        order_id = ?`,
      [orderId]
    );
    const formattedOrderItems = orderItems.map((item) =>
      Object.assign({}, item, {
        image: `/public/pizzas/${item.pizzaTypeId}.webp`,
        quantity: +item.quantity,
        price: +item.price,
      })
    );
    const total = formattedOrderItems.reduce(
      (acc, item) => acc + item.total,
      0
    );
    res.status(200).json({
      order: Object.assign({ total }, order),
      orderItems: formattedOrderItems,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
}
