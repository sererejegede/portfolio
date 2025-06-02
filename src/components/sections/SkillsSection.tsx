import SkillBadge from '@/components/SkillBadge';
import { CodeXml, Palette, Parentheses, Atom, AppWindow, Layers3, FileCode2, Wind } from 'lucide-react';

const skills = [
  { id: 'html', name: 'HTML5', icon: CodeXml },
  { id: 'css', name: 'CSS3', icon: Palette },
  { id: 'js', name: 'JavaScript', icon: Parentheses }, // Parentheses can represent JS syntax
  { id: 'react', name: 'React', icon: Atom },
  { id: 'vue', name: 'Vue.js', icon: AppWindow },
  { id: 'nuxt', name: 'Nuxt.js', icon: Layers3 },
  { id: 'ts', name: 'TypeScript', icon: FileCode2 },
  { id: 'tailwind', name: 'TailwindCSS', icon: Wind },
];

export default function SkillsSection() {
  return (
    <div>
      <h2 className="font-headline text-4xl font-bold text-primary mb-12 text-center">My Tech Stack</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 lg:gap-8">
        {skills.map((skill) => (
          <SkillBadge key={skill.id} name={skill.name} icon={skill.icon} />
        ))}
      </div>
    </div>
  );
}
