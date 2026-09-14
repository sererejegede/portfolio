import Link from 'next/link';
import { Github } from 'lucide-react';
import ProjectCard, { type Project } from '@/components/ProjectCard';
import Header from '@/components/ui/header';
import { Button } from '@/components/ui/button';
import LazyOfflineSyncDemo from '@/components/demos/tailors-ledger/LazyOfflineSyncDemo';
import WordTwistEmbed from '@/components/demos/word-twist/WordTwistEmbed';
import EuroParcsImage from '@/assets/europarcs.jpg';
import WovarLogo from '@/assets/wv-logo.svg';

/**
 * Tailor's Ledger and Word Twist are deliberately NOT in this list. A card says
 * a project exists; each of these gets the full width so a visitor can use it
 * instead — flip a switch in one, play a round in the other.
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

// Carried over verbatim from Word Twist's former project card.
const WORD_TWIST_STACK = ['Next.js', 'Firebase Studio', 'Typescript', 'TailwindCSS'];

function StackTags({ stack }: { stack: string[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {stack.map((tech) => (
        <span
          key={tech}
          className="rounded-md bg-secondary/50 px-2.5 py-1 text-xs font-medium text-secondary-foreground"
        >
          {tech}
        </span>
      ))}
    </div>
  );
}

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
          <StackTags stack={TAILORS_LEDGER_STACK} />
        </div>

        <LazyOfflineSyncDemo />
      </section>

      <section aria-labelledby="word-twist-heading" className="mb-16 md:mb-24">
        <div className="mb-8 max-w-2xl">
          <h3 id="word-twist-heading" className="font-headline text-2xl text-primary">
            Word Twist
          </h3>
          {/* Verbatim from the former card. */}
          <p className="pt-2 text-muted-foreground">
            A game where you unscramble a given word. Scoring is based on how fast you are.
          </p>
          <StackTags stack={WORD_TWIST_STACK} />
          <Button
            variant="outline"
            asChild
            className="mt-5 border-primary text-primary hover:bg-primary/10"
          >
            <Link
              href="https://github.com/sererejegede/word-twist"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="mr-2 h-4 w-4" /> GitHub
            </Link>
          </Button>
        </div>

        <WordTwistEmbed />
      </section>

      {/* Two cards now, so two columns: the old three-column grid would have left
          an empty slot on large screens. */}
      <div className="grid md:grid-cols-2 gap-8 projects">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
