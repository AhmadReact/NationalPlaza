import { formatPrice } from "@/lib/data";

export const adminStats = {
  revenue: 4_285_400,
  orders: 186,
  customers: 1248,
  lowStock: 14,
};

export const recentOrders = [
  {
    id: "NE-10482",
    customer: "Ahmed Khan",
    total: 189999,
    status: "Processing",
    date: "7 Aug 2026",
  },
  {
    id: "NE-10481",
    customer: "Sara Malik",
    total: 74999,
    status: "Shipped",
    date: "7 Aug 2026",
  },
  {
    id: "NE-10480",
    customer: "Bilal Hussain",
    total: 249999,
    status: "Delivered",
    date: "6 Aug 2026",
  },
  {
    id: "NE-10479",
    customer: "Fatima Ali",
    total: 42999,
    status: "Pending",
    date: "6 Aug 2026",
  },
  {
    id: "NE-10478",
    customer: "Usman Raza",
    total: 129999,
    status: "Cancelled",
    date: "5 Aug 2026",
  },
];

export const topProducts = [
  { name: "Gree 1.5 Ton Inverter AC", sold: 42, revenue: 7_979_958 },
  { name: "Haier 16 cu ft Refrigerator", sold: 31, revenue: 3_719_969 },
  { name: "Samsung 55\" 4K Smart TV", sold: 28, revenue: 5_039_972 },
  { name: "PEL Air Cooler 60L", sold: 55, revenue: 1_649_945 },
];

export const customers = [
  { name: "Ahmed Khan", email: "ahmed@email.com", orders: 8, spent: 612000 },
  { name: "Sara Malik", email: "sara@email.com", orders: 5, spent: 284500 },
  { name: "Bilal Hussain", email: "bilal@email.com", orders: 12, spent: 980000 },
  { name: "Fatima Ali", email: "fatima@email.com", orders: 3, spent: 129000 },
  { name: "Usman Raza", email: "usman@email.com", orders: 6, spent: 410200 },
];

export const coupons = [
  { code: "SUMMER26", discount: "15%", uses: 142, status: "Active" },
  { code: "WELCOME10", discount: "10%", uses: 89, status: "Active" },
  { code: "EID5000", discount: "Rs.5,000", uses: 56, status: "Expired" },
  { code: "FREESHIP", discount: "Free shipping", uses: 210, status: "Active" },
];

export const inventoryAlerts = [
  { product: "Orient 1 Ton AC", sku: "OR-AC-1T", stock: 3, status: "Low" },
  { product: "Dawlance Freezer 15", sku: "DW-FZ-15", stock: 0, status: "Out" },
  { product: "TCL 43\" Android TV", sku: "TCL-43-A", stock: 5, status: "Low" },
  { product: "Homage UPS 2kVA", sku: "HM-UPS-2", stock: 2, status: "Low" },
];

export const reviewQueue = [
  {
    product: "Haier Inverter AC 1.5T",
    customer: "Nadia",
    rating: 5,
    excerpt: "Cooling is excellent, installation was prompt.",
    status: "Published",
  },
  {
    product: "PEL Refrigerator",
    customer: "Imran",
    rating: 3,
    excerpt: "Good value but delivery was delayed.",
    status: "Pending",
  },
  {
    product: "Samsung QLED 55",
    customer: "Zainab",
    rating: 4,
    excerpt: "Picture quality is stunning.",
    status: "Published",
  },
];

export const shippingZones = [
  { zone: "Karachi", rate: "Free", eta: "1–2 days" },
  { zone: "Lahore / Islamabad", rate: "Rs.500", eta: "2–3 days" },
  { zone: "Punjab / Sindh", rate: "Rs.800", eta: "3–5 days" },
  { zone: "Rest of Pakistan", rate: "Rs.1,200", eta: "5–7 days" },
];

export const reportSummary = [
  { label: "Gross sales", value: formatPrice(8_420_000) },
  { label: "Net revenue", value: formatPrice(4_285_400) },
  { label: "Avg. order value", value: formatPrice(23_040) },
  { label: "Return rate", value: "2.4%" },
];

export const weeklySales = [
  { day: "Mon", sales: 420000, orders: 18 },
  { day: "Tue", sales: 510000, orders: 22 },
  { day: "Wed", sales: 480000, orders: 20 },
  { day: "Thu", sales: 620000, orders: 28 },
  { day: "Fri", sales: 780000, orders: 34 },
  { day: "Sat", sales: 910000, orders: 41 },
  { day: "Sun", sales: 565400, orders: 23 },
];

export const categoryShare = [
  { id: 0, value: 38, label: "ACs", color: "#1d2f8b" },
  { id: 1, value: 24, label: "Refrigerators", color: "#244eec" },
  { id: 2, value: 18, label: "LED TVs", color: "#f59e0b" },
  { id: 3, value: 12, label: "Coolers", color: "#059669" },
  { id: 4, value: 8, label: "Other", color: "#94a3b8" },
];

export const fulfillmentPipeline = [
  { label: "Pending", count: 12, tone: "warning" as const },
  { label: "Processing", count: 24, tone: "info" as const },
  { label: "Shipped", count: 31, tone: "primary" as const },
  { label: "Delivered", count: 108, tone: "success" as const },
];

export const liveActivity = [
  {
    title: "New order NE-10482",
    detail: "Gree 1.5 Ton Inverter AC · Karachi",
    time: "2m ago",
    type: "order" as const,
  },
  {
    title: "Low stock alert",
    detail: "Orient 1 Ton AC is down to 3 units",
    time: "18m ago",
    type: "stock" as const,
  },
  {
    title: "Review published",
    detail: "Nadia left 5★ on Haier Inverter AC",
    time: "41m ago",
    type: "review" as const,
  },
  {
    title: "Coupon redeemed",
    detail: "SUMMER26 used on order NE-10479",
    time: "1h ago",
    type: "coupon" as const,
  },
  {
    title: "Shipment out",
    detail: "NE-10481 handed to TCS · Lahore",
    time: "2h ago",
    type: "ship" as const,
  },
];
