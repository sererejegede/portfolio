import Image from 'next/image';
import { Card } from '@/components/ui/card';
import ProfilePicture from '@/assets/profile-picture.jpg';
import Header from '@/components/ui/header';

export default function AboutSection() {
  return (
    <div className="grid md:grid-cols-5 gap-12 items-center">
      <div className="md:col-span-2 h-full">
        <Card className="overflow-hidden shadow-xl h-full">
          <Image
            src={ProfilePicture}
            alt="Serere Jegede - Professional Photo"
            width={600}
            height={600}
            className="object-cover w-full h-full"
            data-ai-hint="professional portrait"
          />
        </Card>
      </div>
      <div className="md:col-span-3">
        <Header level="h2">About Me</Header>
        <div className="space-y-4 text-lg text-foreground/90">
          <p>
            Hello! I&apos;m Serere, a dedicated Frontend Developer with over 7 years of experience in creating dynamic and responsive web applications. My journey in web development started with a fascination for how code transforms into interactive digital experiences, and that curiosity continues to drive me today.
          </p>
          <p>
            I specialize in JavaScript, TypeScript, and modern frontend frameworks like Nuxt (Vue) and Next.js (React). I&apos;m passionate about writing clean, efficient, and maintainable code, and I strongly believe in the power of good design to enhance usability.
          </p>
          <p>
            When I&apos;m not coding, you can find me exploring new technologies, being generally curious, or playing video games. I&apos;m always eager to take on new challenges and collaborate on exciting projects.
          </p>
        </div>
      </div>
    </div>
  );
}
