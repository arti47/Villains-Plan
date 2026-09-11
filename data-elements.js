// Schemer — Meaning Tables: Elements, from the Mythic Game Master Emulator Second
// Edition (Word Mill Games). Cited GME2e. Fourth source.
//
// These are the tables "The Villain Crafter" sends you to for the villain's details
// (MM41:p5 names Identity, Skills, Motivations, Personality, Appearance, Traits & Flaws
// and Background). Word lists only - one d100 per table, index i holds the roll i+1.

export const ELEMENTS_SOURCE = {
  title: "Mythic Game Master Emulator Second Edition",
  section: "Meaning Tables: Elements",
  publisher: "Word Mill Games",
  cite: "GME2e"
};

// The seven tables The Villain Crafter names for fleshing out a villain (MM41:p5).
export const VILLAIN_DETAIL_TABLES = [
  "character-identity", "character-skills", "character-motivations", "character-personality",
  "character-appearance", "character-traits-flaws", "character-background"
];

export const ELEMENT_TABLES = [
  {
    id: "character-identity", label: "Character Identity", cite: "GME2e",
    use: "Who they are, or the role they fill.",
    words: ["Abandoned", "Administrator", "Adventurous", "Adversary", "Advisor", "Ally", "Art", "Artist", "Assistant", "Athlete", "Authority", "Bureaucrat", "Business", "Combatant", "Competitor", "Controller", "Crafter", "Creator", "Criminal", "Deceiver", "Deliverer", "Dependent", "Driver/Pilot", "Elite", "Enemy", "Enforcer", "Engineer", "Entertainer", "Executive", "Expert", "Explorer", "Family", "Farmer", "Fighter", "Fixer", "Foreigner", "Friend", "Gambler", "Gatherer", "Guardian", "Healer", "Helpless", "Hero", "Hunter", "Information", "Innocent", "Inspector", "Intellectual", "Investigator", "Judge", "Killer", "Laborer", "Lackey", "Law", "Leader", "Legal", "Lost", "Mechanical", "Mediator", "Merchant", "Messenger", "Military", "Mundane", "Mystery", "Official", "Organizer", "Outsider", "Performer", "Persecutor", "Planner", "Pleaser", "Power", "Prisoner", "Professional", "Protector", "Public", "Punish", "Radical", "Religious", "Represent", "Rogue", "Ruffian", "Ruler", "Scholar", "Scientist", "Scout", "Servant", "Socialite", "Soldier", "Student", "Subverter", "Supporter", "Survivor", "Teacher", "Thief", "Trader", "Victim", "Villain", "Wanderer", "Warrior"]
  },
  {
    id: "character-motivations", label: "Character Motivations", cite: "GME2e",
    use: "Why they want what they want.",
    words: ["Adventure", "Adversity", "Ambition", "Anger", "Approval", "Art", "Attain", "Business", "Change", "Character", "Conflict", "Control", "Create", "Danger", "Death", "Deceive", "Destroy", "Diminish", "Disrupt", "Emotion", "Enemy", "Environment", "Escape", "Failure", "Fame", "Family", "Fear", "Fight", "Find", "Free", "Friend", "Goal", "Gratify", "Group", "Guide", "Guilt", "Hate", "Heal", "Help", "Hide", "Home", "Hope", "Idea", "Illness", "Important", "Imprison", "Increase", "Information", "Innocent", "Intellect", "Intolerance", "Investment", "Jealousy", "Joy", "Justice", "Leader", "Legal", "Loss", "Love", "Loyalty", "Malice", "Misfortune", "Mistrust", "Mundane", "Mysterious", "Nature", "Object", "Obligation", "Official", "Oppose", "Pain", "Passion", "Path", "Peace", "Physical", "Place", "Plan", "Pleasure", "Power", "Pride", "Protect", "Pursue", "Rare", "Recover", "Reveal", "Revenge", "Riches", "Safety", "Search", "Serve", "Start", "Stop", "Strange", "Struggle", "Success", "Suffering", "Support", "Take", "Transform", "Travel"]
  },
  {
    id: "character-personality", label: "Character Personality", cite: "GME2e",
    use: "How they think and behave.",
    words: ["Active", "Adventurous", "Aggressive", "Agreeable", "Ambitious", "Amusing", "Angry", "Annoying", "Anxious", "Arrogant", "Average", "Awkward", "Bad", "Bitter", "Bold", "Brave", "Calm", "Careful", "Careless", "Classy", "Cold", "Collector", "Committed", "Competitive", "Confident", "Control", "Crazy", "Creative", "Crude", "Curious", "Deceptive", "Determined", "Devoted", "Disagreeable", "Dull", "Emotion", "Empathetic", "Fair", "Fastidious", "Follower", "Foolish", "Friendly", "Good", "Gourmet", "Greed", "Haunted", "Helpful", "Honest", "Honor", "Humble", "Humorous", "Inconsistent", "Independent", "Interesting", "Intolerant", "Irresponsible", "Knowledgeable", "Larcenous", "Leader", "Likable", "Loyal", "Manipulative", "Mercurial", "Naive", "Nervous", "Oblivious", "Obstinate", "Optimistic", "Perceptive", "Perfectionist", "Practical", "Prepared", "Principled", "Protect", "Quiet", "Quirky", "Rash", "Rational", "Respectful", "Responsible", "Restless", "Risk", "Rude", "Savvy", "Searching", "Selfish", "Selfless", "Shallow", "Social", "Strange", "Strong", "Studious", "Superstitious", "Tolerant", "Vindictive", "Vocal", "Wary", "Weak", "Wild", "Wise"]
  },
  {
    id: "character-skills", label: "Character Skills", cite: "GME2e",
    use: "What they are good at.",
    words: ["Activity", "Adversity", "Agility", "Animals", "Art", "Assist", "Athletic", "Attack", "Attain", "Average", "Balance", "Beginner", "Bestow", "Block", "Business", "Change", "Combat", "Communicate", "Conflict", "Control", "Create", "Criminal", "Damage", "Danger", "Deceit", "Decrease", "Defense", "Develop", "Dispute", "Disrupt", "Domestic", "Dominate", "Driving", "Elements", "Energy", "Environment", "Experienced", "Expert", "Fight", "Free", "Guide", "Harm", "Heal", "Health", "Increase", "Inform", "Information", "Inquire", "Inspect", "Intellect", "Invade", "Investigative", "Knowledge", "Leadership", "Legal", "Lethal", "Lie", "Master", "Mechanical", "Medical", "Mental", "Military", "Motion", "Move", "Mundane", "Mysterious", "Nature", "Normal", "Obstacles", "Official", "Open", "Oppose", "Perception", "Practical", "Professional", "Ranged", "Release", "Rogue", "Ruin", "Simple", "Social", "Specialist", "Start", "Stop", "Strange", "Strength", "Struggle", "Suppress", "Take", "Technology", "Transform", "Travel", "Trick", "Usurp", "Vehicle", "Violence", "Water", "Weapon", "Weather", "Wounds"]
  },
  {
    id: "character-appearance", label: "Character Appearance", cite: "GME2e",
    use: "What they look like.",
    words: ["Abnormal", "Armed", "Aromatic", "Athletic", "Attractive", "Average", "Bald", "Beautiful", "Bizarre", "Brutish", "Casual", "Classy", "Clean", "Clothing", "Colorful", "Common", "Cool", "Creepy", "Cute", "Dainty", "Delicate", "Desperate", "Different", "Dirty", "Drab", "Elegant", "Equipment", "Exotic", "Expensive", "Extravagant", "Eyewear", "Familiar", "Fancy", "Features", "Feminine", "Festive", "Frail", "Hair", "Hairy", "Headwear", "Heavy", "Hurt", "Innocent", "Insignia", "Intense", "Interesting", "Intimidating", "Jewelry", "Large", "Lavish", "Lean", "Limbs", "Lithe", "Masculine", "Mature", "Messy", "Mighty", "Modern", "Mundane", "Muscular", "Mysterious", "Natural", "Neat", "Normal", "Odd", "Official", "Old", "Petite", "Piercing", "Powerful", "Professional", "Reassuring", "Regal", "Remarkable", "Rough", "Rustic", "Scar", "Scary", "Scented", "Scholarly", "Short", "Simple", "Sinister", "Small", "Smelly", "Stocky", "Strange", "Striking", "Strong", "Stylish", "Tall", "Tattoo", "Tools", "Trendy", "Unusual", "Very", "Weak", "Weapon", "Wounded", "Young"]
  },
  {
    id: "character-traits-flaws", label: "Character Traits & Flaws", cite: "GME2e",
    use: "The quirk, the edge, or the weakness.",
    words: ["Academic", "Adversity", "Animal", "Assist", "Attract", "Beautiful", "Benefits", "Bestow", "Bizarre", "Block", "Burden", "Combat", "Communicate", "Connection", "Control", "Create", "Criminal", "Damaged", "Dangerous", "Decrease", "Defense", "Delicate", "Different", "Dominate", "Driven", "Emotion", "Enemy", "Energy", "Environment", "Failure", "Fame", "Familiar", "Fast", "Feeble", "Flawless", "Focused", "Fortunate", "Friends", "Good", "Healthy", "Illness", "Impaired", "Increase", "Information", "Inspect", "Intellect", "Intense", "Interesting", "Lacking", "Large", "Leadership", "Legal", "Less", "Lethal", "Limited", "Loyal", "Mental", "Military", "Misfortune", "Missing", "Move", "Multi", "Nature", "Object", "Odd", "Old", "Partial", "Passion", "Perception", "Physical", "Poor", "Possessions", "Power", "Principles", "Public", "Rare", "Remarkable", "Resistant", "Resource", "Rich", "Sense", "Skill", "Small", "Social", "Specialized", "Spirit", "Strange", "Strong", "Suffering", "Technical", "Technology", "Tough", "Travel", "Trouble", "Trustworthy", "Unusual", "Very", "Weak", "Weapon", "Young"]
  },
  {
    id: "character-background", label: "Character Background", cite: "GME2e",
    use: "Where they came from.",
    words: ["Abandoned", "Abuse", "Academic", "Activity", "Adventurous", "Adversity", "Art", "Assist", "Average", "Bad", "Bizarre", "Bleak", "Bold", "Burden", "Business", "Care", "Career", "Chaotic", "Cheat", "Combat", "Commitment", "Community", "Competition", "Conflict", "Control", "Crime", "Damaged", "Danger", "Death", "Deceive", "Decrease", "Defeated", "Disaster", "Dispute", "Emotion", "Environment", "Escape", "Exile", "Experience", "Failure", "Faith", "Fame", "Family", "Fortunate", "Free", "Freedom", "Friend", "Gifts", "Good", "Guided", "Hard", "Harm", "Harsh", "Heal", "Helped", "Heroic", "Humble", "Humiliation", "Imprisonment", "Independent", "Inherit", "Injury", "Injustice", "Legal", "Loss", "Military", "Mistake", "Mundane", "Nature", "Outsider", "Person", "Place", "Poor", "Power", "Prestige", "Privilege", "Pursued", "Recruited", "Religion", "Rural", "Saved", "Search", "Seclusion", "Service", "Sheltered", "Skill", "Strange", "Successful", "Survival", "Tradition", "Training", "Trauma", "Travel", "Urban", "War", "Wealth", "Wild", "Work", "Wounded", "Youth"]
  },
  {
    id: "character-descriptors", label: "Character Descriptors", cite: "GME2e",
    use: "A general word for what someone is like.",
    words: ["Abnormal", "Active", "Adventurous", "Aggressive", "Agreeable", "Ally", "Ancient", "Angry", "Anxious", "Armed", "Aromatic", "Arrogant", "Attractive", "Awkward", "Beautiful", "Bizarre", "Bleak", "Bold", "Brave", "Busy", "Calm", "Capable", "Careful", "Careless", "Caring", "Cautious", "Cheerful", "Classy", "Clean", "Clumsy", "Colorful", "Combative", "Commanding", "Common", "Competitive", "Confident", "Crazy", "Curious", "Dangerous", "Different", "Difficult", "Dirty", "Disagreeable", "Disciplined", "Educated", "Elegant", "Erratic", "Exotic", "Fancy", "Fast", "Foul", "Frightened", "Gentle", "Harmful", "Helpful", "Heroic", "Humorous", "Hurt", "Ignorant", "Impulsive", "Inept", "Informative", "Intelligent", "Interesting", "Intimidating", "Intrusive", "Large", "Loud", "Meek", "Naive", "Old", "Passive", "Polite", "Poor", "Powerful", "Powerless", "Primitive", "Principled", "Quiet", "Respectful", "Rough", "Rude", "Simple", "Skilled", "Slow", "Small", "Sneaky", "Sophisticated", "Strange", "Strong", "Supportive", "Surprising", "Sweet", "Trained", "Uniformed", "Unusual", "Weak", "Wealthy", "Wild", "Young"]
  },
  {
    id: "character-actions-combat", label: "Character Actions, Combat", cite: "GME2e",
    use: "What someone does in a fight.",
    words: ["Abandon", "Abuse", "Aggressive", "Agree", "Ally", "Ambush", "Amuse", "Anger", "Antagonize", "Anxious", "Assist", "Attack", "Betray", "Block", "Bold", "Brave", "Break", "Calm", "Careless", "Carry", "Cautious", "Celebrate", "Change", "Charge", "Communicate", "Compete", "Control", "Crazy", "Cruel", "Damage", "Deceive", "Defend", "Defiant", "Delay", "Disrupt", "Divide", "Dominate", "Energetic", "Enthusiastic", "Expectation", "Fearful", "Ferocious", "Fierce", "Fight", "Flee", "Frantic", "Free", "Frightening", "Harm", "Harsh", "Hasty", "Hide", "Imitate", "Imprison", "Kill", "Lead", "Lethal", "Liberty", "Lie", "Loud", "Loyal", "Magic", "Mechanical", "Mighty", "Military", "Mock", "Move", "Mysterious", "Normal", "Odd", "Open", "Oppose", "Pain", "Path", "Prepare", "Punish", "Pursue", "Rough", "Rude", "Ruin", "Ruthless", "Simple", "Slow", "Spy", "Stop", "Strange", "Struggle", "Suppress", "Swift", "Take", "Technology", "Threaten", "Trick", "Truce", "Usurp", "Vehicle", "Vengeance", "Waste", "Weapon", "Withdraw"]
  },
  {
    id: "character-actions-general", label: "Character Actions, General", cite: "GME2e",
    use: "What someone does outside a fight.",
    words: ["Abandon", "Aggressive", "Amusing", "Anger", "Antagonize", "Anxious", "Assist", "Bestow", "Betray", "Bizarre", "Block", "Bold", "Break", "Calm", "Care", "Careful", "Careless", "Celebrate", "Change", "Combative", "Communicate", "Control", "Crazy", "Creepy", "Dangerous", "Deceive", "Decrease", "Defiant", "Delay", "Disrupt", "Dominate", "Efficient", "Energetic", "Excited", "Expose", "Fearful", "Feeble", "Fierce", "Fight", "Foolish", "Frantic", "Frightening", "Generous", "Gentle", "Harm", "Harsh", "Hasty", "Helpful", "Imitate", "Important", "Imprison", "Increase", "Inspect", "Intense", "Juvenile", "Kind", "Lazy", "Leadership", "Lethal", "Loud", "Loyal", "Mature", "Meaningful", "Messy", "Move", "Mundane", "Mysterious", "Nice", "Normal", "Odd", "Official", "Open", "Oppose", "Passion", "Peace", "Playful", "Pleasures", "Possessions", "Punish", "Pursue", "Release", "Return", "Simple", "Slow", "Start", "Stop", "Strange", "Struggle", "Swift", "Tactics", "Take", "Technology", "Threatening", "Trust", "Violent", "Waste", "Weapons", "Wild", "Work", "Yield"]
  },
  {
    id: "character-conversations", label: "Character Conversations", cite: "GME2e",
    use: "How a conversation goes, or what it is about.",
    words: ["Abuse", "Advice", "Aggressive", "Agree", "Amusing", "Angry", "Anxious", "Assist", "Awkward", "Betray", "Bizarre", "Bleak", "Bold", "Business", "Calm", "Careful", "Careless", "Cautious", "Cheerful", "Classy", "Cold", "Colorful", "Combative", "Crazy", "Creepy", "Curious", "Defiant", "Delightful", "Disagreeable", "Dispute", "Efficient", "Energetic", "Enthusiastic", "Excited", "Fearful", "Fierce", "Foolish", "Frantic", "Frightening", "Generous", "Gentle", "Glad", "Grateful", "Haggle", "Happy", "Harsh", "Hasty", "Helpful", "Helpless", "Hopeless", "Ideas", "Inform", "Innocent", "Inquire", "Intense", "Interesting", "Intolerance", "Irritating", "Joyful", "Judgmental", "Juvenile", "Kind", "Leadership", "Lie", "Loud", "Loving", "Loyal", "Macabre", "Mature", "Meaningful", "Miserable", "Mistrust", "Mocking", "Mundane", "Mysterious", "News", "Nice", "Normal", "Odd", "Offensive", "Official", "Oppose", "Peace", "Plans", "Playful", "Polite", "Positive", "Praise", "Quarrelsome", "Quiet", "Reassuring", "Refuse", "Rude", "Rumor", "Simple", "Threatening", "Truce", "Trust", "Warm", "Wild"]
  },
  {
    id: "city-descriptors", label: "City Descriptors", cite: "GME2e",
    use: "What a place is like - useful for a villain's seat of power.",
    words: ["Activity", "Aggressive", "Aromatic", "Average", "Beautiful", "Bleak", "Block", "Bridge", "Bustling", "Calm", "Chaotic", "Clean", "Cold", "Colorful", "Commerce", "Conflict", "Control", "Crime", "Dangerous", "Dense", "Developed", "Dirty", "Efficient", "Energy", "Enormous", "Environment", "Extravagant", "Festive", "Flawless", "Frightening", "Government", "Happy", "Harsh", "Healthy", "Helpful", "Hills", "History", "Illness", "Important", "Impressive", "Industry", "Interesting", "Intrigues", "Isolated", "Lacking", "Lake", "Large", "Lavish", "Leadership", "Liberty", "Loud", "Magnificent", "Masses", "Meaningful", "Mechanical", "Messy", "Mighty", "Military", "Miserable", "Misfortune", "Modern", "Mountain", "Mundane", "Mysterious", "Nature", "Odd", "Old", "Oppress", "Opulence", "Peace", "Poor", "Powerful", "Protected", "Public", "Quiet", "Rare", "Reassuring", "Remarkable", "River", "Rough", "Ruined", "Rustic", "Simple", "Small", "Sparse", "Structures", "Struggle", "Success", "Suffering", "Technology", "Tension", "Travel", "Troubled", "Valuable", "Warm", "Water", "Weak", "Weather", "Wild", "Work"]
  }
];
