export const CLIENT_HIRING_DOMAIN_OPTIONS: Record<string, string[]> = {
  Development: [
    "Frontend Web Apps",
    "Backend APIs",
    "Full Stack Platforms",
    "Mobile Apps",
    "DevOps & Cloud",
    "Automation Scripts",
  ],
  Design: [
    "UI Design",
    "UX Research",
    "Brand Design",
    "Design Systems",
    "Illustrations",
    "Motion Graphics",
  ],
  "Data & AI": [
    "Data Engineering",
    "Analytics Dashboards",
    "Machine Learning",
    "NLP & LLM Apps",
    "Computer Vision",
    "MLOps",
  ],
  Marketing: [
    "SEO",
    "Paid Ads",
    "Content Marketing",
    "Email Campaigns",
    "Social Media",
    "Growth Strategy",
  ],
  "Writing & Content": [
    "Technical Writing",
    "Website Copy",
    "Blog Articles",
    "Product Docs",
    "Proofreading",
    "Script Writing",
  ],
  "Video & Animation": [
    "Video Editing",
    "Explainer Videos",
    "2D Animation",
    "3D Animation",
    "Ad Creatives",
    "Post Production",
  ],
  "IT & Security": [
    "Security Audits",
    "Network Setup",
    "Cloud Admin",
    "IT Support",
    "Compliance",
    "Penetration Testing",
  ],
  "Product & Strategy": [
    "Product Management",
    "Roadmapping",
    "Business Analysis",
    "User Interviews",
    "Go-To-Market",
    "Process Optimization",
  ],
  "Sales & Ops": [
    "CRM Setup",
    "Lead Generation",
    "Outbound Campaigns",
    "Sales Operations",
    "Customer Success",
    "Support Systems",
  ],
  "Finance & Legal": [
    "Bookkeeping",
    "Financial Modeling",
    "Tax Support",
    "Contract Drafting",
    "Compliance Review",
    "Policy Writing",
  ],
  "Engineering & CAD": [
    "Mechanical CAD",
    "Electrical CAD",
    "Architectural Drafting",
    "Manufacturing Design",
    "3D Modeling",
    "Simulation",
  ],
  "Translation & Localization": [
    "Translation",
    "Localization QA",
    "Transcription",
    "Subtitles",
    "Multilingual SEO",
    "Interpretation",
  ],
};

export const CLIENT_INDUSTRY_OPTIONS = [
  "Information Technology",
  "SaaS",
  "E-commerce",
  "Fintech",
  "Healthcare",
  "Education",
  "Real Estate",
  "Manufacturing",
  "Media & Entertainment",
  "Travel & Hospitality",
  "Legal Services",
  "Nonprofit",
];

export const CLIENT_COMPANY_SIZE_OPTIONS = [
  "Solo",
  "2-10",
  "11-50",
  "51-200",
  "201-500",
  "500+",
];

export const CLIENT_PREFERRED_LEVEL_OPTIONS = [
  { label: "Entry", value: "entry" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Expert", value: "expert" },
] as const;

export const CLIENT_TIMEZONE_OPTIONS = [
  "Asia/Kolkata",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
];

export const CLIENT_PAYMENT_TYPE_OPTIONS = [
  { label: "Hourly", value: "hourly" },
  { label: "Fixed", value: "fixed" },
  { label: "Milestone", value: "milestone" },
] as const;

export const CLIENT_INDIA_PAYMENT_OPTIONS = [
  "UPI",
  "Bank Transfer",
  "Razorpay",
  "Paytm",
  "Cheque",
];

export const CLIENT_INTERNATIONAL_PAYMENT_OPTIONS = [
  "Wire Transfer",
  "Wise",
  "PayPal",
  "Payoneer",
  "Stripe",
];
