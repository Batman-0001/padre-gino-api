export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }
  // Log or handle the contact form submission as needed
  res.status(200).json({ success: "Message received" });
}
