export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  searchQuery: string;
  icon: string;
  tags: string[];
}

export const promptTemplates: PromptTemplate[] = [
  // Pedagogical Templates
  {
    id: 'pedagogy-1',
    name: 'Active Learning Strategies',
    category: 'Pedagogy',
    description: 'Research on active learning methodologies in math education',
    searchQuery: 'active learning strategies mathematics education evidence-based practices',
    icon: '🎯',
    tags: ['pedagogy', 'active learning', 'methodology'],
  },
  {
    id: 'pedagogy-2',
    name: 'Formative Assessment',
    category: 'Pedagogy',
    description: 'Effective formative assessment techniques for math',
    searchQuery: 'formative assessment techniques mathematics classroom real-time feedback',
    icon: '📊',
    tags: ['assessment', 'feedback', 'pedagogy'],
  },
  {
    id: 'pedagogy-3',
    name: 'Differentiated Instruction',
    category: 'Pedagogy',
    description: 'Strategies for differentiated math instruction',
    searchQuery: 'differentiated instruction mathematics diverse learners scaffolding strategies',
    icon: '🎨',
    tags: ['differentiation', 'inclusion', 'scaffolding'],
  },

  // Technology Templates
  {
    id: 'tech-1',
    name: 'EdTech Integration',
    category: 'Technology',
    description: 'Effective educational technology in math teaching',
    searchQuery: 'educational technology mathematics integration digital tools learning outcomes',
    icon: '💻',
    tags: ['technology', 'digital tools', 'innovation'],
  },
  {
    id: 'tech-2',
    name: 'AI in Math Education',
    category: 'Technology',
    description: 'AI and machine learning applications in math learning',
    searchQuery: 'artificial intelligence mathematics education adaptive learning personalized instruction',
    icon: '🤖',
    tags: ['AI', 'adaptive learning', 'personalization'],
  },
  {
    id: 'tech-3',
    name: 'Virtual Manipulatives',
    category: 'Technology',
    description: 'Digital manipulatives and visualization tools',
    searchQuery: 'virtual manipulatives mathematics visualization tools interactive learning',
    icon: '🔷',
    tags: ['visualization', 'manipulatives', 'interactive'],
  },

  // Curriculum Templates
  {
    id: 'curriculum-1',
    name: 'Problem-Based Learning',
    category: 'Curriculum',
    description: 'Problem-based learning in math curriculum',
    searchQuery: 'problem-based learning mathematics curriculum real-world applications',
    icon: '🧩',
    tags: ['PBL', 'curriculum', 'real-world'],
  },
  {
    id: 'curriculum-2',
    name: 'Vertical Alignment',
    category: 'Curriculum',
    description: 'Vertical curriculum alignment in math',
    searchQuery: 'vertical alignment mathematics curriculum K-12 coherence progression',
    icon: '📈',
    tags: ['alignment', 'coherence', 'progression'],
  },
  {
    id: 'curriculum-3',
    name: 'STEM Integration',
    category: 'Curriculum',
    description: 'Integrated STEM curriculum design',
    searchQuery: 'STEM integration mathematics interdisciplinary curriculum project-based',
    icon: '🔬',
    tags: ['STEM', 'interdisciplinary', 'integration'],
  },

  // Assessment Templates
  {
    id: 'assessment-1',
    name: 'Standardized Testing',
    category: 'Assessment',
    description: 'Research on standardized math assessments',
    searchQuery: 'standardized testing mathematics SAT AP assessment validity reliability',
    icon: '📝',
    tags: ['testing', 'SAT', 'AP', 'validity'],
  },
  {
    id: 'assessment-2',
    name: 'Alternative Assessment',
    category: 'Assessment',
    description: 'Alternative and authentic assessment methods',
    searchQuery: 'alternative assessment mathematics portfolios performance-based authentic',
    icon: '📂',
    tags: ['alternative', 'authentic', 'portfolios'],
  },

  // Special Topics
  {
    id: 'special-1',
    name: 'Math Anxiety',
    category: 'Psychology',
    description: 'Research on math anxiety and interventions',
    searchQuery: 'mathematics anxiety interventions growth mindset affective factors',
    icon: '🧠',
    tags: ['anxiety', 'mindset', 'psychology'],
  },
  {
    id: 'special-2',
    name: 'Equity in Math',
    category: 'Equity',
    description: 'Equity and access in mathematics education',
    searchQuery: 'equity mathematics education access achievement gap culturally responsive',
    icon: '⚖️',
    tags: ['equity', 'access', 'diversity'],
  },
  {
    id: 'special-3',
    name: 'Mathematical Thinking',
    category: 'Cognition',
    description: 'Development of mathematical thinking and reasoning',
    searchQuery: 'mathematical thinking reasoning problem solving cognitive development',
    icon: '💭',
    tags: ['thinking', 'reasoning', 'cognition'],
  },
];

export function getTemplatesByCategory(category: string): PromptTemplate[] {
  return promptTemplates.filter(t => t.category === category);
}

export function getAllCategories(): string[] {
  return Array.from(new Set(promptTemplates.map(t => t.category)));
}

export function searchTemplates(query: string): PromptTemplate[] {
  const lowerQuery = query.toLowerCase();
  return promptTemplates.filter(
    t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}
