"""Regression checks for cross-domain skill matching and summary counts."""
import unittest
from backend.engine import COMMON_SKILLS, parse_resume_content, parse_job_description, analyze_match


def analyze(resume, jd):
    return analyze_match(resume, jd, parse_resume_content(resume), parse_job_description(jd))


class SkillCoverageTests(unittest.TestCase):
    def test_domains_and_aliases(self):
        cases = [('Finance', 'financial modelling', 'financial modeling'),
                 ('Healthcare', 'electronic medical records', 'electronic health records'),
                 ('Education', 'lesson planning', 'lesson planning'),
                 ('Legal', 'contract drafting', 'contract drafting'),
                 ('Manufacturing', 'finite element analysis', 'finite element analysis'),
                 ('Marketing', 'SEO', 'search engine optimization'),
                 ('Agriculture', 'soil science', 'soil science'),
                 ('Hospitality', 'menu planning', 'menu planning'),
                 ('HR', 'talent acquisition', 'talent acquisition'),
                 ('Design', 'user experience design', 'ux design'),
                 ('Logistics', 'inventory management', 'inventory management')]
        for domain, alias, key in cases:
            with self.subTest(domain=domain):
                result = analyze(f'Alex Example\nEXPERIENCE\nApplied {alias} to improve team outcomes.', f'Position: {domain} Specialist\nRequired skills: {key}')
                self.assertEqual(result['skill_gaps']['summary']['matched'], 1)
                self.assertEqual(result['skill_gaps']['matched'][0]['status'], 'FULL MATCH')

    def test_listed_skill_is_partial_not_synthetic_project_match(self):
        result = analyze('Alex Example\nSKILLS\nPython, accounting', 'Required skills: Python, accounting, nursing\nPreferred skills: lesson planning')
        self.assertEqual(result['skill_gaps']['summary'], {'total': 4, 'matched': 0, 'partial': 2, 'missing': 2, 'uncertain': 0, 'required_gaps': 3, 'preferred_gaps': 1})
        self.assertEqual(len(result['skill_gaps']['medium_priority']), 1)

    def test_unknown_skill_alongside_known_skill(self):
        result = analyze('Alex Example\nEXPERIENCE\nUsed marine habitat mapping for coastal surveys.', 'Required skills: Python, marine habitat mapping\nPreferred skills: coral restoration')
        self.assertEqual(result['skill_gaps']['summary']['total'], 3)
        self.assertEqual(result['skill_gaps']['matched'][0]['requirement'], 'marine habitat mapping')
        self.assertEqual(result['skill_gaps']['summary']['missing'], 2)

    def test_punctuation_skills_and_alias_evidence(self):
        resume = parse_resume_content('Alex Example\nEXPERIENCE\nDeveloped services using C++, C# and Node.js.')
        for key in ['c++', 'c#', 'node.js']:
            self.assertIn(key, resume['skills'])
            self.assertIn('Developed services', resume['skills'][key]['evidence'])
        self.assertNotIn('c++', parse_resume_content('Experience with C programming')['skills'])

    def test_required_preferred_deduplication(self):
        jd = parse_job_description('Preferred skills: SEO\nRequired skills: search engine optimization')
        self.assertEqual(len(jd['required_skills']), 1)
        self.assertEqual(jd['preferred_skills'], [])

    def test_no_prose_false_positives(self):
        skills = parse_resume_content('Please go to the next page of my CV for the rest of my experience.')['skills']
        for key in ['golang', 'next.js', 'computer vision', 'rest api']:
            self.assertNotIn(key, skills)

    def test_unknown_prose_has_no_fabricated_skill_requirements(self):
        result = analyze('Alex Example', 'Position: Specialist\nWe are a welcoming team looking for a motivated colleague.')
        self.assertEqual(result['skill_gaps']['summary']['total'], 0)
        self.assertEqual(result['radar_data'], [])

    def test_cross_domain_roadmap_and_radar(self):
        result = analyze('Alex Example\nSKILLS\nPatient care', 'Required skills: patient care, wound care')
        self.assertEqual(len(result['radar_data']), 2)
        self.assertNotIn('Docker', str(result['skill_gaps']['roadmap']))
        self.assertNotIn('AWS', str(result['skill_gaps']['roadmap']))
        self.assertEqual(result['skill_gaps']['roadmap']['certifications_to_consider'], [])

    def test_all_matched_has_no_learning_gaps(self):
        result = analyze('Alex Example\nEXPERIENCE\nUsed financial analysis to inform business decisions.', 'Required skills: financial analysis')
        self.assertEqual(result['skill_gaps']['summary']['required_gaps'], 0)
        self.assertEqual(result['skill_gaps']['roadmap']['what_to_learn'], [])

    def test_full_match_quotes_work_evidence_not_skill_list(self):
        result = analyze('Alex Example\nSKILLS\nPatient care, nursing\nEXPERIENCE\nProvided patient care at a community clinic.', 'Required skills: patient care')
        self.assertIn('Provided patient care', result['skill_gaps']['matched'][0]['resume_evidence'])

    def test_taxonomy_has_broad_coverage(self):
        self.assertGreater(len(COMMON_SKILLS), 250)


if __name__ == '__main__':
    unittest.main()
