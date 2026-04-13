import type { FormFieldType } from "@/lib/validations/knowledge-form";

export interface FormTemplateField {
  label: string;
  type: FormFieldType;
  isRequired: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { choices: string[] };
  validation?: Record<string, unknown>;
}

export interface FormTemplateSection {
  title?: string;
  description?: string;
  fields: FormTemplateField[];
}

export interface FormTemplate {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  sections: FormTemplateSection[];
  settings: {
    thankYouMessage: string;
  };
}

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    key: "team-onboarding",
    name: "Team Onboarding Questionnaire",
    description: "Collect essential information from new team members during onboarding.",
    icon: "Users",
    category: "Internal",
    sections: [
      {
        title: "Personal Information",
        fields: [
          { label: "Full Name", type: "TEXT", isRequired: true, placeholder: "First and Last Name" },
          { label: "Email Address", type: "EMAIL", isRequired: true, placeholder: "work@company.com" },
          { label: "Phone Number", type: "PHONE", isRequired: false, placeholder: "+1 (555) 000-0000" },
          { label: "Start Date", type: "DATE", isRequired: true },
        ],
      },
      {
        title: "Role & Department",
        fields: [
          { label: "Job Title", type: "TEXT", isRequired: true },
          {
            label: "Department",
            type: "SELECT",
            isRequired: true,
            options: { choices: ["Sales", "Marketing", "Engineering", "Operations", "Support", "Finance", "Other"] },
          },
          { label: "Manager / Team Lead", type: "TEXT", isRequired: false, placeholder: "Name of your direct report" },
        ],
      },
      {
        title: "Logistics",
        fields: [
          {
            label: "Equipment Needed",
            type: "MULTI_SELECT",
            isRequired: false,
            options: { choices: ["Laptop", "Monitor", "Headset", "Keyboard/Mouse", "Phone", "Other"] },
          },
          { label: "Dietary Restrictions", type: "TEXT", isRequired: false, placeholder: "For team events and catering" },
          { label: "Emergency Contact Name", type: "TEXT", isRequired: true },
          { label: "Emergency Contact Phone", type: "PHONE", isRequired: true },
        ],
      },
    ],
    settings: { thankYouMessage: "Welcome to the team! Your onboarding information has been recorded." },
  },
  {
    key: "customer-feedback",
    name: "Customer Feedback Survey",
    description: "Gather feedback from customers about their experience with your products or services.",
    icon: "MessageSquare",
    category: "Customer",
    sections: [
      {
        title: "Overall Experience",
        fields: [
          { label: "How would you rate your overall experience?", type: "RATING", isRequired: true, validation: { maxRating: 10 } },
          {
            label: "Which areas were you most satisfied with?",
            type: "MULTI_SELECT",
            isRequired: false,
            options: { choices: ["Product Quality", "Customer Service", "Pricing", "Delivery Speed", "Ease of Use", "Documentation"] },
          },
          {
            label: "Which areas need improvement?",
            type: "MULTI_SELECT",
            isRequired: false,
            options: { choices: ["Product Quality", "Customer Service", "Pricing", "Delivery Speed", "Ease of Use", "Documentation"] },
          },
        ],
      },
      {
        title: "Detailed Feedback",
        fields: [
          { label: "What do you like most about our product/service?", type: "TEXTAREA", isRequired: false, placeholder: "Tell us what we're doing well..." },
          { label: "What could we improve?", type: "TEXTAREA", isRequired: false, placeholder: "Share suggestions for improvement..." },
          { label: "Would you recommend us to a friend or colleague?", type: "YES_NO", isRequired: true },
        ],
      },
    ],
    settings: { thankYouMessage: "Thank you for your feedback! Your input helps us improve." },
  },
  {
    key: "partner-application",
    name: "Partner Application Form",
    description: "Intake form for prospective partners or affiliates applying to your program.",
    icon: "Handshake",
    category: "Partners",
    sections: [
      {
        title: "Company Information",
        fields: [
          { label: "Company Name", type: "TEXT", isRequired: true },
          { label: "Company Website", type: "TEXT", isRequired: true, placeholder: "https://..." },
          { label: "Industry", type: "TEXT", isRequired: true },
          {
            label: "Company Size",
            type: "SELECT",
            isRequired: true,
            options: { choices: ["1-10", "11-50", "51-200", "201-1000", "1000+"] },
          },
        ],
      },
      {
        title: "Contact Details",
        fields: [
          { label: "Contact Name", type: "TEXT", isRequired: true },
          { label: "Contact Email", type: "EMAIL", isRequired: true },
          { label: "Contact Phone", type: "PHONE", isRequired: false },
        ],
      },
      {
        title: "Partnership Details",
        fields: [
          {
            label: "Partnership Type",
            type: "SELECT",
            isRequired: true,
            options: { choices: ["Affiliate/Referral", "Reseller", "Technology Integration", "Strategic Alliance", "Other"] },
          },
          { label: "What are your goals for this partnership?", type: "TEXTAREA", isRequired: true },
          { label: "References (companies you've partnered with)", type: "TEXTAREA", isRequired: false },
        ],
      },
    ],
    settings: { thankYouMessage: "Thank you for your application! We'll review your information and get back to you within 5 business days." },
  },
  {
    key: "product-interest",
    name: "Product Interest Survey",
    description: "Understand customer interest in your products, pricing sensitivity, and feature priorities.",
    icon: "Package",
    category: "Customer",
    sections: [
      {
        title: "Product Preferences",
        fields: [
          {
            label: "Which products are you most interested in?",
            type: "MULTI_SELECT",
            isRequired: true,
            options: { choices: ["Supplements", "Apparel", "Accessories", "Digital Content", "Coaching", "Other"] },
          },
          { label: "How often do you purchase health/fitness products?", type: "SELECT", isRequired: true, options: { choices: ["Weekly", "Monthly", "Quarterly", "Rarely", "First time"] } },
          { label: "What is your monthly budget for these products?", type: "SELECT", isRequired: false, options: { choices: ["Under $25", "$25-$50", "$50-$100", "$100-$200", "$200+"] } },
        ],
      },
      {
        title: "Feature Priorities",
        fields: [
          { label: "How important is product quality to you?", type: "RATING", isRequired: true, validation: { maxRating: 5 } },
          { label: "How important is price?", type: "RATING", isRequired: true, validation: { maxRating: 5 } },
          { label: "How important is brand reputation?", type: "RATING", isRequired: true, validation: { maxRating: 5 } },
          { label: "Any specific features or products you'd like to see?", type: "TEXTAREA", isRequired: false },
        ],
      },
    ],
    settings: { thankYouMessage: "Thank you for sharing your preferences! This helps us build better products for you." },
  },
  {
    key: "event-registration",
    name: "Event Registration Form",
    description: "Collect registrations and preferences for events, webinars, or meetups.",
    icon: "Calendar",
    category: "Events",
    sections: [
      {
        title: "Attendee Information",
        fields: [
          { label: "Full Name", type: "TEXT", isRequired: true },
          { label: "Email Address", type: "EMAIL", isRequired: true },
          { label: "Company / Organization", type: "TEXT", isRequired: false },
          { label: "Job Title", type: "TEXT", isRequired: false },
        ],
      },
      {
        title: "Event Preferences",
        fields: [
          { label: "Which sessions are you interested in?", type: "MULTI_SELECT", isRequired: false, options: { choices: ["Keynote", "Workshop A", "Workshop B", "Panel Discussion", "Networking", "All Sessions"] } },
          { label: "Dietary Requirements", type: "SELECT", isRequired: false, options: { choices: ["None", "Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher", "Other"] } },
          { label: "Accessibility Requirements", type: "TEXTAREA", isRequired: false, placeholder: "Let us know if you need any accommodations" },
          { label: "Have you attended our events before?", type: "YES_NO", isRequired: false },
        ],
      },
    ],
    settings: { thankYouMessage: "You're registered! We'll send a confirmation email with event details." },
  },
  {
    key: "nps-survey",
    name: "NPS Survey",
    description: "Net Promoter Score survey — quick single-question format with follow-up.",
    icon: "TrendingUp",
    category: "Customer",
    sections: [
      {
        fields: [
          { label: "On a scale of 0-10, how likely are you to recommend us to a friend or colleague?", type: "RATING", isRequired: true, validation: { maxRating: 10 } },
          { label: "What is the primary reason for your score?", type: "TEXTAREA", isRequired: false, placeholder: "Tell us why you gave this score..." },
          { label: "What is one thing we could do to improve your experience?", type: "TEXTAREA", isRequired: false },
        ],
      },
    ],
    settings: { thankYouMessage: "Thank you for your feedback! Every response helps us improve." },
  },
  {
    key: "support-ticket",
    name: "Support Ticket Form",
    description: "Structured support request intake with categorization and severity.",
    icon: "LifeBuoy",
    category: "Support",
    sections: [
      {
        title: "Contact Information",
        fields: [
          { label: "Your Name", type: "TEXT", isRequired: true },
          { label: "Your Email", type: "EMAIL", isRequired: true },
        ],
      },
      {
        title: "Issue Details",
        fields: [
          {
            label: "Issue Category",
            type: "SELECT",
            isRequired: true,
            options: { choices: ["Account/Billing", "Product/Service", "Technical Issue", "Feature Request", "General Inquiry", "Other"] },
          },
          {
            label: "Severity",
            type: "RADIO",
            isRequired: true,
            options: { choices: ["Low — Minor inconvenience", "Medium — Affects my workflow", "High — Blocking my work", "Critical — System down"] },
          },
          { label: "Describe the issue", type: "TEXTAREA", isRequired: true, placeholder: "Please describe what happened, what you expected, and any error messages..." },
          { label: "Steps to reproduce", type: "TEXTAREA", isRequired: false, placeholder: "1. Go to...\n2. Click on...\n3. See error..." },
        ],
      },
    ],
    settings: { thankYouMessage: "Your support ticket has been submitted. We'll get back to you as soon as possible." },
  },
  {
    key: "knowledge-contribution",
    name: "Knowledge Contribution Form",
    description: "Allow team members or community to submit knowledge articles, tips, or resources.",
    icon: "BookOpen",
    category: "Internal",
    sections: [
      {
        title: "Contribution Details",
        fields: [
          { label: "Topic / Title", type: "TEXT", isRequired: true, placeholder: "What is this contribution about?" },
          {
            label: "Content Type",
            type: "SELECT",
            isRequired: true,
            options: { choices: ["How-To Guide", "Best Practice", "FAQ", "Process Documentation", "Tip/Trick", "Resource Link", "Other"] },
          },
          { label: "Content", type: "TEXTAREA", isRequired: true, helpText: "Write the full content of your contribution. You can use markdown formatting." },
          { label: "Sources / References", type: "TEXTAREA", isRequired: false, placeholder: "Links or references supporting this content" },
          {
            label: "Tags",
            type: "MULTI_SELECT",
            isRequired: false,
            options: { choices: ["Sales", "Marketing", "Product", "Engineering", "Operations", "Onboarding", "Training", "General"] },
          },
        ],
      },
    ],
    settings: { thankYouMessage: "Thank you for your contribution! It will be reviewed and added to our knowledge base." },
  },
];

export function getFormTemplate(key: string): FormTemplate | undefined {
  return FORM_TEMPLATES.find((t) => t.key === key);
}
