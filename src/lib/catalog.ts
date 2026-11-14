export type Subject = {
  slug: string;
  name: string;
  description: string;
  image: string;
  color: string;
  icon: string;
};

export type Lesson = {
  id: string;
  title: string;
  duration: string;
  description: string;
  takeaways: string[];
  video?: { source: string; captions: string };
};

export type CourseSection = {
  title: string;
  lessons: Lesson[];
};

export type Course = {
  slug: string;
  subjectSlug: string;
  title: string;
  description: string;
  cover: string;
  rating: number;
  reviews: string;
  duration: string;
  lessonCount: number;
  price: number;
  sections: CourseSection[];
  outcomes: string[];
  instructor: string;
};

export const subjects: Subject[] = [
  { slug: "hsc", name: "HSC", description: "Mathematics, Physics, Chemistry, Biology, English and more.", image: "/home/hsc.jpg", color: "#e1f5fc", icon: "hsc" },
  { slug: "ielts", name: "IELTS", description: "Listening, Reading, Writing, Speaking.", image: "/home/ielts.jpg", color: "#fdf0f5", icon: "ielts" },
  { slug: "robotics", name: "SI & Robotics", description: "AI, Programming, Robotics, Computer Science.", image: "/home/robotics.jpg", color: "#f0ebfd", icon: "robotics" },
  { slug: "mathematics", name: "University Mathematics", description: "Calculus, Algebra, Statistics, Discrete Maths, Linear Algebra and more.", image: "/home/mathematics.jpg", color: "#e5f8f3", icon: "mathematics" },
  { slug: "citizenship", name: "Australian Citizenship", description: "Test practice, key topics, Australian values, laws and more.", image: "/home/citizenship.jpg", color: "#fdf8e7", icon: "citizenship" },
];

function lesson(id: string, title: string, duration: string, description: string, takeaways: string[]): Lesson {
  return { id, title, duration, description, takeaways };
}

const aiSections: CourseSection[] = [
  {
    title: "Getting Started",
    lessons: [
      lesson("introduction", "Introduction to AI & ML", "8:20", "Artificial intelligence describes systems that perform tasks such as classifying images or planning routes. Machine learning is one way to build those systems: a model learns patterns from examples and applies them to new inputs.", ["Explain how AI, machine learning and deep learning relate", "Recognise a real-world application", "Identify the input and output of a simple model"]),
      lesson("what-is-machine-learning", "What is Machine Learning?", "16:25", "A model can learn to identify spam by comparing example messages with their labels. After training, evaluate it on messages it has never seen before.", ["Describe a feature and a label", "Separate training examples from test examples"]),
      lesson("types-of-machine-learning", "Types of Machine Learning", "15:05", "Compare supervised learning with labelled examples, unsupervised learning with unlabelled data, and reinforcement learning with feedback from actions.", ["Match a task to a learning approach", "Distinguish labels from rewards"]),
      lesson("setup", "Setting Up Your Environment", "15:10", "Set up a Python environment, start a notebook and inspect a small dataset before training a model.", ["Check the shape of a dataset", "Run a reproducible notebook"]),
    ],
  },
  {
    title: "Neural Networks",
    lessons: [
      lesson("neural-networks", "Introduction to Neural Networks", "55:00", "A neural network combines weighted inputs across layers to transform raw features into useful predictions.", ["Identify input, hidden and output layers", "Explain the role of a weight"]),
      lesson("neurons-and-layers", "Understanding Neurons and Layers", "60:00", "Follow a single input through two layers and see how each layer builds on the previous representation.", ["Trace a forward pass", "Distinguish weights from biases"]),
      lesson("training-neural-networks", "Training Neural Networks", "85:00", "A loss function measures prediction error. Gradient-based training adjusts the weights to reduce that error.", ["Describe the loss function", "Explain what a learning rate controls"]),
      lesson("activation-functions", "Activation Functions", "75:00", "Activation functions let layers model nonlinear relationships. Compare when ReLU and sigmoid are useful.", ["Describe why nonlinearity matters", "Choose an activation for a simple task"]),
    ],
  },
  {
    title: "Machine Learning Models",
    lessons: [
      lesson("supervised-learning", "Supervised Learning", "45:00", "Train a model to predict labelled outcomes. Compare classification and regression with examples.", ["Choose between classification and regression", "Explain why evaluation uses held-out data"]),
      lesson("unsupervised-learning", "Unsupervised Learning", "50:00", "Explore how clustering groups similar observations without target labels.", ["Describe a clustering use case", "Explain how feature scales affect similarity"]),
      lesson("model-evaluation", "Model Training and Evaluation", "57:00", "Use validation data to select a model and a test set to estimate its performance on new examples.", ["Recognise overfitting", "Choose a metric that fits the task"]),
      lesson("applications", "Real-World AI Applications", "48:00", "Review a practical workflow for building and monitoring an AI feature from problem definition through deployment.", ["Define a measurable success criterion", "Identify risks from biased training data"]),
    ],
  },
];

const flagship: Course = {
  slug: "introduction-to-ai-and-ml",
  subjectSlug: "robotics",
  title: "Introduction to Artificial Intelligence & ML",
  description: "Learn the fundamentals of AI, neural networks and machine learning. Explore key algorithms, train simple models and apply them to real-world problems.",
  cover: "/catalog/ai-network.jpg",
  rating: 4.9,
  reviews: "1.2k",
  duration: "8h 50m",
  lessonCount: 12,
  price: 49,
  sections: aiSections,
  outcomes: [
    "Understand the basics of AI and machine learning",
    "Explore key algorithms and concepts",
    "Learn how neural networks work",
    "Work with real datasets and visualisation",
    "Build simple ML models from scratch",
    "Apply ML to real-world problems",
  ],
  instructor: "Dr. Alex Carter",
};

type Sample = Omit<Course, "duration" | "lessonCount" | "sections" | "outcomes" | "instructor"> & {
  topic: string;
};

function sampleCourse({ topic, ...sample }: Sample): Course {
  return {
    ...sample,
    duration: "10m",
    lessonCount: 1,
    instructor: "SI Tutor Team",
    outcomes: [topic],
    sections: [{ title: "Getting Started", lessons: [
      lesson("introduction", "Introduction", "10:00", sample.description, [topic]),
    ] }],
  };
}

export const courses: Course[] = [
  flagship,
  sampleCourse({ slug: "robotics-101", subjectSlug: "robotics", title: "Robotics 101: Building Your First Autonomous Car", description: "Explore how sensors, microcontrollers and motors work together in a small autonomous vehicle.", cover: "/catalog/robotics-board.jpg", rating: 4.7, reviews: "850", price: 39, topic: "Connect sensor readings to steering and motor control" }),
  sampleCourse({ slug: "python-for-beginners", subjectSlug: "robotics", title: "Python for Beginners: From Scripting to Apps", description: "Start with Python variables, functions and loops, then put them together in a small script.", cover: "/catalog/python-code.jpg", rating: 5, reviews: "2.4k", price: 29, topic: "Write a reusable function and call it from a script" }),
  sampleCourse({ slug: "internet-of-things", subjectSlug: "robotics", title: "Internet of Things (IoT) Masterclass", description: "Follow a reading from a connected sensor through an embedded device to a dashboard.", cover: "/catalog/internet-of-things.jpg", rating: 4.8, reviews: "340", price: 39, topic: "Trace how sensor data moves across an IoT system" }),
  sampleCourse({ slug: "cybersecurity-essentials", subjectSlug: "robotics", title: "Cybersecurity Essentials for Robotics", description: "Identify common entry points in networked robots and examine how authentication helps protect them.", cover: "/catalog/cybersecurity.jpg", rating: 4.9, reviews: "512", price: 39, topic: "Identify where a robot system needs access controls" }),
  sampleCourse({ slug: "ethics-in-ai", subjectSlug: "robotics", title: "Ethics in Artificial Intelligence", description: "Consider how training data, deployment choices and feedback shape the effects of an AI system.", cover: "/catalog/ai-ethics.jpg", rating: 5, reviews: "120", price: 39, topic: "Recognise a potential fairness issue in a model" }),
  sampleCourse({ slug: "advanced-linear-algebra", subjectSlug: "robotics", title: "Advanced Linear Algebra for Engineers", description: "Work through how matrices and vectors represent transformations in engineering.", cover: "/catalog/linear-algebra.jpg", rating: 4, reviews: "92", price: 29, topic: "Use a matrix to represent a transformation" }),
  sampleCourse({ slug: "control-systems", subjectSlug: "robotics", title: "Control Systems & Mechatronics", description: "Explore how a feedback loop helps a machine track a target position or speed.", cover: "/catalog/control-systems.jpg", rating: 4.9, reviews: "430", price: 39, topic: "Identify the set point, sensor and controller in a feedback loop" }),
  sampleCourse({ slug: "vr-and-ar", subjectSlug: "robotics", title: "Introduction to VR & AR Technology", description: "Compare immersive virtual environments with digital objects placed into a view of the real world.", cover: "/catalog/virtual-reality.jpg", rating: 4.6, reviews: "210", price: 29, topic: "Explain the role of tracking in VR and AR" }),
  sampleCourse({ slug: "hsc-mathematics", subjectSlug: "hsc", title: "Mathematics for HSC: Advanced Level", description: "Review function notation, interpret graphs and connect their shapes to equations.", cover: "/catalog/hsc-mathematics-amy-82e11fe1.png", rating: 4.9, reviews: "48", price: 29, topic: "Connect the roots of a quadratic to its graph" }),
  sampleCourse({ slug: "ielts-speaking", subjectSlug: "ielts", title: "IELTS Speaking Foundations", description: "Practise answering a question with a clear point, a reason and a short example.", cover: "/home/ielts.jpg", rating: 4.8, reviews: "36", price: 29, topic: "Develop an answer using a specific example" }),
  sampleCourse({ slug: "university-calculus", subjectSlug: "mathematics", title: "University Calculus Essentials", description: "Explore derivatives as rates of change and interpret them on a graph.", cover: "/home/mathematics.jpg", rating: 4.9, reviews: "24", price: 29, topic: "Interpret the sign of a derivative on an interval" }),
  sampleCourse({ slug: "citizenship-preparation", subjectSlug: "citizenship", title: "Australian Citizenship Test Preparation", description: "Organise your study around government, rights and responsibilities, and Australian values.", cover: "/home/citizenship.jpg", rating: 4.8, reviews: "31", price: 29, topic: "Distinguish study topics and identify areas for review" }),
  sampleCourse({ slug: "hsc-physics", subjectSlug: "hsc", title: "HSC Physics", description: "Study motion, forces and energy with worked examples.", cover: "/home/hsc.jpg", rating: 0, reviews: "0", price: 29, topic: "Apply Newton’s laws to a simple motion problem" }),
  sampleCourse({ slug: "hsc-chemistry", subjectSlug: "hsc", title: "HSC Chemistry", description: "Explore chemical reactions, equilibrium and quantitative chemistry.", cover: "/home/hsc.jpg", rating: 0, reviews: "0", price: 29, topic: "Balance an equation and calculate reaction quantities" }),
  sampleCourse({ slug: "hsc-biology", subjectSlug: "hsc", title: "HSC Biology", description: "Explore cells, inheritance and the way living systems respond to change.", cover: "/home/hsc.jpg", rating: 0, reviews: "0", price: 29, topic: "Explain how genetic information passes between generations" }),
  sampleCourse({ slug: "hsc-english", subjectSlug: "hsc", title: "HSC English", description: "Develop close reading and evidence-based writing for text analysis.", cover: "/home/hsc.jpg", rating: 0, reviews: "0", price: 29, topic: "Build a claim using evidence from a text" }),
  sampleCourse({ slug: "ielts-listening", subjectSlug: "ielts", title: "IELTS Listening Foundations", description: "Practise identifying key information in conversations and short talks.", cover: "/home/ielts.jpg", rating: 0, reviews: "0", price: 29, topic: "Predict the type of answer before listening" }),
  sampleCourse({ slug: "ielts-reading", subjectSlug: "ielts", title: "IELTS Reading Foundations", description: "Practise skimming, scanning and locating evidence in passages.", cover: "/home/ielts.jpg", rating: 0, reviews: "0", price: 29, topic: "Identify evidence for an answer in a passage" }),
  sampleCourse({ slug: "ielts-writing", subjectSlug: "ielts", title: "IELTS Writing Foundations", description: "Learn to structure a response with clear points and examples.", cover: "/home/ielts.jpg", rating: 0, reviews: "0", price: 29, topic: "Plan a coherent response to a writing prompt" }),
  sampleCourse({ slug: "linear-algebra", subjectSlug: "mathematics", title: "Linear Algebra Essentials", description: "Explore vectors, matrices and systems of equations.", cover: "/home/mathematics.jpg", rating: 0, reviews: "0", price: 29, topic: "Represent a linear system using a matrix" }),
  sampleCourse({ slug: "statistics", subjectSlug: "mathematics", title: "Statistics Essentials", description: "Learn to summarise data and interpret variability.", cover: "/home/mathematics.jpg", rating: 0, reviews: "0", price: 29, topic: "Compare distributions using centre and spread" }),
  sampleCourse({ slug: "discrete-mathematics", subjectSlug: "mathematics", title: "Discrete Mathematics", description: "Study sets, logic and basic graph theory.", cover: "/home/mathematics.jpg", rating: 0, reviews: "0", price: 29, topic: "Represent a relationship as a graph" }),
  sampleCourse({ slug: "australian-values", subjectSlug: "citizenship", title: "Australian Values", description: "Explore shared values and their role in Australian civic life.", cover: "/home/citizenship.jpg", rating: 0, reviews: "0", price: 29, topic: "Describe an example of a shared civic value" }),
  sampleCourse({ slug: "government-and-laws", subjectSlug: "citizenship", title: "Government and Laws", description: "Get an overview of government institutions and the role of laws.", cover: "/home/citizenship.jpg", rating: 0, reviews: "0", price: 29, topic: "Distinguish levels of government" }),
  sampleCourse({ slug: "rights-and-responsibilities", subjectSlug: "citizenship", title: "Rights and Responsibilities", description: "Explore key topics about Australian citizenship responsibilities.", cover: "/home/citizenship.jpg", rating: 0, reviews: "0", price: 29, topic: "Identify topics for further citizenship study" }),
];

export function getSubject(slug: string) {
  return subjects.find((subject) => subject.slug === slug);
}

export function getCourse(slug: string) {
  return courses.find((course) => course.slug === slug);
}

export function getCoursesBySubject(slug: string) {
  return courses.filter((course) => course.subjectSlug === slug);
}


export function formatCoursePrice(price: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(price) + " AUD";
}
