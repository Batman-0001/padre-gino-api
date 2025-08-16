import { AsyncDatabase } from "promised-sqlite3";

let db;
async function getDb() {
  if (!db) db = await AsyncDatabase.open("./pizza.sqlite");
  return db;
}

export default async function handler(req, res) {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  try {
    const db = await getDb();
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const pastOrders = await db.all(
      "SELECT order_id, date, time FROM orders ORDER BY order_id DESC LIMIT 10 OFFSET ?",
      [offset]
    );
    res.status(200).json(pastOrders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch past orders" });
  }
}
