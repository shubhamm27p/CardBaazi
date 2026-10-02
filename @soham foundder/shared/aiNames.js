export const MALE_NAMES = [
  "Aarav", "Vihaan", "Advik", "Reyansh", "Arjun", "Kabir", "Vivaan", "Ayaan", "Rudra", "Atharv", 
  "Ishaan", "Dhruv", "Arnav", "Kiaan", "Yuvaan", "Shaurya", "Ved", "Agastya", "Neil", "Rohan", 
  "Krish", "Aryan", "Samar", "Aditya", "Ranveer", "Darsh", "Ivaan", "Aarush", "Devansh", "Parth", 
  "Rishi", "Samarth", "Shiv", "Vidyut", "Kavish", "Nirvaan", "Pranav", "Raghav", "Siddharth", 
  "Tanish", "Utkarsh", "Vedant", "Yash", "Ziaan", "Akshay", "Ayush", "Chetan", "Daksh", "Eshaan", 
  "Gaurav", "Hrithik", "Jatin", "Kunal", "Lakshya", "Manav", "Nikhil", "Om", "Piyush", 
  "Sarthak", "Tarun", "Uday", "Varun", "Yug", "Zayn", "Ansh", "Bodhi", "Chirag", "Aadi", "Abhinav",
  "Akhil", "Amrit", "Anirudh", "Ankit", "Ashwin", "Bharat", "Bhavik", "Darshan", "Divit", "Eansh",
  "Farhan", "Gagan", "Gautam", "Hardik", "Harsh", "Hemant", "Hridaan", "Jai", "Jash", "Karan",
  "Kartik", "Kian", "Lakshay", "Luv", "Madhav", "Mayank", "Mihir", "Nakul", "Naman", "Nishant",
  "Ojas", "Palash", "Pranav", "Priyam", "Rachit", "Rajat", "Rayan", "Rishi", "Rithvik", "Rohan",
  "Ronit", "Rupesh", "Sahil", "Sanjay", "Saurabh", "Shivaay", "Shreyas", "Soham", "Sparsh", "Surya",
  "Tushar", "Vaibhav", "Varun", "Veer", "Viaan", "Vidur", "Virat", "Vivaan", "Yuvraj", "Zorawar"
];

export const FEMALE_NAMES = [
  "Ananya", "Aadhya", "Myra", "Kiara", "Anvi", "Avni", "Ira", "Siya", "Aarohi", "Meera", 
  "Navya", "Riya", "Tara", "Diya", "Anika", "Ishita", "Kavya", "Shanaya", "Prisha", "Aanya", 
  "Vanya", "Sara", "Aarna", "Mahi", "Zoya", "Amaya", "Bhavya", "Chahat", "Drishti", "Esha", 
  "Falguni", "Gauri", "Hina", "Inaya", "Jhanvi", "Kashvi", "Lavanya", "Mahika", "Naina", "Ojasvi", 
  "Pari", "Raisha", "Suhana", "Trisha", "Urvi", "Vaani", "Yashvi", "Zara", "Aashi", "Bhumi", 
  "Charu", "Devi", "Eva", "Gargi", "Hasti", "Isha", "Jiya", "Kriti", "Lipika", "Manya", 
  "Nishtha", "Oviya", "Pihu", "Rhea", "Saisha", "Tia", "Unnati", "Veda", "Yamini", "Zeenat",
  "Aakriti", "Aditi", "Ahana", "Akshara", "Amira", "Amrita", "Anamika", "Anushka", "Archana",
  "Bani", "Barkha", "Bina", "Chitra", "Dakshita", "Damini", "Darshana", "Disha", "Diya",
  "Eshana", "Fiza", "Gitanjali", "Gunjan", "Harshita", "Hema", "Ipsita", "Ishika", "Jasmine",
  "Jyoti", "Kajal", "Kamakshi", "Karishma", "Khushi", "Kirti", "Komal", "Lata", "Leela",
  "Madhu", "Mala", "Manasi", "Mehak", "Mitali", "Muskaan", "Nandini", "Neha", "Nidhi", "Niharika",
  "Nitika", "Nupur", "Pooja", "Poonam", "Prachi", "Priti", "Priyanka", "Radhika", "Ragini",
  "Rakhi", "Rani", "Ritika", "Roshni", "Ruchi", "Rupali", "Sachi", "Saloni", "Sanjana", "Sanya",
  "Shakti", "Shikha", "Shreya", "Shruti", "Smriti", "Sneha", "Sonal", "Sonam", "Srishti", "Suman"
];

export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function generateRandomIndianAINames(aiCount) {
  const maleCount = Math.ceil(aiCount / 2);
  const femaleCount = Math.floor(aiCount / 2);
  
  const shuffledMales = [...MALE_NAMES];
  const shuffledFemales = [...FEMALE_NAMES];
  
  shuffleArray(shuffledMales);
  shuffleArray(shuffledFemales);
  
  const selectedMales = shuffledMales.slice(0, maleCount).map(name => ({ name, gender: 'male', avatar: '👨' }));
  const selectedFemales = shuffledFemales.slice(0, femaleCount).map(name => ({ name, gender: 'female', avatar: '👩' }));
  
  const result = [...selectedMales, ...selectedFemales];
  shuffleArray(result);
  
  return result;
}
