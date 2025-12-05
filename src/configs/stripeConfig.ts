// WaveKit Pricing Configuration
// Pro Yearly: $79/year (Save 35%)
// Pro Monthly: $9.9/month

const priceProd = [
  {
    currency: "usd",
    type: "recurring",
    unit_amount: 7900, // $79/year
    interval: "year",
    id: "price_" // Replace with your Stripe price ID for yearly plan
  },
  {
    currency: "usd",
    type: "recurring",
    unit_amount: 990, // $9.9/month
    interval: "month",
    id: "price_" // Replace with your Stripe price ID for monthly plan
  }
];

const priceTest = [
  {
    currency: "usd",
    type: "recurring",
    unit_amount: 7900, // $79/year
    interval: "year",
    id: "price_" // Replace with your Stripe test price ID for yearly plan
  },
  {
    currency: "usd",
    type: "recurring",
    unit_amount: 990, // $9.9/month
    interval: "month",
    id: "price_" // Replace with your Stripe test price ID for monthly plan
  }
];

export const priceList = (process.env.NODE_ENV === 'production' ? priceProd: priceTest);
