import ProjectCard, { type Project } from '@/components/ProjectCard';
import Header from '@/components/ui/header';
import EuroParcsImage from '@/assets/europarcs.jpg';
import WordTwistImage from '@/assets/word-twist.png';
import WovarLogo from '@/assets/wv-logo.svg';
import TailorsLedgerImage from '@/assets/tailors-ledger.png';

const projects: Project[] = [
  {
    id: '1',
    title: 'EuroParcs Rental',
    description: 'Holiday homes built with an advanced availability management and a robust CMS integration using Contentful.',
    techStack: ['Nuxt.js', 'Vue.js', 'TypeScript', 'TailwindCSS', 'GraphQL', 'Contentful CMS'],
    image: EuroParcsImage,
    liveDemoUrl: 'https://europarcs.com',
    fitImage: false,
  },
  {
    id: '2',
    title: 'Word Twist',
    description: 'A game where you unscramble a given word. Scoring is based on how fast you are.',
    techStack: ['Next.js', 'Firebase Studio', 'Typescript', 'TailwindCSS'],
    image: WordTwistImage,
    githubUrl: 'https://github.com/sererejegede/word-twist',
    liveDemoUrl: 'https://word-twist.sererejegede.dev',
    fitImage: true,
  },
  {
    id: '3',
    title: 'Wovar',
    description: 'A high-traffic e-commerce platform specializing in hardware and construction supplies',
    techStack: ['React', 'Remix', 'Typescript', 'Prismic CMS'],
    image: WovarLogo,
    githubUrl: 'https://github.com/example/ecommerce-dashboard',
    fitImage: true,
  },
  {
    id: '4',
    title: "Tailor's Ledger",
    description: 'An offline-first mobile app that replaces the paper measurement card, letting tailors capture client measurements as fast as pen and paper, with self-built sync to a Postgres backend.',
    techStack: ['React Native', 'Expo', 'TypeScript', 'WatermelonDB', 'Hono', 'Supabase', 'Postgres'],
    image: TailorsLedgerImage,
    liveDemoUrl: 'https://tailors-ledger.vercel.app',
    fitImage: true,
  },
];

export default function ProjectsSection() {
  return (
    <div>
      <Header level="h2">My Recent Projects</Header>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 projects">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
