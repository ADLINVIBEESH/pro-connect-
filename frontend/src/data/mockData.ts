export interface Freelancer {
  id: string;
  name: string;
  title: string;
  avatar: string;
  hourlyRate: number;
  rating: number;
  reviews: number;
  country: string;
  countryFlag: string;
  city?: string;
  professionalTitle?: string;
  yearsOfExperience?: number;
  bio: string;
  skills: string[];
  category: string;
  resumeFile?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  budgetMin: number;
  budgetMax: number;
  timeline: string;
  description: string;
  skills: string[];
  category: string;
  postedAt: string;
}

export const categories = [
  { id: "frontend", label: "Frontend Dev", icon: "Monitor" },
  { id: "backend", label: "Backend Dev", icon: "Server" },
  { id: "mobile", label: "Mobile Apps", icon: "Smartphone" },
  { id: "uiux", label: "UI/UX Design", icon: "Palette" },
  { id: "data", label: "Data Science", icon: "BarChart3" },
  { id: "cyber", label: "Cybersecurity", icon: "Shield" },
  { id: "devops", label: "DevOps", icon: "Cloud" },
  { id: "ai", label: "AI / ML", icon: "Brain" },
];

export const freelancers: Freelancer[] = [
  {
    id: "1", name: "Aarav Mehta", title: "Senior React Developer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=aarav",
    hourlyRate: 85, rating: 4.9, reviews: 127, country: "India", countryFlag: "🇮🇳",
    bio: "Full-stack React specialist with 8+ years building scalable web applications for Fortune 500 clients.",
    skills: ["React", "TypeScript", "Next.js", "Node.js"], category: "frontend"
  },
  {
    id: "2", name: "Sophie Chen", title: "UI/UX Design Lead",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sophie",
    hourlyRate: 95, rating: 5.0, reviews: 89, country: "Singapore", countryFlag: "🇸🇬",
    bio: "Design lead crafting pixel-perfect interfaces. Formerly at Grab and Shopee.",
    skills: ["Figma", "Prototyping", "Design Systems", "User Research"], category: "uiux"
  },
  {
    id: "3", name: "James Okafor", title: "Python & ML Engineer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=james",
    hourlyRate: 110, rating: 4.8, reviews: 64, country: "Nigeria", countryFlag: "🇳🇬",
    bio: "Machine learning engineer specializing in NLP and computer vision solutions.",
    skills: ["Python", "TensorFlow", "PyTorch", "AWS"], category: "ai"
  },
  {
    id: "4", name: "Maria Santos", title: "Mobile App Developer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
    hourlyRate: 75, rating: 4.7, reviews: 93, country: "Brazil", countryFlag: "🇧🇷",
    bio: "Cross-platform mobile developer with expertise in React Native and Flutter.",
    skills: ["React Native", "Flutter", "iOS", "Android"], category: "mobile"
  },
  {
    id: "5", name: "Liam Schmidt", title: "DevOps Architect",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=liam",
    hourlyRate: 120, rating: 4.9, reviews: 56, country: "Germany", countryFlag: "🇩🇪",
    bio: "Cloud infrastructure expert. AWS & GCP certified with 10+ years in enterprise DevOps.",
    skills: ["AWS", "Kubernetes", "Terraform", "Docker"], category: "devops"
  },
  {
    id: "6", name: "Yuki Tanaka", title: "Cybersecurity Analyst",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=yuki",
    hourlyRate: 130, rating: 4.8, reviews: 41, country: "Japan", countryFlag: "🇯🇵",
    bio: "Certified ethical hacker and security consultant. Protecting businesses since 2015.",
    skills: ["Penetration Testing", "SIEM", "Compliance", "Network Security"], category: "cyber"
  },
  {
    id: "7", name: "Elena Volkov", title: "Backend Engineer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=elena",
    hourlyRate: 90, rating: 4.6, reviews: 78, country: "Ukraine", countryFlag: "🇺🇦",
    bio: "Scalable backend systems in Go and Rust. Microservices architecture specialist.",
    skills: ["Go", "Rust", "PostgreSQL", "gRPC"], category: "backend"
  },
  {
    id: "8", name: "Carlos Rivera", title: "Data Scientist",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos",
    hourlyRate: 100, rating: 4.9, reviews: 52, country: "Mexico", countryFlag: "🇲🇽",
    bio: "Data scientist turning complex datasets into actionable business insights.",
    skills: ["Python", "R", "SQL", "Tableau"], category: "data"
  },
];

export const jobs: Job[] = [
  {
    id: "1", title: "Build E-Commerce Platform Frontend",
    company: "ShopWave Inc.", companyLogo: "https://api.dicebear.com/7.x/identicon/svg?seed=shopwave",
    budgetMin: 2000, budgetMax: 5000, timeline: "Within 1 month",
    description: "We need a senior React developer to build our new e-commerce storefront with a modern UI.",
    skills: ["React", "TypeScript", "Tailwind CSS"], category: "frontend", postedAt: "2 hours ago"
  },
  {
    id: "2", title: "Mobile App for Fitness Tracking",
    company: "FitPulse", companyLogo: "https://api.dicebear.com/7.x/identicon/svg?seed=fitpulse",
    budgetMin: 3000, budgetMax: 7000, timeline: "Within 2 months",
    description: "Cross-platform fitness tracking app with real-time heart rate monitoring and workout plans.",
    skills: ["React Native", "Firebase", "HealthKit"], category: "mobile", postedAt: "5 hours ago"
  },
  {
    id: "3", title: "AI Chatbot for Customer Support",
    company: "TechServe Solutions", companyLogo: "https://api.dicebear.com/7.x/identicon/svg?seed=techserve",
    budgetMin: 4000, budgetMax: 8000, timeline: "Within 3 weeks",
    description: "Build an intelligent chatbot using GPT-4 API for handling customer inquiries automatically.",
    skills: ["Python", "OpenAI API", "NLP", "FastAPI"], category: "ai", postedAt: "1 day ago"
  },
  {
    id: "4", title: "Redesign SaaS Dashboard",
    company: "CloudMetrics", companyLogo: "https://api.dicebear.com/7.x/identicon/svg?seed=cloudmetrics",
    budgetMin: 1500, budgetMax: 3000, timeline: "Within 2 weeks",
    description: "Redesign our analytics dashboard for better usability and modern aesthetics.",
    skills: ["Figma", "UI/UX", "Design Systems"], category: "uiux", postedAt: "3 hours ago"
  },
  {
    id: "5", title: "Kubernetes Cluster Migration",
    company: "DataFlow Corp", companyLogo: "https://api.dicebear.com/7.x/identicon/svg?seed=dataflow",
    budgetMin: 5000, budgetMax: 12000, timeline: "Within 1 month",
    description: "Migrate our legacy infrastructure to a Kubernetes-based microservices architecture on AWS.",
    skills: ["Kubernetes", "AWS", "Docker", "Terraform"], category: "devops", postedAt: "6 hours ago"
  },
  {
    id: "6", title: "Security Audit & Penetration Testing",
    company: "FinSecure Bank", companyLogo: "https://api.dicebear.com/7.x/identicon/svg?seed=finsecure",
    budgetMin: 6000, budgetMax: 15000, timeline: "Within 3 weeks",
    description: "Comprehensive security audit and penetration testing of our online banking platform.",
    skills: ["Penetration Testing", "OWASP", "Compliance"], category: "cyber", postedAt: "1 day ago"
  },
];

export const testimonials = [
  {
    name: "Priya Sharma",
    role: "CTO at InnovateTech",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
    quote: "ProConnect helped us find a brilliant React developer in 48 hours. The quality of talent here is unmatched.",
    rating: 5
  },
  {
    name: "David Kim",
    role: "Freelance Designer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
    quote: "I've tripled my income since joining ProConnect. The platform makes finding high-quality clients effortless.",
    rating: 5
  },
  {
    name: "Sarah Johnson",
    role: "Product Manager at ScaleUp",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    quote: "The filtering system is incredible. We posted a job and had 10 qualified applicants within the first day.",
    rating: 5
  },
];
