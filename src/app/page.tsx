import Navbar from '@/components/Navbar';
import HeaderSection from '@/components/sections/HeaderSection';
import AboutSection from '@/components/sections/AboutSection';
import SkillsSection from '@/components/sections/SkillsSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import ExperienceSection from '@/components/sections/ExperienceSection';
import ContactSection from '@/components/sections/ContactSection';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <HeaderSection />

        <section id="about" className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-lg">
            <AboutSection />
          </div>
        </section>

        <Separator className="my-12 md:my-16 bg-border/50" />

        <section id="skills" className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-lg">
            <SkillsSection />
          </div>
        </section>

        <Separator className="my-12 md:my-16 bg-border/50" />
        
        <section id="projects" className="py-16 md:py-24 bg-card/30"> {/* Subtle background change for variety */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-xl">
            <ProjectsSection />
          </div>
        </section>

        <Separator className="my-12 md:my-16 bg-border/50" />

        <section id="experience" className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-lg">
            <ExperienceSection />
          </div>
        </section>

        <Separator className="my-12 md:my-16 bg-border/50" />

        <section id="contact" className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <ContactSection />
          </div>
        </section>
      </main>
      <footer className="py-8 text-center text-muted-foreground border-t border-border mt-12">
        <p>&copy; {currentYear} John Doe. All rights reserved.</p>
        <p className="text-sm mt-1">Built with Next.js & Tailwind CSS.</p>
      </footer>
    </div>
  );
}
