// Copy and data for the About page. Edit text here without touching the layout.

export type Track = {
  slug: string;
  title: [string, string];
  categories: string[];
  image: string;
  imageAlt: string;
  tone: string;
  product: string;
  focus: string;
  levels: string[];
  aiFeatures: string[];
  mastery: string;
  availability: string;
};

export const tracks: Track[] = [
  {
    slug: "ielts",
    title: ["IELTS & ACADEMIC", "ENGLISH"],
    categories: ["Exam prep", "Academic", "English"],
    image: "/home/ielts.jpg",
    imageAlt: "3D IELTS book with a microphone and speech bubbles",
    tone: "#E0F2FE",
    product: "SI IELTS COACH",
    focus: "Listening / Reading / Writing / Speaking",
    levels: ["Band 5.0 – 8.0", "All levels"],
    aiFeatures: ["24/7 Q&A", "Auto-Grading", "Study Planner"],
    mastery: "8 – 12 weeks",
    availability: "Open now",
  },
  {
    slug: "hsc",
    title: ["HSC & STEM", "MASTERY"],
    categories: ["Year 11 – 12", "Science", "Mathematics"],
    image: "/home/hsc.jpg",
    imageAlt: "Stack of colourful subject textbooks topped with a graduation cap",
    tone: "#EDE9FE",
    product: "SI HSC STUDIO",
    focus: "Mathematics / Physics / Chemistry / Biology",
    levels: ["Year 11 – 12", "Band 6 focus"],
    aiFeatures: ["24/7 Q&A", "Auto-Grading", "Study Planner"],
    mastery: "12 – 20 weeks",
    availability: "Open now",
  },
  {
    slug: "robotics",
    title: ["AI & ROBOTICS", "FOUNDATIONS"],
    categories: ["AI", "Programming", "Robotics"],
    image: "/home/robotics.jpg",
    imageAlt: "3D robot arm working beside a friendly robot",
    tone: "#CCFBF1",
    product: "SI ROBOTICS LAB",
    focus: "Machine learning / Python / Control systems",
    levels: ["Beginner friendly", "Project-based"],
    aiFeatures: ["24/7 Q&A", "Auto-Grading", "Study Planner"],
    mastery: "10 – 14 weeks",
    availability: "Open now",
  },
];

export const values = [
  {
    title: "Adaptive AI tutoring",
    text: "Lessons tailored to your pace and the topics you find hardest.",
    tone: "#E0F2FE",
    icon: "spark",
  },
  {
    title: "All-in-one study hub",
    text: "Notes, practice tests and progress synced together.",
    tone: "#EDE9FE",
    icon: "stack",
  },
  {
    title: "Deep conceptual clarity",
    text: "Step-by-step explanations instead of rote memorisation.",
    tone: "#CCFBF1",
    icon: "prism",
  },
] as const;

export const features = [
  {
    title: "Self-paced mastery",
    text: "Learn when curiosity strikes. Pause, rewind and return to any lesson whenever you are ready.",
    tone: "#E0F2FE",
    icon: "clock",
  },
  {
    title: "Smart progress tracking",
    text: "See completed lessons, weak spots and your next best step at a glance.",
    tone: "#EDE9FE",
    icon: "bars",
  },
  {
    title: "Interactive study files",
    text: "Worked examples, summaries and practice sheets sit right beside every lesson.",
    tone: "#E0E7FF",
    icon: "file",
  },
  {
    title: "24/7 AI mentorship",
    text: "Ask a question at midnight and get a clear, patient explanation in seconds.",
    tone: "#CCFBF1",
    icon: "burst",
  },
] as const;

export const journey = [
  {
    title: "Diagnostic & Goal Setup",
    text: "Start with a short diagnostic. SI Tutor maps what you already know, then sets a realistic goal and a study path that fits your timetable.",
    image: "/home/mathematics.jpg",
    imageAlt: "3D calculator surrounded by maths formulas",
  },
  {
    title: "Interactive AI Practice",
    text: "Work through bite-sized lessons and practice questions. Your AI tutor explains each step, checks your answers and adapts the next question to you.",
    image: "/catalog/brand-robot.jpg",
    imageAlt: "The friendly SI Tutor robot giving a thumbs up",
  },
  {
    title: "Mastery & Progress Insights",
    text: "Track your growth topic by topic. Clear insights show what you have mastered and what to review next, so every session counts.",
    image: "/about/si-learning-hub-crop.jpg",
    imageAlt: "Isometric 3D AI learning hub with books, graduation caps and progress charts",
  },
] as const;

// Placeholder reviews for the design preview. Replace with real, consented learner reviews before launch.
export const reviews = [
  { quote: "The AI tutor explained Writing Task 2 structure better than any book I tried. My band score finally moved.", name: "Ploy S.", track: "IELTS Candidate", avatar: "blue" },
  { quote: "I ask questions at 1 a.m. and still get a patient, step-by-step answer. It feels like a tutor who never gets tired.", name: "Daniel K.", track: "CS Student", avatar: "green" },
  { quote: "The study planner broke my HSC Maths revision into small daily goals. I stopped cramming.", name: "Mia T.", track: "High School Senior", avatar: "amber" },
  { quote: "Auto-graded practice shows exactly where I lose marks. I fix the weak topic instead of redoing everything.", name: "Arjun P.", track: "HSC Physics", avatar: "violet" },
  { quote: "The robotics track made machine learning click for me. The examples are practical, not just theory.", name: "Noah L.", track: "AI & Robotics Learner", avatar: "blue" },
  { quote: "Speaking practice with instant feedback gave me the confidence I needed before test day.", name: "Linh N.", track: "IELTS Candidate", avatar: "green" },
  { quote: "Lessons, notes and progress in one place. I always know what to study next.", name: "Sophie R.", track: "University Maths", avatar: "amber" },
  { quote: "Step-by-step explanations instead of memorising answers. Chemistry finally makes sense.", name: "Ethan W.", track: "High School Senior", avatar: "violet" },
] as const;
