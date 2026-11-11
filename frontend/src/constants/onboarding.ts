export const POPULAR_STATES = [
  "Uttar Pradesh",
  "Bihar",
  "Madhya Pradesh",
  "Rajasthan",
  "Uttarakhand",
  "Delhi",
  "Maharashtra",
  "Gujarat",
] as const;

const OTHER_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Chhattisgarh",
  "Goa",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export const STATES = [...POPULAR_STATES, ...OTHER_STATES];

export const TOPICS = [
  { value: "civic", label: "Civic" },
  { value: "politics", label: "Politics" },
  { value: "education", label: "Education" },
  { value: "crime", label: "Crime" },
  { value: "business", label: "Business & Economy" },
] as const;

export const COMING_SOON_INTERESTS = [
  { value: "entertainment", label: "Entertainment" },
  { value: "sports", label: "Sports" },
] as const;
