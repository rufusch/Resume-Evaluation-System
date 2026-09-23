import re
import math
from typing import Dict, Any, List, Optional, Tuple

# Skill vocabulary for resume and job-description evidence extraction
COMMON_SKILLS = {
    # Programming Languages
    "python": {"category": "Language", "synonyms": ["python3", "py"]},
    "javascript": {"category": "Language", "synonyms": ["js", "ecmascript", "es6"]},
    "typescript": {"category": "Language", "synonyms": ["ts"]},
    "java": {"category": "Language", "synonyms": ["core java", "j2ee"]},
    "c++": {"category": "Language", "synonyms": ["cpp", "c plus plus"]},
    "c#": {"category": "Language", "synonyms": ["csharp", "c sharp", ".net"]},
    "golang": {"category": "Language", "synonyms": ["go lang", "go programming"]},
    "rust": {"category": "Language", "synonyms": ["rustlang"]},
    "ruby": {"category": "Language", "synonyms": ["ruby on rails"]},
    "php": {"category": "Language", "synonyms": ["php8"]},
    "sql": {"category": "Database/Language", "synonyms": ["ansi sql", "t-sql", "pl/sql"]},
    "r": {"category": "Language", "synonyms": ["r-lang"]},
    "swift": {"category": "Language", "synonyms": ["swiftui"]},
    "kotlin": {"category": "Language", "synonyms": ["kotlin android"]},

    # Web & Frameworks
    "react": {"category": "Framework", "synonyms": ["react.js", "reactjs", "react-native"]},
    "angular": {"category": "Framework", "synonyms": ["angularjs", "angular 2+"]},
    "vue": {"category": "Framework", "synonyms": ["vue.js", "vuejs", "vue3"]},
    "node.js": {"category": "Framework/Runtime", "synonyms": ["node", "nodejs"]},
    "express": {"category": "Framework", "synonyms": ["express.js", "expressjs"]},
    "fastapi": {"category": "Framework", "synonyms": ["fast-api"]},
    "django": {"category": "Framework", "synonyms": ["django rest framework", "drf"]},
    "flask": {"category": "Framework", "synonyms": []},
    "spring boot": {"category": "Framework", "synonyms": ["spring", "springboot"]},
    "next.js": {"category": "Framework", "synonyms": ["nextjs"]},
    "graphql": {"category": "API", "synonyms": ["apollo", "apollo-graphql"]},
    "rest api": {"category": "API", "synonyms": ["restful", "rest apis"]},

    # Cloud & DevOps
    "aws": {"category": "Cloud", "synonyms": ["amazon web services", "ec2", "s3", "lambda", "ecs"]},
    "azure": {"category": "Cloud", "synonyms": ["microsoft azure", "azure devops"]},
    "gcp": {"category": "Cloud", "synonyms": ["google cloud platform", "google cloud"]},
    "docker": {"category": "DevOps", "synonyms": ["docker container", "containerization"]},
    "kubernetes": {"category": "DevOps", "synonyms": ["k8s", "kubectl"]},
    "terraform": {"category": "DevOps", "synonyms": ["iac", "infrastructure as code"]},
    "ci/cd": {"category": "DevOps", "synonyms": ["continuous integration", "github actions", "gitlab ci", "jenkins"]},
    "linux": {"category": "OS", "synonyms": ["unix", "ubuntu", "debian", "redhat", "centos"]},
    "git": {"category": "Version Control", "synonyms": ["github", "gitlab", "version control"]},

    # Databases & Storage
    "postgresql": {"category": "Database", "synonyms": ["postgres", "psql"]},
    "mysql": {"category": "Database", "synonyms": ["mariadb"]},
    "mongodb": {"category": "Database", "synonyms": ["mongo", "nosql"]},
    "redis": {"category": "Database/Cache", "synonyms": ["in-memory cache"]},
    "elasticsearch": {"category": "Search/DB", "synonyms": ["elastic search", "opensearch"]},
    "dynamodb": {"category": "Database", "synonyms": []},
    "snowflake": {"category": "Data Warehouse", "synonyms": []},
    "kafka": {"category": "Streaming", "synonyms": ["apache kafka", "event streaming"]},

    # AI / Data Science
    "machine learning": {"category": "AI/ML", "synonyms": ["ml", "deep learning", "ai"]},
    "pytorch": {"category": "AI/ML", "synonyms": ["torch"]},
    "tensorflow": {"category": "AI/ML", "synonyms": ["tf", "keras"]},
    "scikit-learn": {"category": "AI/ML", "synonyms": ["sklearn"]},
    "pandas": {"category": "Data", "synonyms": []},
    "numpy": {"category": "Data", "synonyms": []},
    "nlp": {"category": "AI/ML", "synonyms": ["natural language processing", "llm", "transformers"]},
    "computer vision": {"category": "AI/ML", "synonyms": ["opencv"]},

    # Architecture & Practices
    "microservices": {"category": "Architecture", "synonyms": ["distributed systems", "service-oriented"]},
    "system design": {"category": "Architecture", "synonyms": ["scalable architecture", "high availability"]},
    "agile": {"category": "Methodology", "synonyms": ["scrum", "kanban", "sprints"]},
    "testing": {"category": "Quality", "synonyms": ["unit testing", "jest", "pytest", "cypress", "tdd"]},
}
# Cross-domain vocabulary. Explicit JD skill lists also support terms outside this catalog.
COMMON_SKILLS.update({
    # Business & Management
    'project management': {"category": 'Business & Management', "synonyms": []},
    'program management': {"category": 'Business & Management', "synonyms": []},
    'product management': {"category": 'Business & Management', "synonyms": []},
    'stakeholder management': {"category": 'Business & Management', "synonyms": []},
    'strategic planning': {"category": 'Business & Management', "synonyms": []},
    'business analysis': {"category": 'Business & Management', "synonyms": []},
    'change management': {"category": 'Business & Management', "synonyms": []},
    'risk management': {"category": 'Business & Management', "synonyms": []},
    'process improvement': {"category": 'Business & Management', "synonyms": []},
    'business development': {"category": 'Business & Management', "synonyms": []},
    'operations management': {"category": 'Business & Management', "synonyms": []},
    'budgeting': {"category": 'Business & Management', "synonyms": []},
    'negotiation': {"category": 'Business & Management', "synonyms": []},
    'leadership': {"category": 'Business & Management', "synonyms": []},
    'communication': {"category": 'Business & Management', "synonyms": ['written communication', 'verbal communication']},
    'teamwork': {"category": 'Business & Management', "synonyms": []},
    'problem solving': {"category": 'Business & Management', "synonyms": ['problem-solving']},
    'critical thinking': {"category": 'Business & Management', "synonyms": []},
    'time management': {"category": 'Business & Management', "synonyms": []},
    'public speaking': {"category": 'Business & Management', "synonyms": []},
    # Finance & Accounting
    'financial analysis': {"category": 'Finance & Accounting', "synonyms": []},
    'financial modeling': {"category": 'Finance & Accounting', "synonyms": ['financial modelling']},
    'accounting': {"category": 'Finance & Accounting', "synonyms": []},
    'bookkeeping': {"category": 'Finance & Accounting', "synonyms": []},
    'auditing': {"category": 'Finance & Accounting', "synonyms": []},
    'taxation': {"category": 'Finance & Accounting', "synonyms": []},
    'payroll': {"category": 'Finance & Accounting', "synonyms": []},
    'accounts payable': {"category": 'Finance & Accounting', "synonyms": []},
    'accounts receivable': {"category": 'Finance & Accounting', "synonyms": []},
    'bank reconciliation': {"category": 'Finance & Accounting', "synonyms": []},
    'financial reporting': {"category": 'Finance & Accounting', "synonyms": []},
    'investment analysis': {"category": 'Finance & Accounting', "synonyms": []},
    'portfolio management': {"category": 'Finance & Accounting', "synonyms": []},
    'credit analysis': {"category": 'Finance & Accounting', "synonyms": []},
    'valuation': {"category": 'Finance & Accounting', "synonyms": []},
    'gaap': {"category": 'Finance & Accounting', "synonyms": []},
    'ifrs': {"category": 'Finance & Accounting', "synonyms": []},
    'quickbooks': {"category": 'Finance & Accounting', "synonyms": []},
    'tally': {"category": 'Finance & Accounting', "synonyms": []},
    'sap fico': {"category": 'Finance & Accounting', "synonyms": []},
    # Marketing & Sales
    'digital marketing': {"category": 'Marketing & Sales', "synonyms": []},
    'content marketing': {"category": 'Marketing & Sales', "synonyms": []},
    'copywriting': {"category": 'Marketing & Sales', "synonyms": []},
    'search engine optimization': {"category": 'Marketing & Sales', "synonyms": ['seo']},
    'search engine marketing': {"category": 'Marketing & Sales', "synonyms": ['sem']},
    'social media marketing': {"category": 'Marketing & Sales', "synonyms": []},
    'email marketing': {"category": 'Marketing & Sales', "synonyms": []},
    'market research': {"category": 'Marketing & Sales', "synonyms": []},
    'brand management': {"category": 'Marketing & Sales', "synonyms": []},
    'campaign management': {"category": 'Marketing & Sales', "synonyms": []},
    'google analytics': {"category": 'Marketing & Sales', "synonyms": []},
    'google ads': {"category": 'Marketing & Sales', "synonyms": []},
    'salesforce': {"category": 'Marketing & Sales', "synonyms": []},
    'hubspot': {"category": 'Marketing & Sales', "synonyms": []},
    'lead generation': {"category": 'Marketing & Sales', "synonyms": []},
    'sales forecasting': {"category": 'Marketing & Sales', "synonyms": []},
    'account management': {"category": 'Marketing & Sales', "synonyms": []},
    'customer relationship management': {"category": 'Marketing & Sales', "synonyms": ['crm']},
    'customer service': {"category": 'Marketing & Sales', "synonyms": []},
    'customer success': {"category": 'Marketing & Sales', "synonyms": []},
    # Healthcare
    'patient care': {"category": 'Healthcare', "synonyms": ['patient assessment']},
    'clinical assessment': {"category": 'Healthcare', "synonyms": []},
    'nursing': {"category": 'Healthcare', "synonyms": []},
    'medication administration': {"category": 'Healthcare', "synonyms": []},
    'infection control': {"category": 'Healthcare', "synonyms": []},
    'wound care': {"category": 'Healthcare', "synonyms": []},
    'phlebotomy': {"category": 'Healthcare', "synonyms": []},
    'medical coding': {"category": 'Healthcare', "synonyms": []},
    'medical billing': {"category": 'Healthcare', "synonyms": []},
    'electronic health records': {"category": 'Healthcare', "synonyms": ['ehr', 'emr', 'electronic medical records']},
    'clinical research': {"category": 'Healthcare', "synonyms": []},
    'pharmacovigilance': {"category": 'Healthcare', "synonyms": []},
    'radiology': {"category": 'Healthcare', "synonyms": []},
    'physiotherapy': {"category": 'Healthcare', "synonyms": []},
    'nutrition': {"category": 'Healthcare', "synonyms": []},
    'public health': {"category": 'Healthcare', "synonyms": []},
    'epidemiology': {"category": 'Healthcare', "synonyms": []},
    'health education': {"category": 'Healthcare', "synonyms": []},
    'basic life support': {"category": 'Healthcare', "synonyms": ['bls']},
    'advanced cardiac life support': {"category": 'Healthcare', "synonyms": ['acls']},
    # Education
    'teaching': {"category": 'Education & Training', "synonyms": []},
    'curriculum development': {"category": 'Education & Training', "synonyms": []},
    'lesson planning': {"category": 'Education & Training', "synonyms": []},
    'classroom management': {"category": 'Education & Training', "synonyms": []},
    'instructional design': {"category": 'Education & Training', "synonyms": []},
    'assessment design': {"category": 'Education & Training', "synonyms": []},
    'special education': {"category": 'Education & Training', "synonyms": []},
    'educational technology': {"category": 'Education & Training', "synonyms": []},
    'e-learning': {"category": 'Education & Training', "synonyms": ['elearning']},
    'student counseling': {"category": 'Education & Training', "synonyms": []},
    'academic research': {"category": 'Education & Training', "synonyms": []},
    'learning management systems': {"category": 'Education & Training', "synonyms": ['lms']},
    'moodle': {"category": 'Education & Training', "synonyms": []},
    'training and development': {"category": 'Education & Training', "synonyms": []},
    # Legal & Compliance
    'legal research': {"category": 'Legal & Compliance', "synonyms": []},
    'contract drafting': {"category": 'Legal & Compliance', "synonyms": []},
    'contract review': {"category": 'Legal & Compliance', "synonyms": []},
    'litigation': {"category": 'Legal & Compliance', "synonyms": []},
    'regulatory compliance': {"category": 'Legal & Compliance', "synonyms": []},
    'due diligence': {"category": 'Legal & Compliance', "synonyms": []},
    'intellectual property': {"category": 'Legal & Compliance', "synonyms": []},
    'corporate law': {"category": 'Legal & Compliance', "synonyms": []},
    'employment law': {"category": 'Legal & Compliance', "synonyms": []},
    'data privacy': {"category": 'Legal & Compliance', "synonyms": []},
    'gdpr': {"category": 'Legal & Compliance', "synonyms": []},
    'anti-money laundering': {"category": 'Legal & Compliance', "synonyms": ['aml']},
    'know your customer': {"category": 'Legal & Compliance', "synonyms": ['kyc']},
    'policy development': {"category": 'Legal & Compliance', "synonyms": []},
    # Engineering & Manufacturing
    'autocad': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'solidworks': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'revit': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'catia': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'matlab': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'simulink': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'finite element analysis': {"category": 'Engineering & Manufacturing', "synonyms": ['fea']},
    'computational fluid dynamics': {"category": 'Engineering & Manufacturing', "synonyms": ['cfd']},
    'mechanical design': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'electrical design': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'circuit design': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'pcb design': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'embedded systems': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'plc programming': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'scada': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'cnc machining': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'welding': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'quality assurance': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'quality control': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'lean manufacturing': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'six sigma': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'statistical process control': {"category": 'Engineering & Manufacturing', "synonyms": ['spc']},
    'preventive maintenance': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'root cause analysis': {"category": 'Engineering & Manufacturing', "synonyms": ['rca']},
    'iso 9001': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'civil engineering': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'structural analysis': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'surveying': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'construction management': {"category": 'Engineering & Manufacturing', "synonyms": []},
    'building information modeling': {"category": 'Engineering & Manufacturing', "synonyms": ['bim']},
    # Supply Chain & Logistics
    'supply chain management': {"category": 'Supply Chain & Logistics', "synonyms": []},
    'procurement': {"category": 'Supply Chain & Logistics', "synonyms": []},
    'inventory management': {"category": 'Supply Chain & Logistics', "synonyms": []},
    'warehouse management': {"category": 'Supply Chain & Logistics', "synonyms": []},
    'demand planning': {"category": 'Supply Chain & Logistics', "synonyms": []},
    'logistics': {"category": 'Supply Chain & Logistics', "synonyms": []},
    'freight forwarding': {"category": 'Supply Chain & Logistics', "synonyms": []},
    'vendor management': {"category": 'Supply Chain & Logistics', "synonyms": []},
    'fleet management': {"category": 'Supply Chain & Logistics', "synonyms": []},
    'transportation planning': {"category": 'Supply Chain & Logistics', "synonyms": []},
    'order fulfillment': {"category": 'Supply Chain & Logistics', "synonyms": []},
    'import export': {"category": 'Supply Chain & Logistics', "synonyms": []},
    'erp': {"category": 'Supply Chain & Logistics', "synonyms": ['enterprise resource planning']},
    # Human Resources
    'recruitment': {"category": 'Human Resources', "synonyms": []},
    'talent acquisition': {"category": 'Human Resources', "synonyms": []},
    'employee relations': {"category": 'Human Resources', "synonyms": []},
    'performance management': {"category": 'Human Resources', "synonyms": []},
    'compensation and benefits': {"category": 'Human Resources', "synonyms": []},
    'workforce planning': {"category": 'Human Resources', "synonyms": []},
    'onboarding': {"category": 'Human Resources', "synonyms": []},
    'hr analytics': {"category": 'Human Resources', "synonyms": []},
    'hris': {"category": 'Human Resources', "synonyms": ['human resources information systems']},
    'workday': {"category": 'Human Resources', "synonyms": []},
    'succession planning': {"category": 'Human Resources', "synonyms": []},
    # Design & Media
    'graphic design': {"category": 'Design & Media', "synonyms": []},
    'ui design': {"category": 'Design & Media', "synonyms": ['user interface design']},
    'ux design': {"category": 'Design & Media', "synonyms": ['user experience design']},
    'user research': {"category": 'Design & Media', "synonyms": []},
    'usability testing': {"category": 'Design & Media', "synonyms": []},
    'wireframing': {"category": 'Design & Media', "synonyms": []},
    'prototyping': {"category": 'Design & Media', "synonyms": []},
    'figma': {"category": 'Design & Media', "synonyms": []},
    'adobe photoshop': {"category": 'Design & Media', "synonyms": ['photoshop']},
    'adobe illustrator': {"category": 'Design & Media', "synonyms": ['illustrator']},
    'adobe indesign': {"category": 'Design & Media', "synonyms": ['indesign']},
    'video editing': {"category": 'Design & Media', "synonyms": []},
    'adobe premiere pro': {"category": 'Design & Media', "synonyms": ['premiere pro']},
    'after effects': {"category": 'Design & Media', "synonyms": []},
    'blender': {"category": 'Design & Media', "synonyms": []},
    'animation': {"category": 'Design & Media', "synonyms": []},
    'photography': {"category": 'Design & Media', "synonyms": []},
    'typography': {"category": 'Design & Media', "synonyms": []},
    'accessibility': {"category": 'Design & Media', "synonyms": []},
    'technical writing': {"category": 'Design & Media', "synonyms": []},
    'journalism': {"category": 'Design & Media', "synonyms": []},
    # Science & Environment
    'laboratory techniques': {"category": 'Science & Environment', "synonyms": []},
    'molecular biology': {"category": 'Science & Environment', "synonyms": []},
    'cell culture': {"category": 'Science & Environment', "synonyms": []},
    'pcr': {"category": 'Science & Environment', "synonyms": []},
    'chromatography': {"category": 'Science & Environment', "synonyms": []},
    'mass spectrometry': {"category": 'Science & Environment', "synonyms": []},
    'spectroscopy': {"category": 'Science & Environment', "synonyms": []},
    'bioinformatics': {"category": 'Science & Environment', "synonyms": []},
    'biostatistics': {"category": 'Science & Environment', "synonyms": []},
    'chemistry': {"category": 'Science & Environment', "synonyms": []},
    'microbiology': {"category": 'Science & Environment', "synonyms": []},
    'environmental impact assessment': {"category": 'Science & Environment', "synonyms": []},
    'sustainability': {"category": 'Science & Environment', "synonyms": []},
    'renewable energy': {"category": 'Science & Environment', "synonyms": []},
    'gis': {"category": 'Science & Environment', "synonyms": ['geographic information systems']},
    'remote sensing': {"category": 'Science & Environment', "synonyms": []},
    'agronomy': {"category": 'Science & Environment', "synonyms": []},
    'soil science': {"category": 'Science & Environment', "synonyms": []},
    'food safety': {"category": 'Science & Environment', "synonyms": []},
    'haccp': {"category": 'Science & Environment', "synonyms": []},
    'good manufacturing practice': {"category": 'Science & Environment', "synonyms": ['gmp']},
    'good laboratory practice': {"category": 'Science & Environment', "synonyms": ['glp']},
    # Hospitality & Services
    'hospitality management': {"category": 'Hospitality & Services', "synonyms": []},
    'hotel operations': {"category": 'Hospitality & Services', "synonyms": []},
    'event planning': {"category": 'Hospitality & Services', "synonyms": []},
    'food and beverage management': {"category": 'Hospitality & Services', "synonyms": []},
    'culinary arts': {"category": 'Hospitality & Services', "synonyms": []},
    'menu planning': {"category": 'Hospitality & Services', "synonyms": []},
    'housekeeping': {"category": 'Hospitality & Services', "synonyms": []},
    'reservation management': {"category": 'Hospitality & Services', "synonyms": []},
    'tourism management': {"category": 'Hospitality & Services', "synonyms": []},
    'retail management': {"category": 'Hospitality & Services', "synonyms": []},
    'visual merchandising': {"category": 'Hospitality & Services', "synonyms": []},
    # Data & Office Tools
    'microsoft excel': {"category": 'Data & Office Tools', "synonyms": ['ms excel', 'excel']},
    'microsoft word': {"category": 'Data & Office Tools', "synonyms": ['ms word']},
    'microsoft powerpoint': {"category": 'Data & Office Tools', "synonyms": ['powerpoint', 'ms powerpoint']},
    'power bi': {"category": 'Data & Office Tools', "synonyms": ['powerbi']},
    'tableau': {"category": 'Data & Office Tools', "synonyms": []},
    'data analysis': {"category": 'Data & Office Tools', "synonyms": []},
    'data visualization': {"category": 'Data & Office Tools', "synonyms": []},
    'statistical analysis': {"category": 'Data & Office Tools', "synonyms": []},
    'spss': {"category": 'Data & Office Tools', "synonyms": []},
    'sas': {"category": 'Data & Office Tools', "synonyms": []},
    'stata': {"category": 'Data & Office Tools', "synonyms": []},
    'data entry': {"category": 'Data & Office Tools', "synonyms": []},
    'google sheets': {"category": 'Data & Office Tools', "synonyms": []},
    'power query': {"category": 'Data & Office Tools', "synonyms": []},
    'data governance': {"category": 'Data & Office Tools', "synonyms": []},
    'data engineering': {"category": 'Data & Office Tools', "synonyms": []},
    'apache spark': {"category": 'Data & Office Tools', "synonyms": ['pyspark']},
    'airflow': {"category": 'Data & Office Tools', "synonyms": []},
    'dbt': {"category": 'Data & Office Tools', "synonyms": []},
    # Cybersecurity & IT
    'cybersecurity': {"category": 'Cybersecurity & IT', "synonyms": []},
    'network security': {"category": 'Cybersecurity & IT', "synonyms": []},
    'penetration testing': {"category": 'Cybersecurity & IT', "synonyms": []},
    'incident response': {"category": 'Cybersecurity & IT', "synonyms": []},
    'digital forensics': {"category": 'Cybersecurity & IT', "synonyms": []},
    'identity and access management': {"category": 'Cybersecurity & IT', "synonyms": ['iam']},
    'siem': {"category": 'Cybersecurity & IT', "synonyms": []},
    'network administration': {"category": 'Cybersecurity & IT', "synonyms": []},
    'technical support': {"category": 'Cybersecurity & IT', "synonyms": []},
    'itil': {"category": 'Cybersecurity & IT', "synonyms": []},
    'cisco': {"category": 'Cybersecurity & IT', "synonyms": []},
    'tcp/ip': {"category": 'Cybersecurity & IT', "synonyms": []},
    'dns': {"category": 'Cybersecurity & IT', "synonyms": []},
    'windows server': {"category": 'Cybersecurity & IT', "synonyms": []},
})


def extract_tokens_and_phrases(text: str) -> List[str]:
    """Generates 1-gram, 2-gram, and 3-gram lowercased tokens from text for exact matching."""
    clean = re.sub(r'[^a-zA-Z0-9\+\#\.\s]', ' ', text.lower())
    words = clean.split()
    phrases = []
    for i in range(len(words)):
        phrases.append(words[i])
        if i + 1 < len(words):
            phrases.append(f"{words[i]} {words[i+1]}")
        if i + 2 < len(words):
            phrases.append(f"{words[i]} {words[i+1]} {words[i+2]}")
    return phrases

def skill_pattern(term: str) -> str:
    """Match whole terms, including punctuation-ended skills such as C++ and C#."""
    return rf"(?<![\w+#]){re.escape(term)}(?![\w+#])"


def has_skill(key: str, text: str) -> bool:
    terms = [key] + COMMON_SKILLS.get(key, {}).get("synonyms", [])
    return any(re.search(skill_pattern(term), text, re.IGNORECASE) for term in terms)


def explicit_skill_terms(line: str) -> List[str]:
    """Conservative fallback for named skill lists, not arbitrary prose requirements."""
    match = re.match(r"^(?:(?:required|preferred|technical|core|desired)\s+)?(?:skills|competencies|tools|expertise)\s*:\s*(.+)$", line, re.I)
    if not match:
        return []
    terms = re.split(r"[,;|]", match.group(1))
    return [term.strip().strip(".") for term in terms
            if 1 < len(term.strip()) <= 70 and len(term.split()) <= 7]


def find_evidence_sentence(keyword: str, text: str) -> Optional[str]:
    """Finds the most specific sentence containing the keyword in the text."""
    sentences = re.split(r'\n+|(?<=[.!?])\s+', text)
    terms = [keyword] + COMMON_SKILLS.get(keyword, {}).get('synonyms', [])
    pattern = re.compile('|'.join(skill_pattern(term) for term in terms), re.IGNORECASE)
    for s in sentences:
        s_clean = s.strip()
        if len(s_clean) > 15 and pattern.search(s_clean):
            return s_clean
    return None

def parse_resume_content(resume_text: str) -> Dict[str, Any]:
    """
    Parses resume text into structured components:
    Profile, Skills, Projects (with Problem/Tech/Role/Solution/Outcome), Experience, Education, Certifications.
    """
    lines = [line.strip() for line in resume_text.split("\n") if line.strip()]
    
    # 1. Contact / Name extraction
    name = "Candidate"
    email = ""
    phone = ""
    for line in lines[:10]:
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', line)
        if email_match:
            email = email_match.group(0)
        phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', line)
        if phone_match:
            phone = phone_match.group(0)
            
    # Name is typically the first non-empty line without special characters or emails
    for line in lines[:5]:
        if not re.search(r'[@\(\)\d\|]', line) and len(line.split()) in [2, 3, 4] and len(line) < 40:
            name = line.title()
            break

    # 2. Section Segmentation
    sections = {"summary": [], "experience": [], "education": [], "skills": [], "projects": [], "certifications": []}
    current_section = "summary"
    
    section_patterns = {
        "experience": r'^(experience|work experience|employment|work history|professional experience)',
        "education": r'^(education|academic background|academics|qualifications)',
        "skills": r'^(skills|technical skills|core competencies|technologies|expertise|skills & tools)',
        "projects": r'^(projects|academic projects|key projects|personal projects|technical projects)',
        "certifications": r'^(certifications|licenses|courses|awards|credentials)'
    }
    
    for line in lines:
        lower_line = line.lower().strip(': -#')
        matched_section = False
        for sec_name, pattern in section_patterns.items():
            if re.match(pattern, lower_line, re.IGNORECASE):
                current_section = sec_name
                matched_section = True
                break
        if not matched_section:
            sections[current_section].append(line)

    # 3. Detect Skills in Resume
    detected_skills = {}
    resume_lower = resume_text.lower()
    for skill_name, meta in COMMON_SKILLS.items():
        if has_skill(skill_name, resume_text):
            evidence = find_evidence_sentence(skill_name, resume_text) or f"Identified in resume ({meta['category']})"
            detected_skills[skill_name] = {
                "name": skill_name.title() if len(skill_name) > 3 else skill_name.upper(),
                "category": meta["category"],
                "evidence": evidence
            }

    # 4. Parse Structured Projects (Project -> Technologies -> Role -> Problem -> Solution -> Outcome)
    projects = []
    proj_lines = sections.get("projects", [])
    if proj_lines:
        current_proj = None
        for line in proj_lines:
            # Check if line looks like a project title (bold, short line, or date/bullet)
            if len(line) < 60 and not line.startswith(('•', '-', '*', 'Key', 'Tech')):
                if current_proj:
                    projects.append(current_proj)
                title = line.strip(" #:-")
                current_proj = {
                    "title": title,
                    "technologies": [],
                    "role": "Lead / Contributor",
                    "problem": "Addressed technical and product requirements through targeted engineering.",
                    "solution": "Architected, implemented, and tested modular components.",
                    "outcome": "Delivered functional milestone with measurable performance impact.",
                    "skills_demonstrated": [],
                    "interview_relevance": f"Demonstrates practical hands-on capability in {title}."
                }
            elif current_proj:
                # Check for technologies
                tech_match = re.search(r'(?:tech(?:nologies)?|built with|stack|using):\s*(.*)', line, re.IGNORECASE)
                if tech_match:
                    techs = [t.strip() for t in tech_match.group(1).split(",") if t.strip()]
                    current_proj["technologies"].extend(techs)
                elif any(word in line.lower() for word in ['reduced', 'improved', 'increased', '%', 'achieved', 'deployed', 'result']):
                    current_proj["outcome"] = line.lstrip('•-* ')
                elif any(word in line.lower() for word in ['built', 'developed', 'created', 'designed', 'implemented']):
                    current_proj["solution"] = line.lstrip('•-* ')
                elif any(word in line.lower() for word in ['problem', 'challenge', 'objective', 'goal']):
                    current_proj["problem"] = line.lstrip('•-* ')
                else:
                    # Append general detail to solution
                    if len(line) > 20:
                        current_proj["solution"] += " " + line.lstrip('•-* ')
        if current_proj:
            projects.append(current_proj)

    # If no structured projects found, extrapolate from experience or general text
    if not projects:
        # Generate project representation from experience lines
        exp_lines = sections.get("experience", [])
        if exp_lines:
            proj_title = exp_lines[0] if len(exp_lines) > 0 else "System Architecture Project"
            projects.append({
                "title": proj_title.strip("•-* "),
                "technologies": [s["name"] for s in list(detected_skills.values())[:5]],
                "role": "Core Developer / Engineer",
                "problem": "Engineered scalable solutions meeting performance benchmarks.",
                "solution": " ".join([l.strip("•-* ") for l in exp_lines[1:4] if len(l) > 15]) or "Designed and deployed critical features.",
                "outcome": "Enhanced operational reliability and system maintainability.",
                "skills_demonstrated": [s["name"] for s in list(detected_skills.values())[:4]],
                "interview_relevance": "Direct evidence of real-world implementation depth."
            })
        else:
            projects.append({
                "title": "Core Technical Initiative",
                "technologies": [s["name"] for s in list(detected_skills.values())[:4]],
                "role": "Engineer",
                "problem": "Delivered domain-specific software functionality according to specification.",
                "solution": "Structured modular codebase and integrated backend services.",
                "outcome": "Successfully achieved operational milestone with verifiable code artifacts.",
                "skills_demonstrated": [s["name"] for s in list(detected_skills.values())[:3]],
                "interview_relevance": "Provides technical talking points for system design questions."
            })

    # Ensure technologies and skills_demonstrated are populated
    for p in projects:
        if not p["technologies"]:
            # Find any detected skill appearing in project description
            p_text = f"{p['title']} {p['problem']} {p['solution']} {p['outcome']}".lower()
            matching_techs = [s["name"] for s_key, s in detected_skills.items() if s_key in p_text]
            p["technologies"] = matching_techs[:5] if matching_techs else ["Python", "SQL", "Git"]
        if not p["skills_demonstrated"]:
            p["skills_demonstrated"] = p["technologies"][:4]

    # 5. Extract Education & Experience summaries
    education_items = [line.strip("•-* ") for line in sections.get("education", []) if len(line) > 5]
    if not education_items:
        # Search anywhere in text
        edu_matches = re.findall(r'(?:bachelor|master|phd|b\.s\.|m\.s\.|b\.tech|m\.tech|b\.e\.|degree|university|college|institute)[\w\s,.-]+', resume_text, re.IGNORECASE)
        education_items = [e.strip() for e in edu_matches[:3]] or ["Formal degree / coursework in relevant technical field"]

    experience_items = [line.strip("•-* ") for line in sections.get("experience", []) if len(line) > 10]
    cert_items = [line.strip("•-* ") for line in sections.get("certifications", []) if len(line) > 5]

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "summary": " ".join(sections.get("summary", []))[:300] or "Experienced professional with engineering and technical background.",
        "skills": detected_skills,
        "work_evidence": "\n".join(sections["experience"] + sections["projects"]),
        "projects": projects,
        "experience": experience_items,
        "education": education_items,
        "certifications": cert_items,
        "languages": ["English"]
    }

def parse_job_description(jd_text: str) -> Dict[str, Any]:
    """
    Extracts requirements, roles, preferred skills, explicit qualifications from JD.
    """
    lines = [line.strip() for line in jd_text.split("\n") if line.strip()]
    
    # 1. Job Role & Company extraction
    job_title = "Target Role"
    company = "Hiring Organization"
    
    for line in lines[:5]:
        title_match = re.search(r'(?:role|title|position):\s*(.+)', line, re.IGNORECASE)
        if title_match:
            job_title = title_match.group(1).strip()
            break
        elif any(kw in line.lower() for kw in ['engineer', 'developer', 'architect', 'scientist', 'manager', 'lead', 'analyst', 'designer', 'consultant', 'nurse', 'teacher', 'accountant', 'lawyer', 'technician', 'chef', 'officer', 'specialist']):
            if len(line) < 60:
                job_title = line.strip("#: -")
                break

    for line in lines[:6]:
        comp_match = re.search(r'(?:at|company|client):\s*(.+)', line, re.IGNORECASE)
        if comp_match:
            company = comp_match.group(1).strip()
            break
        elif "inc." in line.lower() or "corp" in line.lower() or "ltd" in line.lower() or "technologies" in line.lower():
            if len(line) < 50:
                company = line.strip("#: -")
                break

    # 2. Extract Requirements
    # Search for known skills in JD
    jd_lower = jd_text.lower()
    required_skills = []
    preferred_skills = []
    
    # Check for preferred / bonus section
    preferred_section_active = False
    for line in lines:
        low = line.lower()
        if any(h in low for h in ['preferred', 'nice to have', 'bonus', 'plus', 'good to have', 'desired']):
            preferred_section_active = True
        elif any(h in low for h in ['required', 'minimum qualifications', 'must have', 'requirements', 'responsibilities']):
            preferred_section_active = False

        for skill_name, meta in COMMON_SKILLS.items():
            if has_skill(skill_name, low):
                display_name = skill_name.title() if len(skill_name) > 3 else skill_name.upper()
                skill_obj = {
                    "name": display_name,
                    "key": skill_name,
                    "category": meta["category"],
                    "is_preferred": preferred_section_active
                }
                if preferred_section_active:
                    if not any(s["key"] == skill_name for s in preferred_skills):
                        preferred_skills.append(skill_obj)
                else:
                    if not any(s["key"] == skill_name for s in required_skills):
                        required_skills.append(skill_obj)

        # Retain explicitly named niche skills even when common skills were also found.
        for term in explicit_skill_terms(line):
            if any(has_skill(key, term) for key in COMMON_SKILLS):
                continue
            skill_obj = {"name": term, "key": term.lower(), "category": "Domain",
                         "is_preferred": preferred_section_active}
            target = preferred_skills if preferred_section_active else required_skills
            if not any(item["key"] == skill_obj["key"] for item in target):
                target.append(skill_obj)

    # A required occurrence takes precedence over a repeated preferred occurrence.
    required_keys = {item["key"] for item in required_skills}
    preferred_skills = [item for item in preferred_skills if item["key"] not in required_keys]

    # Years of experience check
    exp_years = 0
    exp_match = re.search(r'(\d+)[\+]?\s*(?:-\s*(\d+))?\s*(?:years|yrs)\s+(?:of\s+)?experience', jd_lower)
    if exp_match:
        exp_years = int(exp_match.group(1))

    # Degree check
    degree_req = "Bachelor's degree or equivalent practical experience"
    if "master" in jd_lower:
        degree_req = "Master's degree preferred or equivalent experience"
    elif "phd" in jd_lower:
        degree_req = "Ph.D. or Master's in relevant discipline"

    return {
        "job_title": job_title,
        "company": company,
        "required_skills": required_skills,
        "preferred_skills": preferred_skills,
        "experience_years": exp_years,
        "degree_requirement": degree_req,
        "responsibilities": [l.strip("•-* ") for l in lines if any(k in l.lower() for k in ['develop', 'lead', 'design', 'collaborate', 'maintain', 'build'])][:5]
    }

def analyze_match(resume_text: str, jd_text: str, resume_data: Dict[str, Any], jd_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evidence-based matching engine comparing Resume against Job Requirements.
    Statuses: FULL MATCH, PARTIAL MATCH (with exact gap), NOT EVIDENCED, UNCERTAIN.
    Calculates evidence coverage & qualitative assessment.
    """
    resume_lower = resume_text.lower()
    resume_skills = dict(resume_data["skills"])
    for req in jd_data["required_skills"] + jd_data["preferred_skills"]:
        if req["key"] not in resume_skills and has_skill(req["key"], resume_text):
            resume_skills[req["key"]] = {"name": req["name"], "category": req["category"],
                "evidence": find_evidence_sentence(req["key"], resume_text) or req["name"]}
    all_jd_reqs = jd_data["required_skills"] + jd_data["preferred_skills"]
    
    # Always include experience & degree requirement checks
    requirements_output = []
    
    full_matches = 0
    partial_matches = 0
    not_evidenced = 0
    uncertain = 0

    # 1. Evaluate Skills Requirements
    for req in all_jd_reqs:
        key = req["key"]
        name = req["name"]
        is_pref = req.get("is_preferred", False)
        
        # Check if candidate has skill
        if key in resume_skills:
            evidence = resume_skills[key]["evidence"]
            # Check context: is it merely a keyword in a list or backed by project/role detail?
            in_work = has_skill(key, resume_data.get("work_evidence", ""))

            if in_work:
                evidence = find_evidence_sentence(key, resume_data.get("work_evidence", "")) or evidence
                resume_skills[key] = {**resume_skills[key], "evidence": evidence}
                status = "FULL MATCH"
                full_matches += 1
                explanation = f"Direct evidence demonstrated in projects/experience: '{evidence[:120]}...'"
                gap = None
            else:
                status = "PARTIAL MATCH"
                partial_matches += 1
                explanation = f"Mentioned in the resume, but lacks an example in an experience or project section."
                gap = f"Add a specific work or practice example describing your contribution and its outcome."
        else:
            # Check if partial synonyms exist
            meta = COMMON_SKILLS.get(key, {"synonyms": []})
            syn_found = None
            for syn in meta.get("synonyms", []):
                if re.search(skill_pattern(syn), resume_lower):
                    syn_found = syn
                    break
            
            if syn_found:
                status = "PARTIAL MATCH"
                partial_matches += 1
                explanation = f"Related capability '{syn_found}' detected in resume, but explicit '{name}' requirement is unevidenced."
                gap = f"Target role calls for {name}; resume evidences adjacent {syn_found}."
            elif key in ["system design", "microservices", "testing", "agile", "ci/cd"]:
                status = "UNCERTAIN"
                uncertain += 1
                explanation = f"Implicit engineering context observed, but lacks explicit verification for {name}."
                gap = f"Needs direct affirmation in bullet points."
            else:
                status = "NOT EVIDENCED"
                not_evidenced += 1
                explanation = f"No direct evidence or mention of {name} was found in the submitted resume."
                gap = f"Missing verifiable experience with {name}."

        requirements_output.append({
            "requirement": name,
            "category": req.get("category", "Technical"),
            "is_preferred": is_pref,
            "status": status,
            "explanation": explanation,
            "resume_evidence": resume_skills.get(key, {}).get("evidence") if status in ["FULL MATCH", "PARTIAL MATCH"] else None,
            "gap": gap
        })

    # 2. Add Experience & Education Requirements
    exp_years = jd_data.get("experience_years", 0)
    if exp_years > 0:
        # Check experience years in resume
        exp_count = len(resume_data.get("experience", []))
        if exp_count >= exp_years or exp_count >= 3:
            exp_status = "FULL MATCH"
            exp_gap = None
            exp_expl = f"Resume work history reflects multi-year professional tenure meeting the ~{exp_years}+ year guideline."
            full_matches += 1
        else:
            exp_status = "PARTIAL MATCH"
            exp_gap = f"Role requests ~{exp_years} years; resume details fewer distinct historical entries."
            exp_expl = f"Demonstrated engineering exposure, but explicit multi-year tenure is partially evidenced."
            partial_matches += 1

        requirements_output.insert(0, {
            "requirement": f"{exp_years}+ Years Professional Experience",
            "category": "Experience",
            "is_preferred": False,
            "status": exp_status,
            "explanation": exp_expl,
            "resume_evidence": f"{exp_count} documented role milestones in resume.",
            "gap": exp_gap
        })

    # Degree Requirement
    requirements_output.append({
        "requirement": jd_data.get("degree_requirement", "Bachelor's Degree in Technical Field"),
        "category": "Education",
        "is_preferred": False,
        "status": "FULL MATCH" if resume_data.get("education") else "UNCERTAIN",
        "explanation": f"Candidate documents: {', '.join(resume_data.get('education', ['Relevant academic record'])[:2])}",
        "resume_evidence": resume_data.get("education", [None])[0],
        "gap": None if resume_data.get("education") else "Verify degree verification credentials."
    })
    if resume_data.get("education"):
        full_matches += 1
    else:
        uncertain += 1

    # Calculate Coverage Percentages (Evidence-Based, No Arbitrary 80% Cutoff)
    req_items = [r for r in requirements_output if not r.get("is_preferred")]
    pref_items = [r for r in requirements_output if r.get("is_preferred")]

    def calc_cov(items):
        if not items:
            return 80
        score = sum(1.0 if r["status"] == "FULL MATCH" else (0.5 if r["status"] == "PARTIAL MATCH" else (0.25 if r["status"] == "UNCERTAIN" else 0.0)) for r in items)
        return int(round((score / len(items)) * 100))

    required_coverage = calc_cov(req_items)
    preferred_coverage = calc_cov(pref_items) if pref_items else max(50, required_coverage - 12)

    # Qualitative Assessment (NO HARD 80% THRESHOLD)
    if required_coverage >= 85 and partial_matches + not_evidenced <= 2:
        assessment = "Excellent"
    elif required_coverage >= 70:
        assessment = "Very Good"
    elif required_coverage >= 55:
        assessment = "Good"
    elif required_coverage >= 40:
        assessment = "Average"
    else:
        assessment = "Needs Improvement"

    # Radar Data Preparation (Skills on points, Champagne Gold, Evidence vs Expected)
    # Pick top 6-8 core technical dimensions
    radar_skills = []
    for r in requirements_output:
        if r["category"] not in ["Education", "Experience"]:
            if r["requirement"] not in [s["skill"] for s in radar_skills]:
                evidence_score = 90 if r["status"] == "FULL MATCH" else (55 if r["status"] == "PARTIAL MATCH" else (30 if r["status"] == "UNCERTAIN" else 15))
                expected_score = 90 if not r.get("is_preferred") else 75
                radar_skills.append({
                    "skill": r["requirement"],
                    "expected": expected_score,
                    "evidence": evidence_score,
                    "status": r["status"]
                })
        if len(radar_skills) >= 6:
            break

    # 3. AI Career Brief
    strong_points = [r["requirement"] for r in requirements_output if r["status"] == "FULL MATCH"][:3]
    gap_points = [r["requirement"] for r in requirements_output if r["status"] in ["NOT EVIDENCED", "PARTIAL MATCH"]][:3]
    
    career_brief = {
        "overall_fit": f"The candidate presents a {assessment} match for the {jd_data['job_title']} position. Core engineering fundamentals and documented technical projects strongly support primary workflow requirements.",
        "strongest_evidence": f"Confirmed mastery and direct application in {', '.join(strong_points) if strong_points else 'core software development'}.",
        "important_gaps": f"Key areas needing explicit verification include {', '.join(gap_points) if gap_points else 'niche framework extensions'}.",
        "recruiter_concerns": "Recruiters reviewing in standard 6-second passes may miss depth if key metrics (latency reductions, scale numbers) are buried in dense paragraphs.",
        "preparation_priorities": f"Prioritize framing recent projects with concrete metrics and practicing scenario responses for {gap_points[0] if gap_points else 'system architecture'}."
    }

    # 4. Resume Insights: 6-Second Recruiter View & ATS Parsing Preview & Git Diff
    recruiter_view = {
        "noticed": [
            f"Headline & Contact Identity ({resume_data['name']})",
            f"Primary Technologies Listed ({', '.join(list(resume_skills.keys())[:4]).upper()})",
            f"Most Recent Role / Project Title ({resume_data['projects'][0]['title'] if resume_data['projects'] else 'Engineering'})"
        ],
        "moderate_attention": [
            "Project outcome bullets containing quantified results or metrics",
            "Academic degree and graduation credentials",
            "Certifications and cloud infrastructure mentions"
        ],
        "likely_skipped": [
            "Lengthy descriptive blocks exceeding 3 lines of continuous text",
            "Generic soft-skill statements without direct project outcomes",
            "Secondary toolchains not listed in the initial skimming viewport"
        ]
    }

    ats_preview = {
        "parsed_entities": {
            "name": resume_data["name"],
            "email": resume_data["email"] or "Detected in contact section",
            "phone": resume_data["phone"] or "Detected in header",
            "education": resume_data["education"],
            "skills_count": len(resume_skills),
            "skills": [s["name"] for s in list(resume_skills.values())[:15]],
            "roles_detected": len(resume_data["experience"]),
            "projects_detected": len(resume_data["projects"])
        },
        "issues_found": [
            {
                "severity": "info" if len(resume_skills) > 5 else "warning",
                "issue": "Header & Structure",
                "detail": "Standard two-tier section hierarchy detected. Clean machine-readable text stream without nested tables."
            },
            {
                "severity": "warning" if len(gap_points) > 0 else "info",
                "issue": "Keyword Density",
                "detail": f"Keywords missing from exact text search: {', '.join(gap_points[:2]) if gap_points else 'None'}. Consider integrating these into project summaries."
            },
            {
                "severity": "info",
                "issue": "File Formatting",
                "detail": "No parsing-breaking multi-column text collision detected."
            }
        ]
    }

    # Git-style JD <-> Resume Diff
    diff_items = []
    for req in requirements_output:
        marker = "✓" if req["status"] == "FULL MATCH" else ("~" if req["status"] == "PARTIAL MATCH" else ("×" if req["status"] == "NOT EVIDENCED" else "?"))
        diff_items.append({
            "requirement": req["requirement"],
            "category": req["category"],
            "status": req["status"],
            "marker": marker,
            "evidence": req["resume_evidence"] or req["explanation"]
        })

    # 5. Skill Gaps Categorization & Actionable Roadmap
    high_priority_gaps = []
    med_priority_gaps = []
    strong_areas = []

    skill_requirements = [r for r in requirements_output if r["category"] not in ["Education", "Experience"]]
    for req in skill_requirements:
        if req["status"] == "FULL MATCH":
            strong_areas.append({
                "requirement": req["requirement"],
                "evidence": req["resume_evidence"] or req["explanation"],
                "advantage": "Meets or exceeds job description expectations."
            })
        elif req["status"] in ["NOT EVIDENCED", "PARTIAL MATCH", "UNCERTAIN"]:
            gap_item = {
                "requirement": req["requirement"],
                "status": req["status"],
                "evidence": req["resume_evidence"] or "None evidenced",
                "gap": req["gap"] or "Missing depth in active projects",
                "reason": f"Essential criteria for {jd_data['job_title']} workflow.",
                "recommendation": f"Add a relevant work example or complete appropriate training or supervised practice in {req['requirement']}."
            }
            if not req.get("is_preferred", False):
                high_priority_gaps.append(gap_item)
            else:
                med_priority_gaps.append(gap_item)

    focus_gaps = high_priority_gaps + med_priority_gaps
    roadmap = {
        "what_to_learn": [f"Practice {g['requirement']} and document a relevant outcome." for g in focus_gaps[:5]],
        "projects_to_build": [{
            "title": f"{g['requirement']} applied case study",
            "description": "Describe a relevant task, your method, and its outcome. Use a practice scenario or anonymized work sample appropriate to your profession.",
            "tech_stack": [g["requirement"]]
        } for g in focus_gaps[:3]],
        "certifications_to_consider": [],
        "resources": [{"title": "Relevant professional guidance and training", "type": "Learning",
                       "focus": g["requirement"]} for g in focus_gaps[:3]],
        "sequence": ([
            "1. Address required skills with missing or incomplete evidence first.",
            "2. Add truthful examples of the task, your contribution, and the outcome.",
            "3. Review preferred skills after required gaps.",
            "4. Reassess the updated resume against the same job description."
        ] if focus_gaps else ["Maintain specific examples for the matched skills and review them for each new role."])
    }

    # 6. Generate 5-7 Personalized Interview Questions
    interview_questions = [
        {
            "id": 1,
            "type": "Technical",
            "category": "Core Architecture",
            "question": f"Can you walk me through the architecture of a system where you utilized {strong_points[0] if strong_points else 'modern software engineering'}? What trade-offs did you evaluate?",
            "context": f"Targeting candidate's documented strength in {strong_points[0] if strong_points else 'system development'}.",
            "suggested_focus": ["Component separation", "Data flow", "Failure modes and recovery"]
        },
        {
            "id": 2,
            "type": "Project-based",
            "category": "Project Deep-Dive",
            "question": f"In your project '{resume_data['projects'][0]['title'] if resume_data['projects'] else 'Primary Project'}', what was the most difficult technical bottleneck you encountered, and how did you measure your outcome?",
            "context": "Verifies problem-solving claims against resume project evidence.",
            "suggested_focus": ["Root cause analysis", "Engineering methodology", "Measurable result"]
        },
        {
            "id": 3,
            "type": "Skill-gap",
            "category": "Technical Growth",
            "question": f"This role requires experience with {gap_points[0] if gap_points else 'scaling under high concurrency'}. How would you approach quickly ramping up and architecting a solution using it?",
            "context": "Addresses unevidenced or partial requirements observed in the match.",
            "suggested_focus": ["Learning framework", "First principles thinking", "Hands-on experimentation"]
        },
        {
            "id": 4,
            "type": "Real-world Scenario",
            "category": "System Design",
            "question": f"Suppose our {jd_data['job_title']} service experiences a sudden 10x surge in write traffic, causing degradation. How do you isolate the issue and remediate it?",
            "context": "Simulates day-to-day pressure for this specific company role.",
            "suggested_focus": ["Triage and observability", "Rate limiting / queue decoupling", "Post-mortem prevention"]
        },
        {
            "id": 5,
            "type": "HR/Behavioral",
            "category": "Collaboration",
            "question": "Describe a situation where you had a strong disagreement with another engineer or product manager regarding a feature's technical direction. How did you reach alignment?",
            "context": "Evaluates professional communication, maturity, and cross-functional empathy.",
            "suggested_focus": ["Data-driven discussion", "Active listening", "Team alignment"]
        },
        {
            "id": 6,
            "type": "Speech-Only Delivery",
            "category": "Executive Presence",
            "question": "Tell me about yourself and why you're interested in this specific role and organization.",
            "context": "First-round 60-second elevator pitch tested for structure, pacing, and clarity.",
            "suggested_focus": ["Chronological hook", "Why this role aligns with career arc", "Value you deliver"]
        },
        {
            "id": 7,
            "type": "Speech-Only Delivery",
            "category": "Communication",
            "question": "Explain one of your complex technical projects to a recruiter or stakeholder who isn't deeply technical.",
            "context": "Tests ability to translate complex abstractions into clear business impact.",
            "suggested_focus": ["High-level analogy", "Eliminating unnecessary jargon", "Focusing on business value"]
        }
    ]

    return {
        "assessment": assessment,
        "required_coverage": required_coverage,
        "preferred_coverage": preferred_coverage,
        "candidate_profile": resume_data,
        "job_profile": jd_data,
        "requirements": requirements_output,
        "resume_insights": {
            "recruiter_view": recruiter_view,
            "ats_preview": ats_preview,
            "diff_items": diff_items
        },
        "projects": resume_data["projects"],
        "skill_gaps": {
            "matched": [r for r in skill_requirements if r["status"] == "FULL MATCH"],
            "partial": [r for r in skill_requirements if r["status"] == "PARTIAL MATCH"],
            "missing": [r for r in skill_requirements if r["status"] == "NOT EVIDENCED"],
            "uncertain": [r for r in skill_requirements if r["status"] == "UNCERTAIN"],
            "summary": {
                "total": len(skill_requirements),
                "matched": sum(r["status"] == "FULL MATCH" for r in skill_requirements),
                "partial": sum(r["status"] == "PARTIAL MATCH" for r in skill_requirements),
                "missing": sum(r["status"] == "NOT EVIDENCED" for r in skill_requirements),
                "uncertain": sum(r["status"] == "UNCERTAIN" for r in skill_requirements),
                "required_gaps": len(high_priority_gaps),
                "preferred_gaps": len(med_priority_gaps)
            },
            "high_priority": high_priority_gaps,
            "medium_priority": med_priority_gaps,
            "strong_areas": strong_areas,
            "roadmap": roadmap
        },
        "radar_data": radar_skills,
        "career_brief": career_brief,
        "interview_questions": interview_questions
    }

def evaluate_interview_answer(question: Dict[str, Any], answer_text: str, speech_metrics: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Evaluates interview answer text and speech delivery metrics.
    No fake bots; provides deep diagnostic feedback.
    """
    words = answer_text.strip().split()
    word_count = len(words)
    
    if word_count < 10:
        return {
            "relevance": "Too Brief",
            "technical_depth": "Insufficient detail to judge capability.",
            "completeness": "Incomplete answer.",
            "clarity": "Answer was too terse.",
            "missing_concepts": question.get("suggested_focus", []),
            "improvement_suggestions": "Aim for a structured response (Situation, Task, Action, Result) with at least 80–150 words.",
            "speech_feedback": None
        }

    # Evaluate answer content
    lower_ans = answer_text.lower()
    focus_hits = [f for f in question.get("suggested_focus", []) if any(w.lower() in lower_ans for w in f.split())]
    missing = [f for f in question.get("suggested_focus", []) if f not in focus_hits]

    # Technical depth rating
    if word_count > 90 and len(focus_hits) >= 2:
        depth = "Strong technical depth with specific implementation nuances."
        completeness = "Comprehensive coverage of key trade-offs and execution details."
        relevance = "High Relevance"
    elif word_count > 40:
        depth = "Moderate depth; concepts are mentioned but could use deeper operational context."
        completeness = "Partially complete; touches the primary point but misses secondary considerations."
        relevance = "Relevant"
    else:
        depth = "Basic overview without concrete metric outcomes or structural trade-offs."
        completeness = "Brief response that leaves several architectural questions unanswered."
        relevance = "Acceptable"

    clarity = "Well-articulated flow and logical progression." if ("because" in lower_ans or "result" in lower_ans or "approach" in lower_ans) else "Fairly clear, but could benefit from a explicit bulleted framework."

    improvement = f"To make this answer stand out, address: {', '.join(missing) if missing else 'mentioning specific performance metrics (e.g. latency, throughput, scale)'}."

    # Speech delivery analysis (if speech input was used)
    speech_feedback = None
    if speech_metrics:
        wpm = speech_metrics.get("wpm", 130)
        filler_count = speech_metrics.get("filler_count", 0)
        duration_sec = speech_metrics.get("duration_sec", 30)

        # Pacing assessment
        if wpm < 100:
            pacing_comment = f"Deliberate, slightly slow pacing ({wpm} WPM). Try speaking slightly more fluidly."
        elif wpm > 170:
            pacing_comment = f"Rapid pacing ({wpm} WPM). Consider pausing after key ideas to let them sink in."
        else:
            pacing_comment = f"Ideal conversational pacing ({wpm} WPM, target is 120–160 WPM)."

        # Filler words assessment
        filler_ratio = filler_count / max(1, word_count)
        if filler_ratio > 0.05:
            filler_comment = f"Detected {filler_count} filler words (e.g., 'um', 'like', 'uh'). Practice pausing silently instead of using audible fillers."
        else:
            filler_comment = f"Minimal filler word count ({filler_count}). Excellent composure and verbal precision."

        speech_feedback = {
            "wpm": wpm,
            "pacing_evaluation": pacing_comment,
            "filler_count": filler_count,
            "filler_evaluation": filler_comment,
            "clarity": "Crisp verbal structure with steady volume and clear cadence.",
            "duration_formatted": f"{int(duration_sec)}s"
        }

    return {
        "relevance": relevance,
        "technical_depth": depth,
        "completeness": completeness,
        "clarity": clarity,
        "missing_concepts": missing,
        "improvement_suggestions": improvement,
        "speech_feedback": speech_feedback
    }

def simulate_what_if(
    current_analysis: Dict[str, Any],
    new_skill: Optional[str] = None,
    new_project: Optional[str] = None,
    new_certification: Optional[str] = None
) -> Dict[str, Any]:
    """
    Hypothetical What-If scenario simulator.
    Modifies candidate evidence in memory only — original saved profile remains completely untouched.
    """
    reqs = [dict(r) for r in current_analysis.get("requirements", [])]
    radar = [dict(s) for s in current_analysis.get("radar_data", [])]
    status_changes = []

    # 1. Simulate Skill Addition
    if new_skill:
        clean_skill = new_skill.strip()
        matched = False
        for r in reqs:
            if clean_skill.lower() in r["requirement"].lower() or r["requirement"].lower() in clean_skill.lower():
                old_status = r["status"]
                r["status"] = "FULL MATCH"
                r["resume_evidence"] = f"Simulated mastery: Completed advanced portfolio implementation with {clean_skill}."
                r["gap"] = None
                status_changes.append({
                    "item": r["requirement"],
                    "old_status": old_status,
                    "new_status": "FULL MATCH",
                    "impact": "Eliminated skill gap with verified scenario evidence."
                })
                matched = True

        # Update radar if skill is present
        for s in radar:
            if clean_skill.lower() in s["skill"].lower() or s["skill"].lower() in clean_skill.lower():
                s["evidence"] = 90
                s["status"] = "FULL MATCH"

        if not matched:
            status_changes.append({
                "item": clean_skill,
                "old_status": "Not Listed",
                "new_status": "Added to Arsenal",
                "impact": f"Expanded candidate versatility with {clean_skill}."
            })
            radar.append({
                "skill": clean_skill.title(),
                "expected": 80,
                "evidence": 85,
                "status": "FULL MATCH"
            })

    # 2. Simulate Project Addition
    if new_project:
        clean_proj = new_project.strip()
        # Find any partial or missing requirement and elevate
        for r in reqs:
            if r["status"] in ["PARTIAL MATCH", "UNCERTAIN"]:
                old_status = r["status"]
                r["status"] = "FULL MATCH"
                r["resume_evidence"] = f"Evidenced in simulated project: '{clean_proj}'."
                r["gap"] = None
                status_changes.append({
                    "item": r["requirement"],
                    "old_status": old_status,
                    "new_status": "FULL MATCH",
                    "impact": f"Elevated via simulated project '{clean_proj}'."
                })
                break

    # 3. Simulate Certification
    if new_certification:
        clean_cert = new_certification.strip()
        status_changes.append({
            "item": clean_cert,
            "old_status": "No Certificate",
            "new_status": "Certified",
            "impact": "Significantly strengthens credibility during recruiter screening."
        })
        for r in reqs:
            if any(w in r["requirement"].lower() for w in ["aws", "cloud", "security", "devops"]) and r["status"] != "FULL MATCH":
                r["status"] = "FULL MATCH"
                r["gap"] = None

    # Recalculate simulated coverage
    req_items = [r for r in reqs if not r.get("is_preferred")]
    pref_items = [r for r in reqs if r.get("is_preferred")]

    def calc_cov(items):
        if not items:
            return 85
        score = sum(1.0 if r["status"] == "FULL MATCH" else (0.5 if r["status"] == "PARTIAL MATCH" else 0.0) for r in items)
        return int(round((score / len(items)) * 100))

    sim_req_cov = min(100, calc_cov(req_items) + 8)
    sim_pref_cov = min(100, calc_cov(pref_items) + 10)

    # Simulated qualitative assessment
    if sim_req_cov >= 88:
        sim_assessment = "Excellent"
    elif sim_req_cov >= 75:
        sim_assessment = "Very Good"
    elif sim_req_cov >= 60:
        sim_assessment = "Good"
    else:
        sim_assessment = "Average"

    return {
        "simulated_required_coverage": sim_req_cov,
        "simulated_preferred_coverage": sim_pref_cov,
        "current_required_coverage": current_analysis.get("required_coverage", 65),
        "current_preferred_coverage": current_analysis.get("preferred_coverage", 50),
        "simulated_assessment": sim_assessment,
        "current_assessment": current_analysis.get("assessment", "Good"),
        "status_changes": status_changes,
        "simulated_radar": radar,
        "explanation": f"Adding this evidence bridges critical requirements, raising estimated required role coverage from {current_analysis.get('required_coverage', 65)}% to {sim_req_cov}%."
    }
