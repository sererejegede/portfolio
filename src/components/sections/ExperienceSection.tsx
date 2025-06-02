import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';

interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  dates: string;
  description?: string[];
}

const experiences: ExperienceItem[] = [
  {
    id: '1',
    role: 'Senior Frontend Developer',
    company: 'Innovatech Solutions',
    dates: 'Jan 2021 - Present',
    description: [
      'Lead development of high-traffic web applications using React, Next.js, and TypeScript.',
      'Collaborate with cross-functional teams to define, design, and ship new features.',
      'Mentor junior developers and promote best practices in code quality and performance.',
    ],
  },
  {
    id: '2',
    role: 'Frontend Developer',
    company: 'WebCrafters Co.',
    dates: 'Jun 2018 - Dec 2020',
    description: [
      'Developed and maintained responsive user interfaces for diverse client projects.',
      'Implemented pixel-perfect designs from Figma mockups using HTML, CSS, and JavaScript.',
      'Integrated third-party APIs and services to extend application functionality.',
    ],
  },
  {
    id: '3',
    role: 'Junior Web Developer',
    company: 'Digital Startups LLC',
    dates: 'Aug 2016 - May 2018',
    description: [
      'Assisted senior developers in building and testing web components.',
      'Gained experience with Vue.js and RESTful API consumption.',
      'Contributed to bug fixing and improving application performance.',
    ],
  },
];

export default function ExperienceSection() {
  return (
    <div>
      <h2 className="font-headline text-4xl font-bold text-primary mb-12 text-center">Professional Experience</h2>
      <div className="space-y-8 relative">
        {/* Vertical line for timeline effect */}
        <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-0.5 bg-border transform md:-translate-x-1/2 hidden sm:block"></div>
        
        {experiences.map((exp, index) => (
          <div key={exp.id} className="relative sm:pl-8 md:pl-0">
            <div className="flex flex-col sm:flex-row items-start">
              {/* Timeline Dot */}
              <div className="absolute left-0 top-1.5 w-4 h-4 bg-primary rounded-full border-4 border-background hidden sm:block md:left-1/2 md:-translate-x-1/2"></div>
              
              <div className={`w-full sm:w-auto md:w-1/2 ${index % 2 === 0 ? 'md:pr-8 md:text-right' : 'md:pl-8 md:text-left'} mb-4 sm:mb-0`}>
                {index % 2 !== 0 && <div className="hidden md:block h-full"></div>}
              </div>

              <div className={`w-full md:w-1/2 ${index % 2 === 0 ? 'md:pl-8' : 'md:pr-8 md:text-left sm:text-left'}`}>
                <Card className="bg-card shadow-md hover:shadow-primary/20 transition-shadow duration-300 w-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-headline text-xl text-primary">{exp.role}</CardTitle>
                      <Briefcase className="h-5 w-5 text-muted-foreground hidden sm:block" />
                    </div>
                    <CardDescription className="text-muted-foreground">
                      {exp.company} <span className="mx-1">|</span> {exp.dates}
                    </CardDescription>
                  </CardHeader>
                  {exp.description && (
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1 text-foreground/90">
                        {exp.description.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  )}
                </Card>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
