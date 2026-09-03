import ProjectCard, { type Project } from '@/components/ProjectCard';
import Header from '@/components/ui/header';
import LazyOfflineSyncDemo from '@/components/demos/tailors-ledger/LazyOfflineSyncDemo';
import EuroParcsImage from '@/assets/europarcs.jpg';
import WordTwistImage from '@/assets/word-twist.png';
import WovarLogo from '@/assets/wv-logo.svg';

/**
 * Tailor's Ledger is deliberately NOT in this list. A screenshot of it would say
 * that an offline-first app exists; the demo below lets a visitor prove it in
 * five seconds by flipping a switch. It gets the full width instead of a card.
 */
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
];

const TAILORS_LEDGER_STACK = [
  'React Native',
  'Expo',
  'TypeScript',
  'WatermelonDB',
  'Hono',
  'Supabase',
  'Postgres',
];

export default function ProjectsSection() {
  return (
    <div>
      <Header level="h2">My Recent Projects</Header>

      <section aria-labelledby="tailors-ledger-heading" className="mb-16 md:mb-24">
        <div className="mb-8 max-w-2xl">
          <h3
            id="tailors-ledger-heading"
            className="font-headline text-2xl text-primary"
          >
            Tailor&apos;s Ledger
          </h3>
          <p className="pt-2 text-muted-foreground">
            An offline-first measurement book for tailors. Every value is written to the
            device first and syncs only when the tailor says so — flip airplane mode and
            watch the app carry on regardless.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {TAILORS_LEDGER_STACK.map((tech) => (
              <span
                key={tech}
                className="rounded-md bg-secondary/50 px-2.5 py-1 text-xs font-medium text-secondary-foreground"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <LazyOfflineSyncDemo />
      </section>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 projects">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
