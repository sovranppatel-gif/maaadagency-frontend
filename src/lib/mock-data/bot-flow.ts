import type { BotStep } from "@/lib/types";

export const botFlow: BotStep[] = [
  {
    id: "step-1",
    order: 1,
    title: "Welcome Message",
    message:
      "Namaste! 👋 Welcome to Maa Ad Agency. What service do you need?",
    options: [
      { id: "o1", label: "Website" },
      { id: "o2", label: "Web Application" },
      { id: "o3", label: "Mobile Application" },
      { id: "o4", label: "UI/UX Design" },
      { id: "o5", label: "Custom Software" },
      { id: "o6", label: "Digital Marketing" },
      { id: "o7", label: "Other" },
    ],
  },
  {
    id: "step-2",
    order: 2,
    title: "Requirement Prompt",
    message: "Great choice! What do you need exactly? Tell us in a few words.",
    collectsField: "requirement",
  },
  {
    id: "step-3",
    order: 3,
    title: "Client Name",
    message: "Could you share your full name?",
    collectsField: "clientName",
  },
  {
    id: "step-4",
    order: 4,
    title: "Company Name",
    message: "What's your company / business name?",
    collectsField: "company",
  },
  {
    id: "step-5",
    order: 5,
    title: "Description",
    message: "Please describe your requirement in more detail.",
    collectsField: "description",
  },
  {
    id: "step-6",
    order: 6,
    title: "Reference Website",
    message: "Do you have a reference website or design you like? (optional)",
    collectsField: "referenceWebsite",
  },
  {
    id: "step-7",
    order: 7,
    title: "Deadline",
    message: "What's your expected deadline?",
    collectsField: "deadline",
  },
  {
    id: "step-8",
    order: 8,
    title: "Budget",
    message: "What budget range are you planning for this project?",
    collectsField: "budget",
  },
  {
    id: "step-9",
    order: 9,
    title: "Attachments",
    message: "You can share any reference files, logos or documents now.",
    collectsField: "attachments",
  },
  {
    id: "step-10",
    order: 10,
    title: "Closing Message",
    message:
      "Thank you! 🙏 Our team has received your requirement and will get back to you shortly.",
  },
];

export const quickReplies = [
  { id: "qr1", label: "Welcome", message: "Namaste! 👋 Welcome to Maa Ad Agency. How can we help you today?" },
  { id: "qr2", label: "Select Service", message: "Which service are you interested in? Website, UI/UX Design, Digital Marketing, or something else?" },
  { id: "qr3", label: "Requirement Details", message: "Could you share a few more details about your requirement?" },
  { id: "qr4", label: "Request Documents", message: "Could you please share any reference files, logos or documents?" },
  { id: "qr5", label: "Work Started", message: "Good news — our team has started working on your project! 🚀" },
  { id: "qr6", label: "Work Completed", message: "Your project has been completed and is ready for your review. ✅" },
  { id: "qr7", label: "Need More Information", message: "We need a bit more information to proceed. Could you clarify?" },
];
