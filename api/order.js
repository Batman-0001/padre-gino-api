import { AsyncDatabase } from "promised-sqlite3";

let db;
async function getDb() {
  if (!db) db = await AsyncDatabase.open("./pizza.sqlite");
  return db;
}

export default async function handler(req, res) {
  const db = await getDb();
  const id = req.query.id;
  const orderPromise = db.get(
    "SELECT order_id, date, time FROM orders WHERE order_id = ?",
    [id]
  );
  const orderItemsPromise = db.all(
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
    [id]
  );

  const [order, orderItemsRes] = await Promise.all([
    orderPromise,
    orderItemsPromise,
  ]);

  const orderItems = orderItemsRes.map((item) =>
    Object.assign({}, item, {
      image: `/public/pizzas/${item.pizzaTypeId}.webp`,
      quantity: +item.quantity,
      price: +item.price,
    })
  );

  const total = orderItems.reduce((acc, item) => acc + item.total, 0);

  res.status(200).json({
    order: Object.assign({ total }, order),
    orderItems,
  });
}
