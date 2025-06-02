import ProjectCard, { type Project } from '@/components/ProjectCard';

const projects: Project[] = [
  {
    id: '1',
    title: 'DevFolio Showcase',
    description: 'A personal portfolio website template built with Next.js and Tailwind CSS, designed to showcase developer projects and skills.',
    techStack: ['Next.js', 'React', 'TypeScript', 'TailwindCSS', 'ShadCN UI'],
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'portfolio website design',
    githubUrl: 'https://github.com/example/devfolio',
    liveDemoUrl: '#',
  },
  {
    id: '2',
    title: 'Task Management App',
    description: 'A collaborative task management tool helping teams organize and track their work effectively with an intuitive interface.',
    techStack: ['Vue.js', 'Firebase', 'Vuetify'],
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'task manager interface',
    githubUrl: 'https://github.com/example/task-app',
    liveDemoUrl: '#',
  },
  {
    id: '3',
    title: 'E-commerce Analytics Dashboard',
    description: 'An analytics platform providing insights into sales, customer behavior, and product performance for online businesses.',
    techStack: ['React', 'Node.js', 'Chart.js', 'Express'],
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'dashboard charts',
    githubUrl: 'https://github.com/example/ecommerce-dashboard',
  },
];

export default function ProjectsSection() {
  return (
    <div>
      <h2 className="font-headline text-4xl font-bold text-primary mb-12 text-center">My Recent Projects</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
