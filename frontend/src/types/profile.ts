export interface PersonalInformation {
  fullName: string;
  profilePhoto?: string;
  phoneNumber?: string;
  email: string;
  location: {
    city: string;
    country: string;
  };
  timeZone: string;
  dateOfBirth?: Date;
  shortBio: string;
}

export interface ProfessionalTitle {
  professionalTitle: string;
  professionalOverview: string;
  languages: Array<{
    language: string;
    proficiency: 'Native' | 'Fluent' | 'Intermediate' | 'Basic';
  }>;
  availabilityStatus: 'Full-time' | 'Part-time' | 'Available now' | 'Not available';
  availabilityDate?: Date;
}

export interface Skill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  yearsOfExperience: number;
}

export interface SkillsExpertise {
  primarySkills: Skill[];
  topSpecializations: string[];
  toolsAndTechnologies: string[];
}

export interface Education {
  degree: string;
  field: string;
  institution: string;
  year: number;
}

export interface Certification {
  name: string;
  issuingOrganization: string;
  credentialId?: string;
  issueDate: Date;
  expiryDate?: Date;
}

export interface RelevantCourse {
  name: string;
  platform: string;
  completionDate?: Date;
  certificateUrl?: string;
}

export interface EducationCertifications {
  highestEducation: Education;
  certifications: Certification[];
  relevantCourses: RelevantCourse[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  role: string;
  technologies: string[];
  projectUrl?: string;
  images: string[];
  startDate?: Date;
  endDate?: Date;
  clientName?: string;
}

export interface HourlyRatePreferences {
  hourlyRateMin: number;
  hourlyRateMax: number;
  currency: string;
  preferredProjectTypes: ('Hourly' | 'Fixed-price' | 'Milestone-based')[];
  minimumProjectBudget?: number;
  preferredPayoutMethod: 'PayPal' | 'Payoneer' | 'Bank Transfer' | 'Wise' | 'UPI';
  billingInfo?: {
    taxId?: string;
    gstin?: string;
  };
}

export interface ProfileSetupData {
  step1: PersonalInformation;
  step2: ProfessionalTitle;
  step3: SkillsExpertise;
  step4: EducationCertifications;
  step5: Project[];
  step6: HourlyRatePreferences;
  step7: {
    termsAccepted: boolean;
    completedAt: Date;
  };
}

export type ProfileSetupStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ProfileSetupState {
  currentStep: ProfileSetupStep;
  data: Partial<ProfileSetupData>;
  isCompleted: boolean;
}

export const PREDEFINED_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Express.js',
  'Python', 'Django', 'Flask', 'Java', 'Spring Boot', 'C#', '.NET',
  'PHP', 'Laravel', 'Ruby', 'Rails', 'Go', 'Rust', 'Swift', 'Kotlin',
  'HTML', 'CSS', 'SASS', 'Tailwind CSS', 'Bootstrap', 'Material UI',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
  'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'CI/CD',
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Figma', 'Sketch',
  'Machine Learning', 'Data Science', 'AI', 'Blockchain', 'DevOps',
  'Mobile Development', 'iOS', 'Android', 'React Native', 'Flutter',
  'Testing', 'Jest', 'Cypress', 'Selenium', 'QA', 'Agile', 'Scrum'
];

export const TIME_ZONES = [
  'UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00',
  'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00',
  'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00', 'UTC+02:00',
  'UTC+03:00', 'UTC+04:00', 'UTC+05:00', 'UTC+05:30', 'UTC+06:00',
  'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00',
  'UTC+12:00'
];

export const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Chinese', 'Japanese', 'Korean', 'Hindi', 'Arabic', 'Russian',
  'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish',
  'Turkish', 'Greek', 'Hebrew', 'Thai', 'Vietnamese', 'Indonesian'
];

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' }
];
