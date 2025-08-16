import { AsyncDatabase } from "promised-sqlite3";

let db;
async function getDb() {
  if (!db) db = await AsyncDatabase.open("./pizza.sqlite");
  return db;
}

export default async function handler(req, res) {
  const db = await getDb();
  const orders = await db.all("SELECT order_id, date, time FROM orders");
  res.status(200).json(orders);
}
