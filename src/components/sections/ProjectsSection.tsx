import ProjectCard, { type Project } from '@/components/ProjectCard';
import Header from '@/components/ui/header';
import EuroParcsImage from '@/assets/europarcs.jpg';

const projects: Project[] = [
  {
    id: '1',
    title: 'EuroParcs Rental',
    description: 'Holiday homes built with an advanced availability management and a robust CMS integration using Contentful.',
    techStack: ['Nuxt.js', 'Vue.js', 'TypeScript', 'TailwindCSS', 'GraphQL'],
    image: EuroParcsImage,
    liveDemoUrl: 'https://europarcs.com',
  },
  // {
  //   id: '2',
  //   title: 'Task Management App',
  //   description: 'A collaborative task management tool helping teams organize and track their work effectively with an intuitive interface.',
  //   techStack: ['Vue.js', 'Firebase', 'Vuetify'],
  //   image: 'https://placehold.co/600x400.png',
  //   githubUrl: 'https://github.com/example/task-app',
  //   liveDemoUrl: '#',
  // },
  // {
  //   id: '3',
  //   title: 'E-commerce Analytics Dashboard',
  //   description: 'An analytics platform providing insights into sales, customer behavior, and product performance for online businesses.',
  //   techStack: ['React', 'Node.js', 'Chart.js', 'Express'],
  //   image: 'https://placehold.co/600x400.png',
  //   githubUrl: 'https://github.com/example/ecommerce-dashboard',
  // },
];

export default function ProjectsSection() {
  return (
    <div>
      <Header level="h2">My Recent Projects</Header>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
